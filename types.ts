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
  userSheetUrl: string;
  departmentFolders: Record<Department, string>; // Maps Department to Drive Folder ID/Link
  users: User[]; // Cached users from the sheet
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