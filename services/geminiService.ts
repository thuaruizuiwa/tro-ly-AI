import { GoogleGenAI } from "@google/genai";
import { Department, DriveFile, AppSettings, ChatMessage, MessageType } from '../types';

// Cache for Document Embeddings to avoid re-calculating on every request
// In a real app, this would be stored in a Vector Database (Pinecone, Milvus, etc.)
let DOCUMENT_EMBEDDINGS_CACHE: { id: string; embedding: number[] }[] | null = null;
let CACHED_DOC_COUNT = 0;

// --- VECTOR MATH UTILS ---

const cosineSimilarity = (vecA: number[], vecB: number[]) => {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
};

// --- GEMINI API HELPERS ---

const getEmbedding = async (ai: GoogleGenAI, text: string): Promise<number[]> => {
  // Use text-embedding-004 for high quality embeddings
  const response = await ai.models.embedContent({
    model: 'text-embedding-004',
    contents: { parts: [{ text }] }
  });
  return response.embeddings?.[0]?.values || [];
};

// Initialize/Pre-calculate embeddings for the Knowledge Base
// This should be called once when the app starts or settings change
export const initializeKnowledgeBaseEmbeddings = async (apiKey: string, documents: DriveFile[]) => {
  if (!apiKey) return;
  
  // If cache exists and doc count hasn't changed, skip re-embedding (Simple optimization)
  // In production, you'd check a hash of the content.
  if (DOCUMENT_EMBEDDINGS_CACHE && CACHED_DOC_COUNT === documents.length) {
      console.log("Using cached vectors.");
      return;
  }
  
  console.log("Initializing Vector Store for " + documents.length + " docs...");
  const ai = new GoogleGenAI({ apiKey });
  
  const promises = documents.map(async (doc) => {
    // We embed "Name + Content" to capture both title relevance and body context
    const textToEmbed = `Title: ${doc.name}\nContent: ${doc.content}`;
    try {
      const embedding = await getEmbedding(ai, textToEmbed);
      return { id: doc.id, embedding };
    } catch (e) {
      console.error(`Failed to embed doc ${doc.id}`, e);
      return null;
    }
  });

  const results = await Promise.all(promises);
  DOCUMENT_EMBEDDINGS_CACHE = results.filter(r => r !== null) as { id: string; embedding: number[] }[];
  CACHED_DOC_COUNT = documents.length;
  console.log(`Vector Store Ready: ${DOCUMENT_EMBEDDINGS_CACHE.length} documents indexed.`);
};

// --- RAG RETRIEVAL ---

const retrieveDocumentsByVector = async (
  ai: GoogleGenAI,
  query: string, 
  userDept: Department,
  documents: DriveFile[]
): Promise<DriveFile[]> => {
  
  // 1. Filter documents by permission FIRST (General + User Dept)
  const allowedDocIds = new Set(
    documents
      .filter(doc => doc.department === Department.GENERAL || doc.department === userDept)
      .map(doc => doc.id)
  );

  if (!DOCUMENT_EMBEDDINGS_CACHE || DOCUMENT_EMBEDDINGS_CACHE.length === 0) {
    // Fallback if embeddings failed or empty
    return documents.filter(d => allowedDocIds.has(d.id)).slice(0, 3);
  }

  // 2. Generate Embedding for the User's Query
  const queryEmbedding = await getEmbedding(ai, query);

  // 3. Calculate Similarity Scores
  const scoredDocs = DOCUMENT_EMBEDDINGS_CACHE
    .filter(item => allowedDocIds.has(item.id)) // Only check allowed docs
    .map(item => ({
      id: item.id,
      score: cosineSimilarity(queryEmbedding, item.embedding)
    }));

  // 4. Sort and Retrieve Top K
  // Threshold: 0.4 is a decent baseline for "somewhat relevant" in cosine similarity
  const topDocs = scoredDocs
    .sort((a, b) => b.score - a.score)
    .slice(0, 4); // Get top 4 chunks

  console.log("Top Semantic Matches:", topDocs);

  return topDocs.map(match => documents.find(d => d.id === match.id)!);
};


interface RagResult {
  answer: string;
  sourceType: 'internal' | 'external';
  sources: { title: string; link: string }[];
}

export const processQuery = async (
  query: string, 
  userDept: Department, 
  settings: AppSettings,
  history: ChatMessage[]
): Promise<RagResult> => {
  const apiKey = settings.geminiApiKey || process.env.API_KEY;
  if (!apiKey) throw new Error("Missing API Key");
  
  const ai = new GoogleGenAI({ apiKey: apiKey });
  const documents = settings.knowledgeBase || [];

  // Ensure Embeddings are ready (lazy init if new docs added)
  if (!DOCUMENT_EMBEDDINGS_CACHE || CACHED_DOC_COUNT !== documents.length) {
    await initializeKnowledgeBaseEmbeddings(apiKey, documents);
  }

  // 1. RETRIEVE (Semantic Search)
  const relevantDocs = await retrieveDocumentsByVector(ai, query, userDept, documents);
  
  const contextString = relevantDocs.map(d => 
    `---
    File: ${d.name}
    Department: ${d.department}
    Link: ${d.webViewLink}
    Content: ${d.content}
    ---`
  ).join('\n');

  // 2. Format Chat History
  // We take the last 6 messages to keep context without blowing up token limits
  const historyString = history.slice(-6).map(msg => 
    `${msg.type === MessageType.USER ? 'User' : 'Assistant'}: ${msg.content}`
  ).join('\n');

  // 3. GENERATE ANSWER
  try {
    const internalResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are Nexus, an intelligent internal corporate assistant.
        
        CONTEXT INFORMATION (From Knowledge Base):
        ${contextString || "No relevant documents found."}
        
        CONVERSATION HISTORY:
        ${historyString}
        
        CURRENT USER QUESTION:
        "${query}"
        
        INSTRUCTIONS:
        1. Answer the user's question primarily using the provided "CONTEXT INFORMATION".
        2. If the context has the answer, cite the specific file name in your response.
        3. Maintain the flow of the "CONVERSATION HISTORY". If the user asks a follow-up (e.g., "What about for managers?"), use the history to understand what they are referring to.
        4. If the provided context is NOT sufficient to answer the question, output EXACTLY: "SEARCH_NEEDED".
        5. Respond in professional Vietnamese.
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

  // 4. FALLBACK: EXTERNAL WEB SEARCH
  try {
    const searchResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
      Chat History:
      ${historyString}

      User Question: ${query}
      
      Task: Answer the question utilizing Google Search.
      Language: Vietnamese.
      Start the response with: "Trong tài liệu nội bộ không có thông tin này, tuy nhiên theo tra cứu web:"`,
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