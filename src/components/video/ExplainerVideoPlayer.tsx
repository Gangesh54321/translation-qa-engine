import React from 'react';
import { Player } from '@remotion/player';
import { MainComposition } from './Composition';

export const ExplainerVideoPlayer: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl border bg-card/50 backdrop-blur-sm group">
      <Player
        component={MainComposition}
        durationInFrames={300}
        compositionWidth={1920}
        compositionHeight={1080}
        fps={30}
        controls
        autoPlay
        loop
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
        }}
        inputProps={{}}
      />
      <div className="p-4 bg-muted/30 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
           <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">App Explainer</span>
        </div>
        <div className="text-[10px] text-muted-foreground italic">
          
        </div>
      </div>
    </div>
  );
};
