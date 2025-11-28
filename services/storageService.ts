import { AppSettings, User, Department, UserRole } from '../types';
import { MOCK_SHEET_USERS, INITIAL_FOLDERS, DRIVE_KNOWLEDGE_BASE } from '../constants';

const SETTINGS_KEY = 'nexus_ai_settings';

const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  googleClientId: '753294940441-dgf2hh8uj6gvj8uja5mrtv9ljhrpoukr.apps.googleusercontent.com', // Updated Default
  userSheetUrl: '',
  departmentFolders: INITIAL_FOLDERS,
  users: MOCK_SHEET_USERS,
  knowledgeBase: DRIVE_KNOWLEDGE_BASE // Load initial mock data as default editable data
};

export const getSettings = (): AppSettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) return DEFAULT_SETTINGS;
  
  try {
    const parsed = JSON.parse(stored);
    // Ensure knowledgeBase exists for older saves
    if (!parsed.knowledgeBase) {
        parsed.knowledgeBase = DRIVE_KNOWLEDGE_BASE;
    }
    // Update default client ID if missing in stored settings
    if (!parsed.googleClientId) {
        parsed.googleClientId = DEFAULT_SETTINGS.googleClientId;
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// Helper to parse CSV line correctly handling quotes
const parseCSVLine = (text: string) => {
  const result = [];
  let cell = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cell.trim());
      cell = '';
    } else {
      cell += char;
    }
  }
  result.push(cell.trim());
  return result;
};

// REAL implementation: Fetches CSV from public/shared Google Sheet
export const syncUsersFromSheet = async (sheetUrl: string): Promise<User[]> => {
  console.log(`Syncing users from sheet: ${sheetUrl}`);
  
  try {
    // 1. Convert Edit URL to Export URL
    // From: https://docs.google.com/spreadsheets/d/DOC_ID/edit...
    // To:   https://docs.google.com/spreadsheets/d/DOC_ID/export?format=csv
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
      throw new Error("Không tìm thấy ID Google Sheet hợp lệ trong link.");
    }
    const docId = match[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv`;

    // 2. Fetch CSV
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Không thể tải Sheet (Code ${response.status}). Hãy chắc chắn Sheet được chia sẻ 'Anyone with link'.`);
    }
    const csvText = await response.text();

    // 3. Parse CSV
    const lines = csvText.split('\n');
    const users: User[] = [];
    
    // Skip header (row 0), start from row 1
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const cols = parseCSVLine(lines[i]);
      // Expect columns: Name, Email, Department, Role
      if (cols.length < 3) continue;

      const name = cols[0].replace(/^"|"$/g, '');
      const email = cols[1].replace(/^"|"$/g, '');
      const deptRaw = cols[2].replace(/^"|"$/g, '');
      const roleRaw = cols[3]?.replace(/^"|"$/g, '') || 'Nhân viên';

      // Normalize Department Enum
      let department = Department.GENERAL;
      const deptValues = Object.values(Department);
      const foundDept = deptValues.find(d => d.toLowerCase() === deptRaw.toLowerCase());
      if (foundDept) department = foundDept;

      // Normalize Role Enum
      let role = UserRole.EMPLOYEE;
      if (roleRaw.toLowerCase().includes('quản trị')) role = UserRole.ADMIN;
      else if (roleRaw.toLowerCase().includes('biên tập')) role = UserRole.EDITOR;

      users.push({ name, email, department, role });
    }

    if (users.length === 0) {
      throw new Error("Sheet không có dữ liệu hoặc sai định dạng cột.");
    }

    return users;

  } catch (error: any) {
    console.error("Sheet Sync Error:", error);
    throw error; // Propagate error to UI
  }
};