import React from 'react';
import { 
  ShieldCheck
} from 'lucide-react';

export const FooterStrip: React.FC = () => {
  return (
    <footer className="w-full bg-card/50 backdrop-blur-xl border-t py-4 relative z-10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/10">
              <span className="text-white font-black text-lg select-none">T</span>
            </div>
            <span className="font-black text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">TransTech Hub</span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
            <p className="text-xs font-bold text-muted-foreground">
              &copy; 2026 TransTech Intelligence Hub. All rights reserved.
            </p>
            <span className="hidden sm:inline text-muted-foreground/30">|</span>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/40">
              v1.0.4-stable
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
