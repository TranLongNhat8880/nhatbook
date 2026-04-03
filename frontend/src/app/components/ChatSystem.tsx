import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Minus, Search, Send, Paperclip, Smile, MoreHorizontal, Phone, Video, Users } from "lucide-react";
import { useSearchParams, useLocation } from "react-router";
import { io, Socket } from "socket.io-client";
import { API_ENDPOINTS } from "../api.config";
import { UserAvatar } from "./ui/UserAvatar";

interface Conversation {
  other_user_id: string;
  other_username: string;
  other_avatar: string;
  content: string;
  sender_id: string;
  unread_count: number;
}

interface Friend {
  id: string;
  username: string;
  avatar_url?: string;
  role: string;
}

/**
 * NHATCHAT - HỆ THỐNG CHAT NỔI (FLOATING CHAT)
 */
export default function ChatSystem({ token, currentUser }: { token: string; currentUser: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Khởi khởi tạo Socket
  useEffect(() => {
    if (!token || !currentUser) return;
    const backendUrl = (import.meta as any).env.VITE_API_URL || "http://localhost:3000";
    const newSocket = io(backendUrl);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("register", currentUser.id);
    });

    newSocket.on("RECEIVE_PRIVATE_MESSAGE", (msg: any) => {
      // Nếu đang mở đúng cửa sổ chat và KHÔNG bị thu nhỏ -> Đánh dấu đã đọc
      if (selectedUser && msg.sender_id === selectedUser.id && isOpen && !isMinimized) {
        setMessages((prev: any[]) => [...prev, msg]);
        markRead(selectedUser.id);
      } else {
        // Nếu không, chỉ cần update list hội thoại để hiện dot hoặc update tin nhắn mới nhất
        if (selectedUser && msg.sender_id === selectedUser.id) {
            setMessages((prev: any[]) => [...prev, msg]);
        }
        fetchConversations();
      }
    });

    newSocket.on("MESSAGE_SENT", (msg: any) => {
      setMessages((prev: any[]) => [...prev, msg]);
      fetchConversations();
    });

    newSocket.on("TYPING_STATUS", ({ senderId, isTyping }) => {
      if (selectedUser && senderId === selectedUser.id) {
        setIsTyping(isTyping);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token, currentUser?.id, selectedUser?.id]);

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchConversations();
      fetchFriends();
    }
  }, [isOpen]);

  // Xử lý auto-open chat khi có tham số ?chat=ID trên URL
  useEffect(() => {
    const chatUserId = searchParams.get("chat");
    if (chatUserId && currentUser) {
      setIsOpen(true);
      setIsMinimized(false);
      
      // Kiểm tra xem user này đã có trong list conversation chưa
      const existing = conversations.find(c => c.other_user_id === chatUserId);
      if (existing) {
        setSelectedUser({ id: existing.other_user_id, username: existing.other_username, avatar_url: existing.other_avatar });
      } else {
        // Nếu chưa, có thể fetch info user (hoặc thử tìm trong list friends)
        fetchUserInfo(chatUserId);
      }
      
      // Xóa tham số chat sau khi đã xử lý để tránh loop hoặc phiền toái khi điều hướng khác
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("chat");
      setSearchParams(newParams, { replace: true });
    }
  }, [location.search, currentUser, conversations]);

  const fetchUserInfo = async (id: string) => {
    try {
      const res = await fetch(API_ENDPOINTS.GET_PUBLIC_PROFILE(id));
      const data = await res.json();
      if (res.ok) {
        setSelectedUser({ id: data.user.id, username: data.user.username, avatar_url: data.user.avatar_url });
      }
    } catch (err) { console.error(err); }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.GET_FRIENDS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setFriends(data.friends);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchChatHistory(selectedUser.id);
      markRead(selectedUser.id);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.GET_CONVERSATIONS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setConversations(data.conversations);
    } catch (err) { console.error(err); }
  };

  const fetchChatHistory = async (otherUserId: string) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.GET_CHAT_HISTORY}/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setMessages(data.messages);
    } catch (err) { console.error(err); }
  };

  const markRead = async (senderId: string) => {
    try {
      await fetch(API_ENDPOINTS.MARK_MESSAGES_READ, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ senderId })
      });
      fetchConversations();
    } catch (err) { console.error(err); }
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`${API_ENDPOINTS.SEARCH_USERS_CHAT}?query=${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setSearchResults(data.users);
    } catch (err) { console.error(err); }
  };

  const sendMessage = () => {
    if (!inputText.trim() || !selectedUser || !socket) return;
    socket.emit("SEND_PRIVATE_MESSAGE", {
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      content: inputText
    });
    setInputText("");
    socket.emit("TYPING_STATUS", { senderId: currentUser.id, receiverId: selectedUser.id, isTyping: false });
  };

  const handleTyping = (e: any) => {
    setInputText(e.target.value);
    if (!socket || !selectedUser) return;
    socket.emit("TYPING_STATUS", { 
      senderId: currentUser.id, 
      receiverId: selectedUser.id, 
      isTyping: e.target.value.length > 0 
    });
  };

  if (!currentUser) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-[100] transition-all duration-300 transform ${isOpen ? "scale-100" : "scale-100"}`}>
      {/* NÚT MỞ CHAT (KHI ĐANG ĐÓNG) */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-emerald-500 text-white p-4 rounded-full shadow-2xl hover:bg-emerald-600 transition-all hover:scale-110 active:scale-95 group relative"
        >
          <MessageSquare className="w-7 h-7" />
          {conversations.some(c => c.unread_count > 0) && (
            <span className="absolute -top-1 -right-1 bg-rose-500 w-4 h-4 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </button>
      )}

      {/* CỬA SỔ CHAT NỔI */}
      {isOpen && (
        <div className={`bg-card/95 backdrop-blur-xl border border-border/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] rounded-3xl overflow-hidden flex flex-col transition-all duration-500 ${isMinimized ? "h-16 w-80" : "h-[600px] w-[900px] max-w-[90vw] max-h-[85vh]"}`}>
          
          {/* HEADER CHUNG */}
          <div className="bg-emerald-500/10 px-6 py-4 border-b border-border/30 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-xl">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-black text-foreground tracking-tight text-lg underline decoration-emerald-500/30 decoration-4 underline-offset-4">NhatChat</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors text-emerald-500"><Minus className="w-5 h-5" /></button>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors text-rose-500"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex-1 flex overflow-hidden">
              {/* SIDEBAR BÊN TRÁI - DANH SÁCH HỘI THOẠI */}
              <div className="w-80 border-r border-border/50 flex flex-col shrink-0 bg-muted/20">
                <div className="p-4">
                   <div className="relative group">
                     <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                     <input 
                       type="text" 
                       placeholder="Tìm bạn bè..."
                       value={searchQuery}
                       onChange={(e) => handleSearch(e.target.value)}
                       onFocus={() => setIsSearchMode(true)}
                       className="w-full bg-background border border-border/50 pl-10 pr-4 py-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all shadow-sm text-foreground"
                     />
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
                  {isSearchMode && searchQuery.length > 0 ? (
                    <div className="space-y-1">
                      <p className="px-4 text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Kết quả tìm kiếm</p>
                      {searchResults.map(u => (
                        <button 
                          key={u.id}
                          onClick={() => { setSelectedUser(u); setIsSearchMode(false); setSearchQuery(""); }}
                          className="w-full p-3 rounded-2xl hover:bg-emerald-500/10 flex items-center gap-3 transition-all group"
                        >
                          <UserAvatar src={u.avatar_url} username={u.username} size="md" className="group-hover:ring-2 ring-emerald-500/20" />
                          <span className="font-semibold text-emerald-900 text-sm">{u.username}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="px-4 text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Gần đây</p>
                      {conversations.map(c => (
                        <button 
                          key={c.other_user_id}
                          onClick={() => setSelectedUser({ id: c.other_user_id, username: c.other_username, avatar_url: c.other_avatar })}
                          className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all hover:bg-emerald-50/50 relative group ${selectedUser?.id === c.other_user_id ? 'bg-emerald-500/10' : ''}`}
                        >
                          <div className="relative">
                            <UserAvatar src={c.other_avatar} username={c.other_username} size="md" />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-bold text-emerald-900 text-sm truncate">{c.other_username}</p>
                            <p className={`text-xs truncate ${c.unread_count > 0 ? 'text-emerald-600 font-bold' : 'text-muted-foreground'}`}>
                              {c.sender_id === currentUser.id ? 'Bạn: ' : ''}{c.content}
                            </p>
                          </div>
                          {c.unread_count > 0 && (
                            <span className="bg-emerald-500 text-white text-[10px] font-black min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                              {c.unread_count}
                            </span>
                          )}
                        </button>
                      ))}

                      {/* FRIEND LIST SECTION */}
                      {friends.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-emerald-50">
                          <p className="px-4 text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                             <Users className="w-3 h-3" /> Tất cả bạn bè
                          </p>
                          {friends.map(f => (
                            <button 
                              key={f.id}
                              onClick={() => setSelectedUser(f)}
                              className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all hover:bg-emerald-50/50 group ${selectedUser?.id === f.id ? 'bg-emerald-500/10' : ''}`}
                            >
                              <UserAvatar src={f.avatar_url} username={f.username} size="md" />
                              <div className="flex-1 text-left min-w-0">
                                <p className="font-bold text-emerald-900 text-sm truncate">{f.username}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">{f.role}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* KHU VỰC CHAT CHÍNH BÊN PHẢI */}
              <div className="flex-1 flex flex-col bg-background/30">
                {selectedUser ? (
                  <>
                    {/* Header Chat Window */}
                    <div className="px-6 py-4 border-b border-border/30 flex justify-between items-center shrink-0 bg-card/50">
                      <div className="flex items-center gap-3">
                        <UserAvatar src={selectedUser.avatar_url} username={selectedUser.username} size="md" />
                        <div>
                          <p className="font-bold text-foreground leading-none mb-1">{selectedUser.username}</p>
                          <p className="text-[10px] text-emerald-500 flex items-center gap-1 font-bold italic uppercase"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Đang hoạt động</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-2.5 hover:bg-emerald-500/10 text-emerald-500 rounded-xl transition-all"><Phone className="w-5 h-5" /></button>
                        <button className="p-2.5 hover:bg-emerald-500/10 text-emerald-500 rounded-xl transition-all"><Video className="w-5 h-5" /></button>
                        <button className="p-2.5 hover:bg-emerald-500/10 text-emerald-500 rounded-xl transition-all"><MoreHorizontal className="w-5 h-5" /></button>
                      </div>
                    </div>

                    {/* Tin nhắn Loop */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed custom-scrollbar">
                      {messages.map((m, idx) => {
                         const isMe = m.sender_id === currentUser.id;
                         return (
                           <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                             <div className={`flex gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                               {!isMe && <UserAvatar src={selectedUser.avatar_url} username={selectedUser.username} size="sm" className="mt-1 shrink-0" />}
                               <div className="flex flex-col">
                                 <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-emerald-600 text-white rounded-tr-none font-medium' : 'bg-muted border border-border/50 text-foreground rounded-tl-none font-medium'}`}>
                                   {m.content}
                                 </div>
                                 <span className={`text-[9px] mt-1 text-muted-foreground/60 font-mono ${isMe ? 'text-right' : 'text-left'}`}>
                                   {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                               </div>
                             </div>
                           </div>
                         )
                      })}
                      {isTyping && (
                         <div className="flex justify-start">
                            <div className="flex gap-2 items-center bg-emerald-50 px-4 py-2 rounded-2xl rounded-tl-none">
                              <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-bounce"></span>
                              </div>
                            </div>
                         </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-border/30 bg-card/30">
                       <div className="bg-muted/50 rounded-2xl p-2 flex items-center gap-2 border border-border/50 focus-within:border-emerald-500/50 transition-all">
                          <button className="p-2 hover:bg-emerald-500/10 text-emerald-500 rounded-xl transition-all"><Paperclip className="w-5 h-5" /></button>
                          <button className="p-2 hover:bg-emerald-500/10 text-emerald-500 rounded-xl transition-all"><Smile className="w-5 h-5" /></button>
                          <input 
                            type="text" 
                            placeholder="Nhập tin nhắn..."
                            value={inputText}
                            onChange={handleTyping}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            className="bg-transparent border-none flex-1 text-sm focus:outline-none focus:ring-0 placeholder-muted-foreground/50 font-medium text-foreground"
                          />
                          <button 
                            disabled={!inputText.trim()}
                            onClick={sendMessage}
                            className={`p-2.5 rounded-xl transition-all ${inputText.trim() ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-105' : 'bg-muted-foreground/10 text-muted-foreground/30'}`}
                          >
                            <Send className="w-5 h-5" />
                          </button>
                       </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-40 grayscale group">
                    <div className="bg-emerald-100 p-8 rounded-full mb-6 group-hover:scale-110 transition-transform duration-500">
                      <MessageSquare className="w-16 h-16 text-emerald-500" />
                    </div>
                    <h4 className="text-xl font-black text-emerald-900 tracking-tight">Chào mừng đến với NhatChat</h4>
                    <p className="text-sm mt-2 font-medium max-w-[250px]">Hãy chọn một hội thoại hoặc tìm kiếm bạn bè để bắt đầu tám chuyện ngay!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
        }
      `}</style>
    </div>
  );
}
