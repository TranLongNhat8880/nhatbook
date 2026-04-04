import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Calendar, User, ArrowLeft, MessageSquare, Trash2, Reply, X, MoreVertical, Heart, Edit3, ChevronDown, ChevronUp, ShieldCheck, Crown, ShieldAlert, AlertTriangle, Info } from "lucide-react";
import { UserAvatar } from "./ui/UserAvatar";
import { API_ENDPOINTS } from "../api.config";

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  author_equipped_items?: any[];
  like_count?: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_name: string;
  author_avatar?: string;
  author_equipped_items?: any[];
  author_role: string;
  parent_id?: string;
}

export function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  // State quản lý việc Reply & Modal
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [violationDetail, setViolationDetail] = useState<{ message: string, reason: string } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // States for Read More feature
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const isLiked = currentUser && likes.some((u) => u.id === currentUser.id);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setCurrentUser(parsed);
        // Sync lại với server để đảm bảo role và data luôn mới nhất
        // (Fix bug: Render cold start chậm khiến MainLayout chưa kịp sync trước PostDetailPage)
        const token = localStorage.getItem("token");
        if (token) {
          fetch(API_ENDPOINTS.GET_ME, {
            headers: { "Authorization": `Bearer ${token}` }
          })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
              if (data?.user) {
                setCurrentUser(data.user);
                localStorage.setItem("user", JSON.stringify(data.user));
              }
            })
            .catch(() => {}); // Lỗi mạng không crash app
        }
      } catch (e) { }
    }

    if (id) {
      fetchPostDetails();
      fetchComments();
      fetchLikes();
    }
  }, [id]);

  // Check content height to show "Read More" button
  useEffect(() => {
    if (post && contentRef.current) {
      const height = contentRef.current.scrollHeight;
      if (height > 800) {
        setShowReadMore(true);
      } else {
        setShowReadMore(false);
      }
    }
  }, [post]);

  const fetchPostDetails = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.GET_POST_DETAIL(id!));
      const data = await res.json();
      if (res.ok) setPost(data.post);
    } catch (err) {
      console.error("Lỗi tải bài viết:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.GET_COMMENTS(id!));
      const data = await res.json();
      if (res.ok) setComments(data.comments);
    } catch (err) {
      console.error("Lỗi tải bình luận:", err);
    }
  };

  const fetchLikes = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.GET_LIKES(id!));
      if (res.ok) {
        const data = await res.json();
        setLikes(data.likes);
      }
    } catch (err) {
      console.error("Lỗi tải likes:", err);
    }
  };

  const handleLike = async () => {
    if (!currentUser) return alert("Vui lòng đăng nhập để thích bài viết.");

    setIsLiking(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.LIKE_POST(id!), {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        // Fetch lại để nhận dữ liệu thời gian thực
        fetchLikes();
      }
    } catch (err) {
      console.error("Lỗi thả tim:", err);
    } finally {
      setIsLiking(false);
    }
  };

  const submitComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const contentToSubmit = parentId ? replyContent : newComment;

    if (!contentToSubmit.trim() || !currentUser) return;

    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(API_ENDPOINTS.POST_COMMENT(id!), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          content: contentToSubmit,
          parent_id: parentId
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.moderation?.isToxic) {
          setViolationDetail({
            message: data.message,
            reason: data.moderation.reason
          });
        }

        if (parentId) {
          setReplyContent("");
          setReplyingTo(null);
        } else {
          setNewComment("");
        }
        fetchComments(); // Tải lại danh sách
      } else {
        alert("Thêm bình luận thất bại");
      }
    } catch (err) {
      alert("Lỗi kết nối");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này? (Các bình luận con cũng sẽ bị xóa theo)")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.DELETE_COMMENT(commentId), {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        fetchComments();
      } else {
        alert("Bạn không có quyền xóa bình luận này");
      }
    } catch (err) {
      alert("Lỗi khi xóa");
    }
  };

  const deletePost = async () => {
    if (!confirm("CẢNH BÁO: BẠN CÓ CHẮC CHẮN MUỐN XÓA BÀI VIẾT NÀY KHÔNG?\n\n(Hành động này sẽ xóa VĨNH VIỄN toàn bộ Lượt Thích và Bình luận của bài viết này và không thể khôi phục!)")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_ENDPOINTS.DELETE_POST(id!), {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        alert("Đã xóa bài viết khỏi Hệ thống!");
        window.location.href = "/";
      } else {
        alert("Bạn không có quyền xóa bài viết này.");
      }
    } catch (err) {
      alert("Lỗi kết nối khi xóa");
    }
  };

  const handleReplyClick = (parentId: string, authorName?: string) => {
    setReplyingTo(parentId);
    if (authorName) {
      setReplyContent(`@${authorName} `);
    } else {
      setReplyContent("");
    }
  };

  const parentComments = comments.filter(c => {
    // Dùng ?? thay || để tránh falsy coercion với UUID dạng string
    const pId = c.parent_id ?? (c as any).parentId;
    return pId === null || pId === undefined || String(pId).trim() === "" || String(pId).trim() === "null";
  });

  const getReplies = (parentId: string) => {
    if (!parentId) return [];
    // Không dùng toLowerCase() — UUID từ Supabase production đã là lowercase text
    // Dùng trim() để loại bỏ whitespace ẩn có thể có khi qua PgBouncer
    const targetId = String(parentId).trim();
    return comments.filter(c => {
      const cPId = c.parent_id ?? (c as any).parentId;
      if (!cPId) return false;
      return String(cPId).trim() === targetId;
    });
  };

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-medium animate-pulse">Đang tải bài viết...</div>;
  if (!post) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-medium">Rất tiếc, bài viết không tồn tại.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Nút quay lại & Tiêu đề trang */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/")}
          className="p-3 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent italic">Chi tiết bài viết</h2>
      </div>

      <article className="bg-card rounded-[2.5rem] shadow-sm border border-border overflow-hidden mb-12">
        <div className="p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-4 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold rounded-full uppercase tracking-wider">
              {post.category}
            </span>
            <span className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium">
              <Calendar className="w-4 h-4" /> {new Date(post.created_at).toLocaleDateString("vi-VN")}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-8 leading-tight tracking-tight">
            {post.title}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center p-0.5 scale-90 cursor-pointer hover:ring-2 ring-green-500 rounded-full transition-all" onClick={() => navigate(`/user/${post.author_id}`)}>
                  <UserAvatar
                    src={post.author_avatar}
                    username={post.author_name}
                    equippedItems={post.author_equipped_items}
                    size="sm"
                  />
                </div>
                <span className="font-semibold text-foreground/90 cursor-pointer hover:text-green-600 hover:underline transition-colors" onClick={() => navigate(`/user/${post.author_id}`)}>{post.author_name}</span>
              </div>
            </div>

            {/* Khu Vực Nút Admin / Tác giả */}
            {(currentUser?.role === "ADMIN" || (currentUser?.id === post.author_id && currentUser?.role === "MEMBER")) && (
              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/posts/${id}/edit`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-semibold"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Sửa bài
                </Link>
                <button
                  onClick={deletePost}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa bài
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <div
            ref={contentRef}
            className={`prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed 
                prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground 
                prose-img:rounded-3xl prose-img:shadow-lg prose-a:text-green-600 px-8 sm:px-12 transition-all duration-500 ease-in-out overflow-hidden
                ${showReadMore && !isExpanded ? 'max-h-[800px]' : 'max-h-full pb-8'}`}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Read More / Collapse Toggle UI */}
          {showReadMore && (
            <div className={`absolute bottom-0 left-0 right-0 flex justify-center pb-10 pt-44 transition-all duration-500
                ${isExpanded ? 'static pt-4 pb-12' : 'bg-gradient-to-t from-card via-card/95 to-transparent'}`}>

              <button
                onClick={() => {
                  setIsExpanded(!isExpanded);
                  if (isExpanded) {
                    // Scroll back to content top if collapsing
                    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="flex items-center gap-2 px-8 py-3 bg-white dark:bg-muted border border-border rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all font-bold text-green-600 dark:text-green-400 group"
              >
                {isExpanded ? (
                  <><ChevronUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" /> Thu gọn nội dung</>
                ) : (
                  <><ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" /> Xem thêm nội dung</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Action Bar (Like/Meta) */}
        <div className="px-8 sm:px-12 py-6 border-t border-border flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`group flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${isLiked
                ? "border-red-100 bg-red-50 text-red-500 hover:bg-red-100"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-red-500"
                } ${isLiking ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Heart
                className={`w-5 h-5 transition-transform duration-300 ${isLiked ? "fill-red-500 scale-110" : "group-hover:scale-110 group-active:scale-90"}`}
              />
              <span className="font-medium">{isLiked ? "Đã thích" : "Thích"}</span>
            </button>

            {likes.length > 0 && (
              <button
                onClick={() => setShowLikesModal(true)}
                className="text-sm text-muted-foreground hover:text-foreground font-medium hover:underline flex items-center gap-1.5"
              >
                <div className="flex -space-x-2">
                  {likes.slice(0, 3).map((liker, i) => (
                    <div key={liker.id} className="w-6 h-6 rounded-full border-2 border-card overflow-hidden bg-muted relative" style={{ zIndex: 10 - i }}>
                      {liker.avatar_url ? (
                        <img src={liker.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-[9px] font-bold text-muted-foreground">
                          {liker.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <span>
                  {isLiked
                    ? (likes.length === 1 ? 'Bạn đã thích bài viết' : `Bạn và ${likes.length - 1} người khác`)
                    : `${likes.length} lượt thích`}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm">
            <MessageSquare className="w-4 h-4" />
            {comments.length} Bình luận
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <section className="bg-card rounded-[2.5rem] shadow-sm border border-border p-8 sm:p-12">
        {/* Form Create Comment */}
        {currentUser ? (
          <form onSubmit={(e) => submitComment(e, null)} className="mb-10 flex gap-4">
            <div className="shrink-0 flex items-center justify-center p-0.5">
              <UserAvatar
                src={currentUser.avatar_url}
                username={currentUser.username}
                equippedItems={currentUser.equipped_items}
                size="md"
              />
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..."
                className="w-full border border-border rounded-xl px-4 py-3 placeholder-muted-foreground focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-none bg-background text-sm sm:text-base"
                rows={2}
                required
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50 shadow-sm"
                >
                  Gửi bình luận
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-10 p-6 bg-muted/50 rounded-xl border border-border text-center">
            <p className="text-muted-foreground mb-3 text-sm">Vui lòng đăng nhập để tham gia bình luận.</p>
            <Link to="/login" className="inline-block px-5 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors shadow-sm">
              Đăng nhập ngay
            </Link>
          </div>
        )}

        {/* Main List */}
        <div className="space-y-8">
          {parentComments.map((parent) => (
            <div key={parent.id} className="flex flex-col gap-4">
              <div className="flex gap-4 group">
                <div className="shrink-0 flex items-center justify-center p-0.5 cursor-pointer hover:ring-2 ring-green-500 rounded-full transition-all" onClick={() => navigate(`/user/${parent.user_id || (parent as any).author_id}`)}>
                  <UserAvatar
                    src={parent.author_avatar}
                    username={parent.author_name}
                    equippedItems={parent.author_equipped_items || []}
                    size="md"
                  />
                </div>

                <div className="flex-1">
                  {(() => {
                    const hasGold = (parent.author_equipped_items || [])?.some(i => i?.item_id === 'gold_comment');
                    return (
                      <div className={`rounded-2xl rounded-tl-sm px-5 py-4 border transition-all ${hasGold
                          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 shadow-sm shadow-amber-500/10'
                          : 'bg-muted/50 border-border'
                        }`}>
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-sm ${hasGold ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'}`}>
                              {parent.author_name}
                            </span>
                            {hasGold && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                            {parent.author_role === "ADMIN" && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-md font-bold uppercase transition-colors">Admin</span>
                            )}
                            {parent.author_role === "MEMBER" && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md font-bold uppercase transition-colors">Member</span>
                            )}
                            {parent.author_role === "USER" && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md font-bold uppercase transition-colors">User</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(parent.created_at).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit' })}
                            </span>

                            {/* Menu 3 chấm (Parent) */}
                            {currentUser && (currentUser.id === parent.user_id || currentUser.role === "ADMIN") && (
                              <div className="relative">
                                <button
                                  onClick={() => setOpenDropdownId(openDropdownId === parent.id ? null : parent.id)}
                                  className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {openDropdownId === parent.id && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)}></div>
                                    <div className="absolute right-0 top-full mt-1 w-40 bg-card rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-border z-50 overflow-hidden py-1">
                                      <button
                                        onClick={() => { deleteComment(parent.id); setOpenDropdownId(null); }}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" /> Xóa bình luận
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          className={`text-sm whitespace-pre-wrap mt-2 comment-content ${hasGold ? 'text-amber-900 dark:text-amber-100/90 font-medium' : 'text-foreground/80'}`}
                          dangerouslySetInnerHTML={{ __html: parent.content }}
                        />
                      </div>
                    );
                  })()}

                  <div className="flex items-center gap-4 mt-2 ml-2">
                    {currentUser && (
                      <button
                        onClick={() => handleReplyClick(parent.id)}
                        className="text-xs font-semibold text-muted-foreground hover:text-green-600 flex items-center gap-1 transition-colors"
                      >
                        <Reply className="w-3.5 h-3.5" /> Phản hồi
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {replyingTo === parent.id && (
                <div className="ml-14 flex gap-3 relative">
                  <div className="absolute -left-8 top-0 bottom-0 w-px bg-border" />
                  <div className="w-8 h-8 shrink-0 rounded-full border border-border overflow-hidden flex items-center justify-center bg-muted">
                    {currentUser?.avatar_url ? (
                      <img src={currentUser.avatar_url} alt="You" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <form onSubmit={(e) => submitComment(e, parent.id)} className="flex-1">
                    <div className="relative border border-border rounded-xl overflow-hidden shadow-sm bg-card focus-within:ring-2 focus-within:ring-green-500/20">
                      <textarea
                        autoFocus
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`Trả lời ${parent.author_name}...`}
                        className="w-full px-4 py-3 placeholder-muted-foreground focus:outline-none transition-all resize-none bg-transparent text-sm text-foreground"
                        rows={2}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || !replyContent.trim()}
                        className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-xs disabled:opacity-50"
                      >
                        Gửi phản hồi
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {getReplies(parent.id).length > 0 && (
                <div className="ml-14 flex flex-col gap-4 relative mt-4">
                  <div className="absolute -left-10 top-2 bottom-4 w-px bg-border rounded-full" />
                  {getReplies(parent.id).map(child => (
                    <div key={child.id} className="flex gap-3 group">
                      <div className="shrink-0 flex items-center justify-center p-0.5 scale-90 cursor-pointer hover:ring-2 ring-green-500 rounded-full transition-all" onClick={() => navigate(`/user/${child.user_id || (child as any).author_id}`)}>
                        <UserAvatar
                          src={child.author_avatar}
                          username={child.author_name}
                          equippedItems={child.author_equipped_items || []}
                          size="sm"
                        />
                      </div>
                      <div className="flex-1">
                        {(() => {
                          const hasGold = (child.author_equipped_items || [])?.some(i => i?.item_id === 'gold_comment');
                          return (
                            <div className={`rounded-2xl rounded-tl-sm px-4 py-3 border transition-all ${hasGold
                                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 shadow-sm shadow-amber-500/10'
                                : 'bg-muted/50 border-border'
                              }`}>
                              <div className="flex justify-between items-start mb-0.5">
                                <div className="flex items-center gap-2">
                                  <span className={`font-semibold text-sm ${hasGold ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'}`}>
                                    {child.author_name}
                                  </span>
                                  {hasGold && <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                  {child.author_role === "ADMIN" && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-md font-bold uppercase transition-colors">Admin</span>
                                  )}
                                  {child.author_role === "MEMBER" && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md font-bold uppercase transition-colors">Member</span>
                                  )}
                                  {child.author_role === "USER" && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md font-bold uppercase transition-colors">User</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-muted-foreground">
                                    {new Date(child.created_at).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit' })}
                                  </span>
                                  {/* Menu 3 chấm (Child) */}
                                  {currentUser && (currentUser.id === child.user_id || currentUser.role === "ADMIN") && (
                                    <div className="relative">
                                      <button
                                        onClick={() => setOpenDropdownId(openDropdownId === child.id ? null : child.id)}
                                        className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                                      >
                                        <MoreVertical className="w-3.5 h-3.5" />
                                      </button>
                                      {openDropdownId === child.id && (
                                        <>
                                          <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)}></div>
                                          <div className="absolute right-0 top-full mt-1 w-40 bg-card rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-border z-50 overflow-hidden py-1">
                                            <button
                                              onClick={() => { deleteComment(child.id); setOpenDropdownId(null); }}
                                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                              <Trash2 className="w-4 h-4" /> Xóa phản hồi
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div
                                className={`text-sm whitespace-pre-wrap mt-1 comment-content ${hasGold ? 'text-amber-900 dark:text-amber-100/90 font-medium' : 'text-foreground/80'}`}
                                dangerouslySetInnerHTML={{ __html: child.content }}
                              />
                            </div>
                          );
                        })()}

                        {currentUser && (
                          <div className="flex items-center gap-4 mt-1.5 ml-2">
                            <button
                              onClick={() => handleReplyClick(parent.id, child.author_name)}
                              className="text-[11px] font-semibold text-gray-500 hover:text-green-600 flex items-center gap-1 transition-colors"
                            >
                              <Reply className="w-3 h-3" /> Phản hồi
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {comments.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 border border-gray-100/50 rounded-2xl">
              Bài viết này chưa có bình luận nào. Hãy trở thành người đầu tiên!
            </div>
          )}
        </div>
      </section>

      {/* Modal Hiện Danh Sách Người Like */}
      {showLikesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowLikesModal(false)} />
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden flex flex-col max-h-[70vh] relative z-10 transform scale-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                Lượt thích ({likes.length})
              </h3>
              <button onClick={() => setShowLikesModal(false)} className="text-gray-400 hover:text-gray-700 bg-white rounded-full p-1.5 border hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-2">
              {likes.map(liker => (
                <div key={liker.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                    {liker.avatar_url ? (
                      <img src={liker.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex justify-center items-center text-sm font-bold text-gray-500">
                        {liker.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm line-clamp-1">{liker.username}</div>
                    <div className="text-xs text-gray-400">Đã thích {new Date(liker.created_at).toLocaleDateString("vi-VN", { day: 'numeric', month: 'short' })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* MODAL CẢNH BÁO VI PHẠM AI */}
      {violationDetail && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-rose-500/20 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-rose-500 p-8 flex flex-col items-center text-center text-white relative">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
              <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center mb-4 shadow-xl border border-white/30 animate-bounce">
                <ShieldAlert className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black tracking-tight uppercase">Phát hiện vi phạm!</h3>
              <p className="text-rose-100 font-medium text-sm mt-1">Hệ thống AI Moderator đã can thiệp</p>
            </div>

            {/* Body */}
            <div className="p-8">
              <div className="flex gap-4 items-start mb-6 bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                <span className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-bold text-rose-950 dark:text-rose-100 text-base leading-tight mb-1">{violationDetail.message}</p>
                  <p className="text-xs text-rose-600/80 dark:text-rose-400 font-medium italic">Vui lòng tuân thủ tiêu chuẩn cộng đồng để xây dựng NhatBook văn minh.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest pl-1">
                  <Info className="w-3 h-3" /> Chi tiết phân tích AI
                </div>
                <div className="bg-muted/50 p-5 rounded-2xl border border-border text-sm leading-relaxed font-medium text-foreground italic shadow-inner">
                  "{violationDetail.reason}"
                </div>
              </div>

              <button
                onClick={() => setViolationDetail(null)}
                className="w-full mt-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group"
              >
                Đã hiểu & Tiếp tục
                <ShieldCheck className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
