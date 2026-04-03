import { useState } from "react";
import { Eye, EyeOff, BookOpen, Mail, Lock, User, ArrowRight, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { ThemeToggle } from "./ThemeToggle";
import { API_ENDPOINTS } from "../api.config";

export function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(API_ENDPOINTS.REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Đăng ký thất bại");
        return;
      }

      if (data.requiresOtp) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setStep(2);
        }, 1500);
      } else {
        // Fallback or legacy
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      setError("Không thể kết nối tới máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(API_ENDPOINTS.VERIFY_EMAIL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Xác thực OTP thất bại");
        return;
      }

      setSuccess(true);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Chuyển hướng về trang chủ
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err) {
      setError("Không thể kết nối tới máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-background transition-colors duration-300 relative"
    >
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

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
            {step === 1 ? "Tạo tài khoản mới" : "Xác thực Email"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {step === 1 ? "Gia nhập cộng đồng nhatbook ngay hôm nay." : "Vui lòng nhập mã OTP đã được gửi đến email của bạn."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl font-medium border border-red-100 dark:border-red-900/30 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-xl font-medium border border-green-100 dark:border-green-900/30 text-center">
            {step === 1 ? "Mã OTP đã được gửi! Đang chuyển trang..." : "Kích hoạt thành công! Đang vào trang chủ..."}
          </div>
        )}

        {/* Render Form */}
        {step === 1 ? (
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-foreground/70 mb-2 ml-1">
                Tên hiển thị
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-green-600 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên của bạn"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-foreground/70 mb-2 ml-1">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-green-600 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-foreground/70 mb-2 ml-1">
                Mật khẩu
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-green-600 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập ít nhất 6 ký tự"
                  minLength={6}
                  required
                  className="w-full pl-11 pr-12 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all placeholder:text-muted-foreground/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-primary text-primary-foreground rounded-xl hover:opacity-90 active:scale-[0.98] transition-all duration-200 font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group mt-6"
            >
              {isLoading ? (
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  Đăng ký
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            {/* OTP */}
            <div>
              <label className="block text-sm font-semibold text-foreground/70 mb-2 ml-1">
                Mã OTP (6 chữ số)
              </label>
              <div className="relative group">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-green-600 transition-colors" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  placeholder="Nhập 6 số"
                  maxLength={6}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-muted border border-border rounded-xl tracking-[0.5em] font-mono text-center text-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all placeholder:text-muted-foreground/50 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground text-center">
                Mã xác nhận đã gửi đến: <strong>{email}</strong>
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="w-full py-3.5 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-lg flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  Kích hoạt tài khoản
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setOtp(''); }}
              className="w-full py-3 px-4 bg-transparent text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors mt-2"
            >
              Trở lại màn hình đăng ký
            </button>
          </form>
        )}

        {/* Login link */}
        {step === 1 && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="font-bold text-green-600 hover:text-green-700 transition-all"
            >
              Đăng nhập
            </Link>
          </p>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 opacity-60">
          © 2026 nhatbook · Mọi quyền được bảo lưu
        </p>
      </div>
    </div>
  );
}
