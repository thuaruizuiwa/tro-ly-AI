import { AppSettings, User, Department, UserRole } from '../types';
import { MOCK_SHEET_USERS, INITIAL_FOLDERS } from '../constants';

const SETTINGS_KEY = 'nexus_ai_settings';

const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  userSheetUrl: '',
  departmentFolders: INITIAL_FOLDERS,
  users: MOCK_SHEET_USERS
};

export const getSettings = (): AppSettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) return DEFAULT_SETTINGS;
  
  try {
    const parsed = JSON.parse(stored);
    // Ensure all fields exist (merge with default in case of migration)
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// Simulation of fetching data from Google Sheets API
export const syncUsersFromSheet = async (sheetUrl: string): Promise<User[]> => {
  // In a real app, we would parse the sheet ID from the URL and call Google Sheets API
  // await gapi.client.sheets.spreadsheets.values.get(...)
  
  console.log(`Syncing users from sheet: ${sheetUrl}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // For demo purposes, we return the Mock Users. 
  // If the user actually changed the URL, in a real app this would fetch different data.
  return MOCK_SHEET_USERS;
};