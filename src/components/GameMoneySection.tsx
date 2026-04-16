import SectionHeader from './SectionHeader';
import { Coins } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GameMoneySection() {
  const cards = [
    { title: 'VP SATIN AL', q: 'Valorant VP', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80' },
    { title: 'ELMAS SATIN AL', q: 'Mobile Legends Elmas', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80' },
    { title: 'UC SATIN AL', q: 'PUBG UC', image: 'https://images.unsplash.com/photo-1548686304-89d188a80029?auto=format&fit=crop&w=400&q=80' },
  ];

  return (
    <section className="py-4">
      <SectionHeader 
        title="Oyun Parası Satın Al" 
        subtitle="Anında teslim edilen, güvenli altyapı üzerinden sunulan dijital oyun kodları."
        viewAllLink="/ilan-pazari"
        icon={<Coins className="w-6 h-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.title}
            to={`/ilan-pazari?q=${encodeURIComponent(c.q)}`}
            className="relative rounded-xl overflow-hidden group h-[200px]"
          >
            <img src={c.image} alt={c.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
              <div className="text-white font-extrabold text-2xl leading-tight">{c.title}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

