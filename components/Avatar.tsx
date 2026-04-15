'use client'

import { motion } from 'framer-motion'
import { GEAR_DB } from '@/lib/outfits'
import type { InBodyRecord } from '@/lib/types'

interface AvatarProps {
  loadout?: Record<string, string>
  size?: 'sm' | 'md' | 'lg'
  inbody?: InBodyRecord | null
  animated?: boolean
  className?: string
}

/**
 * Avatar V3: "Exquisite Chibi" Implementation
 * Based on user-provided RPG/Chibi references
 */
export default function Avatar({ loadout, size = 'md', inbody, animated = false, className = '' }: AvatarProps) {
  const activeLoadout = loadout || {
    head: 'head_none',
    top: 'top_basic_white',
    bottom: 'bottom_sweats_gray',
    accessory: 'acc_none'
  }

  const parts = {
    head: GEAR_DB.find(p => p.id === activeLoadout.head) || GEAR_DB[0],
    top: GEAR_DB.find(p => p.id === activeLoadout.top) || GEAR_DB[6],
    bottom: GEAR_DB.find(p => p.id === activeLoadout.bottom) || GEAR_DB[11],
    accessory: GEAR_DB.find(p => p.id === activeLoadout.accessory) || GEAR_DB[16],
  }
  
  const dim = {
    sm: 64,
    md: 128,
    lg: 256,
  }[size]

  // Proportions: Large head, small compact body
  let headRadius = 24
  let torsoWidth = 32
  let legHeight = 30

  if (inbody) {
    if (inbody.skeletalMuscleMass && inbody.skeletalMuscleMass > 35) {
      torsoWidth = 38 
    }
    if (inbody.bodyFat && inbody.bodyFat < 18) {
      torsoWidth = 28
    }
  }

  const SvgContent = (
    <svg viewBox="0 0 100 130" width={dim} height={dim} className="select-none pointer-events-none filter drop-shadow-md">
      <defs>
        <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFDBB4" />
          <stop offset="100%" stopColor="#E5BE98" />
        </linearGradient>
        <linearGradient id="staffGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B4513" />
          <stop offset="100%" stopColor="#5D2E0C" />
        </linearGradient>
        <filter id="eyeGlow" x="-20%" y="-20%" width="140%" height="140%">
           <feGaussianBlur stdDeviation="0.8" result="blur" />
           <feMerge>
             <feMergeNode in="blur" />
             <feMergeNode in="SourceGraphic" />
           </feMerge>
        </filter>
      </defs>

      {/* BACK ACCESSORY (Behind hair) */}
      {parts.accessory.id === 'acc_pathfinder_staff' && (
        <g transform="translate(68, 30) rotate(15)">
           <rect x="0" y="0" width="4" height="80" rx="2" fill="url(#staffGrad)" />
           <circle cx="2" cy="0" r="4" fill="#64B5F6" />
        </g>
      )}

      {/* BACK HAIR (Pre-layer) */}
      <path d="M 24 35 Q 24 5 50 2 Q 76 5 76 35 Z" fill="#5D4037" />

      {/* RARITY & AURA EFFECTS */}
      {parts.accessory.id === 'acc_lightning' && (
        <motion.g animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
           <path d="M 12 60 L 22 40 L 8 50 M 88 60 L 78 40 L 92 50" stroke="#FFD700" strokeWidth="2" fill="none" />
        </motion.g>
      )}
      {parts.accessory.id.includes('aura') && (
        <motion.circle 
          cx="50" cy="75" r="42" 
          stroke={parts.accessory.colors?.primary || '#0F9E75'} 
          strokeWidth="1.5" 
          fill="none" 
          strokeDasharray="5 5"
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }} 
        />
      )}

      {/* BODY BASE */}
      <g className="base-rig">
        {/* Feet/Shoes */}
        <rect x={50 - torsoWidth/2 - 2} y="112" width="14" height="10" rx="5" fill={parts.bottom.id.includes('pathfinder') ? '#5D4037' : '#334155'} />
        <rect x={50 + torsoWidth/2 - 12} y="112" width="14" height="10" rx="5" fill={parts.bottom.id.includes('pathfinder') ? '#5D4037' : '#334155'} />

        {/* Legs */}
        <path d={`M ${50 - torsoWidth/3} 90 L ${50 - torsoWidth/3} 115`} stroke={parts.bottom.id.includes('tights') || parts.bottom.id.includes('leggings') ? parts.bottom.colors?.primary : "url(#skinGrad)"} strokeWidth="11" strokeLinecap="round" />
        <path d={`M ${50 + torsoWidth/3} 90 L ${50 + torsoWidth/3} 115`} stroke={parts.bottom.id.includes('tights') || parts.bottom.id.includes('leggings') ? parts.bottom.colors?.primary : "url(#skinGrad)"} strokeWidth="11" strokeLinecap="round" />

        {/* Torso Base */}
        <path 
           d={`M ${50 - torsoWidth/2} 55 Q 50 48 ${50 + torsoWidth/2} 55 L ${50 + torsoWidth/2} 95 Q 50 102 ${50 - torsoWidth/2} 95 Z`} 
           fill="url(#skinGrad)" 
        />

        {/* Chibi Face Shape (Tapered Jaw) */}
        <path 
           d="M 26 28 C 26 12, 74 12, 74 28 C 74 48, 62 58, 50 58 C 38 58, 26 48, 26 28" 
           fill="url(#skinGrad)" 
        />

        {/* DEFAULT HAIR (Bangs/Front) */}
        <path d="M 26 28 Q 30 15 50 15 Q 70 15 74 28 L 74 20 Q 50 5 26 20 Z" fill="#5D4037" />
        <path d="M 26 28 Q 35 18 45 28 L 50 20 L 55 28 Q 65 18 74 28" fill="#5D4037" />
        
        {/* Face Details */}
        <g className="face-details">
          {/* Eyes (Refined) */}
          <g transform="translate(42, 34)">
            <ellipse cx="0" cy="0" rx="4" ry="5.5" fill="#3D2B1F" />
            <ellipse cx="0" cy="0" rx="2.5" ry="4" fill="#000" />
            <circle cx="-1.5" cy="-2" r="1.5" fill="white" />
            <circle cx="1" cy="1" r="0.8" fill="white" opacity="0.6" />
            <path d="M -5 -3 Q 0 -6 5 -3" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </g>
          <g transform="translate(58, 34)">
            <ellipse cx="0" cy="0" rx="4" ry="5.5" fill="#3D2B1F" />
            <ellipse cx="0" cy="0" rx="2.5" ry="4" fill="#000" />
            <circle cx="-1.5" cy="-2" r="1.5" fill="white" />
            <circle cx="1" cy="1" r="0.8" fill="white" opacity="0.6" />
            <path d="M -5 -3 Q 0 -6 5 -3" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </g>
          
          {/* Mouth (Smile) */}
          <path d="M 47 48 Q 50 50 53 48" stroke="#3D2B1F" strokeWidth="1" fill="none" strokeLinecap="round" />
          
          {/* Blush */}
          <circle cx="34" cy="42" r="3.5" fill="#FF8A80" opacity="0.35" />
          <circle cx="66" cy="42" r="3.5" fill="#FF8A80" opacity="0.35" />
        </g>

        {/* Arms (Shapely with sleeves) */}
        <motion.g 
          animate={animated ? { rotate: [-5, 5, -5] } : {}}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          style={{ originX: '40px', originY: '60px' }}
        >
          <path d={`M ${50 - torsoWidth/2} 60 C 35 65, 30 75, 35 92`} stroke="url(#skinGrad)" strokeWidth="10" fill="none" strokeLinecap="round" />
          {/* Sleeve cuff */}
          <rect x={30} y="88" width="10" height="4" rx="2" fill={parts.top.colors?.primary || '#FFF'} opacity="0.8" />
        </motion.g>
        <motion.g 
          animate={animated ? { rotate: [5, -5, 5] } : {}}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          style={{ originX: '60px', originY: '60px' }}
        >
          <path d={`M ${50 + torsoWidth/2} 60 C 65 65, 70 75, 65 92`} stroke="url(#skinGrad)" strokeWidth="10" fill="none" strokeLinecap="round" />
          {/* Sleeve cuff */}
          <rect x={60} y="88" width="10" height="4" rx="2" fill={parts.top.colors?.primary || '#FFF'} opacity="0.8" />
        </motion.g>
      </g>

      {/* GEAR LAYERS */}
      <g className="gear-rig">
        {/* BOTTOMS */}
        {parts.bottom.id !== 'bottom_none' && (
          <>
            <path 
               d={`M ${50 - torsoWidth/2 - 1} 88 Q 50 84 ${50 + torsoWidth/2 + 1} 88 L ${50 + torsoWidth/2 + 1} 105 L ${50 - torsoWidth/2 - 1} 105 Z`}
               fill={parts.bottom.colors?.primary || '#334155'} 
            />
            {/* Belt Detail */}
            <path d={`M ${50 - torsoWidth/2 - 1} 90 L ${50 + torsoWidth/2 + 1} 90`} stroke="black" strokeWidth="0.5" opacity="0.2" />
          </>
        )}

        {/* TOPS */}
        <g>
          <path 
             d={`M ${50 - torsoWidth/2 - 1} 58 Q 50 48 ${50 + torsoWidth/2 + 1} 58 L ${50 + torsoWidth/2 + 1} 92 L ${50 - torsoWidth/2 - 1} 92 Z`}
             fill={parts.top.colors?.primary || '#FFF'}
          />
          {/* Top Details (Neckline) */}
          <path d={`M ${50 - 8} 52 Q 50 58 ${50 + 8} 52`} stroke="black" strokeWidth="0.5" fill="none" opacity="0.1" />
          {/* Mid seam */}
          <path d={`M 50 65 L 50 90`} stroke="black" strokeWidth="0.5" fill="none" opacity="0.05" />
          
          {parts.top.id.includes('tank') && (
            <path d={`M 50 50 L 50 65`} stroke="var(--bg-card)" strokeWidth="8" />
          )}
          
          {parts.top.id === 'top_pathfinder_tunic' && (
            <>
              <rect x={50 - torsoWidth/2} y="58" width="4" height="34" fill="#5D2E0C" />
              <rect x={50 + torsoWidth/2 - 4} y="58" width="4" height="34" fill="#5D2E0C" />
              <rect x={50 - torsoWidth/2} y="75" width={torsoWidth} height="4" fill="#5D2E0C" />
            </>
          )}
        </g>

        {/* ACCESSORY (Front Layered) */}
        {parts.accessory.id === 'acc_shaker' && (
          <rect x="68" y="82" width="9" height="15" rx="3" fill="#3B82F6" stroke="#1E3A8A" strokeWidth="0.5" />
        )}
        {parts.accessory.id === 'acc_belt_pro' && (
          <rect x={50 - torsoWidth/2 - 1} y="86" width={torsoWidth + 2} height="7" fill="#450a0a" stroke="#F59E0B" strokeWidth="0.8" />
        )}
        {parts.accessory.id === 'acc_smart_watch' && (
          <rect x="29" y="80" width="7" height="7" rx="1.5" fill="#333" stroke="#0F9E75" strokeWidth="0.5" />
        )}

        {/* HEADGEAR */}
        {parts.head.id !== 'head_none' && (
          <g>
             {/* Glasses/Shades */}
             {parts.head.id.includes('glasses') && (
               <g transform="translate(50, 34)">
                 <rect x="-18" y="-4" width="14" height="8" rx="2" fill="#1E293B" opacity="0.95" />
                 <rect x="4" y="-4" width="14" height="8" rx="2" fill="#1E293B" opacity="0.95" />
                 <rect x="-4" y="-2" width="8" height="3" fill="#1E293B" />
                 {/* Lens reflection */}
                 <rect x="-14" y="-2" width="3" height="1.5" rx="0.5" fill="white" opacity="0.2" />
                 <rect x="8" y="-2" width="3" height="1.5" rx="0.5" fill="white" opacity="0.2" />
               </g>
             )}

             {/* Sweatbands */}
             {parts.head.id.includes('sweatband') && (
               <rect x={50 - headRadius} y="15" width={headRadius * 2} height="7" fill={parts.head.colors?.primary} stroke="black" strokeWidth="0.2" opacity="0.9" />
             )}

             {/* Beanie */}
             {parts.head.id.includes('beanie') && (
               <path d={`M ${50 - headRadius} 25 Q ${50 - headRadius} 0 50 0 Q ${50 + headRadius} 0 ${50 + headRadius} 25 Z`} fill={parts.head.colors?.primary} opacity="0.95" />
             )}

            {/* Pathfinder Hat */}
            {parts.head.id === 'head_pathfinder_hat' && (
              <g transform="translate(50, 32)">
                 <path d="M -38 0 Q -38 -12 0 -12 Q 38 -12 38 0 Z" fill="#8B4513" />
                 <path d="M -22 -8 L -16 -28 Q 0 -38 16 -28 L 22 -8 Z" fill="#8B4513" stroke="#5D2E0C" strokeWidth="1" />
                 <rect x="-22" y="-13" width="44" height="5" fill="#5D2E0C" />
              </g>
            )}
            
            {/* Crown */}
            {parts.head.id === 'head_crown' && (
              <path d="M 28 15 L 34 3 L 42 12 L 50 0 L 58 12 L 66 3 L 72 15 Z" fill="#FFD700" stroke="#F59E0B" strokeWidth="1" />
            )}

            {/* Caps & Visors */}
            {(parts.head.id.includes('cap') || parts.head.id.includes('visor')) && (
              <g>
                {!parts.head.id.includes('visor') && <path d={`M ${50 - headRadius} 28 Q ${50 - headRadius} 8 50 8 Q ${50 + headRadius} 8 ${50 + headRadius} 28 Z`} fill={parts.head.colors?.primary} />}
                <path d="M 50 15 L 78 15 Q 85 15 85 24" fill={parts.head.colors?.primary} stroke={parts.head.colors?.primary} strokeWidth="3" strokeLinecap="round" />
              </g>
            )}

            {/* Headphones */}
            {parts.head.id === 'head_headphones' && (
               <>
                 <path d="M 28 32 Q 28 6 50 6 Q 72 6 72 32" stroke="#333" strokeWidth="5" fill="none" />
                 <rect x="22" y="25" width="10" height="18" rx="4" fill="#0F9E75" stroke="#065F46" strokeWidth="0.5" />
                 <rect x="68" y="25" width="10" height="18" rx="4" fill="#0F9E75" stroke="#065F46" strokeWidth="0.5" />
               </>
            )}
          </g>
        )}
      </g>
    </svg>
  )

  if (animated) {
    return (
      <motion.div 
        animate={{ y: [0, -3, 0] }} 
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        className={`inline-block ${className}`}
      >
        {SvgContent}
      </motion.div>
    )
  }

  return <div className={`inline-block ${className}`}>{SvgContent}</div>
}
