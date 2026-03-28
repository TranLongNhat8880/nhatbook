import { useState, useEffect } from "react";
import { BookOpen, User as UserIcon, LogOut, Calendar, MessageSquare, Heart, Search, Filter, ChevronLeft, ChevronRight, Facebook, Instagram, AtSign as ThreadsIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { ThemeToggle } from "./ThemeToggle";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_avatar?: string;
  comment_count: string;
  like_count: string;
}

// Hàm hỗ trợ trích xuất ảnh đầu tiên từ nội dung bài viết HTML
const extractFirstImage = (htmlContent: string) => {
  if (!htmlContent) return null;
  const match = htmlContent.match(/<img[^>]+src="([^">]+)"/);
  return match ? match[1] : null;
};

const safeLink = (url: string) => {
  if (!url) return "#";
  return url.startsWith("http") ? url : `https://${url}`;
};

// Hàm hỗ trợ xóa các thẻ HTML ra khỏi văn bản hiển thị tóm tắt
const stripHtml = (htmlContent: string) => {
  if (!htmlContent) return "";
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;
  return tempDiv.textContent || tempDiv.innerText || "";
};

export function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // States cho Lọc và Tìm Kiếm
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  // State cho Phân Trang
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 6;

  const navigate = useNavigate();

  // Load data on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchCurrentUser(); // Background sync
    }
    fetchPosts();
    fetchAdminUser();
  }, []);

  const fetchAdminUser = async () => {
    try {
      const res = await fetch("/api/users/admin");
      if (res.ok) {
        const data = await res.json();
        setAdminUser(data.admin);
      }
    } catch (err) {
      console.error("Lỗi tải thông tin Tác giả:", err);
    }
  };

  // Reset Phân trang về 1 nếu có thay đổi Bộ Lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("/api/users/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      if (res.ok) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error("Lỗi khi tải bài viết:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  // ---- TÍNH TOÁN BỘ LỌC (REAL-TIME) ---- //
  const categories = ["Tất cả", ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))];

  const filteredPosts = posts.filter(post => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = post.title.toLowerCase().includes(searchLower);
    const contentMatch = stripHtml(post.content).toLowerCase().includes(searchLower);
    const matchesSearch = titleMatch || contentMatch;
    const matchesCategory = selectedCategory === "Tất cả" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // ---- CẮT LÁT PHÂN TRANG ---- //
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const currentPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    // Cuộn mượt lên trên sau khi đổi trang
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      {/* Navbar */}
      <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                style={{ background: "linear-gradient(135deg, #a3e635, #16a34a)" }}
              >
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span
                className="text-2xl tracking-tight dark:text-green-500"
                style={{ color: "#15803d", fontFamily: "Georgia, serif", fontWeight: 700 }}
              >
                nhat<span className="italic">book</span>
              </span>
            </div>

            {/* Auth Menu */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="w-px h-6 bg-border mx-1" />
              {user ? (
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded-lg transition-colors"
                    onClick={() => navigate("/profile")}
                  >
                    <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center overflow-hidden bg-muted">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Ava" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-green-700" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground/80">{user.username}</span>
                    {user.role === "ADMIN" && (
                      <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-semibold">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="w-px h-6 bg-border" />
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-medium px-4 py-2 rounded-xl text-white transition-all duration-200 hover:shadow-md"
                    style={{ background: "linear-gradient(135deg, #a3e635, #16a34a)" }}
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Hero Banner Section */}
        <div className="mb-12 relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-green-600 to-emerald-800 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative px-8 py-14 sm:px-12 sm:py-20 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="text-center sm:text-left">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight drop-shadow-sm">
                Nhật ký tác giả
              </h1>
              <p className="text-emerald-100 text-lg max-w-xl font-medium">
                Chào mừng bạn đến với góc nhỏ của Trần Long Nhật. Hãy cùng mình khám phá thế giới qua những dòng chia sẻ chân thành nhất.
              </p>
            </div>

            {user?.role === "ADMIN" && (
              <button
                onClick={() => navigate("/admin/posts/new")}
                className="shrink-0 px-8 py-4 bg-white text-green-700 text-base font-bold rounded-2xl hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-3"
              >
                <BookOpen className="w-5 h-5" />
                <span>Viết bài mới</span>
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-10">

          {/* CỘT TRÁI (LEFT COLUMN) - BÀI VIẾT : 70% */}
          <div className="flex-1 lg:max-w-[70%] xl:max-w-[75%]">
            {/* Posts List */}
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="col-span-full py-24 text-center bg-card rounded-3xl shadow-sm border border-border flex flex-col items-center">
                <span className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-muted-foreground/30" />
                </span>
                <h3 className="text-xl font-bold text-foreground mb-2">Không tìm thấy bài viết nào</h3>
                <p className="text-muted-foreground max-w-sm">Có vẻ như không có từ khóa hoặc chủ đề nào khớp với tìm kiếm của bạn.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
                  {currentPosts.map((post) => {
                    const thumbnail = extractFirstImage(post.content);
                    const previewText = stripHtml(post.content);

                    return (
                      <div
                        key={post.id}
                        onClick={() => navigate(`/posts/${post.id}`)}
                        className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
                      >
                        {/* Img Thumbnail */}
                        <div
                          className="h-48 w-full relative overflow-hidden bg-muted"
                          style={!thumbnail ? { background: "linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)" } : undefined}
                        >
                          {thumbnail && (
                            <img src={thumbnail} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          )}

                          {/* Dấu hiệu Category */}
                          {post.category && (
                            <span className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider shadow-sm">
                              {post.category}
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-6 flex flex-col flex-1">
                          <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-green-600 transition-colors line-clamp-2">
                            {post.title}
                          </h3>

                          {/* Tạm ẩn content dài chứa HTML, dùng previewText thuần túy */}
                          <p className="text-muted-foreground text-sm mb-6 line-clamp-3 flex-1 leading-relaxed">
                            {previewText}
                          </p>

                          {/* Meta */}
                          <div className="flex items-center justify-between pt-4 border-t border-border">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full border border-border overflow-hidden flex items-center justify-center bg-muted">
                                {post.author_avatar ? (
                                  <img src={post.author_avatar} alt={post.author_name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-muted-foreground">
                                    {post.author_name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-medium text-foreground/70">{post.author_name}</span>
                            </div>

                            <div className="flex items-center gap-3 text-muted-foreground text-xs font-medium">
                              <div className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                                <Heart className="w-3.5 h-3.5" />
                                {post.like_count || 0}
                              </div>
                              <div className="flex items-center gap-1.5 hover:text-green-600 transition-colors">
                                <MessageSquare className="w-3.5 h-3.5" />
                                {post.comment_count || 0}
                              </div>
                              <div className="w-1 h-1 rounded-full bg-border"></div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(post.created_at).toLocaleDateString("vi-VN")}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 py-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:bg-muted hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <span className="text-sm font-semibold hidden sm:inline">Trang trước</span>
                    </button>

                    <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-xl border border-border shadow-sm">
                      <span className="text-sm font-semibold text-foreground/80">
                        {currentPage} <span className="text-muted-foreground/50 mx-1">/</span> {totalPages}
                      </span>
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:bg-muted hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                    >
                      <span className="text-sm font-semibold hidden sm:inline">Trang kế</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div> {/* Kết thúc Cột Trái */}

          {/* CỘT PHẢI (RIGHT COLUMN) - SIDEBAR CỐ ĐỊNH : 30% */}
          <aside className="w-full lg:w-[30%] xl:w-[25%] shrink-0">
            <div className="sticky top-24 space-y-6">

              {/* Mini Author Profile */}
              <div className="bg-card rounded-3xl shadow-sm border border-border p-6 text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-muted border-4 border-border overflow-hidden mb-4 shadow-sm flex items-center justify-center">
                  {(user?.role === "ADMIN" ? user : adminUser)?.avatar_url ? (
                    <img src={(user?.role === "ADMIN" ? user : adminUser).avatar_url} alt="Admin Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-green-500" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{(user?.role === "ADMIN" ? user : adminUser)?.username || "Tác Giả"}</h3>
                <p className="text-sm text-muted-foreground mb-4 px-2 tracking-tight">Đam mê công nghệ, yêu thích trải nghiệm và luôn chia sẻ góc nhìn cuộc sống.</p>

                {/* Social Media Row Links */}
                <div className="flex justify-center gap-3 mb-4">
                  {/* Facebook */}
                  {(user?.role === "ADMIN" ? user : adminUser)?.facebook_url ? (
                    <a href={safeLink((user?.role === "ADMIN" ? user : adminUser).facebook_url)} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                      <Facebook className="w-4 h-4" />
                    </a>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground/30 flex items-center justify-center cursor-not-allowed" title="Chưa cập nhật Facebook">
                      <Facebook className="w-4 h-4" />
                    </div>
                  )}

                  {/* Instagram */}
                  {(user?.role === "ADMIN" ? user : adminUser)?.instagram_url ? (
                    <a href={safeLink((user?.role === "ADMIN" ? user : adminUser).instagram_url)} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all">
                      <Instagram className="w-4 h-4" />
                    </a>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground/30 flex items-center justify-center cursor-not-allowed" title="Chưa cập nhật Instagram">
                      <Instagram className="h-4 w-4" />
                    </div>
                  )}

                  {/* Threads */}
                  {(user?.role === "ADMIN" ? user : adminUser)?.threads_url ? (
                    <a href={safeLink((user?.role === "ADMIN" ? user : adminUser).threads_url)} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-all">
                      <ThreadsIcon className="w-4 h-4" />
                    </a>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground/30 flex items-center justify-center cursor-not-allowed" title="Chưa cập nhật Threads">
                      <ThreadsIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="h-px bg-border w-full mb-4"></div>
                <div className="flex justify-center gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div>
                    <span className="block text-xl text-green-600 mb-1 font-bold">{posts.length}</span>
                    Bài viết
                  </div>
                  <div>
                    <span className="block text-xl text-rose-500 mb-1 font-bold">
                      {posts.reduce((total, p) => total + Number(p.like_count || 0), 0)}
                    </span>
                    Lượt thích
                  </div>
                </div>
              </div>

              {/* Ô TÌM KIẾM TRỤ ĐỨNG */}
              <div className="bg-card rounded-3xl shadow-sm border border-border p-6">
                <h4 className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wider mb-4">
                  <Search className="w-4 h-4 text-green-600" />
                  Tìm kiếm
                </h4>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Gõ từ khóa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-muted border border-border rounded-xl focus:bg-background focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm font-medium text-foreground placeholder:text-muted-foreground/50"
                  />
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* DẢI THUMBNAIL THỂ LOẠI (CATEGORY) */}
              <div className="bg-card rounded-3xl shadow-sm border border-border p-6">
                <h4 className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wider mb-4">
                  <Filter className="w-4 h-4 text-blue-500" />
                  Góc khám phá
                </h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${selectedCategory === cat
                        ? "bg-green-600 text-white shadow-md shadow-green-600/30 transform scale-105"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border hover:border-border"
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

            </div> {/* Kết thúc Sticky */}
          </aside> {/* Kết thúc Cột Phải */}

        </div> {/* Kết thúc Grid 2 Cột Lớn */}
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-card rounded-[2.5rem] p-8 max-w-sm w-full mx-4 shadow-2xl transform transition-all border border-border">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-6">
              <LogOut className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-foreground text-center mb-2">Đăng xuất tài khoản?</h3>
            <p className="text-muted-foreground text-center text-sm mb-8">
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống ngay lúc này không?
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleLogout}
                className="w-full py-3.5 px-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-[0.98]"
              >
                Vâng, hãy đăng xuất
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-3.5 px-4 bg-muted text-muted-foreground font-bold rounded-xl hover:bg-muted/80 transition-all border border-border active:scale-[0.98]"
              >
                Không, tôi bấm nhầm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
