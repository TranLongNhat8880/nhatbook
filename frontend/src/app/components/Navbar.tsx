import { BookOpen, Menu, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { ThemeToggle } from "./ThemeToggle";
import { UserAvatar } from "./ui/UserAvatar";
import { NotificationBell } from "./ui/NotificationBell";

interface NavbarProps {
  user: any;
  canCheckin?: boolean;
  onMenuClick: () => void;
}

export function Navbar({ user, canCheckin, onMenuClick }: NavbarProps) {
  const navigate = useNavigate();
  const showDot = user && canCheckin;

  return (
    <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Hamburger & Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground relative"
              aria-label="Mở menu"
            >
              <Menu className="w-6 h-6" />
              {showDot && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-card rounded-full animate-pulse"></span>
              )}
            </button>
            
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                style={{ background: "linear-gradient(135deg, #a3e635, #16a34a)" }}
              >
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span
                className="text-xl sm:text-2xl tracking-tight dark:text-green-500 hidden sm:block"
                style={{ color: "#15803d", fontFamily: "Georgia, serif", fontWeight: 700 }}
              >
                nhat<span className="italic">book</span>
              </span>
            </div>
          </div>

          {/* Right: Theme & User Quick View */}
          <div className="flex items-center gap-3">
            {user && <NotificationBell token={localStorage.getItem("token") || ""} userId={user.id} />}
            <ThemeToggle />
            {user ? (
              <button 
                onClick={() => navigate("/profile")}
                className="flex items-center justify-center p-0.5 rounded-full border border-border/50 hover:border-primary/50 transition-all active:scale-95"
              >
                <UserAvatar 
                  src={user.avatar_url} 
                  username={user.username} 
                  equippedItems={user.equipped_items}
                  size="sm"
                />
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 text-sm font-bold text-white rounded-xl transition-all hover:shadow-md"
                style={{ background: "linear-gradient(135deg, #a3e635, #16a34a)" }}
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
