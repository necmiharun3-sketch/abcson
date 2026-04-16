import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  viewAllText?: string;
  className?: string;
  icon?: React.ReactNode;
}

export default function SectionHeader({
  title,
  subtitle,
  viewAllLink,
  viewAllText = 'Tümünü Gör',
  className,
  icon,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6", className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-1 p-2 rounded-xl bg-white/5 border border-white/10 text-amber-400">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase italic">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-white/50 text-sm font-medium ml-3">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {viewAllLink && (
        <Link
          to={viewAllLink}
          className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-white/70 hover:text-white text-sm font-bold transition-all shrink-0"
        >
          <span>{viewAllText}</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}
