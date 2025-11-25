import React, { useState } from 'react';
import { AppSettings, User } from '../types';

interface LoginScreenProps {
  settings: AppSettings;
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ settings, onLogin }) => {
  const [error, setError] = useState('');
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Simulation of Google Auth Flow
  const handleGoogleLogin = () => {
    setIsPopupOpen(true);
  };

  const handleSelectAccount = (user: User) => {
    onLogin(user);
    setIsPopupOpen(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 text-center">
        
        <div className="mb-8">
          <div className="w-16 h-16 bg-white border border-gray-100 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg">
             {/* Logo Placeholder */}
             <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Đăng nhập</h1>
          <p className="text-gray-500 mt-2 text-sm">Sử dụng tài khoản Google Workspace của công ty để truy cập Nexus AI.</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" className="w-5 h-5" />
          Tiếp tục với Google
        </button>

        <div className="mt-8 text-xs text-gray-400">
           Hệ thống được bảo mật và chỉ dành cho nhân viên nội bộ.<br/>
           Liên hệ Admin nếu không thể truy cập.
        </div>
      </div>

      {/* Simulated Google Account Chooser Popup */}
      {isPopupOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center">
               <span className="text-gray-600 font-medium">Chọn tài khoản</span>
               <button onClick={() => setIsPopupOpen(false)} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-times"></i></button>
             </div>
             <div className="max-h-[400px] overflow-y-auto">
                <div className="p-4 space-y-2">
                   <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">Tài khoản khả dụng (Demo)</p>
                   {settings.users.map((user, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleSelectAccount(user)}
                        className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer rounded-lg border border-transparent hover:border-blue-100 transition-all group"
                      >
                         <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                            {user.name.charAt(0)}
                         </div>
                         <div className="text-left flex-1">
                            <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                         </div>
                         <div className="text-xs text-gray-400 group-hover:text-blue-600">
                            {user.department}
                         </div>
                      </div>
                   ))}
                </div>
                
                {/* Simulated unauthorized account */}
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                   <div 
                     className="flex items-center gap-3 p-3 opacity-60 hover:opacity-100 cursor-pointer rounded-lg border border-transparent hover:border-red-200 hover:bg-red-50"
                     onClick={() => {
                        setError('Tài khoản này không có quyền truy cập.');
                        setIsPopupOpen(false);
                        alert("Truy cập bị từ chối: Email không nằm trong danh sách cho phép.");
                     }}
                   >
                       <div className="w-10 h-10 rounded-full bg-gray-400 text-white flex items-center justify-center font-bold text-sm">?</div>
                       <div className="text-left">
                          <p className="text-sm font-semibold text-gray-600">Guest User</p>
                          <p className="text-xs text-gray-500">stranger@gmail.com</p>
                       </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;