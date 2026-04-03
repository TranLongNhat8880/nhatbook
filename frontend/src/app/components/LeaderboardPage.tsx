import { useState, useEffect } from "react";
import { BookOpen, Trophy, Flame, Star, Medal, TrendingUp, Crown, Award, Coins } from "lucide-react";
import { UserAvatar } from "./ui/UserAvatar";
import { API_ENDPOINTS } from "../api.config";

type Period = "week" | "month" | "all";

interface LeaderboardUser {
  id: string;
  username: string;
  avatar_url: string;
  balance: string;
  role: string;
  post_count: string;
  equipped_items: any[];
}

interface Stats {
  totalMembers: number;
  monthlyPosts: number;
}

const periodLabels: Record<Period, string> = {
  week: "Tuần này",
  month: "Tháng này",
  all: "Tổng thể",
};

const rankMeta = [
  {
    ring: "linear-gradient(135deg,#fbbf24,#f59e0b)",
    glow: "rgba(251,191,36,0.35)",
    podiumH: "h-32 md:h-40",
    label: "🥇",
    crown: true,
  },
  {
    ring: "linear-gradient(135deg,#94a3b8,#cbd5e1)",
    glow: "rgba(148,163,184,0.3)",
    podiumH: "h-24 md:h-28",
    label: "🥈",
    crown: false,
  },
  {
    ring: "linear-gradient(135deg,#fb923c,#ea580c)",
    glow: "rgba(251,146,60,0.3)",
    podiumH: "h-20 md:h-24",
    label: "🥉",
    crown: false,
  },
];

function ChangeChip() {
  // Mặc định là 'same' vì hiện tại hệ thống chưa trả về lịch sử thay đổi thứ hạng
  return (
    <span className="text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-emerald-900/30 text-slate-400 dark:text-emerald-500/50 font-black tracking-widest">
      —
    </span>
  );
}

