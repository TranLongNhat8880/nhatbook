import { User } from "lucide-react";

interface UserAvatarProps {
  src?: string | null;
  username?: string;
  role?: string;
  equippedItems?: any[];
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export function UserAvatar({ src, username, role, equippedItems = [], size = 'md', className = "" }: UserAvatarProps) {
  const items = equippedItems || [];
  const hasNeon = items.some(i => i.item_id === 'neon_frame');
  const hasDiamond = items.some(i => i.item_id === 'diamond_frame');

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32'
  };

  const containerClasses = `relative rounded-full flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`;

  const avatarColors = [
    "linear-gradient(135deg,#a3e635,#16a34a)",
    "linear-gradient(135deg,#60a5fa,#3b82f6)",
    "linear-gradient(135deg,#f472b6,#ec4899)",
    "linear-gradient(135deg,#fb923c,#f97316)",
    "linear-gradient(135deg,#a78bfa,#8b5cf6)",
    "linear-gradient(135deg,#34d399,#10b981)",
    "linear-gradient(135deg,#fbbf24,#f59e0b)",
    "linear-gradient(135deg,#f87171,#ef4444)",
  ];

  const getAvatarStyle = (name: string) => {
    if (!name) return { background: avatarColors[0] };
    const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return { background: avatarColors[charCodeSum % avatarColors.length] };
  };

  const initials = username ? username.substring(0, 2).toUpperCase() : "??";
  const mainAvatarClasses = `relative z-10 w-full h-full rounded-full overflow-hidden border-2 border-background flex items-center justify-center shadow-inner ${!src ? 'text-white font-black' : 'bg-card'}`;
  const mainAvatarStyle = !src ? getAvatarStyle(username || "") : {};

  return (
    <div className={containerClasses}>
      {/* Neon Frame Effect */}
      {hasNeon && (
        <div className="absolute inset-[-5px] rounded-full z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg,#ff0000,#ff7300,#fffb00,#48ff00,#00ffd5,#002bff,#7a00ff,#ff00c8,#ff0000)] animate-[spin_3s_linear_infinite] blur-[2px]"></div>
          <div className="absolute inset-[3px] rounded-full bg-background z-10"></div>
          <div className="absolute inset-[-10px] rounded-full bg-[conic-gradient(from_0deg,#ff0000,#ff7300,#fffb00,#48ff00,#00ffd5,#002bff,#7a00ff,#ff00c8,#ff0000)] animate-[spin_3s_linear_infinite] blur-[15px] opacity-40"></div>
        </div>
      )}

      {/* Diamond Frame Effect */}
      {hasDiamond && (
        <div className="absolute inset-[-6px] rounded-full z-0 bg-gradient-to-br from-cyan-100 via-white to-blue-200 p-[3px] shadow-[0_0_20px_rgba(165,243,252,0.6)] animate-pulse overflow-hidden">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-[-100%] bg-gradient-to-r from-transparent via-white/80 to-transparent rotate-[35deg] animate-[shimmer_2s_infinite] -translate-x-[150%]"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 rounded-full mix-blend-overlay"></div>
            </div>
            <div className="absolute inset-[-5px] rounded-full border border-cyan-200/50 blur-[1px]"></div>
        </div>
      )}

      {/* Main Avatar Body */}
      <div 
        className={mainAvatarClasses}
        style={mainAvatarStyle}
      >
        {src ? (
          <img 
            src={src} 
            alt={username || "User"} 
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="select-none tracking-tighter">
            {initials}
          </span>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(150%) rotate(35deg); }
        }
      `}</style>

      {/* Role Badge */}
      {role === 'ADMIN' && (
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-rose-500 border-2 border-background rounded-full z-20 shadow-lg"></div>
      )}
    </div>
  );
}
