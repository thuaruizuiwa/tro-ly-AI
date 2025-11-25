import React from 'react';
import { User, Department, UserRole } from '../types';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, isOpen, toggleSidebar, onOpenSettings }) => {
  
  const canAccessSettings = user.role === UserRole.ADMIN || user.role === UserRole.EDITOR;

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      <div className={`
        fixed md:static inset-y-0 left-0 z-30
        w-72 bg-gray-900 text-white flex flex-col h-full transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/50">
            <i className="fa-solid fa-layer-group text-sm"></i>
          </div>
          <div>
            <span className="font-bold text-lg tracking-wide block leading-none">Nexus AI</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Internal</span>
          </div>
          <button onClick={toggleSidebar} className="md:hidden ml-auto text-gray-400 hover:text-white">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        {/* User Profile Card */}
        <div className="p-6">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-inner">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white text-sm shadow-md">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-sm truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 mt-2">
               <div className="flex items-center gap-2 text-[10px] bg-gray-900/50 p-1.5 rounded border border-gray-700/50">
                  <i className="fa-solid fa-building text-blue-400 w-4 text-center"></i>
                  <span className="text-gray-300 truncate">{user.department}</span>
               </div>
               <div className="flex items-center gap-2 text-[10px] bg-gray-900/50 p-1.5 rounded border border-gray-700/50">
                  <i className="fa-solid fa-id-badge text-purple-400 w-4 text-center"></i>
                  <span className="text-gray-300">{user.role}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
          
          <div className="mb-6">
             <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Connected Knowledge</p>
             <div className="mx-2 p-3 rounded bg-gray-800/50 border border-gray-800">
                <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="font-semibold">Google Drive Active</span>
                </div>
                <div className="space-y-1">
                    <FolderItem name={Department.GENERAL} />
                    {user.department !== Department.GENERAL && (
                        <FolderItem name={user.department} highlight />
                    )}
                </div>
             </div>
          </div>

          {canAccessSettings && (
             <button 
               onClick={onOpenSettings}
               className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600/10 text-blue-400 rounded-lg hover:bg-blue-600/20 transition-all border border-blue-600/20 mb-4"
             >
                <i className="fa-solid fa-gear w-5"></i>
                <span className="font-medium text-sm">Cài đặt hệ thống</span>
             </button>
          )}

          <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Menu</p>
          <div className="flex items-center gap-3 px-4 py-2 text-white bg-gray-800 rounded-lg">
             <i className="fa-regular fa-comments w-5 text-center"></i>
             <span className="text-sm">Trợ lý ảo</span>
          </div>

        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
};

const FolderItem = ({ name, highlight }: { name: string, highlight?: boolean }) => (
    <div className={`flex items-center gap-2 text-[11px] px-2 py-1 rounded ${highlight ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>
        <i className={`fa-regular ${highlight ? 'fa-folder-open' : 'fa-folder'}`}></i> 
        <span className="truncate">{name}</span>
    </div>
)

export default Sidebar;