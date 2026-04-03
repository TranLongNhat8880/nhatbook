import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "./Navbar";
import { NavigationDrawer } from "./NavigationDrawer";
import ChatSystem from "./ChatSystem";
import { API_ENDPOINTS } from "../api.config";
import { LogOut } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [canCheckin, setCanCheckin] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  // Đồng bộ user từ localStorage và API
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchCurrentUser();
    }
  }, [location.pathname]); // Cập nhật khi đổi trang

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      // 1. Fetch Profile
      const res = await fetch(API_ENDPOINTS.GET_ME, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // 2. Fetch Wallet Status (Checkin)
      const walletRes = await fetch("/api/users/wallet", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setCanCheckin(walletData.canCheckin);
      }
    } catch (err) {
      console.error("Lỗi đồng bộ dữ liệu:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setShowLogoutModal(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar 
        user={user} 
        canCheckin={canCheckin}
        onMenuClick={() => setIsDrawerOpen(true)} 
      />
      
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        canCheckin={canCheckin}
        onLogout={() => setShowLogoutModal(true)}
        onCheckinUpdate={(newStatus: boolean) => setCanCheckin(newStatus)}
      />

      {/* Main Content Area */}
      <main>
        {children}
      </main>
      
      {/* NHATCHAT SYSTEM (Floating) */}
      <ChatSystem 
        token={localStorage.getItem("token") || ""} 
        currentUser={user} 
      />

      {/* Shared Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-sm rounded-[2rem] shadow-2xl border border-border p-8 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-6 flex items-center justify-center text-red-600 dark:text-red-400">
              <LogOut className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Đăng xuất?</h3>
            <p className="text-muted-foreground text-center text-sm mb-8">Bạn có chắc chắn muốn rời khỏi nhatbook?</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleLogout}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95"
              >
                Xác nhận đăng xuất
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-4 bg-muted hover:bg-muted/80 text-foreground rounded-2xl font-bold transition-all border border-border"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
