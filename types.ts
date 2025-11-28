export enum Department {
  GENERAL = 'Tài liệu chung',
  EXECUTIVE = 'Điều hành',
  HR = 'Nhân sự',
  SALES = 'Kinh doanh',
  MARKETING = 'Marketing',
  TRAINING = 'Đào tạo',
  ACCOUNTING = 'Kế toán',
  CHESS_TEACHER = 'Giáo viên cờ vua',
  ART_TEACHER = 'Giáo viên mỹ thuật',
  CUSTOMER_CARE = 'Chăm sóc khách hàng',
  ONLINE_SALES = 'Sale Online'
}

export enum UserRole {
  ADMIN = 'Quản trị viên',
  EDITOR = 'Biên tập viên',
  EMPLOYEE = 'Nhân viên'
}

export interface User {
  email: string;
  name: string;
  department: Department;
  role: UserRole;
  avatar?: string;
}

export interface DriveFile {
  id: string;
  name: string; 
  content: string; 
  department: Department; 
  webViewLink: string; 
  mimeType: string; 
}

export interface AppSettings {
  geminiApiKey: string;
  googleClientId?: string; // New: Required for Drive API Client-side flow
  userSheetUrl: string;
  departmentFolders: Record<Department, string>; // Maps Department to Drive Folder ID/Link (For reference only)
  users: User[]; // Cached users from the sheet
  knowledgeBase: DriveFile[]; // Dynamic list of documents managed by Admin
}

export enum MessageType {
  USER = 'user',
  BOT = 'bot'
}

export enum SourceType {
  INTERNAL = 'internal', 
  EXTERNAL = 'external' 
}

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  sourceType?: SourceType;
  sources?: { title: string; link: string }[]; 
  isThinking?: boolean;
}