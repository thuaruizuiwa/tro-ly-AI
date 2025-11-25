import { AppSettings, User, Department, UserRole } from '../types';
import { INITIAL_FOLDERS } from '../constants';
import GAPI from 'gapi-script';

const SETTINGS_KEY = 'nexus_ai_settings';

const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  userSheetUrl: '',
  departmentFolders: INITIAL_FOLDERS,
  users: []
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

// Initialize the Google API client
export const initializeGapiClient = (apiKey: string) => {
  return new Promise<void>((resolve, reject) => {
    GAPI.load('client', async () => {
      try {
        await GAPI.client.init({
          apiKey: apiKey,
          discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
};


// Fetches and parses user data from the Google Sheet
export const syncUsersFromSheet = async (sheetUrl: string): Promise<User[]> => {
  console.log(`Attempting to sync users from: ${sheetUrl}`);
  
  const extractSheetId = (url: string): string | null => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const sheetId = extractSheetId(sheetUrl);
  if (!sheetId) {
    throw new Error("Invalid Google Sheet URL provided.");
  }

  try {
    const response = await GAPI.client.sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A2:D', // Assuming data is in columns A-D, starting from row 2
    });

    const rows = response.result.values;
    if (!rows || rows.length === 0) {
      console.log("No data found in the sheet.");
      return [];
    }

    // Map rows to User objects
    const users: User[] = rows.map((row: any[]) => ({
      email: row[0] || '',
      name: row[1] || '',
      department: (row[2] || '').toUpperCase() as Department,
      role: (row[3] || '').toUpperCase() as UserRole,
    })).filter(u => u.email && u.name); // Basic validation

    console.log(`Successfully synced ${users.length} users.`);
    return users;

  } catch (err: any) {
    console.error("Error fetching or parsing sheet data:", err.result.error.message);
    throw new Error(`Could not sync from Google Sheet: ${err.result.error.message}`);
  }
};