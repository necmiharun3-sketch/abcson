import { LayoutGrid, Store, ShoppingBag, Gift, Building2, Key, CreditCard, CreditCard as GiftCard, Users, Megaphone, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AllCategoriesSection from './AllCategoriesSection';

export default function Navbar() {
  const location = useLocation();
  const { profile } = useAuth();
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isCategoriesPinned, setIsCategoriesPinned] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const isStaff = profile?.role === 'admin' || profile?.role === 'moderator';

  const navItems = [
    { name: 'Kategoriler', icon: LayoutGrid, hasDropdown: true, path: '/' },
    { name: 'İlan Pazarı', icon: Store, path: '/ilan-pazari' },
    { name: 'Alım İlanları', icon: ShoppingBag, path: '/alim-ilanlari' },
    { name: 'Çekilişler', icon: Gift, color: 'text-yellow-500', path: '/cekilisler' },
    { name: 'Mağazalar', icon: Building2, path: '/magazalar' },
    { name: 'CD-Key', icon: Key, path: '/cd-key' },
    { name: 'Top Up', icon: CreditCard, path: '/top-up' },
    { name: 'Hediye Kartları', icon: GiftCard, path: '/hediye-kartlari' },
    { name: 'Topluluk', icon: Users, path: '/topluluk' },
    { name: 'Server Tanıtımı', icon: Megaphone, color: 'text-yellow-500', path: '/server-tanitimi' },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false);
        setIsCategoriesPinned(false);
      }
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsCategoriesOpen(false);
        setIsCategoriesPinned(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  return (
    <nav ref={navRef} className="bg-[#1a1b23] border-b border-white/5 relative z-40">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <ul className="flex items-center gap-6 overflow-x-auto scrollbar-hide w-full">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isCategoriesItem = item.hasDropdown;
              return (
                <li
                  key={item.name}
                  className="relative h-full flex items-center"
                  onMouseEnter={() => isCategoriesItem && setIsCategoriesOpen(true)}
                  onMouseLeave={() => {
                    if (isCategoriesItem && !isCategoriesPinned) setIsCategoriesOpen(false);
                  }}
                >
                  <Link
                    to={item.path}
                    onClick={(e) => {
                      if (isCategoriesItem) {
                        e.preventDefault();
                        if (isCategoriesPinned || isCategoriesOpen) {
                          setIsCategoriesPinned(false);
                          setIsCategoriesOpen(false);
                          return;
                        }
                        setIsCategoriesPinned(true);
                        setIsCategoriesOpen(true);
                      }
                    }}
                    className={`flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide transition-all duration-300 whitespace-nowrap group h-full px-2 ${
                      item.color 
                        ? `${item.color} hover:text-white` 
                        : isActive 
                          ? 'text-white border-b-2 border-blue-500' 
                          : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {item.name}
                    {item.hasDropdown && <ChevronDown className="w-4 h-4 ml-1" />}
                  </Link>
                </li>
              );
            })}
          </ul>
          
          <div className="flex items-center gap-2 shrink-0 ml-4">
            {isStaff && (
              <Link
                to="/admin"
                className="flex items-center gap-2 bg-[#1f2937] hover:bg-[#374151] text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border border-white/10"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      {isCategoriesOpen && (
        <div
          className="absolute top-full left-0 right-0 px-4 sm:px-6 lg:px-8 pt-2"
          onMouseEnter={() => setIsCategoriesOpen(true)}
          onMouseLeave={() => {
            if (!isCategoriesPinned) setIsCategoriesOpen(false);
          }}
        >
          <div
            className="w-full"
            onClick={() => {
              setIsCategoriesOpen(false);
              setIsCategoriesPinned(false);
            }}
          >
            <AllCategoriesSection />
          </div>
        </div>
      )}
    </nav>
  );
}
