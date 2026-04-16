import { Search, User, LogOut, ShoppingCart, Plus, Bell, MessageSquare, ChevronDown, Menu, X, Wallet, Package, Tag, Star, LifeBuoy, ShieldCheck, PlusCircle } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import toast from 'react-hot-toast';

export default function Header() {
  const { user, profile } = useAuth();
  const { cartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isCreateListingActive = location.pathname === '/ilan-ekle';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/ilan-pazari?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleAction = (path: string, state?: any) => {
    navigate(path, { state });
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Çıkış yapıldı.');
      setIsDropdownOpen(false);
    } catch (error) {
      toast.error('Çıkış yapılırken bir hata oluştu.');
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-[#111218] border-b border-white/5 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-white/70 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="flex items-center gap-1 group">
              <div className="text-white font-black text-2xl sm:text-3xl tracking-tighter px-2 py-1">
                item<span className="text-blue-500">TR</span>
              </div>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-3xl mx-4 lg:mx-8 hidden md:block">
            <form onSubmit={handleSearch} className="relative flex items-center w-full bg-white rounded-md overflow-hidden h-11">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 pl-4 pr-4 py-2 bg-transparent text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
                placeholder="Oyun, İlan, Satıcı veya Kategori ara"
              />
              <div className="flex items-center h-full">
                <button type="submit" className="px-4 h-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors border-l border-gray-200">
                  <Search className="h-5 w-5" />
                </button>
                <button type="button" className="px-4 h-full flex items-center justify-center bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-colors border-l border-gray-200">
                  DETAYLI ARAMA
                </button>
              </div>
            </form>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <Link
                  to="/ilan-ekle"
                  className={`hidden sm:flex items-center gap-1.5 text-white px-4 py-2.5 rounded-md text-sm font-bold transition-colors ${
                    isCreateListingActive
                      ? 'bg-blue-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden md:inline">İLAN EKLE</span>
                </Link>
                
                <Link to="/sepet" className="relative p-2 text-white/70 hover:text-white transition-colors">
                  <ShoppingCart className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#111218]">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <Link to="/mesajlarim" className="hidden sm:block relative p-2 text-white/70 hover:text-white transition-colors">
                  <MessageSquare className="w-6 h-6" />
                </Link>

                <Link to="/bildirimler" className="relative p-2 text-white/70 hover:text-white transition-colors">
                  <Bell className="w-6 h-6" />
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 hover:bg-white/5 p-1.5 rounded-lg transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-white/50 transition-transform hidden sm:block ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1d2e] rounded-xl border border-white/10 shadow-xl overflow-hidden">
                      <div className="p-3 border-b border-white/5">
                        <div className="text-white font-semibold text-sm truncate">{profile?.username || user.displayName || 'Kullanıcı'}</div>
                        <div className="text-white/50 text-xs truncate">{user.email}</div>
                      </div>
                      
                      <div className="p-2">
                        <button onClick={() => handleAction('/kontrol-merkezi', { activeView: 'balance' })} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-white transition-colors text-sm">
                          <PlusCircle className="w-4 h-4" /> Bakiye Yükle
                        </button>
                        <button onClick={() => handleAction('/kontrol-merkezi', { activeView: 'security' })} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-emerald-400 transition-colors text-sm">
                          <ShieldCheck className="w-4 h-4" /> Güvenli Hesap
                        </button>
                      </div>

                      <div className="p-2 border-t border-white/5">
                        <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-white transition-colors text-sm">
                          <User className="w-4 h-4" /> Profilim
                        </Link>
                        <Link to="/kontrol-merkezi" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-white transition-colors text-sm">
                          <Wallet className="w-4 h-4" /> Kontrol Merkezi
                        </Link>
                        <Link to="/siparislerim" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-white transition-colors text-sm">
                          <ShoppingCart className="w-4 h-4" /> Siparişlerim
                        </Link>
                        <Link to="/ilanlarim" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-white transition-colors text-sm">
                          <Tag className="w-4 h-4" /> İlanlarım
                        </Link>
                        <Link to="/trade/offers" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-white transition-colors text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                          Takas Teklifleri
                        </Link>
                        <Link to="/favorilerim" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-white transition-colors text-sm">
                          <Star className="w-4 h-4" /> Favorilerim
                        </Link>
                        <Link to="/destek-sistemi" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-white transition-colors text-sm">
                          <LifeBuoy className="w-4 h-4" /> Destek
                        </Link>
                      </div>

                      <div className="p-2 border-t border-white/5">
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors text-sm">
                          <LogOut className="w-4 h-4" /> Çıkış Yap
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="flex items-center gap-2 px-4 py-2 text-white border border-white/20 hover:bg-white/5 rounded-md text-sm font-bold transition-colors">
                  GİRİŞ YAP
                </Link>
                <Link to="/register" className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors">
                  KAYIT OL
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 py-3">
            <nav className="flex flex-col gap-1">
              <Link to="/ilan-pazari" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-white text-sm">İlan Pazarı</Link>
              <Link to="/magazalar" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-white text-sm">Mağazalar</Link>
              <Link to="/cd-key" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-white text-sm">CD Key</Link>
              <Link to="/roblox" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-white text-sm">Roblox</Link>
              <Link to="/destek-sistemi" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-white text-sm">Destek</Link>
              {user && (
                <Link
                  to="/ilan-ekle"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold mt-2 ${
                    isCreateListingActive
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-600/20 text-purple-400'
                  }`}
                >
                  <Plus className="w-4 h-4" /> İlan Ekle
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
