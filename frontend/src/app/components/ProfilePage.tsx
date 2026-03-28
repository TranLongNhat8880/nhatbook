import { useState, useRef, useEffect } from "react";
import { User, Mail, Camera, Save, ArrowLeft, Facebook, Instagram, AtSign as ThreadsIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { ThemeToggle } from "./ThemeToggle";

export function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [threadsUrl, setThreadsUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
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
  }, [navigate]);

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch("/api/users/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setUsername(data.user.username);
        setFacebookUrl(data.user.facebook_url || "");
        setInstagramUrl(data.user.instagram_url || "");
        setThreadsUrl(data.user.threads_url || "");
        // Ensure local storage is up to date
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    } catch (err) {
      console.error("Lỗi lấy thông tin cá nhân:", err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
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
      const res = await fetch("/api/users/avatar", {
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

  if (!user) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300 text-foreground">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="text-muted-foreground hover:text-green-600 flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ
          </Link>
          <ThemeToggle />
        </div>

        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
          {/* Header Cover */}
          <div className="h-32 bg-gray-200" style={{ background: "linear-gradient(135deg, #a3e635, #16a34a)" }}></div>

          <div className="px-8 pb-8">
            {/* Avatar Section */}
            <div className="relative flex justify-center -mt-16 mb-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-card bg-card shadow-md overflow-hidden flex items-center justify-center bg-muted">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-muted-foreground" />
                  )}
                </div>

                {/* Upload Button overlay */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="w-8 h-8 text-white" />
                </button>
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

            {message && (
              <div className={`mb-6 p-4 rounded-xl text-center text-sm font-bold border ${isError
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30'
                  : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30'
                }`}>
                {message}
              </div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-6">
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
          </div>
        </div>
      </div>
    </div>
  );
}
