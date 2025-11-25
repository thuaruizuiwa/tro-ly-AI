import { GoogleGenAI } from "@google/genai";
import { DRIVE_KNOWLEDGE_BASE } from '../constants';
import { Department, DriveFile, AppSettings } from '../types';

// Simulate Vector Search against Google Drive Files
const retrieveDocuments = (query: string, userDept: Department): DriveFile[] => {
  const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 3);
  
  // Permissions Check: User sees General + Their Department Folder content
  // Note: In a real app, we would query the specific Folder IDs from settings.departmentFolders
  const accessibleDocs = DRIVE_KNOWLEDGE_BASE.filter(doc => 
    doc.department === Department.GENERAL || doc.department === userDept
  );

  if (queryTerms.length === 0) return accessibleDocs.slice(0, 3);

  // Simple keyword scoring
  const scoredDocs = accessibleDocs.map(doc => {
    let score = 0;
    const contentLower = doc.content.toLowerCase();
    const titleLower = doc.name.toLowerCase();
    
    queryTerms.forEach(term => {
      if (contentLower.includes(term)) score += 1;
      if (titleLower.includes(term)) score += 2; 
    });
    return { doc, score };
  });

  return scoredDocs
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.doc);
};

interface RagResult {
  answer: string;
  sourceType: 'internal' | 'external';
  sources: { title: string; link: string }[];
}

export const processQuery = async (query: string, userDept: Department, settings: AppSettings): Promise<RagResult> => {
  // Use API Key from Settings if available, else process.env
  const apiKey = settings.geminiApiKey || process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey });

  // 1. RETRIEVE from Drive Simulator
  const relevantDocs = retrieveDocuments(query, userDept);
  
  const contextString = relevantDocs.map(d => 
    `[File Name: ${d.name}]
     Department: ${d.department}
     Content: ${d.content}`
  ).join('\n\n');

  // 2. AUGMENT & ATTEMPT GENERATION
  try {
    const internalResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are an internal corporate assistant for "Nexus".
        User Department: ${userDept}.
        
        Question: "${query}"
        
        Here is the context retrieved from the company Google Drive:
        ---
        ${contextString || "No relevant files found in Drive."}
        ---
        
        INSTRUCTIONS:
        1. Answer the question strictly using the provided Drive context.
        2. Provide a professional response in Vietnamese.
        3. If the context is NOT sufficient, output EXACTLY: "SEARCH_NEEDED".
      `,
    });

    const text = internalResponse.text?.trim();

    if (text && !text.includes("SEARCH_NEEDED")) {
        const uniqueSources = relevantDocs.map(d => ({
            title: d.name,
            link: d.webViewLink
        }));
        
        return {
            answer: text,
            sourceType: 'internal',
            sources: uniqueSources
        };
    }
  } catch (error) {
    console.error("Internal generation failed", error);
  }

  // 3. FALLBACK: EXTERNAL WEB SEARCH
  try {
    const searchResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Answer the following question utilizing Google Search in Vietnamese.
      User Question: ${query}
      
      Begin your response by stating (in Vietnamese): "Tôi không tìm thấy thông tin này trong tài liệu nội bộ, nhưng đây là kết quả từ web:"`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const webAnswer = searchResponse.text || "Xin lỗi, tôi không thể tìm thấy thông tin.";
    
    const chunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = chunks
      .map(c => ({
          title: c.web?.title || 'Web Result',
          link: c.web?.uri || ''
      }))
      .filter(s => !!s.link);

    return {
      answer: webAnswer,
      sourceType: 'external',
      sources: webSources
    };

  } catch (err) {
    console.error("Web search failed", err);
    return {
      answer: "Đã xảy ra lỗi khi tìm kiếm thông tin.",
      sourceType: 'external',
      sources: []
    };
  }
};