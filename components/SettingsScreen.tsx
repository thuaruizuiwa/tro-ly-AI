import React, { useState, useEffect } from 'react';
import { AppSettings, User, Department, UserRole } from '../types';
import { saveSettings, syncUsersFromSheet } from '../services/storageService';

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

  // Permission Check
  const canEditSystem = currentUserRole === UserRole.ADMIN;
  const canEditUsers = currentUserRole === UserRole.ADMIN;
  const canEditKnowledge = currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.EDITOR;

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
            label="Kho tài liệu (Drive)"
            disabled={!canEditKnowledge}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* KNOWLEDGE BASE TAB */}
          {activeTab === 'knowledge' && (
            <div className="space-y-6 animate-fadeIn">
               <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                  <i className="fa-solid fa-circle-info text-blue-500 mt-1"></i>
                  <div className="text-sm text-blue-800">
                    <strong>Hướng dẫn:</strong> Nhập link Google Drive Folder chứa tài liệu cho từng phòng ban. 
                    AI sẽ tự động tra cứu trong "Tài liệu chung" + "Tài liệu phòng ban" của người hỏi.
                  </div>
               </div>

               <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="grid grid-cols-1 divide-y divide-gray-100">
                    {Object.values(Department).map((dept) => (
                      <div key={dept} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                         <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500">
                            <i className="fa-brands fa-google-drive text-xl"></i>
                         </div>
                         <div className="w-48 flex-shrink-0">
                            <h4 className="font-medium text-gray-900">{dept}</h4>
                            <p className="text-xs text-gray-500">Folder ID Config</p>
                         </div>
                         <div className="flex-1">
                            <input 
                              type="text"
                              value={localSettings.departmentFolders[dept] || ''}
                              onChange={(e) => {
                                setLocalSettings(prev => ({
                                  ...prev,
                                  departmentFolders: {
                                    ...prev.departmentFolders,
                                    [dept]: e.target.value
                                  }
                                }));
                              }}
                              placeholder={`Paste Drive Link for ${dept}...`}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                            />
                         </div>
                         <div className="flex-shrink-0">
                           {localSettings.departmentFolders[dept] ? (
                              <a 
                                href={localSettings.departmentFolders[dept]} 
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                <i className="fa-solid fa-external-link-alt mr-1"></i>
                                Open
                              </a>
                           ) : (
                             <span className="text-gray-300 text-sm italic">Chưa cấu hình</span>
                           )}
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex items-center gap-3 px-6 py-4 text-sm font-medium w-full text-left transition-colors
      ${active ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}
  >
    <i className={`fa-solid ${icon} w-5 text-center`}></i>
    {label}
  </button>
);

const RoleBadge = ({ role }: { role: UserRole }) => {
  const colors = {
    [UserRole.ADMIN]: 'bg-purple-100 text-purple-700',
    [UserRole.EDITOR]: 'bg-orange-100 text-orange-700',
    [UserRole.EMPLOYEE]: 'bg-gray-100 text-gray-700'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[role]}`}>
      {role}
    </span>
  );
}

export default SettingsScreen;