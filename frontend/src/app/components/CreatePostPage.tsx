import { useState, useRef, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { ArrowLeft, Save, Image as ImageIcon, Send, BookOpen } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const quillRef = useRef<ReactQuill>(null);

  // Custom handler cho việc chèn ảnh
  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const userStr = localStorage.getItem("user");
      if (!userStr) return;

      const formData = new FormData();
      formData.append("image", file);

      try {
        const token = localStorage.getItem("token");
        // Gửi ảnh lên server
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();

        if (res.ok && data.url) {
          // Lấy vị trí trỏ chuột hiện tại trong editor
          const quill = quillRef.current?.getEditor();
          const range = quill?.getSelection();

          if (quill && range) {
            // Chèn link ảnh (data.url) do Cloudinary sinh ra trả về từ Backend
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
        image: imageHandler, // Gắn custom handler thay cho mặc định
      },
    },
  }), [imageHandler]);

  const handleSubmit = async (e: React.FormEvent) => {
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
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, content, category }),
      });

      if (res.ok) {
        navigate("/");
      } else {
        const data = await res.json();
        setMessage(data.message || "Tạo bài viết thất bại");
      }
    } catch (error) {
      setMessage("Lỗi kết nối tới máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

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
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Về trang chủ
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Viết bài mới</h1>
          <p className="text-muted-foreground">Chia sẻ những ý tưởng và câu chuyện tuyệt vời của bạn với mọi người.</p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-card rounded-[2.5rem] shadow-sm border border-border p-8 md:p-10 space-y-8">
            {/* Title & Category Input */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-bold text-foreground/70 uppercase tracking-wider ml-1">Tiêu đề bài viết</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tiêu đề hấp dẫn thu hút người đọc..."
                  className="w-full px-5 py-4 bg-muted border border-border rounded-2xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder:text-muted-foreground/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-foreground/70 uppercase tracking-wider ml-1">Danh mục</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ví dụ: Đời sống, Công nghệ..."
                  className="w-full px-5 py-4 bg-muted border border-border rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder:text-muted-foreground/50"
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
                  placeholder="Hãy bắt đầu câu chuyện của bạn tại đây..."
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
                  <><Send className="w-5 h-5" /> Xuất bản bài viết</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
