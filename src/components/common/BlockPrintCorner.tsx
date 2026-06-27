import React from 'react';
import Svg, { G, Path, Circle, Ellipse } from 'react-native-svg';

interface Props {
  color?: string;
  size?: number;
  opacity?: number;
}

/**
 * Block-print corner motif — inspired by Bagh/Bagru hand-block printing.
 * Renders a curved vine with leaf buds and dot clusters, designed to sit
 * in the top-right corner of a card at very low opacity as a texture accent.
 *
 * Usage:
 *   <BlockPrintCorner color="#C1440E" size={64} opacity={0.09} />
 */
export default function BlockPrintCorner({
  color = '#C05A00',
  size = 64,
  opacity = 0.09,
}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <G opacity={opacity} fill={color} stroke={color}>
        {/* ── Main vine — curved sweep from right edge to top edge ── */}
        <Path
          d="M64,28 Q52,16 36,0"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        {/* ── Secondary vine, tighter to corner ── */}
        <Path
          d="M64,12 Q58,6 52,0"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* ── Tertiary vine, wider sweep ── */}
        <Path
          d="M64,44 Q40,28 18,0"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="2,3"
        />

        {/* ── Leaf buds on main vine ── */}
        {/* Large leaf at vine mid-point */}
        <Ellipse cx="50" cy="14" rx="6" ry="2.5" transform="rotate(-45 50 14)" />
        {/* Small leaf near top */}
        <Ellipse cx="40" cy="5" rx="4" ry="1.8" transform="rotate(-45 40 5)" />
        {/* Leaf bud on wide vine */}
        <Ellipse cx="50" cy="34" rx="5.5" ry="2.2" transform="rotate(-45 50 34)" />
        <Ellipse cx="30" cy="14" rx="4" ry="1.8" transform="rotate(-45 30 14)" />

        {/* ── Corner dot cluster (like a rangoli seed pattern) ── */}
        <Circle cx="62" cy="2" r="3" />
        <Circle cx="56" cy="2" r="1.8" />
        <Circle cx="62" cy="8" r="1.8" />
        <Circle cx="58" cy="6" r="1.2" />

        {/* ── Rotating diamonds along wide vine ── */}
        <Path d="M42,18 L44,20 L42,22 L40,20 Z" />
        <Path d="M28,6 L30,8 L28,10 L26,8 Z" />
        <Path d="M57,28 L59,30 L57,32 L55,30 Z" />

        {/* ── Small blossom at corner ── */}
        <Circle cx="62" cy="16" r="1.2" />
        <Circle cx="56" cy="10" r="1" />
        <Circle cx="50" cy="4" r="1" />
      </G>
    </Svg>
  );
}
