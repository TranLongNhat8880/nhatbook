import { useState, useEffect } from "react";
import {
  Home,
  UserCircle,
  ShieldCheck,
  FileText,
  SunMoon,
  LogOut,
  X,
  ChevronRight,
  Mail,
  Instagram,
  Facebook,
  BookOpen,
  ShoppingBag,
  Coins,
  CheckCircle2,
  Zap,
  Calendar,
  AlertCircle,
  Trophy,
  Lightbulb,
  Sparkles
} from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { API_ENDPOINTS } from "../api.config";
import { useTheme } from "next-themes";
import { UserAvatar } from "./ui/UserAvatar";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  canCheckin?: boolean;
  onLogout: () => void;
  onCheckinUpdate?: (status: boolean) => void;
}

export function NavigationDrawer({ isOpen, onClose, user, canCheckin: propCanCheckin, onLogout, onCheckinUpdate }: NavigationDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [showPolicy, setShowPolicy] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [canCheckin, setLocalCanCheckin] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Sync prop with local state
  useEffect(() => {
    if (propCanCheckin !== undefined) {
      setLocalCanCheckin(propCanCheckin);
    }
  }, [propCanCheckin]);

  // Fetch balance when drawer opens
  useEffect(() => {
    if (isOpen && user) {
      fetchWallet();
    }
  }, [isOpen, user]);

  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_ENDPOINTS.GET_WALLET, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        setLocalCanCheckin(data.canCheckin);
        if (onCheckinUpdate) onCheckinUpdate(data.canCheckin);
      }
    } catch (err) {
      console.error("Lỗi fetch wallet:", err);
    }
  };

  const handleCheckin = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_ENDPOINTS.CHECKIN, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.newBalance);
        setLocalCanCheckin(false);
        if (onCheckinUpdate) onCheckinUpdate(false);
        setMessage({ text: `${data.message} (+${data.reward} NC)`, type: 'success' });
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: "Lỗi kết nối máy chủ", type: 'error' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const menuItems = [
    { label: "Trang chủ", icon: Home, path: "/", show: true },
    { label: "Hồ sơ của tôi", icon: UserCircle, path: "/profile", show: !!user },
    { label: "Bảng xếp hạng", icon: Trophy, path: "/leaderboard", show: true },
    { label: "Cửa hàng vật phẩm", icon: ShoppingBag, path: "/shop", show: true },
    { label: "Cách kiếm Nhatcoin", icon: Lightbulb, path: "#", show: true, onClick: () => setShowTips(true) },
    { label: "Điểm danh", icon: Calendar, path: "#", show: !!user, onClick: () => setShowAttendance(true), hasDot: canCheckin },
    { label: "Quản lý người dùng", icon: ShieldCheck, path: "/profile", show: user?.role === "ADMIN", hash: "user-management" },
    { label: "Điều khoản & Chính sách", icon: FileText, path: "#", show: true, onClick: () => setShowPolicy(true) },
  ];

  const handleNav = (item: any) => {
    if (item.onClick) {
      item.onClick();
      return;
    }
    onClose();
    navigate(item.path);
    if (item.hash) {
      setTimeout(() => {
        const el = document.getElementById(item.hash);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[300px] bg-card border-r border-border z-[70] shadow-2xl transition-transform duration-500 ease-out transform ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header / User Info */}
          <div className="p-8 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/20 relative border-b border-border">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground mr-1" />
            </button>

            {user ? (
              <div className="flex flex-col items-center py-6 border-b border-border/50 bg-muted/30 relative">
                <div className="mb-4 relative">
                  <UserAvatar
                    src={user.avatar_url}
                    username={user.username}
                    role={user.role}
                    equippedItems={user.equipped_items}
                    size="xl"
                  />
                  {user.role === 'ADMIN' && (
                    <div className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-lg text-foreground line-clamp-1">{user.username}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border shadow-sm ${balance !== null && balance < 0
                    ? 'bg-rose-10 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 text-rose-600'
                    : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30'
                    }`}>
                    <Coins className="w-3.5 h-3.5" />
                    <span className="text-xs font-black">
                      {balance !== null ? (balance < 0 ? `-${Math.abs(balance).toLocaleString()}` : balance.toLocaleString()) : "..."} NC
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${user.role === 'ADMIN' ? 'bg-rose-500 text-white' :
                    user.role === 'MEMBER' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                    {user.role}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate w-full text-center px-4 mt-1.5 opacity-60">{user.email}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-muted flex items-center justify-center shadow-lg mb-4">
                  <BookOpen className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-4">Tham gia cùng nhatbook</p>
                <button
                  onClick={() => { onClose(); navigate("/login"); }}
                  className="w-full py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20"
                >
                  Đăng nhập ngay
                </button>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {menuItems.filter(item => item.show).map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleNav(item)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 group ${location.pathname === item.path && !item.onClick
                  ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <div className="flex items-center gap-4 relative">
                  <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${location.pathname === item.path && !item.onClick ? "text-green-600 dark:text-green-400" : ""
                    }`} />
                  <span className="text-sm font-bold">{item.label}</span>
                  {(item as any).hasDot && (
                    <span className="absolute top-0 -left-1 w-2 h-2 bg-rose-500 border border-card rounded-full animate-pulse"></span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" />
              </button>
            ))}

            <div className="pt-4 border-t border-border mx-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-full flex items-center justify-between p-4 rounded-2xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all group"
              >
                <div className="flex items-center gap-4">
                  <SunMoon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span className="text-sm font-bold">Chế độ {theme === 'dark' ? 'Sáng' : 'Tối'}</span>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-green-600' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Footer / Social & Logout */}
          <div className="p-6 border-t border-border space-y-4">
            <div className="flex justify-center gap-4 text-muted-foreground">
              <a href="#" className="hover:text-blue-600 transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-pink-600 transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="mailto:cogisaithathu@gmail.com" className="hover:text-green-600 transition-colors"><Mail className="w-5 h-5" /></a>
            </div>

            {user && (
              <button
                onClick={() => { onClose(); onLogout(); }}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-950/40 transition-all border border-red-100 dark:border-red-900/30 group"
              >
                <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Đăng xuất tài khoản</span>
              </button>
            )}

            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">nhatbook v1.5</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Policy Modal Overlay (VIP Style) */}
      {showPolicy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowPolicy(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-card w-full max-w-sm rounded-[2rem] shadow-2xl border border-border p-8 animate-in zoom-in-95 duration-300 flex flex-col items-center">
            <button
              onClick={() => setShowPolicy(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* VIP Icon */}
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6 flex items-center justify-center">
              <FileText className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>

            <h3 className="text-xl font-bold text-center mb-6 text-foreground">
              Chính sách nhatbook
            </h3>

            <div className="w-full space-y-4 mb-8 overflow-y-auto max-h-[40vh] pr-2 custom-scrollbar">
              <section className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                <h4 className="font-bold text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Quyền riêng tư
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Chúng tôi chỉ thu thập email và tên để định danh. Dữ liệu của bạn được mã hóa an toàn.
                </p>
              </section>

              <section className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                <h4 className="font-bold text-xs uppercase tracking-widest text-rose-500 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Kiểm duyệt AI
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hệ thống tự động quét lời lẽ thô tục. Vi phạm nhiều lần sẽ dẫn đến khóa tài khoản vĩnh viễn.
                </p>
              </section>

              <section className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                <h4 className="font-bold text-xs uppercase tracking-widest text-blue-500 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Trách nhiệm
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Người dùng chịu trách nhiệm với nội dung mình đăng tải. Mọi tranh chấp sẽ do Admin quyết định.
                </p>
              </section>
            </div>

            <button
              onClick={() => setShowPolicy(false)}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              Tôi đã hiểu rõ
            </button>
          </div>
        </div>
      )}
      {/* Attendance Modal (New) */}
      {showAttendance && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowAttendance(false)}></div>

          {/* Modal Content */}
          <div className="relative bg-card w-full max-w-sm rounded-[2rem] shadow-2xl border border-border p-6 animate-in zoom-in-95 duration-300 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-foreground">Điểm danh nhận NC</h3>
              </div>
              <button onClick={() => setShowAttendance(false)} className="p-2 rounded-full hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground mr-1" />
              </button>
            </div>

            {/* Promo Banner Fast */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Ngày x3 NhatCoin</p>
                  <p className="text-sm font-black">NGÀY 17 HÀNG THÁNG</p>
                </div>
              </div>
            </div>

            {/* Simple Dynamic Message */}
            {message && (
              <div className={`mb-4 p-3 rounded-xl text-xs font-bold animate-in slide-in-from-top-2 border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                }`}>
                {message.text}
              </div>
            )}

            {/* Reuse Lịch logic */}
            <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
              <div className="grid grid-cols-7 gap-1 mb-4 text-center">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                  <div key={d} className="text-[10px] font-black text-muted-foreground/60">{d}</div>
                ))}
                {(() => {
                  const daysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
                  const now = new Date();
                  const curr = now.getDate();
                  const total = daysInMonth(now.getMonth(), now.getFullYear());
                  const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
                  const pad = first === 0 ? 6 : first - 1;
                  const nodes = [];
                  for (let i = 0; i < pad; i++) nodes.push(<div key={`pad-${i}`} />);
                  for (let d = 1; d <= total; d++) {
                    const isDay17 = d === 17;
                    const isToday = d === curr;
                    nodes.push(
                      <div
                        key={d}
                        className={`h-9 flex items-center justify-center rounded-lg text-xs font-bold relative transition-colors ${isToday
                          ? 'bg-green-600 text-white shadow-[0_4px_12px_rgba(22,163,74,0.3)] z-10'
                          : isDay17
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30'
                            : 'text-muted-foreground hover:bg-muted transition-colors'
                          }`}
                      >
                        {d}
                        {isDay17 && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full border border-card" />}
                        {isToday && !canCheckin && <CheckCircle2 className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-white bg-green-500 rounded-full" />}
                      </div>
                    );
                  }
                  return nodes;
                })()}
              </div>

              <button
                onClick={handleCheckin}
                disabled={!canCheckin}
                className={`w-full py-4 rounded-xl font-black text-sm transition-all shadow-xl active:scale-95 ${canCheckin
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/20'
                  : 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                  }`}
              >
                {canCheckin ? "NHẬN 10 NC NGAY" : "HÔM NAY ĐÃ NHẬN"}
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 px-2">
              <AlertCircle className="w-3.5 h-3.5 text-muted-foreground/60" />
              <p className="text-[10px] text-muted-foreground/60 font-medium italic">Ngày 17 nhận x3 phần quà (30 NhatCoin)</p>
            </div>
          </div>
        </div>
      )}

      {/* Tips Modal (Admin Corrected) */}
      {showTips && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowTips(false)}></div>
          <div className="relative bg-card w-full max-w-md rounded-[2rem] shadow-2xl border border-border p-8 animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowTips(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-muted-foreground mr-1" />
            </button>

            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-6 flex items-center justify-center mx-auto">
              <Sparkles className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            </div>

            <h3 className="text-xl font-black text-center mb-1 text-foreground uppercase tracking-tight">HƯỚNG DẪN KIẾM NHATCOIN</h3>
            <p className="text-[10px] font-black text-amber-500 text-center mb-6 tracking-[0.3em] uppercase opacity-80">(PLAY-TO-EARN)</p>

            <div className="space-y-4 mb-8 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
              <p className="text-xs text-muted-foreground leading-relaxed text-center italic mb-4">
                Chào mừng bạn đến với hệ sinh thái nhatbook! Để sở hữu những vật phẩm VIP và nâng cấp tài khoản, hãy tích lũy NhatCoin (NC) qua các hoạt động sau:
              </p>

              <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm">Sáng tạo nội dung (+50 NC)</h4>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">Đăng mỗi bài viết chất lượng, bạn sẽ nhận ngay 50 NC vào ví (Tối đa nhận 150 NC mỗi ngày). Hãy chia sẻ những câu chuyện thật hay nhé!</p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm">Tương tác vàng (+5 NC)</h4>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">Khi bài viết của bạn nhận được 1 lượt Like hoặc 1 lượt Bình luận từ người khác, hệ thống sẽ tặng bạn 5 NC (Tối đa 25 NC mỗi ngày).</p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm">Điểm danh hàng ngày (+10 NC)</h4>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">Đăng nhập mỗi ngày và nhấn "Điểm danh" tại Slide bar để nhận ngay 10 NC.</p>
                <div className="flex flex-col gap-1 pl-7">
                  <p className="text-[10px] font-bold text-amber-600 uppercase">🌟 Ngày Vàng (17 hàng tháng): X3 quà thành 30 NC!</p>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase">🎂 Sinh nhật Admin (17/01): Quà khủng lên tới 1701 NC (&gt;30 ngày).</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                <h4 className="font-black text-[10px] text-rose-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Lưu ý quan trọng
                </h4>
                <p className="text-[11px] text-rose-600/80 leading-relaxed font-bold italic">
                  AI Moderator của chúng tôi hoạt động 24/7. Nếu phát hiện hành vi toxic hoặc spam, hệ thống sẽ tự động khấu trừ 100 NC trực tiếp từ ví tiền của bạn.
                </p>
              </div>
            </div>

            <p className="text-[11px] font-black text-center text-foreground/40 mb-6 uppercase tracking-tighter">
              Hãy trở thành công dân văn minh và làm giàu cùng nhatbook ngay hôm nay! 🚀🕶️💎
            </p>

            <button
              onClick={() => setShowTips(false)}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-2xl font-black shadow-xl transition-all active:scale-95 text-sm uppercase tracking-widest"
            >
              CHỐT! ĐÃ HIỂU RÕ
            </button>
          </div>
        </div>
      )}
    </>
  );
}

