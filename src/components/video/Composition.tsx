import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import React from 'react';

const Title: React.FC<{ text: string; color: string }> = ({ text, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const scale = spring({
    frame,
    fps,
    config: { damping: 12 },
  });
  const translateY = interpolate(frame, [0, 25], [50, 0], { extrapolateRight: 'clamp' });

  return (
    <h1
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        color,
        fontSize: '80px',
        fontWeight: '900',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textShadow: '0 10px 30px rgba(0,0,0,0.1)',
      }}
    >
      {text}
    </h1>
  );
};

const Subtitle: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' });
  const translateX = interpolate(frame, [20, 45], [-30, 0], { extrapolateRight: 'clamp' });

  return (
    <p
      style={{
        opacity,
        transform: `translateX(${translateX}px)`,
        color: '#64748b',
        fontSize: '40px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        marginTop: '20px',
      }}
    >
      {text}
    </p>
  );
};

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const rotate = interpolate(frame, [0, 300], [0, 360]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#f8fafc',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '1200px',
          height: '1200px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
          top: '-300px',
          right: '-300px',
          borderRadius: '50%',
          transform: `rotate(${rotate}deg)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '1200px',
          height: '1200px',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 70%)',
          bottom: '-300px',
          left: '-300px',
          borderRadius: '50%',
          transform: `rotate(${-rotate}deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const MainComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Background />
      
      {frame < 90 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Title text="Translation QA Engine" color="#7c3aed" />
          <Subtitle text="Professional Bilingual Auditing" />
        </AbsoluteFill>
      )}

      {frame >= 90 && frame < 200 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '100px' }}>
          <div style={{ transform: `translateY(${interpolate(frame - 90, [0, 20], [30, 0], { extrapolateRight: 'clamp' })}px)` }}>
            <Title text="100+ Professional Rules" color="#059669" />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center', marginTop: '60px', maxWidth: '1200px' }}>
             {[
               'Industrial-Scale Parsing',
               'Combined Export',
               'Smart De-duplication',
               'Bilingual Review RTF',
               'Glossary Support',
             ].map((tag, i) => {
               const delay = i * 8;
               const tagFrame = frame - 90 - delay;
               const tagOpacity = interpolate(tagFrame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
               const tagScale = spring({
                 frame: tagFrame,
                 fps,
                 config: { damping: 10, stiffness: 100 },
               });
               
               return (
                 <div 
                   key={tag} 
                   style={{ 
                     opacity: tagOpacity, 
                     transform: `scale(${tagScale})`,
                     padding: '20px 40px', 
                     backgroundColor: 'white', 
                     borderRadius: '60px', 
                     boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
                     fontSize: '32px', 
                     fontWeight: 'bold',
                     color: '#1e293b'
                   }}
                 >
                   {tag}
                 </div>
               );
             })}
          </div>
        </AbsoluteFill>
      )}

      {frame >= 200 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ 
            transform: `scale(${spring({ frame: frame - 200, fps, config: { damping: 12 } })}) translateY(${interpolate(frame - 200, [0, 20], [20, 0], { extrapolateRight: 'clamp' })}px)` 
          }}>
            <Title text="Audit Passed!" color="#2563eb" />
          </div>
          <Subtitle text="Ready for Global Delivery" />
          <div style={{ 
            marginTop: '60px', 
            width: '200px', 
            height: '200px', 
            borderRadius: '50%', 
            backgroundColor: '#dcfce7', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            boxShadow: '0 25px 50px -12px rgba(22, 163, 74, 0.25)',
            transform: `scale(${spring({ frame: frame - 215, fps, config: { damping: 8 } })})`
          }}>
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
