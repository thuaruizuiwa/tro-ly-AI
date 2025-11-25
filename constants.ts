import { Department, DriveFile, User, UserRole } from './types';


export const INITIAL_FOLDERS: Record<Department, string> = {
  [Department.GENERAL]: 'https://drive.google.com/drive/folders/general-123',
  [Department.EXECUTIVE]: '',
  [Department.HR]: 'https://drive.google.com/drive/folders/hr-456',
  [Department.SALES]: '',
  [Department.MARKETING]: '',
  [Department.TRAINING]: '',
  [Department.ACCOUNTING]: '',
  [Department.CHESS_TEACHER]: 'https://drive.google.com/drive/folders/chess-789',
  [Department.ART_TEACHER]: '',
  [Department.CUSTOMER_CARE]: '',
  [Department.ONLINE_SALES]: ''
};

// Mock Google Drive Content (Expanded)
export const DRIVE_KNOWLEDGE_BASE: DriveFile[] = [
  // --- GENERAL ---
  {
    id: 'gen-1',
    name: 'Noi_quy_cong_ty_2024.pdf',
    content: 'Giờ làm việc: 8:30 sáng đến 5:30 chiều. Nghỉ trưa 12:00 - 13:30. Trang phục công sở lịch sự vào thứ 2, tự do các ngày còn lại.',
    department: Department.GENERAL,
    webViewLink: 'https://docs.google.com/document/d/mock-handbook',
    mimeType: 'application/pdf'
  },
  // --- HR ---
  {
    id: 'hr-1',
    name: 'Quy_trinh_tuyen_dung.gdoc',
    content: 'Quy trình tuyển dụng gồm 3 vòng: Sơ loại hồ sơ, Phỏng vấn chuyên môn, và Phỏng vấn văn hóa. Mức lương thử việc bằng 85% lương chính thức.',
    department: Department.HR,
    webViewLink: 'https://docs.google.com/document/d/mock-recruitment',
    mimeType: 'application/vnd.google-apps.document'
  },
  // --- CHESS TEACHER ---
  {
    id: 'chess-1',
    name: 'Giao_an_co_vua_can_ban.pdf',
    content: 'Bài 1: Giới thiệu bàn cờ và các quân cờ. Quân Xe đi thẳng và ngang. Quân Tượng đi chéo. Mục tiêu là chiếu hết Vua đối phương.',
    department: Department.CHESS_TEACHER,
    webViewLink: 'https://docs.google.com/document/d/mock-chess',
    mimeType: 'application/pdf'
  },
  // --- ART TEACHER ---
  {
    id: 'art-1',
    name: 'Nguyen_tac_pha_mau.pptx',
    content: '3 màu cơ bản: Đỏ, Vàng, Xanh dương. Pha Đỏ + Vàng = Cam. Pha Vàng + Xanh = Lục.',
    department: Department.ART_TEACHER,
    webViewLink: 'https://docs.google.com/presentation/d/mock-art',
    mimeType: 'application/vnd.google-apps.presentation'
  },
  // --- ONLINE SALES ---
  {
    id: 'online-1',
    name: 'Kich_ban_chot_sale_inbox.docx',
    content: 'Khi khách hàng hỏi giá, không trả lời ngay. Hãy hỏi về nhu cầu của bé (độ tuổi, sở thích) để tư vấn khóa học phù hợp trước.',
    department: Department.ONLINE_SALES,
    webViewLink: 'https://docs.google.com/document/d/mock-sale-script',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
];