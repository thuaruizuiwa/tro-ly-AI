import { Department, DriveFile, User, UserRole } from './types';

// Mock Data simulating what would be fetched from the Google Sheet
export const MOCK_SHEET_USERS: User[] = [
  { 
    email: 'admin@nexus.com', 
    name: 'Admin User', 
    department: Department.EXECUTIVE, 
    role: UserRole.ADMIN 
  },
  { 
    email: 'hr.manager@nexus.com', 
    name: 'Sarah HR', 
    department: Department.HR, 
    role: UserRole.EDITOR 
  },
  { 
    email: 'chess.lead@nexus.com', 
    name: 'Magnus C.', 
    department: Department.CHESS_TEACHER, 
    role: UserRole.EDITOR 
  },
  { 
    email: 'sale.online@nexus.com', 
    name: 'Alex Sales', 
    department: Department.ONLINE_SALES, 
    role: UserRole.EMPLOYEE 
  },
  { 
    email: 'art.teacher@nexus.com', 
    name: 'Bob Ross', 
    department: Department.ART_TEACHER, 
    role: UserRole.EMPLOYEE 
  },
  {
    email: 'cskh@nexus.com',
    name: 'Emily Support',
    department: Department.CUSTOMER_CARE,
    role: UserRole.EMPLOYEE
  }
];

export const INITIAL_FOLDERS: Record<Department, string> = {
  [Department.GENERAL]: 'https://drive.google.com/drive/folders/1-GK0y6YXkjZGNRU1erjtUdBtpAdD4Udh',
  [Department.EXECUTIVE]: 'https://drive.google.com/drive/folders/1Qabo2S8d6JtDkbwjTGWeAgsblv0tTKgE',
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

// Mock Google Drive Content (Expanded for Vector Search Demo)
export const DRIVE_KNOWLEDGE_BASE: DriveFile[] = [
  // --- GENERAL ---
  {
    id: 'gen-1',
    name: 'Quy-tac-tac-phong-và-ung-xu-giang-day.pdf',
    content: 'Thời gian làm việc chính thức: Sáng 8h30 - 12h00, Chiều 13h30 - 17h30. Nghỉ phép năm: 12 ngày/năm đối với nhân viên chính thức. Quy định trang phục: Công sở lịch sự, riêng thứ 6 được mặc đồ tự do (freestyle). Không hút thuốc trong văn phòng.',
    department: Department.GENERAL,
    webViewLink: 'https://drive.google.com/file/d/1F1Z_Y_RS_PJkiVxvrn85aHfodLGVTeFN/view?usp=sharing',
    mimeType: 'application/pdf'
  },
  {
    id: 'gen-2',
    name: 'Che_do_phuc_loi.pdf',
    content: 'Bảo hiểm y tế và xã hội được đóng full lương. Thưởng tết lương tháng 13. Du lịch công ty (Company Trip) tổ chức vào tháng 7 hàng năm. Phụ cấp ăn trưa 35k/ngày.',
    department: Department.GENERAL,
    webViewLink: 'https://docs.google.com/document/d/mock-benefits',
    mimeType: 'application/pdf'
  },
  // --- HR ---
  {
    id: 'hr-1',
    name: 'Quy_trinh_tuyen_dung.gdoc',
    content: 'Quy trình tuyển dụng gồm 3 vòng: 1. Sơ loại hồ sơ (CV Screening). 2. Phỏng vấn chuyên môn với Leader bộ phận. 3. Phỏng vấn văn hóa (Culture Fit) với HR. Thời gian thử việc là 2 tháng, hưởng 85% lương.',
    department: Department.HR,
    webViewLink: 'https://docs.google.com/document/d/mock-recruitment',
    mimeType: 'application/vnd.google-apps.document'
  },
  // --- CHESS TEACHER ---
  {
    id: 'chess-1',
    name: 'Giao_an_co_vua_can_ban.pdf',
    content: 'Bài 1: Bàn cờ và Quân cờ. Bàn cờ có 64 ô (32 trắng, 32 đen). Quân Xe đi thẳng ngang/dọc. Quân Tượng đi chéo. Quân Mã đi hình chữ L. Quân Hậu đi kết hợp Xe và Tượng. Vua đi từng ô một mọi hướng.',
    department: Department.CHESS_TEACHER,
    webViewLink: 'https://docs.google.com/document/d/mock-chess',
    mimeType: 'application/pdf'
  },
  {
    id: 'chess-2',
    name: 'Chien_thuat_khai_cuoc.pdf',
    content: 'Nguyên tắc khai cuộc: 1. Kiểm soát trung tâm. 2. Phát triển quân nhẹ (Mã, Tượng) sớm. 3. Nhập thành để bảo vệ Vua. Tránh đi một quân nhiều lần trong khai cuộc.',
    department: Department.CHESS_TEACHER,
    webViewLink: 'https://docs.google.com/document/d/mock-chess-opening',
    mimeType: 'application/pdf'
  },
  // --- ART TEACHER ---
  {
    id: 'art-1',
    name: 'Ly_thuyet_mau_sac.pptx',
    content: 'Bánh xe màu sắc. Màu cơ bản (Primary): Đỏ, Vàng, Xanh Lam. Màu cấp 2 (Secondary): Cam, Tím, Xanh Lục. Màu tương phản: Đỏ - Xanh Lục, Vàng - Tím. Phối màu đơn sắc tạo cảm giác hài hòa.',
    department: Department.ART_TEACHER,
    webViewLink: 'https://docs.google.com/presentation/d/mock-art',
    mimeType: 'application/vnd.google-apps.presentation'
  },
  // --- ONLINE SALES ---
  {
    id: 'online-1',
    name: 'Kich_ban_chot_sale_khoa_hoc.docx',
    content: 'Bước 1: Chào hỏi và hỏi tên, tuổi bé. Bước 2: Khai thác nỗi đau (bé không tập trung, ham chơi game). Bước 3: Giới thiệu lợi ích cờ vua (tăng tập trung, tư duy logic). Bước 4: Báo giá và ưu đãi (đăng ký hôm nay giảm 10%). Bước 5: Xử lý từ chối.',
    department: Department.ONLINE_SALES,
    webViewLink: 'https://docs.google.com/document/d/mock-sale-script',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  },
  // --- CUSTOMER CARE ---
  {
    id: 'cskh-1',
    name: 'Quy_trinh_xu_ly_khieu_nai.pdf',
    content: 'Khi phụ huynh phàn nàn: 1. Lắng nghe và đồng cảm (Không ngắt lời). 2. Xin lỗi vì trải nghiệm không tốt. 3. Xác minh sự việc với giáo viên. 4. Đề xuất giải pháp (Học bù, đổi giáo viên). 5. Follow up sau 3 ngày.',
    department: Department.CUSTOMER_CARE,
    webViewLink: 'https://docs.google.com/document/d/mock-cskh',
    mimeType: 'application/pdf'
  }
];