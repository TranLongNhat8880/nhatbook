import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { ArrowLeft, Send, Save, Image as ImageIcon } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { API_ENDPOINTS } from "../api.config";

export function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [message, setMessage] = useState("");

  const quillRef = useRef<ReactQuill>(null);

  // Nạp dữ liệu cũ của bài viết
  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.GET_POST_DETAIL(id!));
        const data = await res.json();

        if (res.ok && data.post) {
          const userStr = localStorage.getItem("user");
          const currentUser = userStr ? JSON.parse(userStr) : null;
          
          if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.id !== data.post.author_id)) {
            alert("Bạn không có quyền chỉnh sửa bài viết này.");
            navigate(`/posts/${id}`);
            return;
          }

          setTitle(data.post.title);
          setCategory(data.post.category || "");
          setContent(data.post.content);
        } else {
          setMessage("Không tìm thấy bài viết hoặc bài viết đã bị xóa.");
        }
      } catch (err) {
        setMessage("Lỗi kết nối tới máy chủ.");
        console.error("Lỗi tải bài viết:", err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchPostDetails();
  }, [id]);

  // Xử lý Custom chèn ảnh thẳng vào Cloudinary
  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const token = localStorage.getItem("token");
      if (!token) return;

      const formData = new FormData();
      formData.append("image", file);

      setIsUploadingImage(true);

      try {
        const res = await fetch(API_ENDPOINTS.UPLOAD_IMAGE, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();

        if (res.ok && data.url) {
          const quill = quillRef.current?.getEditor();
          const range = quill?.getSelection();

          if (quill && range) {
            quill.insertEmbed(range.index, "image", data.url);
          }
        } else {
          alert("Lỗi tải ảnh: " + data.message);
        }
      } catch (err) {
        console.error("Lỗi upload handler:", err);
        alert("Có lỗi xảy ra khi tải ảnh lên.");
      } finally {
        setIsUploadingImage(false);
      }
    };
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ color: [] }, { background: [] }],
        ["link", "image"],
        ["clean"],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  }), [imageHandler]);

  // Cập nhật lên CSDL
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    if (!title.trim() || !content.trim()) {
      setMessage("Tiêu đề và nội dung không được để trống!");
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_ENDPOINTS.UPDATE_POST(id!), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, content, category }),
      });

      if (res.ok) {
        navigate(`/posts/${id}`);
      } else {
        const data = await res.json();
        setMessage(data.message || "Cập nhật bài viết thất bại");
      }
    } catch (error) {
      setMessage("Lỗi kết nối tới máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4 transition-colors duration-300">
        <span className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full"></span>
        <p className="text-muted-foreground font-medium">Đang nạp dữ liệu bài viết...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans transition-colors duration-300 text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Header Back & Action */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={`/posts/${id}`} className="p-3 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-foreground mb-0">Chỉnh sửa bài viết</h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none">Hoàn thiện tác phẩm của bạn</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {message && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm rounded-xl font-bold border border-red-100 dark:border-red-900/30">
            {message}
          </div>
        )}

        {isUploadingImage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-sm rounded-xl font-bold border border-green-100 dark:border-green-900/30 flex items-center gap-3 animate-pulse">
            <span className="w-5 h-5 border-2 border-green-700 dark:border-green-400 border-t-transparent rounded-full animate-spin"></span>
            Đang làm đẹp hình ảnh...
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-8">
          <div className="bg-card rounded-[2.5rem] shadow-sm border border-border p-8 md:p-10 space-y-8">
            {/* Title & Category Input */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-bold text-foreground/70 uppercase tracking-wider ml-1">Tiêu đề bài viết</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-5 py-4 bg-muted border border-border rounded-2xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-foreground/70 uppercase tracking-wider ml-1">Danh mục</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-5 py-4 bg-muted border border-border rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                />
              </div>
            </div>

            {/* Editor Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline mb-1">
                <label className="block text-sm font-bold text-foreground/70 uppercase tracking-wider ml-1">Nội dung bài viết</label>
                <span className="text-xs text-muted-foreground/80 italic">Mẹo: Chạm/Click vào ảnh và nhấn nút Xóa trên bàn phím để gỡ ảnh</span>
              </div>
              <div className="rounded-2xl border border-border overflow-hidden bg-background prose-img:rounded-2xl">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={modules}
                  className="min-h-[400px] text-foreground"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl hover:opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed font-bold shadow-lg shadow-primary/20"
              >
                {isLoading ? (
                  <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"></span>
                ) : (
                  <>Cập nhật bài viết <Send className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
