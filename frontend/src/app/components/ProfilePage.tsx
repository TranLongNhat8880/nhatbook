import { useState, useRef, useEffect } from "react";
import { User, Mail, Camera, Save, ArrowLeft, Facebook, Instagram, AtSign as ThreadsIcon, ShieldCheck, CheckCircle2, XCircle, Search, Lock, Unlock, ShieldAlert, Monitor, Users, UserCheck, UserX, UserPlus, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { API_ENDPOINTS } from "../api.config";
import { UserAvatar } from "./ui/UserAvatar";

export function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [threadsUrl, setThreadsUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "friends" | "admin">("profile");

  // Friends states
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isFriendsLoading, setIsFriendsLoading] = useState(false);

  // Admin Panel states
  const [adminEmail, setAdminEmail] = useState("");
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [isAdminError, setIsAdminError] = useState(false);
  const [isValidAccount, setIsValidAccount] = useState<boolean | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // User Management states
  const [users, setUsers] = useState<any[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "violation" | "locked">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchProfile(token);

    // Kiểm tra query param để điều hướng tab & filter (từ thông báo đẩy đến)
    const params = new URLSearchParams(window.location.search);
    const tabVal = params.get("tab");
    const filterVal = params.get("filter");
    const searchVal = params.get("search");

    if (tabVal === "admin") setActiveTab("admin");
    if (filterVal === "violation") setUserFilter("violation");
    if (searchVal) {
      setSearchUserQuery(searchVal);
      // Cuộn đến bảng quản lý sau khi tab đã kịp render
      setTimeout(() => {
        const adminSection = document.querySelector('#admin-dashboard');
        if (adminSection) adminSection.scrollIntoView({ behavior: 'smooth' });
      }, 1000);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (user?.role === "ADMIN" && token) {
      fetchUsers(currentPage, searchUserQuery, userFilter);
    }
    if (token) {
      fetchFriends();
      fetchPendingRequests();
    }
  }, [user?.role, currentPage, userFilter]);

  // Debounce search
  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1); // Quay về trang 1 khi search mới
      fetchUsers(1, searchUserQuery, userFilter);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchUserQuery]);

  const fetchUsers = async (page = 1, search = "", filter = "all") => {
    setIsUsersLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_ENDPOINTS.GET_USERS}?page=${page}&limit=5&search=${encodeURIComponent(search)}&filter=${filter}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách user:", err);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch(API_ENDPOINTS.GET_ME, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setUsername(data.user.username);
        setBio(data.user.bio || "");
        setFacebookUrl(data.user.facebook_url || "");
        setInstagramUrl(data.user.instagram_url || "");
        setThreadsUrl(data.user.threads_url || "");
        localStorage.setItem("user", JSON.stringify(data.user));
      } else if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    } catch (err) {
      console.error("Lỗi lấy thông tin cá nhân:", err);
    }
  };

  // Live check email tồn tại cho chức năng Admin
  useEffect(() => {
    const checkEmailExists = async () => {
      // Chỉ kiểm tra khi có định dạng email cơ bản
      if (!adminEmail || !adminEmail.includes('@')) {
        setIsValidAccount(null);
        return;
      }

      setIsCheckingEmail(true);
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API_ENDPOINTS.CHECK_EMAIL}?email=${encodeURIComponent(adminEmail)}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setIsValidAccount(data.exists);
        } else {
          setIsValidAccount(null);
        }
      } catch (err) {
        setIsValidAccount(null);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    const timeoutId = setTimeout(checkEmailExists, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [adminEmail]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.PROFILE, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          bio,
          facebook_url: facebookUrl,
          instagram_url: instagramUrl,
          threads_url: threadsUrl
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Cập nhật thông tin thành công!");
        setIsError(false);
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        setMessage(data.message || "Có lỗi xảy ra");
        setIsError(true);
      }
    } catch (err) {
      setMessage("Không thể kết nối máy chủ");
      setIsError(true);
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage("Đang tải ảnh lên...");
    setIsError(false);

    const formData = new FormData();
    formData.append("avatar", file);

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.UPDATE_AVATAR, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Tải ảnh đại diện thành công!");
        setIsError(false);
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        setMessage(data.message || "Tải ảnh thất bại");
        setIsError(true);
      }
    } catch (err) {
      setMessage("Không thể tải ảnh, lỗi máy chủ");
      setIsError(true);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setMessage(""), 3000);
    }
  };

  /**
   * Mở Modal xác nhận Khóa/Mở khóa
   */
  const handleToggleLock = (targetUser: any) => {
    setSelectedUserForAction(targetUser);
    setIsLockModalOpen(true);
  };

  /**
   * Thực hiện Khóa/Mở khóa sau khi đã xác nhận
   */
  const handleConfirmToggleLock = async () => {
    if (!selectedUserForAction) return;

    const token = localStorage.getItem("token");
    const userId = selectedUserForAction.id;

    try {
      const res = await fetch(API_ENDPOINTS.TOGGLE_LOCK(userId), {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, is_locked: data.is_locked } : u
        ));
        setIsLockModalOpen(false);
        setSelectedUserForAction(null);
      } else {
        alert(data.message || "Lỗi khi khóa/mở khóa");
      }
    } catch (err) {
      console.error("Lỗi toggle lock:", err);
    }
  };

  /**
   * Che email: abcdef@gmail.com -> a***f@gmail.com
   */
  const maskEmail = (email: string) => {
    if (!email) return "";
    const [name, domain] = email.split("@");
    if (name.length <= 2) return `${name.charAt(0)}***@${domain}`;
    return `${name.charAt(0)}***${name.charAt(name.length - 1)}@${domain}`;
  };

  // Ghi chú: Filter nay đã được thực hiện ở Backend để phân trang chuẩn
  const filteredUsers = users;

  const handleGrantRole = async (newRole: "MEMBER" | "USER") => {
    if (!adminEmail) return;
    setIsAdminLoading(true);
    setAdminMessage("");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.GRANT_ROLE, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email: adminEmail, newRole }),
      });

      const data = await res.json();
      if (res.ok) {
        setAdminMessage(data.message);
        setIsAdminError(false);
        setAdminEmail("");
        // Refresh users list if open
        fetchUsers(currentPage, searchUserQuery, userFilter);
      } else {
        setAdminMessage(data.message || "Có lỗi xảy ra");
        setIsAdminError(true);
      }
    } catch (err) {
      setAdminMessage("Không thể kết nối máy chủ");
      setIsAdminError(true);
    } finally {
      setIsAdminLoading(false);
      setTimeout(() => setAdminMessage(""), 5000);
    }
  };

  const fetchFriends = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.GET_FRIENDS, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setFriends(data.friends);
    } catch (err) { console.error(err); }
  };

  const fetchPendingRequests = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.GET_PENDING_REQUESTS, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setPendingRequests(data.requests);
    } catch (err) { console.error(err); }
  };

  const handleFriendResponse = async (requesterId: string, action: 'ACCEPT' | 'REJECT') => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.FRIEND_RESPOND, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ requesterId, action })
      });
      if (res.ok) {
        fetchFriends();
        fetchPendingRequests();
      }
    } catch (err) { console.error(err); }
  };

  if (!user) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300 text-foreground">
      <div className="max-w-2xl mx-auto">

        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
          {/* Header Cover */}
          <div className="h-32 bg-gray-200" style={{ background: "linear-gradient(135deg, #a3e635, #16a34a)" }}></div>

          <div className="px-8 pb-8">
            {/* Avatar Section */}
            <div className="relative -mt-20 flex justify-center mb-8">
              <div className="p-1 rounded-full bg-card shadow-2xl relative">
                <UserAvatar
                  src={user.avatar_url}
                  username={user.username}
                  role={user.role}
                  equippedItems={user.equipped_items}
                  size="xl"
                  className="!w-32 !h-32"
                />
                <label
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2.5 bg-green-600 text-white rounded-full cursor-pointer hover:bg-green-700 transition-all shadow-lg active:scale-95 border-2 border-background z-30"
                >
                  <Camera className="w-5 h-5" />
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">{user.username}</h2>
              <p className="text-muted-foreground text-sm mt-1 uppercase tracking-widest font-semibold">{user.role}</p>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex gap-1 bg-muted/50 p-1.5 rounded-2xl mb-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-2.5 text-xs font-black tracking-tight rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'profile' ? 'bg-card text-emerald-600 shadow-sm ring-1 ring-emerald-500/10' : 'text-muted-foreground hover:bg-emerald-50'}`}
              >
                <User className="w-4 h-4" /> Hồ sơ
              </button>
              <button
                onClick={() => setActiveTab('friends')}
                className="flex-1 py-2.5 text-xs font-black tracking-tight rounded-xl flex items-center justify-center gap-2 relative transition-all text-muted-foreground hover:bg-emerald-50 bg-transparent active:scale-95"
                style={activeTab === 'friends' ? { backgroundColor: 'var(--card)', color: '#10b981', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' } : {}}
              >
                <Users className="w-4 h-4" /> Bạn bè
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-0.5 bg-rose-500 text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center animate-bounce">{pendingRequests.length}</span>
                )}
              </button>
              {user.role === 'ADMIN' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex-1 py-2.5 text-xs font-black tracking-tight rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'admin' ? 'bg-card text-rose-600 shadow-sm ring-1 ring-rose-500/10' : 'text-muted-foreground hover:bg-rose-50'}`}
                >
                  <ShieldCheck className="w-4 h-4" /> Quản trị
                </button>
              )}
            </div>

            {message && activeTab === 'profile' && (
              <div className={`mb-6 p-4 rounded-xl text-center text-sm font-bold border ${isError
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30'
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30'
                }`}>
                {message}
              </div>
            )}

            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Tên hiển thị</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl text-sm focus:bg-card focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Giới thiệu bản thân</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Viết vài dòng giới thiệu về bạn..."
                    rows={4}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:bg-card focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all outline-none resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground mt-2 italic">Mẹo: Giới thiệu hay giúp bạn thu hút nhiều lượt theo dõi và tương tác hơn!</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Email dùng để đăng nhập, không thể thay đổi.</p>
                </div>

                {/* SOCIAL LINKS */}
                <div className="pt-6 border-t border-border space-y-4">
                  <h3 className="text-lg font-bold text-foreground mb-2">Mạng Xã Hội</h3>

                  {/* Facebook */}
                  <div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Facebook className="h-5 w-5 text-blue-600 group-focus-within:text-blue-700 transition-colors" />
                      </div>
                      <input
                        type="text"
                        name="facebook"
                        placeholder="https://facebook.com/nhatbook"
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-muted border border-border rounded-xl text-sm focus:bg-card focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Instagram */}
                  <div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Instagram className="h-5 w-5 text-pink-600 group-focus-within:text-pink-700 transition-colors" />
                      </div>
                      <input
                        type="text"
                        name="instagram"
                        placeholder="https://instagram.com/nhatbook"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-muted border border-border rounded-xl text-sm focus:bg-card focus:border-pink-500 focus:ring-2 focus:ring-pink-500/10 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Threads */}
                  <div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ThreadsIcon className="h-5 w-5 text-gray-800 dark:text-gray-300 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                      </div>
                      <input
                        type="text"
                        name="threads"
                        placeholder="https://threads.net/@nhatbook"
                        value={threadsUrl}
                        onChange={(e) => setThreadsUrl(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-muted border border-border rounded-xl text-sm focus:bg-card focus:border-gray-800 dark:focus:border-white focus:ring-2 focus:ring-gray-800/10 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all disabled:opacity-70 shadow-lg shadow-primary/20"
                >
                  {isLoading ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                  ) : (
                    <><Save className="w-4 h-4" /> Lưu thay đổi</>
                  )}
                </button>
              </form>
            )}

            {/* TAB: FRIENDS */}
            {activeTab === 'friends' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                  <div className="bg-amber-500/5 border border-amber-200/50 rounded-2xl p-6">
                    <h3 className="text-sm font-black text-amber-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Lời mời kết bạn ({pendingRequests.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingRequests.map(req => (
                        <div key={req.id} className="flex items-center justify-between bg-card p-3 rounded-xl border border-amber-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <UserAvatar src={req.avatar_url} username={req.username} size="sm" />
                            <span className="font-bold text-sm">{req.username}</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleFriendResponse(req.id, 'ACCEPT')} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-sm" title="Đồng ý"><UserCheck className="w-4 h-4" /></button>
                            <button onClick={() => handleFriendResponse(req.id, 'REJECT')} className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200" title="Từ chối"><UserX className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Friend List */}
                <div>
                  <h3 className="text-sm font-black text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" /> Bạn bè của bạn ({friends.length})
                  </h3>
                  {friends.length === 0 ? (
                    <div className="text-center py-10 opacity-40">
                      <Users className="w-10 h-10 mx-auto mb-3" />
                      <p className="text-xs font-bold">Chưa có bạn bè nào. Hãy đi kết nối ngay!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {friends.map(f => (
                        <div
                          key={f.id}
                          onClick={() => navigate(`/user/${f.id}`)}
                          className="flex items-center gap-3 p-3 bg-muted/40 hover:bg-emerald-500/5 border border-border rounded-xl cursor-pointer transition-all group"
                        >
                          <UserAvatar src={f.avatar_url} username={f.username} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate group-hover:text-emerald-700">{f.username}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{f.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: ADMIN (CONTENT ONLY) */}
            {activeTab === 'admin' && user.role === 'ADMIN' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-center text-sm font-bold text-muted-foreground py-10 italic">
                  Khu vực quản trị đã được dời xuống phía dưới để giao diện gọn gàng hơn. 👇
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Global Admin Panel (Chỉ hiện khi activeTab === 'admin') */}
        {user.role === 'ADMIN' && activeTab === 'admin' && (
          <div id="admin-dashboard" className="space-y-8 mt-8 animate-in fade-in zoom-in duration-500">
            {/* Công cụ Phân quyền */}
            <div className="bg-card rounded-3xl shadow-sm border border-border p-8 border-t-4 border-t-green-500/80">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-foreground">
                <ShieldCheck className="w-6 h-6 text-green-500" />
                Công cụ Phân quyền
              </h3>
              <p className="text-sm text-muted-foreground mb-6">Cấp quyền Tác giả/Khách mời cho người khác thông qua địa chỉ Email của họ.</p>

              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="Nhập email tài khoản cần thao tác..."
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-muted border border-border rounded-xl text-sm focus:bg-card focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                  />

                  {/* Live validation icons */}
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {isCheckingEmail ? (
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></span>
                    ) : isValidAccount === true ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : isValidAccount === false ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : null}
                  </div>
                </div>

                {adminMessage && (
                  <div className={`p-3 rounded-xl text-center text-sm font-bold border ${isAdminError
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30'
                    : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30'
                    }`}>
                    {adminMessage}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => handleGrantRole('MEMBER')}
                    disabled={isAdminLoading || !adminEmail || isValidAccount !== true}
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdminLoading ? "Đang xử lý..." : "Cấp quyền khách mời"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGrantRole('USER')}
                    disabled={isAdminLoading || !adminEmail || isValidAccount !== true}
                    className="flex-1 py-3 bg-transparent border-2 border-red-500/80 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Thu hồi quyền
                  </button>
                </div>
              </div>
            </div>

            {/* Dashboard Quản lý Người dùng */}
            <div className="bg-card rounded-3xl shadow-sm border border-border p-8 border-t-4 border-t-blue-500/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h4 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <Monitor className="w-5 h-5 text-blue-500" />
                  Danh sách Người dùng
                </h4>

                <div className="relative group max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc email..."
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:bg-card focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* FILTER TABS */}
              <div className="flex flex-wrap gap-4 mb-6 border-b border-border p-1 bg-muted/20 w-fit rounded-lg">
                <button
                  onClick={() => { setUserFilter("all"); setCurrentPage(1); }}
                  className={`px-4 py-2 text-xs font-bold transition-all rounded-md ${userFilter === 'all'
                      ? 'bg-background text-primary shadow-sm ring-1 ring-border'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Tất cả người dùng
                </button>
                <button
                  onClick={() => { setUserFilter("violation"); setCurrentPage(1); }}
                  className={`px-4 py-2 text-xs font-bold transition-all rounded-md flex items-center gap-2 ${userFilter === 'violation'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-muted-foreground hover:text-rose-500'
                    }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Đề xuất khóa (3+)
                </button>
                <button
                  onClick={() => { setUserFilter("locked"); setCurrentPage(1); }}
                  className={`px-4 py-2 text-xs font-bold transition-all rounded-md flex items-center gap-2 ${userFilter === 'locked'
                      ? 'bg-gray-800 text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Danh sách đã khóa
                </button>
              </div>

              <div className="overflow-x-auto -mx-8 px-8">
                <table className="w-full text-left border-collapse">
                  {/* ... table content remains same ... */}
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-bold">
                      <th className="pb-3 pr-4">Người dùng</th>
                      <th className="pb-3 pr-4">Email</th>
                      <th className="pb-3 pr-4">Quyền</th>
                      <th className="pb-3 pr-4 text-center text-red-500">Vi phạm</th>
                      <th className="pb-3 pr-4">Trạng thái</th>
                      <th className="pb-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isUsersLoading ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Đang tải danh sách...</td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Không tìm thấy người dùng nào.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="group hover:bg-muted/30 transition-colors">
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-border shrink-0 bg-muted">
                                {u.avatar_url ? (
                                  <img src={u.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4 m-auto mt-2 text-muted-foreground" />
                                )}
                              </div>
                              <span className="text-sm font-semibold text-foreground">{u.username} {u.id === user.id && "(Bạn)"}</span>
                            </div>
                          </td>
                          <td className="py-4 pr-4 text-sm text-muted-foreground font-mono">{maskEmail(u.email)}</td>
                          <td className="py-4 pr-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${u.role === 'ADMIN' ? 'bg-rose-100 text-rose-600' :
                                u.role === 'MEMBER' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                              }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-sm font-bold ${u.violation_count > 0 ? 'text-red-500' : 'text-muted-foreground/40'}`}>
                                {u.violation_count || 0}
                              </span>
                              {u.violation_count >= 3 && !u.is_locked && (
                                <span className="flex items-center gap-1 text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md font-black animate-pulse">
                                  <ShieldAlert className="w-2.5 h-2.5" /> ĐỀ XUẤT KHÓA
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 pr-4">
                            {u.is_locked ? (
                              <span className="flex items-center gap-1 text-xs text-red-500 font-bold">
                                <Lock className="w-3 h-3" /> Đã khóa
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-emerald-500 font-bold">
                                <Unlock className="w-3 h-3" /> Bình thường
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-center">
                            {u.id !== user.id && (
                              <button
                                onClick={() => handleToggleLock(u)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 mx-auto ${u.is_locked
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                    : 'bg-red-500 text-white hover:bg-red-600'
                                  }`}
                                title={u.is_locked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                              >
                                {u.is_locked ? (
                                  <><Unlock className="w-3.5 h-3.5" /> Mở khóa</>
                                ) : (
                                  <><Lock className="w-3.5 h-3.5" /> Khóa</>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION UI */}
              {totalPages > 1 && (
                <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Trang <span className="font-bold text-foreground">{currentPage}</span> trên {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.max(1, prev - 1));
                        window.scrollTo({ top: 500, behavior: "smooth" });
                      }}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-xs font-bold bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Trang trước
                    </button>
                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.min(totalPages, prev + 1));
                        window.scrollTo({ top: 500, behavior: "smooth" });
                      }}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      Trang sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* VIP Custom Confirmation Modal */}
      {isLockModalOpen && selectedUserForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsLockModalOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-card w-full max-w-sm rounded-[2rem] shadow-2xl border border-border p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${selectedUserForAction.is_locked ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
              }`}>
              {selectedUserForAction.is_locked ? (
                <Unlock className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400" />
              )}
            </div>

            <h3 className="text-xl font-bold text-center mb-2">
              Xác nhận {selectedUserForAction.is_locked ? 'Mở khóa' : 'Khóa tài khoản'}
            </h3>

            <p className="text-muted-foreground text-center text-sm mb-8">
              Bạn có chắc chắn muốn {selectedUserForAction.is_locked ? 'mở lại' : 'tạm dừng'} quyền truy cập của
              <span className="font-bold text-foreground mx-1">@{selectedUserForAction.username}</span>?
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmToggleLock}
                className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${selectedUserForAction.is_locked
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                    : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                  }`}
              >
                Xác nhận {selectedUserForAction.is_locked ? 'Mở khóa' : 'Khóa'}
              </button>
              <button
                onClick={() => setIsLockModalOpen(false)}
                className="w-full py-4 rounded-2xl font-bold bg-muted hover:bg-muted/80 text-foreground transition-all active:scale-95 border border-border"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
