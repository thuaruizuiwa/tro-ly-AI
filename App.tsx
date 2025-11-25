import React, { useState, useRef, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import SettingsScreen from './components/SettingsScreen';
import { User, ChatMessage, MessageType, SourceType, AppSettings } from './types';
import { processQuery } from './services/geminiService';
import { getSettings, initializeGapiClient } from './services/storageService';
import ReactMarkdown from 'react-markdown';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [view, setView] = useState<'chat' | 'settings'>('chat');
  const [gapiInitialized, setGapiInitialized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize GAPI client
  useEffect(() => {
    if (settings.geminiApiKey) {
      initializeGapiClient(settings.geminiApiKey)
        .then(() => {
          console.log("GAPI client initialized successfully.");
          setGapiInitialized(true);
        })
        .catch(error => {
          console.error("Error initializing GAPI client:", error);
          // Optionally, show a generic error to the user
        });
    }
  }, [settings.geminiApiKey]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (view === 'chat') {
      scrollToBottom();
    }
  }, [messages, isLoading, view]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: MessageType.USER,
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await processQuery(userMessage.content, user.department, settings);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: MessageType.BOT,
        content: result.answer,
        sourceType: result.sourceType === 'internal' ? SourceType.INTERNAL : SourceType.EXTERNAL,
        sources: result.sources
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
         id: (Date.now() + 1).toString(),
         type: MessageType.BOT,
         content: "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceIcon = (type: SourceType, title: string) => {
    if (type === SourceType.EXTERNAL) return "fa-globe";
    if (title.endsWith('.pdf')) return "fa-file-pdf";
    if (title.endsWith('.xlsx') || title.endsWith('.xls')) return "fa-file-excel";
    if (title.endsWith('.docx') || title.endsWith('.doc')) return "fa-file-word";
    if (title.endsWith('.gdoc')) return "fa-file-lines";
    if (title.endsWith('.pptx')) return "fa-file-powerpoint";
    return "fa-brands fa-google-drive";
  };

  if (!user) {
    return <LoginScreen settings={settings} onLogin={setUser} gapiInitialized={gapiInitialized} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar 
        user={user} 
        onLogout={() => { setUser(null); setMessages([]); setView('chat'); }} 
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSettings={() => { setView('settings'); setIsSidebarOpen(false); }}
      />

      <main className="flex-1 flex flex-col h-full relative w-full overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between md:hidden z-10 flex-shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
            <i className="fa-solid fa-bars text-xl"></i>
          </button>
          <span className="font-semibold text-gray-800">Nexus AI</span>
          <div className="w-6"></div>
        </header>

        {view === 'settings' ? (
          <SettingsScreen 
            settings={settings} 
            currentUserRole={user.role}
            onSave={(newSettings) => {
              setSettings(newSettings);
              // Update current user if specific user info changed in sheet
              const updatedUser = newSettings.users.find(u => u.email === user.email);
              if (updatedUser) setUser(updatedUser);
              setView('chat');
            }}
            onClose={() => setView('chat')}
          />
        ) : (
          <>
             {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                        <i className="fa-brands fa-google-drive text-blue-600 text-4xl"></i>
                    </div>
                    <p className="text-lg font-medium text-gray-600">Xin chào, {user.name}</p>
                    <p className="text-sm">Tôi đã kết nối với tài liệu phòng: <span className="font-bold">{user.department}</span></p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex w-full ${msg.type === MessageType.USER ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[90%] md:max-w-[75%] gap-3 ${msg.type === MessageType.USER ? 'flex-row-reverse' : 'flex-row'}`}>
                      
                      {/* Avatar */}
                      <div className={`
                        w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white
                        ${msg.type === MessageType.USER ? 'bg-gray-700' : 'bg-blue-600'}
                      `}>
                        <i className={`fa-solid ${msg.type === MessageType.USER ? 'fa-user' : 'fa-robot'}`}></i>
                      </div>

                      {/* Bubble */}
                      <div className={`flex flex-col ${msg.type === MessageType.USER ? 'items-end' : 'items-start'}`}>
                        <div className={`
                          px-5 py-3 rounded-2xl shadow-sm text-sm leading-relaxed
                          ${msg.type === MessageType.USER 
                            ? 'bg-gray-800 text-white rounded-tr-none' 
                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}
                        `}>
                            <ReactMarkdown 
                                className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1"
                                components={{
                                    a: ({node, ...props}) => <a {...props} className="text-blue-500 hover:underline" target="_blank" rel="noreferrer" />
                                }}
                            >
                                {msg.content}
                            </ReactMarkdown>
                        </div>

                        {/* Meta / Sources */}
                        {msg.type === MessageType.BOT && (
                          <div className="mt-2 flex flex-col gap-1 animate-fadeIn">
                            {/* Source Badge */}
                            <div className="flex items-center gap-2">
                              <span className={`
                                  text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border flex items-center gap-1
                                  ${msg.sourceType === SourceType.INTERNAL 
                                    ? 'bg-green-50 text-green-700 border-green-100' 
                                    : 'bg-orange-50 text-orange-600 border-orange-100'}
                              `}>
                                  <i className={`fa-solid ${msg.sourceType === SourceType.INTERNAL ? 'fa-check' : 'fa-globe'}`}></i>
                                  {msg.sourceType === SourceType.INTERNAL ? 'Tài liệu nội bộ' : 'Tìm kiếm Web'}
                              </span>
                            </div>

                            {/* Source Links */}
                            {msg.sources && msg.sources.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-2">
                                    {msg.sources.map((src, idx) => (
                                        <a 
                                          key={idx} 
                                          href={src.link} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className={`
                                            group flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border text-xs transition-all
                                            ${msg.sourceType === SourceType.INTERNAL
                                              ? 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-sm text-gray-600'
                                              : 'bg-orange-50/50 border-orange-100 hover:border-orange-300 text-orange-800'}
                                          `}
                                        >
                                            <div className={`
                                                w-6 h-6 rounded flex items-center justify-center
                                                ${msg.sourceType === SourceType.INTERNAL ? 'bg-gray-100 group-hover:bg-blue-50 text-gray-500 group-hover:text-blue-600' : 'bg-white text-orange-500'}
                                            `}>
                                                <i className={`fa-solid ${getSourceIcon(msg.sourceType || SourceType.EXTERNAL, src.title)}`}></i>
                                            </div>
                                            <span className="truncate max-w-[150px] font-medium">
                                                {src.title}
                                            </span>
                                        </a>
                                    ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex w-full justify-start">
                  <div className="flex max-w-[75%] gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-xs text-white">
                        <i className="fa-solid fa-robot"></i>
                      </div>
                      <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                      </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Đặt câu hỏi..."
                  disabled={isLoading}
                  className="w-full pl-5 pr-14 py-4 rounded-xl bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-inner text-gray-800 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`
                    absolute right-2 top-2 bottom-2 aspect-square rounded-lg flex items-center justify-center transition-all
                    ${!input.trim() || isLoading 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}
                  `}
                >
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}