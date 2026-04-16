import { Sparkles, ChevronRight, LifeBuoy, FileText, Phone, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../hooks/useSiteSettings';

export default function TopBar() {
  const settings = useSiteSettings();
  const slogan = settings.topBarMessage || 'Güvenli al, hızlı teslim al, kazançlı sat — dijital pazarda itemTR ile öne çık.';
  
  // Rotating featured products like itemTR
  const featuredProducts = [
    { name: 'Roblox Robux', description: 'Sınırsız Eğlence, En Uygun Fiyatlı Robux', path: '/roblox' },
    { name: 'Valorant VP', description: 'Hızlı Teslimat, Güvenli Alışveriş', path: '/ilan-pazari?q=Valorant' },
    { name: 'PUBG Mobile UC', description: 'En Ucuz UC Fiyatları', path: '/ilan-pazari?q=PUBG' },
    { name: 'Steam Cüzdan', description: 'Anında Yükleme, Avantajlı Fiyatlar', path: '/ilan-pazari?q=Steam' },
  ];
  
  // Simple rotation - could be enhanced with state for auto-rotation
  const currentFeatured = featuredProducts[0];

  return (
    <div className="bg-[#111218] border-b border-white/5 hidden md:block">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/hakkimizda" className="text-white/60 hover:text-white text-[12px] font-medium transition-colors">Hakkımızda</Link>
          <Link to="/sss" className="text-white/60 hover:text-white text-[12px] font-medium transition-colors">S.S.S</Link>
          <Link to="/marka-yonergeleri" className="text-white/60 hover:text-white text-[12px] font-medium transition-colors">Marka Yönergeleri</Link>
          <Link to="/destek-sistemi" className="text-white/60 hover:text-white text-[12px] font-medium transition-colors flex items-center gap-1">
            <Phone className="w-3 h-3" /> Whatsapp Destek
          </Link>
          <Link to="/steam-cafe" className="text-white/60 hover:text-white text-[12px] font-medium transition-colors">Steam Internet Cafe</Link>
          <Link to="/siparislerim" className="text-white/60 hover:text-white text-[12px] font-medium transition-colors">Sipariş Sorgula</Link>
          <Link to="/takas-koruma" className="text-white/60 hover:text-white text-[12px] font-medium transition-colors">Takas Koruma</Link>
          <Link to="/blog" className="text-white/60 hover:text-white text-[12px] font-medium transition-colors">Blog</Link>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-white/60 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