export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [stats, setStats] = useState<Stats>({ totalMembers: 0, monthlyPosts: 0 });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("all");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.GET_LEADERBOARD);
      const data = await res.json();
      if (res.ok) {
        setLeaderboard(data.leaderboard);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Lỗi fetch leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0fdf4] dark:bg-[#061a12]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  // Podium order: 2nd, 1st, 3rd
  const top3 = [leaderboard[1], leaderboard[0], leaderboard[2]];
  const podiumMeta = [rankMeta[1], rankMeta[0], rankMeta[2]];
  const rest = leaderboard.slice(3);

  return (
    <div
      className="min-h-screen transition-colors duration-500 bg-gradient-to-br from-[#f0fdf4] via-[#dcfce7] to-[#f9fafb] dark:from-[#061a12] dark:via-[#082a1d] dark:to-[#0a1a12]"
    >
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 bg-white/60 dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 transition-all"
          >
            <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            Bảng xếp hạng nhatbook
          </div>
          <h1 className="text-gray-900 dark:text-emerald-50 mb-2 leading-none tracking-tighter" style={{ fontSize: "2.8rem", fontWeight: 900 }}>
            Top đại gia NC nổi bật
          </h1>
          <p className="text-emerald-800/40 dark:text-emerald-400/60 text-sm font-bold italic lowercase">Những cây bút xuất sắc nhất cộng đồng</p>
        </div>

        {/* Period Tabs */}
        <div className="flex justify-center mb-10">
          <div className="flex gap-1.5 bg-white dark:bg-emerald-950/60 rounded-2xl p-1.5 shadow-sm border border-gray-100 dark:border-emerald-900/40 backdrop-blur-md">
            {(Object.keys(periodLabels) as Period[]).map((p) => (
              <button
                key={p}
                className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${p !== 'all' ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                style={
                  p === 'all'
                    ? {
                      background: "linear-gradient(135deg,#a3e635,#16a34a)",
                      color: "white",
                      boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
                    }
                    : { color: "#6b7280" }
                }
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>

        {/* ── Podium ── */}
        <div
          className="rounded-[3rem] p-8 md:p-12 mb-8 relative overflow-hidden shadow-2xl border border-white/20 dark:border-emerald-800/40"
          style={{
            background: "linear-gradient(160deg,#16a34a 0%,#15803d 40%,#166534 100%)",
          }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

          <p className="text-center text-[11px] mb-10 tracking-[0.8em] font-black uppercase text-white/80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] relative z-10">
            Bục danh vọng
          </p>

          {/* Podium avatars */}
          <div className="flex items-end justify-center gap-4 md:gap-14 mb-0 relative z-10">
            {top3.map((user, i) => {
              if (!user) return <div key={i} className="flex-1 invisible" />;
              const meta = podiumMeta[i];
              const realRank = i === 0 ? 2 : i === 1 ? 1 : 3;
              const isWinner = realRank === 1;

              return (
                <div key={user.id} className="flex flex-col items-center gap-3 transition-transform duration-500" style={{ transform: isWinner ? "scale(1.1) translateY(-10px)" : undefined }}>

                  <span className="text-3xl drop-shadow-lg mb-2">{meta.label}</span>

                  <div className="relative">
                    {meta.crown && (
                      <Crown className="absolute -top-12 left-1/2 -translate-x-1/2 w-8 h-8 text-amber-400 fill-amber-400 filter drop-shadow-[0_0_10px_#fbbf24] animate-bounce" />
                    )}

                    {/* UserAvatar Integration for Frames/Items */}
                    <div
                      className="rounded-full p-1 cursor-pointer hover:scale-[1.05] transition-transform"
                      style={{ background: meta.ring, boxShadow: `0 0 20px ${meta.glow}` }}
                      onClick={() => { window.location.href = `/user/${user.id}`; }}
                    >
                      <UserAvatar
                        src={user.avatar_url}
                        username={user.username}
                        role={user.role}
                        equippedItems={user.equipped_items}
                        size={isWinner ? '2xl' : 'xl'}
                        className="ring-4 ring-white shadow-xl"
                      />
                    </div>
                  </div>

                  <div className="text-center max-w-[120px]">
                    <p className="text-white text-sm md:text-lg font-black uppercase tracking-tighter truncate">{user.username}</p>
                    <p className="text-[9px] font-bold lowercase opacity-40 text-white italic">@{user.username.replace(/\s/g, "").toLowerCase()}</p>
                    {/* NhatCoin Badge Styling */}
                    <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-amber-400 dark:bg-amber-500 shadow-[0_4px_12px_rgba(251,191,36,0.3)] border border-amber-300">
                      <Coins className="w-3 h-3 text-amber-900" />
                      <span className="text-amber-950 text-[11px] font-black tracking-tight">{Number(user.balance).toLocaleString()} NC</span>
                    </div>
                  </div>

                  {/* Podium block */}
                  <div
                    className={`w-28 md:w-36 ${meta.podiumH} rounded-t-[2.5rem] flex items-center justify-center shadow-inner transition-all duration-1000`}
                    style={{
                      background: meta.ring,
                      opacity: 0.9,
                    }}
                  >
                    <span className="text-white text-5xl font-black opacity-20">
                      {realRank}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { icon: <Star className="w-6 h-6" />, label: "Tổng thành viên", value: stats.totalMembers.toLocaleString(), bg: "bg-[#fff9e6] dark:bg-amber-950/20", border: "border-amber-100 dark:border-amber-900/40", color: "text-amber-600 dark:text-amber-400" },
            { icon: <TrendingUp className="w-6 h-6" />, label: "Bài viết tháng này", value: stats.monthlyPosts.toLocaleString(), bg: "bg-[#f0fdf4] dark:bg-emerald-950/20", border: "border-emerald-100 dark:border-emerald-900/40", color: "text-emerald-600 dark:text-emerald-400" },
            { icon: <Award className="w-6 h-6" />, label: "Điểm cao nhất", value: leaderboard[0] ? Number(leaderboard[0].balance).toLocaleString() : '0', bg: "bg-[#f5f3ff] dark:bg-purple-950/20", border: "border-purple-100 dark:border-purple-900/40", color: "text-purple-600 dark:text-purple-400" },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-[3rem] p-8 text-center flex flex-col items-center group hover:scale-[1.02] transition-all border ${s.bg} ${s.border} shadow-sm`}
            >
              <div className="p-4 rounded-2xl bg-white dark:bg-black/20 shadow-sm border border-black/5 mb-4 group-hover:rotate-6 transition-transform">
                <div className={s.color}>{s.icon}</div>
              </div>
              <p className="text-3xl font-black tracking-tighter dark:text-white mb-1">{s.value}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 dark:opacity-20">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Rank list 4–10 ── */}
        <div className="bg-white/80 dark:bg-emerald-950/40 backdrop-blur-xl rounded-[3.5rem] shadow-2xl border border-white dark:border-emerald-900/30 overflow-hidden">
          <div className="px-10 py-8 border-b border-gray-100 dark:border-emerald-900/30 flex items-center justify-between bg-emerald-50/20 dark:bg-black/20">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-emerald-500" />
              <h2 className="text-emerald-950 dark:text-emerald-100 text-xl font-black tracking-tighter uppercase">Thứ hạng 4 – 10</h2>
            </div>
            <div className="text-[9px] font-black text-emerald-900/20 uppercase tracking-[0.5em]">NhatBook Billionaire Club</div>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-emerald-900/20">
            {rest.map((user, i) => {
              const rank = i + 4;
              return (
                <div
                  key={user.id}
                  className="px-8 md:px-10 py-6 flex items-center justify-between hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all group"
                >
                  <div className="flex items-center gap-6">
                    {/* Rank */}
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700 transition-all transform group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white"
                    >
                      #{rank}
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="cursor-pointer hover:ring-2 ring-emerald-500 rounded-full transition-all" onClick={() => { window.location.href = `/user/${user.id}`; }}>
                        <UserAvatar
                          src={user.avatar_url}
                          username={user.username}
                          role={user.role}
                          equippedItems={user.equipped_items}
                          size="md"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="cursor-pointer text-base font-black text-emerald-950 dark:text-emerald-100 uppercase tracking-tighter hover:text-emerald-600 transition-colors" onClick={() => { window.location.href = `/user/${user.id}`; }}>
                          {user.username}
                        </h4>
                        <p className="text-[10px] font-bold italic tracking-wide lowercase opacity-30 mt-1">
                          @{user.username.replace(/\s/g, "").toLowerCase()} • {user.post_count} bài tháng này
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Points + change */}
                  <div className="text-right flex items-center gap-6">
                    <div className="hidden md:block">
                      <ChangeChip />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/30 shadow-sm">
                        <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm md:text-base font-black text-amber-700 dark:text-amber-400 tracking-tighter">
                          {Number(user.balance).toLocaleString()} NC
                        </span>
                      </div>
                      <span className="text-[9px] font-black text-emerald-950/20 dark:text-emerald-500/20 uppercase tracking-[0.2em] pr-2">Số dư hiện tại</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {rest.length === 0 && (
              <div className="py-24 text-center text-emerald-900/10 font-black tracking-[0.5em] italic">ĐANG CẬP NHẬT...</div>
            )}
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center mt-12 space-y-3 pb-6">
          <div className="flex justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-75" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-150" />
          </div>
          <p className="text-[10px] font-black text-emerald-900/20 uppercase tracking-[1em]">
            NhatBook Leaderboard · Pixel Refined v1.3
          </p>
        </div>
      </div>
    </div>
  );
}