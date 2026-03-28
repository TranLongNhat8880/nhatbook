import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { ArrowLeft, Send, BookOpen } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState("");

  const quillRef = useRef<ReactQuill>(null);

  // Nạp dữ liệu cũ của bài viết
  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        const res = await fetch(`/api/posts/${id}`);
        const data = await res.json();

        if (res.ok && data.post) {
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

      try {
        const res = await fetch("/api/upload", {
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
      const res = await fetch(`/api/posts/${id}`, {
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
            <Link to={`/posts/${id}`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Hủy và quay lại
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Chỉnh sửa bài viết</h1>
          <p className="text-muted-foreground">Cập nhật nội dung bài viết của bạn để hoàn thiện hơn.</p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl font-medium border border-red-100 dark:border-red-900/30 flex items-center gap-2">
            ⚠️ {message}
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
              <label className="block text-sm font-bold text-foreground/70 uppercase tracking-wider ml-1">Nội dung bài viết</label>
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
