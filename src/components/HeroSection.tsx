import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeroSection() {
  const games = [
    { name: 'Mobil Oyunlar', image: 'https://picsum.photos/seed/mobil/200/300' },
    { name: 'PUBG Mobile', image: 'https://picsum.photos/seed/pubg/200/300' },
    { name: 'Free Fire', image: 'https://picsum.photos/seed/freefire/200/300' },
    { name: 'Call of Duty', image: 'https://picsum.photos/seed/cod/200/300' },
    { name: 'Valorant', image: 'https://picsum.photos/seed/valorant/200/300' },
    { name: 'League of Legends', image: 'https://picsum.photos/seed/lol/200/300' },
    { name: 'CS:GO', image: 'https://picsum.photos/seed/csgo/200/300' },
    { name: 'Roblox', image: 'https://picsum.photos/seed/roblox/200/300' },
    { name: 'Metin2', image: 'https://picsum.photos/seed/metin2/200/300' },
    { name: 'Silkroad', image: 'https://picsum.photos/seed/silkroad/200/300' },
    { name: 'Knight Online', image: 'https://picsum.photos/seed/knight/200/300' },
    { name: 'Black Desert', image: 'https://picsum.photos/seed/bdo/200/300' },
    { name: 'Genshin Impact', image: 'https://picsum.photos/seed/genshin/200/300' },
    { name: 'Minecraft', image: 'https://picsum.photos/seed/minecraft/200/300' },
    { name: 'Zula', image: 'https://picsum.photos/seed/zula/200/300' },
    { name: 'Apex Legends', image: 'https://picsum.photos/seed/apex/200/300' },
  ];

  return (
    <div className="bg-[#0f1015] pt-4 pb-8">
      <div className="w-full px-4">
        
        {/* Top Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-6">
          
          {/* Left Banner */}
          <div className="hidden lg:block lg:col-span-3">
            <Link to="/hediye-kartlari" className="block h-full relative rounded-xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-pink-200 to-pink-300"></div>
              <div className="relative h-full p-6 flex flex-col items-center text-center">
                <div className="text-black font-bold text-xl mb-4">App Store Card</div>
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-auto shadow-lg">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-black">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 1.56.04 2.87.73 3.63 1.88-3.37 1.96-2.85 6.47.45 7.84-.71 1.73-1.63 3.5-2.75 4.21zm-3.67-14.2c.2-1.74-1.14-3.3-2.74-3.48-.26 1.85 1.34 3.39 2.74 3.48z" />
                  </svg>
                </div>
                <div className="mt-8">
                  <h3 className="text-2xl font-black text-black leading-tight mb-2">Sevdikleri her<br/>şey için.</h3>
                  <span className="inline-block bg-black text-white text-xs font-bold px-4 py-2 rounded-full">Şimdi satın al</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Main Slider */}
          <div className="col-span-1 lg:col-span-6 relative rounded-xl overflow-hidden h-[300px] lg:h-[400px] group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] to-[#1e1b4b]">
              <img src="https://picsum.photos/seed/lolbanner/800/400" alt="League of Legends" className="w-full h-full object-cover opacity-50 mix-blend-overlay" />
            </div>
            
            <div className="absolute inset-0 p-8 flex flex-col justify-center items-start">
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-2 uppercase tracking-wider">League of<br/>Legends</h2>
              <h3 className="text-2xl lg:text-3xl font-bold text-cyan-400 mb-6 italic">Wild Rift</h3>
              <Link to="/ilan-pazari?q=League+of+Legends" className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-md uppercase tracking-wide transition-colors">
                Hemen Satın Al
              </Link>
            </div>

            {/* Navigation Arrows */}
            <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100">
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <div className="w-2 h-2 rounded-full bg-white/40"></div>
              <div className="w-2 h-2 rounded-full bg-white/40"></div>
              <div className="w-8 h-2 rounded-full bg-yellow-500"></div>
              <div className="w-2 h-2 rounded-full bg-white/40"></div>
            </div>
          </div>

          {/* Right Banner */}
          <div className="hidden lg:block lg:col-span-3">
            <Link to="/ilan-pazari?q=Diablo" className="block h-full relative rounded-xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-red-900 to-black">
                <img src="https://picsum.photos/seed/diablo/400/600" alt="Diablo" className="w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="relative h-full p-6 flex flex-col items-center justify-between text-center">
                <div className="w-full">
                  <div className="text-cyan-400 font-black text-2xl uppercase tracking-wider mb-2 drop-shadow-lg">Haftanın<br/>İndirimi</div>
                  <div className="flex justify-center gap-2 text-white/80 text-xs font-mono bg-black/50 py-2 rounded-lg backdrop-blur-sm">
                    <div className="flex flex-col items-center"><span className="text-lg font-bold text-white">07</span><span>Saat</span></div>
                    <span className="text-lg font-bold">:</span>
                    <div className="flex flex-col items-center"><span className="text-lg font-bold text-white">45</span><span>Dk</span></div>
                    <span className="text-lg font-bold">:</span>
                    <div className="flex flex-col items-center"><span className="text-lg font-bold text-white">50</span><span>Saniye</span></div>
                  </div>
                </div>
                
                <div className="mt-auto w-full">
                  <h3 className="text-3xl font-black text-white mb-1 drop-shadow-lg">DIABLO</h3>
                  <p className="text-gray-300 font-medium mb-4">PLATIN</p>
                  <div className="bg-red-600 text-white font-black text-xl py-2 rounded-md uppercase tracking-wider w-full">
                    %4 İndirim
                  </div>
                </div>
              </div>
            </Link>
          </div>

        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 lg:gap-3">
          {games.map((game, idx) => (
            <Link key={idx} to={`/ilan-pazari?q=${encodeURIComponent(game.name)}`} className="group relative bg-[#1a1b23] rounded-xl overflow-hidden aspect-[3/4] border border-white/5 hover:border-white/20 transition-colors">
              <img src={game.image} alt={game.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                <h4 className="text-white font-bold text-xs lg:text-sm leading-tight drop-shadow-md">{game.name}</h4>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
