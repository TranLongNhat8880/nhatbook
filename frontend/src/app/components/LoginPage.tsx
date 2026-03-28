import { useState } from "react";
import { Eye, EyeOff, BookOpen, Mail, Lock, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { ThemeToggle } from "./ThemeToggle";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Đăng nhập thất bại");
        return;
      }

      // Lưu token vào localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Chuyển hướng sang trang chính
      navigate("/");
    } catch (err) {
      setError("Không thể kết nối tới máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-background transition-colors duration-300 relative"
    >
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-card rounded-[2.5rem] shadow-xl p-10 border border-border">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: "linear-gradient(135deg, #a3e635, #16a34a)" }}
          >
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <span
            className="text-3xl tracking-tight dark:text-green-500"
            style={{ color: "#15803d", fontFamily: "Georgia, serif", fontWeight: 700 }}
          >
            nhat<span className="italic">book</span>
          </span>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h2 className="text-foreground mb-1" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Chào mừng!!
          </h2>
          <p className="text-muted-foreground text-sm">
            Đăng nhập để tiếp tục.
          </p>
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-card border border-border rounded-xl text-foreground hover:bg-muted transition-all duration-200 shadow-sm hover:shadow-md mb-6 cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-sm">Tiếp tục với Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">hoặc đăng nhập bằng tài khoản</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground/70 mb-2 ml-1">
              Email
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-muted-foreground group-focus-within:text-green-600 transition-colors" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all placeholder:text-muted-foreground/50"
                placeholder="longnhat@gmail.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground/70 mb-2 ml-1">
              Mật khẩu
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-green-600 transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-12 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all placeholder:text-muted-foreground/50"
                placeholder="********"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="w-4 h-4 text-green-600 bg-muted border-border rounded focus:ring-green-500"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="ml-2 text-sm text-muted-foreground">Ghi nhớ</span>
            </label>
            <a href="#" className="text-sm font-medium text-green-600 hover:text-green-700">
              Quên mật khẩu?
            </a>
          </div>

          {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl text-center">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-primary text-primary-foreground rounded-xl hover:opacity-90 active:scale-[0.98] transition-all duration-200 font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
          >
            {isLoading ? (
              <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                Đăng nhập
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Register link */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="font-bold text-green-600 hover:text-green-700 transition-all"
          >
            Đăng ký ngay
          </Link>
        </p>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 nhatbook · Mọi quyền được bảo lưu
        </p>
      </div>
    </div>
  );
}
