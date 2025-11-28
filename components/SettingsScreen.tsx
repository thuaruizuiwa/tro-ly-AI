import React, { useState, useEffect, useCallback } from 'react';
import { AppSettings, User, Department, UserRole, DriveFile } from '../types';
import { saveSettings, syncUsersFromSheet } from '../services/storageService';
// @ts-ignore
import * as pdfjsLibProxy from 'pdfjs-dist';
// @ts-ignore
import * as mammothProxy from 'mammoth';

// Normalize Import: Handle cases where library is default export or named export
// @ts-ignore
const pdfjsLib = pdfjsLibProxy.default || pdfjsLibProxy;
// @ts-ignore
const mammoth = mammothProxy.default || mammothProxy;

// Configure PDF.js Worker
if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

interface SettingsScreenProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onClose: () => void;
  currentUserRole: UserRole;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, onSave, onClose, currentUserRole }) => {
  const [activeTab, setActiveTab] = useState<'system' | 'users' | 'knowledge'>('knowledge');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  
  // Document Editing State
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState<Partial<DriveFile>>({ department: Department.GENERAL, mimeType: 'text/plain' });
  const [showDocForm, setShowDocForm] = useState(false);

  // Drive Import State
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [driveUserEmail, setDriveUserEmail] = useState<string | null>(null);
  const [isGoogleLibReady, setIsGoogleLibReady] = useState(false);

  // Permission Check
  const canEditSystem = currentUserRole === UserRole.ADMIN;
  const canEditUsers = currentUserRole === UserRole.ADMIN;
  const canEditKnowledge = currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.EDITOR;

  // Initialize Google Identity Services (GIS)
  const initializeGsi = useCallback(() => {
    if (window.google?.accounts?.oauth2 && localSettings.googleClientId) {
        try {
            console.log("Init Token Client with:", localSettings.googleClientId);
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: localSettings.googleClientId,
                scope: 'https://www.googleapis.com/auth/drive.readonly',
                callback: (tokenResponse: any) => {
                    console.log("Token Response:", tokenResponse);
                    if (tokenResponse.error) {
                        alert("Lỗi đăng nhập Google (Error): " + JSON.stringify(tokenResponse));
                        return;
                    }
                    if (tokenResponse.access_token) {
                        setAccessToken(tokenResponse.access_token);
                        // Fetch user info
                        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                        })
                        .then(res => res.json())
                        .then(data => setDriveUserEmail(data.email))
                        .catch(err => console.error("Failed to fetch user info", err));
                    }
                },
            });
            setTokenClient(client);
            setIsGoogleLibReady(true);
        } catch (e) {
            console.error("Failed to init GIS", e);
        }
    }
  }, [localSettings.googleClientId]);

  // Check for script load periodically
  useEffect(() => {
    const checkInterval = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
            initializeGsi();
            setIsGoogleLibReady(true);
            clearInterval(checkInterval);
        }
    }, 500);
    return () => clearInterval(checkInterval);
  }, [initializeGsi]);

  const handleConnectDrive = () => {
    if (!localSettings.googleClientId) {
        alert("Vui lòng nhập Google Client ID trong tab 'Hệ thống' trước.");
        setActiveTab('system');
        return;
    }
    
    if (!tokenClient && !window.google?.accounts?.oauth2) {
        alert("Đang tải thư viện Google... Vui lòng thử lại sau vài giây.");
        return;
    }

    if (tokenClient) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        // Fallback: Try to init again if clicked
        initializeGsi();
        alert("Đang khởi tạo kết nối. Vui lòng bấm nút lần nữa.");
    }
  };

  const handleSyncUsers = async () => {
    if (!localSettings.userSheetUrl) {
      setSyncMessage('Vui lòng nhập Link Google Sheet trước.');
      return;
    }
    setIsSyncing(true);
    setSyncMessage('');
    try {
      const users = await syncUsersFromSheet(localSettings.userSheetUrl);
      setLocalSettings(prev => ({ ...prev, users }));
      setSyncMessage(`Đã đồng bộ thành công ${users.length} nhân sự.`);
    } catch (e) {
      setSyncMessage('Lỗi kết nối đến Google Sheet.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSave = () => {
    saveSettings(localSettings);
    onSave(localSettings);
  };

  // --- Document CRUD Handlers ---

  const handleEditDoc = (doc: DriveFile) => {
    setEditingDocId(doc.id);
    setDocForm({ ...doc });
    setShowDocForm(true);
  };

  const handleAddDoc = () => {
    setEditingDocId(null);
    setDocForm({ 
        name: '', 
        content: '', 
        webViewLink: '', 
        department: Department.GENERAL, 
        mimeType: 'text/plain' 
    });
    setShowDocForm(true);
  };

  const handleDeleteDoc = (id: string) => {
    if(window.confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) {
        setLocalSettings(prev => ({
            ...prev,
            knowledgeBase: prev.knowledgeBase.filter(d => d.id !== id)
        }));
    }
  };

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.name || !docForm.content) return;

    if (editingDocId) {
        // Update existing
        setLocalSettings(prev => ({
            ...prev,
            knowledgeBase: prev.knowledgeBase.map(d => d.id === editingDocId ? { ...d, ...docForm } as DriveFile : d)
        }));
    } else {
        // Create new
        const newDoc: DriveFile = {
            ...docForm as DriveFile,
            id: 'doc_' + Date.now(),
        };
        setLocalSettings(prev => ({
            ...prev,
            knowledgeBase: [...prev.knowledgeBase, newDoc]
        }));
    }
    setShowDocForm(false);
  };

  // --- FILE PARSING HELPERS ---

  const parsePdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    } catch (e) {
      console.error("PDF Parse Error", e);
      throw new Error("Không thể đọc file PDF. File có thể bị hỏng hoặc đặt mật khẩu.");
    }
  };

  const parseDocx = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      return result.value;
    } catch (e) {
       console.error("Docx Parse Error", e);
       throw new Error("Không thể đọc file Word.");
    }
  };

  // --- GOOGLE DRIVE INTEGRATION ---

  const extractFolderId = (url: string) => {
    const match = url.match(/folders\/([a-zA-Z0-9-_]+)/) || url.match(/id=([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url; 
  };

  const triggerDriveImport = async (dept: Department, folderLink: string) => {
    if (!accessToken) {
        alert("Vui lòng kết nối Google Drive trước.");
        return;
    }
    if (!localSettings.geminiApiKey) {
        alert("Chưa có Gemini API Key.");
        return;
    }
    if (!folderLink) {
        alert("Vui lòng nhập Link Folder Drive.");
        return;
    }
    
    await processDriveImport(dept, folderLink, accessToken);
  };

  const processDriveImport = async (dept: Department, folderLink: string, token: string) => {
    const folderId = extractFolderId(folderLink);
    setIsImporting(true);
    setImportStatus(`Đang kết nối Drive cho ${dept}...`);

    try {
        // Load GAPI client if not loaded
        if (!window.gapi.client?.drive) {
            await new Promise<void>((resolve) => window.gapi.load('client', resolve));
            await window.gapi.client.init({
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
            });
        }
        
        // Always ensure token is set for GAPI calls
        window.gapi.client.setToken({ access_token: token });

        setImportStatus("Đang quét file...");
        
        // List files: Docs, PDF, Word
        const listRes = await window.gapi.client.drive.files.list({
            q: `'${folderId}' in parents and trashed = false and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'text/plain' or mimeType = 'application/pdf' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')`,
            fields: 'files(id, name, mimeType, webViewLink)',
            pageSize: 50
        });

        const files = listRes.result.files;
        if (!files || files.length === 0) {
            alert(`Không tìm thấy tài liệu phù hợp (Doc, PDF, Word) trong thư mục.`);
            setIsImporting(false);
            return;
        }

        setImportStatus(`Tìm thấy ${files.length} file. Đang xử lý...`);
        let importedCount = 0;
        const newDocs: DriveFile[] = [];

        for (const file of files) {
            try {
                setImportStatus(`Đang tải: ${file.name}...`);
                let content = '';
                
                if (file.mimeType === 'application/vnd.google-apps.document') {
                    // Google Doc -> Text
                    const res = await window.gapi.client.drive.files.export({
                        fileId: file.id, mimeType: 'text/plain'
                    });
                    content = res.body;
                } else {
                    // Binary files (PDF, Word) -> ArrayBuffer -> Text
                    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const arrayBuffer = await res.arrayBuffer();

                    if (file.mimeType === 'application/pdf') {
                        content = await parsePdf(arrayBuffer);
                    } else if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                        content = await parseDocx(arrayBuffer);
                    } else if (file.mimeType === 'text/plain') {
                         content = await new TextDecoder().decode(arrayBuffer);
                    }
                }

                if (content && content.trim().length > 0) {
                    newDocs.push({
                        id: file.id,
                        name: file.name,
                        content: content,
                        department: dept,
                        webViewLink: file.webViewLink,
                        mimeType: file.mimeType
                    });
                    importedCount++;
                }
            } catch (err) {
                console.warn(`Skipped ${file.name}:`, err);
            }
        }

        setLocalSettings(prev => {
            const existingIds = new Set(prev.knowledgeBase.map(d => d.id));
            const uniqueNewDocs = newDocs.filter(d => !existingIds.has(d.id));
            return {
                ...prev,
                knowledgeBase: [...prev.knowledgeBase, ...uniqueNewDocs]
            };
        });

        alert(`Đã nhập thành công ${importedCount} tài liệu mới.`);

    } catch (error: any) {
        console.error("Drive Import Error", error);
        alert("Lỗi nhập dữ liệu: " + (error?.result?.error?.message || error.message));
    } finally {
        setIsImporting(false);
        setImportStatus('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Cài đặt hệ thống</h2>
        <div className="flex gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            Hủy
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Lưu thay đổi
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col pt-4">
          <TabButton 
            active={activeTab === 'system'} 
            onClick={() => setActiveTab('system')} 
            icon="fa-cogs" 
            label="Hệ thống & API"
            disabled={!canEditSystem}
          />
          <TabButton 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
            icon="fa-users-cog" 
            label="Nhân sự & Phân quyền"
            disabled={!canEditUsers}
          />
          <TabButton 
            active={activeTab === 'knowledge'} 
            onClick={() => setActiveTab('knowledge')} 
            icon="fa-folder-tree" 
            label="Kho dữ liệu nguồn"
            disabled={!canEditKnowledge}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {/* SYSTEM TAB */}
          {activeTab === 'system' && (
            <div className="max-w-2xl space-y-6 animate-fadeIn">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Cấu hình API</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
                    <input 
                      type="password" 
                      value={localSettings.geminiApiKey}
                      onChange={(e) => setLocalSettings({...localSettings, geminiApiKey: e.target.value})}
                      placeholder="AIzaSy..."
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Dùng để kích hoạt Gemini 2.5 Flash.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Google OAuth Client ID</label>
                    <input 
                      type="text" 
                      value={localSettings.googleClientId || ''}
                      onChange={(e) => setLocalSettings({...localSettings, googleClientId: e.target.value})}
                      placeholder="xxxx-xxxx.apps.googleusercontent.com"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Bắt buộc để sử dụng tính năng "Nhập từ Drive". <br/>
                        <span className="text-red-500 font-bold">Quan trọng:</span> Hãy thêm domain của ứng dụng vào phần <strong>"Authorized JavaScript origins"</strong> trên Google Cloud Console.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Nguồn dữ liệu nhân sự</h3>
                <div className="flex gap-3 mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Google Sheet Link</label>
                    <input 
                      type="text" 
                      value={localSettings.userSheetUrl}
                      onChange={(e) => setLocalSettings({...localSettings, userSheetUrl: e.target.value})}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={handleSyncUsers}
                      disabled={isSyncing}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSyncing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-rotate"></i>}
                      Đồng bộ
                    </button>
                  </div>
                </div>
                {syncMessage && (
                   <p className={`text-sm ${syncMessage.includes('Lỗi') ? 'text-red-500' : 'text-green-600'}`}>
                     {syncMessage}
                   </p>
                )}
                
                <div className="mt-6 bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800 border border-yellow-100">
                  <strong>Yêu cầu cấu trúc Sheet:</strong><br/>
                  Cột A: Họ tên | Cột B: Email | Cột C: Phòng ban | Cột D: Quyền (Nhân viên / Biên tập viên / Quản trị viên)
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-700">Danh sách nhân sự hiện tại ({localSettings.users.length})</h3>
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3">Họ tên</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Phòng ban</th>
                      <th className="px-6 py-3">Quyền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localSettings.users.map((u, idx) => (
                      <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-900">{u.name}</td>
                        <td className="px-6 py-3 text-gray-500">{u.email}</td>
                        <td className="px-6 py-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{u.department}</span>
                        </td>
                        <td className="px-6 py-3">
                           <RoleBadge role={u.role} />
                        </td>