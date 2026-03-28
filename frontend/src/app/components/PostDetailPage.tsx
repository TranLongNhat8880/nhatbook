import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Calendar, User, ArrowLeft, MessageSquare, Trash2, Reply, X, MoreVertical, Heart, Edit3, BookOpen } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  author_name: string;
  author_avatar?: string;
  like_count?: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_name: string;
  author_avatar?: string;
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

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const isLiked = currentUser && likes.some((u) => u.id === currentUser.id);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) { }
    }

    if (id) {
      fetchPostDetails();
      fetchComments();
      fetchLikes();
    }
  }, [id]);

  const fetchPostDetails = async () => {
    try {
      const res = await fetch(`/api/posts/${id}`);
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
      const res = await fetch(`/api/posts/${id}/comments`);
      const data = await res.json();
      if (res.ok) setComments(data.comments);
    } catch (err) {
      console.error("Lỗi tải bình luận:", err);
    }
  };

  const fetchLikes = async () => {
    try {
      const res = await fetch(`/api/posts/${id}/likes`);
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
      const res = await fetch(`/api/posts/${id}/like`, {
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
      const res = await fetch(`/api/posts/${id}/comments`, {
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

      if (res.ok) {
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
      const res = await fetch(`/api/comments/${commentId}`, {
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
      const res = await fetch(`/api/posts/${id}`, {
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

  const parentComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center">Đang tải...</div>;
  if (!post) return <div className="min-h-screen bg-background flex items-center justify-center">Bài viết không tồn tại.</div>;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      {/* Navbar Minimalist */}
      <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #a3e635, #16a34a)" }}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-xl tracking-tight dark:text-green-500"
              style={{ color: "#15803d", fontFamily: "Georgia, serif", fontWeight: 700 }}
            >
              nhat<span className="italic">book</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Về trang chủ
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
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
                  <div className="w-8 h-8 rounded-full border border-border overflow-hidden flex items-center justify-center bg-muted">
                    {post.author_avatar ? (
                      <img src={post.author_avatar} alt={post.author_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">
                        {post.author_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-foreground/90">{post.author_name}</span>
                </div>
              </div>

              {/* Khu Vực Nút Admin */}
              {currentUser?.role === "ADMIN" && (
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

          <div
            className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed mb-12
              prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground 
              prose-img:rounded-3xl prose-img:shadow-lg prose-a:text-green-600 px-8 sm:px-12"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

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
              <div className="w-10 h-10 shrink-0 rounded-full border border-border overflow-hidden flex items-center justify-center bg-muted">
                {currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
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
                  <div className="w-10 h-10 shrink-0 rounded-full border border-border overflow-hidden flex items-center justify-center bg-muted">
                    {parent.author_avatar ? (
                      <img src={parent.author_avatar} alt={parent.author_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">{parent.author_name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-5 py-4 border border-border">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-foreground text-sm">{parent.author_name}</span>
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
                        className="text-foreground/80 text-sm whitespace-pre-wrap mt-2 comment-content"
                        dangerouslySetInnerHTML={{ __html: parent.content }}
                      />
                    </div>

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
                        <div className="w-8 h-8 shrink-0 rounded-full border border-border overflow-hidden flex items-center justify-center bg-muted z-10">
                          {child.author_avatar ? (
                            <img src={child.author_avatar} alt={child.author_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground">{child.author_name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3 border border-border">
                            <div className="flex justify-between items-start mb-0.5">
                              <span className="font-semibold text-foreground text-sm">{child.author_name}</span>
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
                              className="text-foreground/80 text-sm whitespace-pre-wrap mt-1 comment-content"
                              dangerouslySetInnerHTML={{ __html: child.content }}
                            />
                          </div>

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
      </div>

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
    </div>
  );
}
