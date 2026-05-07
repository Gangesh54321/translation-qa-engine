import React from 'react';
import { 
  ShieldCheck
} from 'lucide-react';

export const FooterStrip: React.FC = () => {
  return (
    <footer className="w-full bg-card/50 backdrop-blur-xl border-t py-12 relative z-10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">TransTech Hub</span>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground flex items-center justify-center gap-2">
              &copy; 2026 TransTech Intelligence Hub. All rights reserved.
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
              v1.0.4-stable
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
