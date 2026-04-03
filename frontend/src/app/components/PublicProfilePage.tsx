import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { BookOpen, Calendar, MessageSquare, Heart, Search, Filter, Facebook, Instagram, AtSign as ThreadsIcon, Settings, UserPlus, UserMinus, UserCheck, MessageCircle } from "lucide-react";
import { UserAvatar } from "./ui/UserAvatar";
import { API_ENDPOINTS } from "../api.config";

interface PublicUser {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar_url?: string;
  bio?: string;
  facebook_url?: string;
  instagram_url?: string;
  threads_url?: string;
  balance?: number;
  post_count?: number;
  total_likes?: number;
  equipped_items?: any[];
  created_at: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
  comment_count: string;
  like_count: string;
}

const extractFirstImage = (htmlContent: string) => {
  if (!htmlContent) return null;
  const match = htmlContent.match(/<img[^>]+src="([^">]+)"/);
  return match ? match[1] : null;
};

const stripHtml = (htmlContent: string) => {
  if (!htmlContent) return "";
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;
  return tempDiv.textContent || tempDiv.innerText || "";
};

const safeLink = (url: string) => {
  if (!url) return "#";
  return url.startsWith("http") ? url : `https://${url}`;
};

export function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<{ status: string; isRequester?: boolean }>({ status: "NONE" });
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Kiểm tra xem ID người xem có phải là ID của user đang login không
  const userStr = localStorage.getItem("user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isMe = currentUser && id && currentUser.id === id;

  useEffect(() => {
    fetchPublicProfile();
    if (!isMe && id) {
      fetchFriendshipStatus();
    }
    // Cuộn lên đầu trang
    window.scrollTo(0, 0);
  }, [id, isMe]);

  const fetchFriendshipStatus = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(API_ENDPOINTS.GET_FRIEND_STATUS(id!), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setFriendStatus(data);
    } catch (err) { console.error(err); }
  };

  const handleToggleFriendRequest = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    setIsActionLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.FRIEND_REQUEST, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ targetId: id })
      });
      const data = await res.json();
      if (res.ok) {
        setFriendStatus({ status: data.status, isRequester: data.status === 'PENDING' });
      }
    } catch (err) { console.error(err); }
    finally { setIsActionLoading(false); }
  };

  const fetchPublicProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.GET_PUBLIC_PROFILE(id!));
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setPosts(data.posts);
      } else {
        console.error("Không tìm thấy người dùng");
      }
    } catch (err) {
      console.error("Lỗi fetchPublicProfile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "ADMIN") return { text: "ADMIN", color: "bg-red-100 text-red-600 border-red-200" };
    if (role === "MEMBER") return { text: "MEMBER", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    return { text: "USER", color: "bg-blue-100 text-blue-600 border-blue-200" };
  };

  const formatCount = (count: number | undefined) => {
    if (count === undefined) return 0;
    return count > 100 ? "100+" : count;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center py-20">
        <div className="text-gray-400 mb-4">
          <Search className="h-16 w-16" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Người dùng không tồn tại</h2>
        <p className="text-muted-foreground mb-6">Tài khoản này có thể đã bị xóa hoặc không hợp lệ.</p>
        <button onClick={() => navigate("/")} className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700">
          Về Trang Chủ
        </button>
      </div>
    );
  }

  const roleInfo = getRoleBadge(profile.role);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 pb-20">
      
      {/* HEADER SECTION (Cover & Avatar) */}
      <div className="relative border-b border-border">
        {/* Lớp cover phụ */}
        <div className="h-48 md:h-64 w-full bg-gradient-to-r from-emerald-700/80 to-teal-900/90 relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           {isMe && (
              <button 
                onClick={() => navigate("/profile")}
                className="absolute top-6 right-6 flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md px-4 py-2 rounded-xl transition-all font-semibold shadow-lg text-sm"
              >
                <Settings className="w-4 h-4" />
                Chỉnh sửa Hồ sơ
              </button>
           )}
        </div>

        {/* Thông tin chính */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-20 sm:-mt-24 mb-10 flex flex-col items-center">
          
          <div className="p-1.5 bg-background rounded-full shadow-xl mb-4 relative z-10">
             <UserAvatar 
                src={profile.avatar_url} 
                username={profile.username}
                equippedItems={profile.equipped_items}
                size="2xl" 
                className="w-32 h-32 text-4xl"
             />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
            {profile.username}
            <span className={`px-2.5 py-0.5 mt-1 sm:mt-0 text-[10px] font-bold uppercase tracking-widest rounded-full border shadow-sm ${roleInfo.color}`}>
               {roleInfo.text}
            </span>
          </h1>

          <p className="text-muted-foreground text-center max-w-2xl px-4 text-sm sm:text-base leading-relaxed mb-6 font-medium">
            {profile.bio || "No bio yet"}
          </p>

          {/* SỐ LIỆU ĐANG CÓ */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-12 mb-8 bg-card/50 px-8 py-4 rounded-2xl border border-border">
            <div className="flex flex-col items-center">
              <span className="text-3xl text-green-600 mb-1 font-black">
                {formatCount(profile.post_count)}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Bài viết
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl text-rose-500 mb-1 font-black">
                {formatCount(profile.total_likes)}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Lượt thích
              </span>
            </div>
            {profile.balance !== undefined && currentUser?.role === "ADMIN" && (
                <div className="flex flex-col items-center">
                  <span className="text-3xl text-yellow-500 mb-1 font-black">
                    {profile.balance}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Số dư NC
                  </span>
                </div>
            )}
          </div>

          {/* SOCIAL LINKS */}
          <div className="flex items-center justify-center gap-4 mb-8">
             {profile.facebook_url ? (
               <a href={safeLink(profile.facebook_url)} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-1">
                 <Facebook className="w-5 h-5" />
               </a>
             ) : (
               <div className="w-10 h-10 rounded-full bg-muted/50 text-muted-foreground/30 flex items-center justify-center cursor-not-allowed">
                 <Facebook className="w-5 h-5" />
               </div>
             )}

             {profile.instagram_url ? (
               <a href={safeLink(profile.instagram_url)} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-1">
                 <Instagram className="w-5 h-5" />
               </a>
             ) : (
               <div className="w-10 h-10 rounded-full bg-muted/50 text-muted-foreground/30 flex items-center justify-center cursor-not-allowed">
                 <Instagram className="w-5 h-5" />
               </div>
             )}

             {profile.threads_url ? (
               <a href={safeLink(profile.threads_url)} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 flex items-center justify-center hover:bg-gray-800 hover:text-white dark:hover:bg-gray-100 dark:hover:text-gray-900 transition-all shadow-sm hover:shadow-md hover:-translate-y-1">
                 <ThreadsIcon className="w-5 h-5" />
               </a>
             ) : (
               <div className="w-10 h-10 rounded-full bg-muted/50 text-muted-foreground/30 flex items-center justify-center cursor-not-allowed">
                 <ThreadsIcon className="w-5 h-5" />
               </div>
             )}
          </div>

          {/* CHỨC NĂNG KẾT BẠN & NHẮN TIN */}
          {!isMe && profile && (
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={handleToggleFriendRequest}
                disabled={isActionLoading}
                className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${
                  friendStatus.status === 'ACCEPTED' 
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                  : friendStatus.status === 'PENDING'
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isActionLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                ) : friendStatus.status === 'ACCEPTED' ? (
                  <><UserCheck className="w-5 h-5" /> Bạn bè</>
                ) : friendStatus.status === 'PENDING' ? (
                  friendStatus.isRequester ? <><UserMinus className="w-5 h-5" /> Hủy lời mời</> : <><UserPlus className="w-5 h-5" /> Phản hồi lời mời</>
                ) : (
                  <><UserPlus className="w-5 h-5" /> Thêm bạn</>
                )}
              </button>

              <button 
                onClick={() => navigate('/?chat=' + profile.id)}
                className="flex items-center gap-2 px-8 py-3 bg-white border border-emerald-200 text-emerald-700 rounded-2xl font-bold hover:bg-emerald-50 transition-all shadow-md active:scale-95"
              >
                <MessageCircle className="w-5 h-5" />
                Nhắn tin
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TÁC PHẨM CỦA TÁC GIẢ (POSTS LIST) */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
           <BookOpen className="w-6 h-6 text-green-600" />
           <h2 className="text-2xl font-bold tracking-tight">Bài viết của {profile.username}</h2>
        </div>

        {posts.length === 0 ? (
          <div className="py-20 text-center bg-card rounded-3xl shadow-sm border border-border border-dashed flex flex-col items-center">
            <span className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-muted-foreground/30" />
            </span>
            <h3 className="text-2xl font-bold text-foreground mb-3">Chưa có bài viết nào</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Tác giả này có vẻ khá trầm tính, chưa chia sẻ bất kỳ bài viết nào với cộng đồng.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {posts.map((post) => {
              const thumbnail = extractFirstImage(post.content);
              const previewText = stripHtml(post.content);

              return (
                <div
                  key={post.id}
                  onClick={() => navigate(`/posts/${post.id}`)}
                  className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
                >
                  <div
                    className="h-40 w-full relative overflow-hidden bg-muted"
                    style={!thumbnail ? { background: "linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)" } : undefined}
                  >
                    {thumbnail && (
                      <img src={thumbnail} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                    {post.category && (
                      <span className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider shadow-sm">
                        {post.category}
                      </span>
                    )}
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-end mb-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase tracking-tighter">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.created_at).toLocaleDateString("vi-VN")}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-green-600 transition-colors line-clamp-2 leading-tight">
                      {post.title}
                    </h3>

                    <p className="text-muted-foreground text-xs mb-5 line-clamp-3 flex-1 leading-relaxed">
                      {previewText}
                    </p>

                     <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                        <div className="flex items-center gap-4 text-muted-foreground text-xs font-semibold">
                          <div className="flex items-center gap-1.5 hover:text-red-500 transition-colors cursor-pointer">
                            <Heart className="w-4 h-4" />
                            <span>{post.like_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5 hover:text-green-600 transition-colors cursor-pointer">
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.comment_count || 0}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                           Đọc →
                        </span>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
}
