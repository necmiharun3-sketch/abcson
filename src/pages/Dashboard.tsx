import {
  Wallet,
  Package,
  Trophy,
  Settings,
  User,
  Bell,
  CreditCard,
  Shield,
  Star,
  TrendingUp,
  ArrowUpRight,
  Gift,
  History,
  ChevronRight,
  Store,
  ShoppingBag,
  Edit3,
  Camera,
  Award,
  Users,
  Heart,
  MessageSquare,
  FileText,
  HelpCircle,
  LogOut,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { db, storage } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user, profile, loading, logout } = useAuth();
  const [stats, setStats] = useState({
    activeListings: 0,
    soldOrders: 0,
    boughtOrders: 0,
    totalEarned: 0,
    totalSpent: 0,
    balance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [activeListings, setActiveListings] = useState<any[]>([]);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: "",
    bio: "",
    avatar: "",
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const uid = user.uid;

        const [activeSnap, soldSnap, boughtSnap, ordersSnap, listingsSnap] =
          await Promise.all([
            getDocs(
              query(
                collection(db, "products"),
                where("sellerId", "==", uid),
                where("status", "==", "active"),
              ),
            ),
            getDocs(
              query(
                collection(db, "orders"),
                where("sellerId", "==", uid),
                limit(50),
              ),
            ),
            getDocs(
              query(
                collection(db, "orders"),
                where("buyerId", "==", uid),
                limit(50),
              ),
            ),
            getDocs(
              query(
                collection(db, "orders"),
                where("buyerId", "==", uid),
                orderBy("createdAt", "desc"),
                limit(5),
              ),
            ),
            getDocs(
              query(
                collection(db, "products"),
                where("sellerId", "==", uid),
                where("status", "==", "active"),
                limit(6),
              ),
            ),
          ]);

        const soldOrders = soldSnap.docs.map((d) => d.data() as any);
        const boughtOrders = boughtSnap.docs.map((d) => d.data() as any);

        setStats({
          activeListings: activeSnap.size,
          soldOrders: soldSnap.size,
          boughtOrders: boughtSnap.size,
          totalEarned: soldOrders.reduce(
            (sum, o) => sum + Number(o.price || 0),
            0,
          ),
          totalSpent: boughtOrders.reduce(
            (sum, o) => sum + Number(o.price || 0),
            0,
          ),
          balance: Number(profile?.balance || 0),
        });

        setRecentOrders(
          ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        );
        setActiveListings(
          listingsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        );

        setProfileData({
          displayName: profile?.username || user.displayName || "",
          bio: profile?.bio || "",
          avatar: profile?.avatar || user.photoURL || "",
        });
      } catch (e) {
        console.error("Dashboard fetch failed:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, profile]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const avatarRef = ref(
        storage,
        `avatars/${user.uid}/${Date.now()}_${file.name}`,
      );
      await uploadBytes(avatarRef, file);
      const avatarUrl = await getDownloadURL(avatarRef);
      setProfileData((prev) => ({ ...prev, avatar: avatarUrl }));
      toast.success("Profil görseli yüklendi.");
    } catch {
      toast.error("Görsel yüklenemedi.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        username: profileData.displayName.trim(),
        bio: profileData.bio.trim(),
        avatar: profileData.avatar || "",
      });
      toast.success("Profil güncellendi!");
      setIsEditingProfile(false);
    } catch {
      toast.error("Profil güncellenemedi.");
    }
  };

  if (loading)
    return <div className="text-center py-20 text-white">Yükleniyor...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header with Profile */}
      <div className="bg-gradient-to-br from-[#111218] via-[#1a1b23] to-[#111218] rounded-2xl border border-white/5 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#059669] via-[#e91e63] to-[#f06292]" />

        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            {/* Profile Section */}
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#059669] to-[#10b981] p-0.5">
                  <div className="w-full h-full rounded-[14px] bg-[#111218] overflow-hidden flex items-center justify-center">
                    {profileData.avatar ? (
                      <img
                        src={profileData.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        {user.displayName?.charAt(0).toUpperCase() ||
                          user.email?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-r from-[#059669] to-[#10b981] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  {profileData.displayName || user.displayName || "Kullanıcı"}
                </h1>
                <p className="text-gray-400 text-sm mb-2">{user.email}</p>
                <div className="flex items-center gap-2">
                  {profile?.isVerifiedSeller && (
                    <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-medium">
                      <Shield className="w-3 h-3" />
                      Onaylı
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      profile?.storeLevel === "corporate"
                        ? "bg-purple-500/20 text-purple-400"
                        : profile?.storeLevel === "pro"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {profile?.storeLevel === "corporate"
                      ? "Kurumsal"
                      : profile?.storeLevel === "pro"
                        ? "Pro"
                        : "Standart"}
                  </span>
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-1 text-gray-400 hover:text-white text-xs transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    Düzenle
                  </button>
                </div>
              </div>
            </div>

            {/* Balance Card */}
            <div className="flex items-center gap-4">
              <div className="text-center px-6 py-4 bg-[#111218] rounded-xl border border-white/5">
                <p className="text-xs text-gray-400 mb-1">Bakiye</p>
                <p className="text-2xl font-bold price-text">
                  {stats.balance.toFixed(2)} ₺
                </p>
              </div>
              <button className="flex items-center gap-2 bg-gradient-to-r from-[#059669] to-[#10b981] hover:from-[#10b981] hover:to-[#34d399] text-white px-5 py-3 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20">
                <ArrowUpRight className="w-4 h-4" />
                Para Çek
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Aktif İlan",
            value: stats.activeListings,
            icon: Store,
            color: "text-blue-400",
            bg: "bg-blue-500/20",
          },
          {
            label: "Satış",
            value: stats.soldOrders,
            icon: Package,
            color: "text-emerald-400",
            bg: "bg-emerald-500/20",
          },
          {
            label: "Satın Alma",
            value: stats.boughtOrders,
            icon: ShoppingBag,
            color: "text-purple-400",
            bg: "bg-purple-500/20",
          },
          {
            label: "Puan",
            value: Math.floor(stats.totalEarned / 100 + stats.totalSpent / 100),
            icon: Trophy,
            color: "text-amber-400",
            bg: "bg-amber-500/20",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-[#1a1b23] rounded-xl border border-white/5 p-5 hover:border-white/10 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}
              >
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="text-sm text-gray-400">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions & Menu */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-5">
            <h3 className="font-bold text-white mb-4">Hızlı İşlemler</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/ilan-ekle"
                className="flex flex-col items-center gap-2 p-4 bg-[#111218] rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#059669]/20 to-[#10b981]/20 flex items-center justify-center group-hover:from-[#059669]/30 group-hover:to-[#10b981]/30 transition-colors">
                  <Package className="w-5 h-5 text-[#e91e63]" />
                </div>
                <span className="text-xs text-gray-300 text-center">
                  İlan Ekle
                </span>
              </Link>
              <Link
                to="/favorilerim"
                className="flex flex-col items-center gap-2 p-4 bg-[#111218] rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center group-hover:bg-pink-500/30 transition-colors">
                  <Heart className="w-5 h-5 text-pink-400" />
                </div>
                <span className="text-xs text-gray-300 text-center">
                  Favorilerim
                </span>
              </Link>
              <Link
                to="/mesajlarim"
                className="flex flex-col items-center gap-2 p-4 bg-[#111218] rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-xs text-gray-300 text-center">
                  Mesajlar
                </span>
              </Link>
              <Link
                to="/destek-sistemi"
                className="flex flex-col items-center gap-2 p-4 bg-[#111218] rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                  <HelpCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs text-gray-300 text-center">
                  Destek
                </span>
              </Link>
            </div>
          </div>

          {/* My Pages */}
          <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-5">
            <h3 className="font-bold text-white mb-4">Sayfalarım</h3>
            <div className="space-y-2">
              {[
                {
                  to: "/ilanlarim",
                  label: "İlanlarım",
                  icon: Store,
                  count: stats.activeListings,
                },
                {
                  to: "/siparislerim",
                  label: "Siparişlerim",
                  icon: ShoppingBag,
                  count: stats.boughtOrders,
                },
                {
                  to: "/sattigim-ilanlar",
                  label: "Sattıklarım",
                  icon: Package,
                  count: stats.soldOrders,
                },
                { to: "/bildirimler", label: "Bildirimler", icon: Bell },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#111218] hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300 group-hover:text-white">
                      {item.label}
                    </span>
                  </div>
                  {item.count !== undefined && (
                    <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                      {item.count}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Wallet Section */}
          <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-5">
            <h3 className="font-bold text-white mb-4">Cüzdan</h3>
            <div className="bg-gradient-to-r from-[#059669]/10 to-[#10b981]/10 border border-emerald-400/20 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-400 mb-1">Mevcut Bakiye</p>
              <p className="text-3xl font-bold price-text">
                {stats.balance.toFixed(2)} ₺
              </p>
            </div>
            <div className="space-y-2">
              <Link
                to="/bakiye-yukle"
                className="flex items-center justify-between p-3 rounded-lg bg-[#111218] hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-gray-300">Bakiye Yükle</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </Link>
              <Link
                to="/para-cek"
                className="flex items-center justify-between p-3 rounded-lg bg-[#111218] hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Para Çek</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </Link>
              <Link
                to="/destek-sistemi"
                className="flex items-center justify-between p-3 rounded-lg bg-[#111218] hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Gift className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Kupon Kullan</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </Link>
            </div>
          </div>
        </div>

        {/* Middle Column - Recent Orders & Active Listings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Toplam Kazanç</p>
                  <p className="text-xl font-bold text-white">
                    {stats.totalEarned.toFixed(2)} ₺
                  </p>
                </div>
              </div>
              <p className="text-sm text-emerald-400">
                {stats.soldOrders} başarılı satış
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Toplam Harcama</p>
                  <p className="text-xl font-bold text-white">
                    {stats.totalSpent.toFixed(2)} ₺
                  </p>
                </div>
              </div>
              <p className="text-sm text-purple-400">
                {stats.boughtOrders} başarılı alışveriş
              </p>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-[#1a1b23] rounded-xl border border-white/5 overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-bold text-white">Son Siparişler</h2>
              <Link
                to="/siparislerim"
                className="text-sm text-[#e91e63] hover:text-[#f06292]"
              >
                Tümünü Gör
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 border-2 border-emerald-400/30 border-t-[#e91e63] rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-400">Yükleniyor...</p>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Henüz sipariş yok</p>
                </div>
              ) : (
                recentOrders.map((order: any) => (
                  <Link
                    key={order.id}
                    to={`/siparis/${order.id}`}
                    className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[#111218] flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {order.productTitle || "Sipariş"}
                        </p>
                        <p className="text-sm text-gray-400">
                          {order.createdAt?.toDate
                            ? order.createdAt
                                .toDate()
                                .toLocaleDateString("tr-TR")
                            : "Yeni"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="price-text font-bold">
                        {Number(order.price || 0).toFixed(2)} ₺
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          order.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : order.status === "pending"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {order.status === "completed"
                          ? "Tamamlandı"
                          : order.status === "pending"
                            ? "Bekliyor"
                            : order.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Active Listings */}
          <div className="bg-[#1a1b23] rounded-xl border border-white/5 overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-bold text-white">Aktif İlanlarım</h2>
              <Link
                to="/ilan-ekle"
                className="text-sm bg-gradient-to-r from-[#059669] to-[#10b981] text-white px-3 py-1.5 rounded-lg hover:from-[#10b981] hover:to-[#34d399] transition-all"
              >
                + Yeni İlan
              </Link>
            </div>
            <div className="p-5">
              {activeListings.length === 0 ? (
                <div className="text-center py-8">
                  <Store className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-3">Henüz ilan yok</p>
                  <Link
                    to="/ilan-ekle"
                    className="text-sm text-[#e91e63] hover:text-[#f06292]"
                  >
                    İlk ilanını ekle
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeListings.map((listing: any) => (
                    <Link
                      key={listing.id}
                      to={`/product/${listing.id}`}
                      className="bg-[#111218] rounded-xl border border-white/5 overflow-hidden hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] hover:scale-105 transition-all duration-300 group"
                    >
                      <div className="relative h-32">
                        {listing.image ? (
                          <img
                            src={listing.image}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#23242f] to-[#111218] flex items-center justify-center text-gray-500 text-sm">
                            Görsel Yok
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-white font-medium text-sm mb-2 line-clamp-1 group-hover:text-[#e91e63] transition-colors">
                          {listing.title}
                        </h3>
                        <p className="price-text font-bold">
                          {Number(listing.price || 0).toFixed(2)} ₺
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Settings & Other Links */}
          <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-5">
            <h3 className="font-bold text-white mb-4">Ayarlar & Diğer</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { to: "/profile", label: "Profil", icon: User },
                { to: "/bildirimler", label: "Bildirimler", icon: Bell },
                { to: "/destek-sistemi", label: "Destek", icon: Shield },
                { to: "/favorilerim", label: "Favoriler", icon: Star },
                { to: "/mesajlarim", label: "Mesajlar", icon: MessageSquare },
                { to: "/hakkimizda", label: "Hakkımızda", icon: FileText },
                { to: "/sss", label: "SSS", icon: HelpCircle },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2 p-3 rounded-lg bg-[#111218] hover:bg-white/5 transition-colors"
                >
                  <item.icon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">{item.label}</span>
                </Link>
              ))}
              <button
                onClick={logout}
                className="flex items-center gap-2 p-3 rounded-lg bg-[#111218] hover:bg-white/5 transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Çıkış</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1b23] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white">Profili Düzenle</h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-6 h-6 rotate-90" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer">
                  {profileData.avatar ? (
                    <img
                      src={profileData.avatar}
                      alt="Avatar"
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-white/10 group-hover:opacity-50 transition-opacity"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl border-2 border-white/10 bg-[#111218] flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-2xl">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400">
                  {uploadingAvatar
                    ? "Yükleniyor..."
                    : "Fotoğrafı değiştirmek için tıklayın"}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Görünen Ad
                </label>
                <input
                  type="text"
                  value={profileData.displayName}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      displayName: e.target.value,
                    })
                  }
                  className="w-full bg-[#111218] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Hakkımda
                </label>
                <textarea
                  rows={3}
                  value={profileData.bio}
                  onChange={(e) =>
                    setProfileData({ ...profileData, bio: e.target.value })
                  }
                  className="w-full bg-[#111218] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-400 transition-colors resize-none"
                  placeholder="Kendinizden bahsedin..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#059669] to-[#10b981] hover:from-[#10b981] hover:to-[#34d399] text-white font-bold py-3 rounded-lg transition-all"
              >
                Değişiklikleri Kaydet
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
