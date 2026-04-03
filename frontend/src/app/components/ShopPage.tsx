import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
  Coins, 
  ShoppingBag, 
  ShieldCheck, 
  UserPlus, 
  Palette, 
  ChevronRight, 
  CheckCircle2, 
  Calendar,
  AlertCircle,
  LayoutGrid,
  Zap,
  Gem,
  ArrowLeft,
  X,
  Star,
  Heart,
  BookOpen
} from "lucide-react";
import { API_ENDPOINTS } from "../api.config";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'avatar_frame' | 'upgrade' | 'comment_style' | 'badge';
  icon: any;
  color: 'blue' | 'green' | 'rose' | 'amber' | 'purple' | 'pink';
}

const colorClasses = {
  blue: { bgPastel: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-500' },
  green: { bgPastel: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-500' },
  rose: { bgPastel: 'bg-rose-50 dark:bg-rose-950/20', text: 'text-rose-500' },
  amber: { bgPastel: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-500' },
  purple: { bgPastel: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-500' },
  pink: { bgPastel: 'bg-pink-50 dark:bg-pink-950/20', text: 'text-pink-500' }
};

export function ShopPage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(0);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [showConfirm, setShowConfirm] = useState<ShopItem | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'upgrade' | 'frame'>('all');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const shopItems: ShopItem[] = [
    { 
      id: 'member_upgrade', 
      name: 'Thẻ nâng cấp MEMBER', 
      description: 'Tự động nâng cấp tài khoản USER thành MEMBER. Mở khóa các đặc quyền viết bài.', 
      price: 350, 
      type: 'upgrade',
      icon: UserPlus,
      color: 'blue'
    },
    { 
      id: 'neon_frame', 
      name: 'Khung Avatar Neon', 
      description: 'Hiệu ứng đèn Led RGB chạy vòng quanh Avatar cực cháy.', 
      price: 500, 
      type: 'avatar_frame',
      icon: Zap,
      color: 'green'
    },
    { 
      id: 'diamond_frame', 
      name: 'Khung Kim cương', 
      description: 'Hiệu ứng lấp lánh sang chảnh dành cho các tổng tài.', 
      price: 1000, 
      type: 'avatar_frame',
      icon: Gem,
      color: 'rose'
    },
    { 
      id: 'gold_comment', 
      name: 'Gói Chữ Vàng', 
      description: 'Comment nằm trong khung Gold và chữ màu vàng đậm nổi bật.', 
      price: 200, 
      type: 'comment_style',
      icon: Palette,
      color: 'amber'
    },
    { 
      id: 'author_badge', 
      name: 'Huy hiệu Tác giả', 
      description: 'Huy hiệu đặc biệt hiển thị bên cạnh tên trong mọi bài viết.', 
      price: 300, 
      type: 'badge',
      icon: Star,
      color: 'purple'
    },
    { 
      id: 'spring_frame', 
      name: 'Khung Avatar Xuân', 
      description: 'Khung avatar theo mùa với hoa anh đào nở rộ lãng mạn.', 
      price: 150, 
      type: 'avatar_frame',
      icon: Heart,
      color: 'pink'
    },
  ];

  useEffect(() => {
    fetchUserData();
    const storedUser = localStorage.getItem("user");
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      const walletRes = await fetch("/api/users/wallet", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const walletData = await walletRes.json();
      if (walletRes.ok) {
        setBalance(walletData.balance);
      }
      
      const invRes = await fetch("/api/shop/inventory", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const invData = await invRes.json();
      if (invRes.ok) {
        setInventory(invData.inventory);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error("Lỗi fetch shop data:", err);
      setIsLoading(false);
    }
  };

  const handleBuy = async (item: ShopItem) => {
    if (balance < item.price) {
      setMessage({ text: "Bạn không đủ NhatCoin rồi!", type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ itemId: item.id })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ text: data.message, type: 'success' });
        setBalance(prev => prev - item.price);
        setInventory(prev => [...prev, { item_id: item.id, item_type: item.type, is_equipped: false }]);

        if (item.id === 'member_upgrade') {
             const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
             storedUser.role = 'MEMBER';
             localStorage.setItem("user", JSON.stringify(storedUser));
        }
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: "Lỗi giao dịch", type: 'error' });
    }
    
    setShowConfirm(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleEquip = async (itemId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/shop/equip", {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ itemId })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ text: data.message, type: 'success' });
        const itemType = shopItems.find(i => i.id === itemId)?.type;
        setInventory(prev => prev.map(inv => {
          if (itemType === 'avatar_frame' && inv.item_type === 'avatar_frame') {
            return { ...inv, is_equipped: inv.item_id === itemId ? data.is_equipped : false };
          }
           if (inv.item_id === itemId) {
            return { ...inv, is_equipped: data.is_equipped };
          }
          return inv;
        }));
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: "Lỗi kết nối", type: 'error' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#f0f9f4] flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full"></div>
    </div>
  );
  return (
    <div className="min-h-screen bg-[#f0f9f4] dark:bg-background pb-20 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 pt-10">
        
        {/* Page Title & Balance Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
           <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-2xl shadow-xl shadow-green-500/20">
                 <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                 <h1 className="text-3xl font-black text-[#15803d] dark:text-foreground">Cửa hàng vật phẩm</h1>
                 <p className="text-sm text-muted-foreground font-medium">Vật phẩm vĩnh viễn · Cập nhật hàng tuần</p>
              </div>
           </div>

           {/* Stylized Balance Badge (Right side) */}
           <div className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl bg-white dark:bg-card border border-border shadow-sm flex-shrink-0 self-start md:self-auto">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${balance < 0 ? 'bg-rose-500 shadow-rose-500/30' : 'bg-amber-500 shadow-amber-500/30'}`}>
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-muted-foreground uppercase leading-none">{balance < 0 ? 'Còn nợ' : 'Số dư NhatCoin'}</span>
                 <span className={`text-lg font-black ${balance < 0 ? 'text-rose-600' : 'text-amber-800 dark:text-amber-400'} tracking-tighter`}>
                    {balance < 0 ? `-${Math.abs(balance).toLocaleString()}` : balance.toLocaleString()} NC
                 </span>
              </div>
           </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-8 py-3 rounded-full font-bold text-sm transition-all ${
              activeTab === 'all' 
              ? 'bg-[#84cc16] text-white shadow-lg shadow-lime-500/30' 
              : 'bg-white dark:bg-card border border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            Tất cả
          </button>
          <button 
            onClick={() => setActiveTab('upgrade')}
            className={`px-8 py-3 rounded-full font-bold text-sm transition-all ${
              activeTab === 'upgrade' 
              ? 'bg-[#84cc16] text-white shadow-lg shadow-lime-500/30' 
              : 'bg-white dark:bg-card border border-border text-muted-foreground hover:bg-muted'
            }`}
          >
             Nâng cấp
          </button>
          <button 
            onClick={() => setActiveTab('frame')}
            className={`px-8 py-3 rounded-full font-bold text-sm transition-all ${
              activeTab === 'frame' 
              ? 'bg-[#84cc16] text-white shadow-lg shadow-lime-500/30' 
              : 'bg-white dark:bg-card border border-border text-muted-foreground hover:bg-muted'
            }`}
          >
             Khung Avatar
          </button>
        </div>

        {/* Floating Message Toast */}
        {message && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 animate-in slide-in-from-top-10 duration-500 ease-out">
            <div className={`p-4 rounded-[1.5rem] shadow-2xl flex items-center gap-3 border backdrop-blur-md ${
              message.type === 'success' 
              ? 'bg-emerald-500/95 text-white border-emerald-400' 
              : 'bg-rose-500/95 text-white border-rose-400'
            }`}>
              <div className="p-2 bg-white/20 rounded-xl">
                 <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-black italic">{message.text}</span>
            </div>
          </div>
        )}

        {/* Items Grid (3 columns desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {shopItems
            .filter(item => {
              if (item.id === 'member_upgrade' && currentUser?.role === 'ADMIN') return false;
              if (activeTab === 'all') return true;
              if (activeTab === 'upgrade') return item.type === 'upgrade';
              if (activeTab === 'frame') return item.type === 'avatar_frame' || item.type === 'comment_style';
              return true;
            })
            .map((item) => (
            <div key={item.id} className="group relative bg-white dark:bg-card rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-transparent hover:border-green-100 dark:hover:border-green-900/30">
              
              {/* Card Header (Icon & Price) */}
              <div className="flex items-start justify-between mb-8">
                <div className={`w-16 h-16 rounded-2xl ${colorClasses[item.color].bgPastel} ${colorClasses[item.color].text} flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
                   <item.icon className="w-8 h-8" />
                </div>
                
                <div className={`flex items-center gap-1.5 px-4 py-2 rounded-full border ${
                  balance < 0 ? 'bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30' : 'bg-[#fef3c7] dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30'
                }`}>
                   <div className={`w-5 h-5 rounded-full flex items-center justify-center ${balance < 0 ? 'bg-rose-500' : 'bg-amber-400'}`}>
                     <Coins className="w-3 h-3 text-white" />
                   </div>
                   <span className={`text-sm font-black ${balance < 0 ? 'text-rose-600' : 'text-amber-800 dark:text-amber-400'}`}>
                      {item.price}
                   </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="mb-10 text-left">
                <h3 className="text-xl font-black text-[#1f2937] dark:text-foreground mb-3">{item.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium line-clamp-2">
                  {item.description}
                </p>
              </div>
              
              {/* Card Action Button (Gradient Green Pill) */}
              {inventory.find(i => i.item_id === item.id) ? (
                 <button 
                  onClick={() => handleEquip(item.id)}
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                    inventory.find(i => i.item_id === item.id)?.is_equipped
                    ? 'bg-gradient-to-r from-green-500 to-green-700 text-white shadow-xl shadow-green-500/30'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {inventory.find(i => i.item_id === item.id)?.is_equipped ? (
                    <> <CheckCircle2 className="w-4 h-4" /> ĐANG SỬ DỤNG </>
                  ) : (
                    "SỬ DỤNG"
                  )}
                </button>
              ) : (
                <button 
                  onClick={() => setShowConfirm(item)}
                  className="w-full py-4 bg-gradient-to-r from-[#84cc16] to-[#22c55e] text-white rounded-2xl font-black text-sm transition-all shadow-lg hover:shadow-xl hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 group/btn"
                >
                  SỞ HỮU NGAY <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Small Footer / Maintenance */}
        <div className="mt-20 pt-10 border-t border-green-100 dark:border-green-900/30 flex flex-col items-center opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-700">
           <ShoppingBag className="w-10 h-10 mb-2 text-[#15803d]" />
           <p className="text-[10px] font-black uppercase tracking-widest text-[#15803d]">Managed by nhatbook store</p>
        </div>
      </div>

      {/* Confirmation Modal (Matches Style) */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowConfirm(null)}></div>
          <div className="relative bg-white dark:bg-card w-full max-w-sm rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-3xl ${colorClasses[showConfirm.color].bgPastel} ${colorClasses[showConfirm.color].text} mb-8 flex items-center justify-center`}>
              <showConfirm.icon className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black mb-2 text-[#1f2937] dark:text-foreground italic">Xác nhận đơn hàng</h3>
            <p className="text-sm text-muted-foreground mb-10 leading-relaxed">Bạn sẽ tiêu tốn <span className="font-black text-green-600">{showConfirm.price} NC</span> để sở hữu vĩnh viễn <span className="font-bold text-[#1f2937] dark:text-foreground">{showConfirm.name}</span>.</p>
            
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={() => handleBuy(showConfirm)}
                className="py-4 bg-gradient-to-r from-[#84cc16] to-[#22c55e] text-white rounded-2xl font-black text-lg shadow-xl hover:opacity-90 transition-all active:scale-95"
              >
                CHỐT ĐƠN!
              </button>
              <button 
                onClick={() => setShowConfirm(null)}
                className="py-4 text-muted-foreground font-bold hover:text-foreground transition-all"
              >
                Để xem lại...
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
