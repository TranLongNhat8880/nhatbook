import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Tránh hydration mismatch bằng cách chỉ render sau khi đã mount ở client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-10 h-10" />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm border border-gray-200 dark:border-gray-700 group focus:outline-none focus:ring-2 focus:ring-green-500/50"
      aria-label="Chuyển đổi giao diện"
    >
      <div className="relative w-5 h-5 overflow-hidden">
        {/* Sun Icon */}
        <div className={`absolute inset-0 transition-transform duration-500 transform ${isDark ? "translate-y-8 opacity-0" : "translate-y-0 opacity-100"}`}>
          <Sun className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
        </div>
        
        {/* Moon Icon */}
        <div className={`absolute inset-0 transition-transform duration-500 transform ${isDark ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"}`}>
          <Moon className="w-5 h-5 text-blue-400 fill-blue-400/20" />
        </div>
      </div>
    </button>
  );
}
