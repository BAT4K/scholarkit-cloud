import React from 'react';
import { Shield, Star } from 'lucide-react';

const Logo = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      
      {/* THE ICON: Merit Crest (Gold) */}
      <div className="relative flex items-center justify-center">
        <Shield 
          className="w-9 h-9 md:w-11 md:h-11 text-yellow-600 fill-yellow-100" 
          strokeWidth={1.5} 
        />
        <Star 
          className="absolute w-4 h-4 md:w-5 md:h-5 text-yellow-600 fill-yellow-500 pb-0.5" 
          strokeWidth={1.5}
        />
      </div>

      {/* THE TEXT: Clear & Authoritative */}
      <div className="flex flex-col justify-center h-full pt-1">
        <span className="font-sans font-black text-xl md:text-2xl text-blue-900 tracking-tight leading-none">
          SCHOLAR<span className="font-serif text-blue-700 font-bold">KIT</span>
        </span>
        
        {/* TAGLINE: Replaces "Est 2025" with relevant context */}
        <span className="text-[10px] md:text-[11px] text-gray-400 font-bold tracking-[0.15em] uppercase leading-tight">
          OFFICIAL STORE
        </span>
      </div>

    </div>
  );
};

export default Logo;