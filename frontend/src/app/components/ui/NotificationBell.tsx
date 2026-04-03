import { useState, useEffect, useRef } from 'react';
import { Bell, Check, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router';
import { io } from 'socket.io-client';
import { API_ENDPOINTS } from '../../api.config';
import { UserAvatar } from './UserAvatar';

export function NotificationBell({ token, userId }: { token: string, userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.GET_NOTIFICATIONS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    if (!token || !userId) return;

    // Tải dữ liệu ban đầu
    fetchNotifications();

    // Khởi tạo kênh Real-time bằng Socket.io (Port 3000 đang dùng cho backend local)
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const socket = io(backendUrl);

    socket.on('connect', () => {
      socket.emit('register', userId);
    });

    socket.on('NEW_NOTIFICATION', (newNotif) => {
      setUnreadCount(prev => prev + 1);
      setNotifications(prev => [newNotif, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id?: string) => {
    try {
      await fetch(API_ENDPOINTS.MARK_NOTIFICATIONS_READ, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      // Cập nhật local state ngay lập tức cho mượt
      if (id) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (notif: any) => {
    if (!notif.is_read) markAsRead(notif.id);
    setIsOpen(false);

    if (notif.type === 'ADMIN_VIOLATION_ALERT') {
      // Dẫn Admin đến Profile, mở Tab Admin, chọn filter Vi phạm và điền sẵn tên người vi phạm
      navigate(`/profile?tab=admin&filter=violation&search=${encodeURIComponent(notif.actor_name)}`); 
      return;
    }

    if (notif.type === 'FRIEND_REQUEST' || notif.type === 'FRIEND_ACCEPT') {
        navigate(notif.type === 'FRIEND_REQUEST' ? '/profile' : `/user/${notif.actor_id}`);
        return;
    }

    if (notif.post_id) {
      navigate(`/posts/${notif.post_id}`);
    } else if (notif.actor_name) {
      navigate(`/user/${notif.actor_id}`);
    }
  };

  const getNotificationText = (notif: any) => {
    const actor = notif.actor_name ? <span className="font-bold">{notif.actor_name}</span> : 'Hệ thống';
    switch (notif.type) {
      case 'LIKE_POST': return <>{actor} đã bình chọn cho bài viết của bạn.</>;
      case 'COMMENT_POST': return <>{actor} đã phản hồi bài viết của bạn.</>;
      case 'REPLY_COMMENT': return <>{actor} đã nhắc đến bạn trong một bình luận.</>;
      case 'RANK_UP': return <><span className="font-bold text-amber-500">Chúc mừng!</span> Bạn vừa lọt vào Top Đại Gia Nhatbook!</>;
      case 'VIOLATION_WARNING':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-black text-rose-600 flex items-center gap-1 uppercase text-[10px] tracking-widest">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span> Cảnh báo vi phạm
            </span>
            <span className="text-foreground">Tài khoản của bạn vừa bị AI ghi nhận vi phạm tiêu chuẩn cộng đồng.</span>
            {notif.reason && <span className="text-[11px] bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 p-2 rounded-lg border border-rose-200/50 mt-1 italic font-medium">Lý do: {notif.reason}</span>}
          </div>
        );
      case 'ADMIN_VIOLATION_ALERT':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-black text-red-600 flex items-center gap-1 uppercase text-[10px] tracking-widest">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span> Báo động Admin
            </span>
            <span className="text-foreground">Người dùng {actor} đã vi phạm 3 lần. Click để xử lý ngay!</span>
            {notif.reason && <span className="text-[11px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-2 rounded-lg border border-red-200/50 mt-1 italic font-medium">Vi phạm mới nhất: {notif.reason}</span>}
          </div>
        );
      case 'NHATCOIN_RECEIVE': return <>Bạn vừa được cộng <span className="font-bold text-emerald-500">+{notif.nhatcoin_amount} NC</span> vào tài khoản.</>;
      case 'NHATCOIN_DEDUCT': return <>Tài khoản của bạn vừa bị trừ <span className="font-bold text-rose-500">-{notif.nhatcoin_amount} NC</span>.</>;
      case 'FRIEND_REQUEST': return <>{actor} đã gửi cho bạn một lời mời kết bạn!</>;
      case 'FRIEND_ACCEPT': return <>{actor} đã chấp nhận lời mời kết bạn của bạn!</>;
      default: return <>{actor} đã gửi cho bạn một thông báo.</>;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-muted transition-colors relative"
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? "text-amber-500 animate-[wiggle_1s_ease-in-out_infinite]" : "text-muted-foreground"}`} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-50 origin-top-right animate-in fade-in slide-in-from-top-5 duration-200">
          <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/30">
            <h3 className="font-bold flex items-center gap-2">
              Thông báo <BellRing className="w-4 h-4 text-emerald-500" />
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead()}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto no-scrollbar">
            {notifications.length > 0 ? (
              <div className="divide-y divide-border/50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 flex gap-3 cursor-pointer transition-all hover:bg-muted/50 ${!n.is_read ? 'bg-primary/5' : ''} ${n.type.includes('VIOLATION') ? 'bg-rose-50/50 dark:bg-rose-950/10 border-l-4 border-rose-500 shadow-sm' : ''}`}
                  >
                    <div className="shrink-0 mt-1">
                      {n.type.includes('VIOLATION') ? (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                          <BellRing className="w-5 h-5 text-white animate-bounce" />
                        </div>
                      ) : n.actor_name ? (
                        <UserAvatar src={n.actor_avatar} username={n.actor_name} size="md" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                          <Bell className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm tracking-tight ${!n.is_read ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {getNotificationText(n)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 opacity-70">
                        {new Date(n.created_at).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="shrink-0 flex items-center">
                        <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_8px_var(--tw-shadow-color)] shadow-primary/50"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <Bell className="w-12 h-12 mb-3 opacity-20" />
                <p>Chưa có thông báo nào cả!</p>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
      `}</style>
    </div>
  );
}
