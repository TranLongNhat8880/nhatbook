import { useState } from "react";
import { Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff, KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { ThemeToggle } from "./ThemeToggle";
import { API_ENDPOINTS } from "../api.config";

export function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await fetch(API_ENDPOINTS.FORGOT_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Không thể yêu cầu đặt lại mật khẩu");
        return;
      }

      setSuccess("Mã OTP đã được gửi đến email của bạn!");
      setTimeout(() => {
        setSuccess("");
        setStep(2);
      }, 1500);
    } catch (err) {
      setError("Không thể kết nối tới máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(API_ENDPOINTS.RESET_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: otp, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Lỗi đổi mật khẩu");
        return;
      }

      setSuccess("Đổi mật khẩu thành công! Đang chuyển đến trang Đăng nhập...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError("Không thể kết nối tới máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background transition-colors duration-300 relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-card rounded-[2.5rem] shadow-xl p-10 border border-border">
        {/* Logo Icon */}
        <div className="flex items-center justify-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #facc15, #eab308)" }}
          >
            <KeyRound className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h2 className="text-foreground mb-2" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {step === 1 ? "Quên mật khẩu?" : "Đặt lại mật khẩu"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {step === 1
              ? "Nhập email của bạn để nhận mã khôi phục."
              : "Nhập mã OTP từ email và tạo mật khẩu mới."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl font-medium border border-red-100 dark:border-red-900/30 text-center animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-xl font-medium border border-green-100 dark:border-green-900/30 text-center animate-in fade-in slide-in-from-top-2">
            {success}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOTP} className="space-y-5 animate-in fade-in zoom-in-95">
            <div>
              <label className="block text-sm font-semibold text-foreground/70 mb-2 ml-1">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-yellow-600 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-600 transition-all placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full py-3.5 px-4 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  Gửi mã xác nhận
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in slide-in-from-right-4">
            {/* OTP */}
            <div>
              <label className="block text-sm font-semibold text-foreground/70 mb-2 ml-1">
                Mã OTP (6 chữ số)
              </label>
              <div className="relative group">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-yellow-600 transition-colors" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  placeholder="Nhập 6 số"
                  maxLength={6}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-muted border border-border rounded-xl tracking-[0.5em] font-mono text-center text-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-600 transition-all placeholder:text-muted-foreground/50 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground ml-1">
                Đã gửi đến {email}
              </p>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-foreground/70 mb-2 ml-1">
                Mật khẩu mới
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-yellow-600 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập ít nhất 6 ký tự"
                  minLength={6}
                  required
                  className="w-full pl-11 pr-12 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-600 transition-all placeholder:text-muted-foreground/50"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-foreground/70 mb-2 ml-1">
                Nhập lại mật khẩu
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-yellow-600 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-600 transition-all placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || otp.length < 6 || !newPassword || !confirmPassword}
              className="w-full py-3.5 px-4 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  Hoàn tất
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setOtp(''); setNewPassword(''); setConfirmPassword(''); }}
              className="w-full py-3 px-4 bg-transparent text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors mt-2"
            >
              Trở lại màn hình nhập Email
            </button>
          </form>
        )}

        {/* Back to Login link */}
        {step === 1 && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Nhớ mật khẩu rồi?{" "}
            <Link
              to="/login"
              className="font-bold text-yellow-600 hover:text-yellow-700 transition-all"
            >
              Đăng nhập lại
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
