import React from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

/**
 * The fixed set of profile avatars. A profile stores `avatar:<id>` in `avatar_url`;
 * nobody can upload their own picture.
 *
 * Characters come from public-domain fairy tales and Japanese folklore / anime tropes,
 * drawn as original artwork. They are deliberately NOT trademarked characters
 * (Disney, Ghibli, named anime), which we have no licence to ship.
 */
export type AvatarDef = { id: string; Art: () => React.JSX.Element };

export const AVATAR_PREFIX = 'avatar:';
export const avatarValue = (id: string) => `${AVATAR_PREFIX}${id}`;
export const avatarIdFrom = (value?: string | null) => (value?.startsWith(AVATAR_PREFIX) ? value.slice(AVATAR_PREFIX.length) : null);

const SKIN = '#FFE0C2';
const INK = '#2B1B14';
const BLUSH = '#FF9AA2';

/** Two round eyes with a highlight. */
const Eyes = ({ y = 56, dx = 8, color = INK, ry = 4.5 }: { y?: number; dx?: number; color?: string; ry?: number }) => (
  <G>
    <Ellipse cx={50 - dx} cy={y} rx={3.2} ry={ry} fill={color} />
    <Ellipse cx={50 + dx} cy={y} rx={3.2} ry={ry} fill={color} />
    <Circle cx={50 - dx + 1} cy={y - 1.6} r={1.2} fill="#fff" />
    <Circle cx={50 + dx + 1} cy={y - 1.6} r={1.2} fill="#fff" />
  </G>
);
const Cheeks = ({ y = 64, dx = 14 }: { y?: number; dx?: number }) => (
  <G opacity={0.55}>
    <Ellipse cx={50 - dx} cy={y} rx={4.5} ry={3} fill={BLUSH} />
    <Ellipse cx={50 + dx} cy={y} rx={4.5} ry={3} fill={BLUSH} />
  </G>
);
const Smile = ({ y = 66, w = 6 }: { y?: number; w?: number }) => (
  <Path d={`M${50 - w} ${y} Q50 ${y + 6} ${50 + w} ${y}`} stroke={INK} strokeWidth={2} strokeLinecap="round" fill="none" />
);
const Star = ({ x, y, s = 1, fill = '#FFD84D' }: { x: number; y: number; s?: number; fill?: string }) => (
  <Path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0 -8 L2.3 -2.5 L8 -2.5 L3.4 1.2 L5 7 L0 3.5 L-5 7 L-3.4 1.2 L-8 -2.5 L-2.3 -2.5 Z"
    fill={fill}
  />
);

// ------------------------------------------------------------ Fairytale (public-domain tales)
const RedHood = () => (
  <G>
    <Rect width={100} height={100} fill="#D9EBD0" />
    <Path d="M50 8 Q90 12 88 64 Q86 94 72 100 L28 100 Q14 94 12 64 Q10 12 50 8 Z" fill="#D32F3F" />
    <Ellipse cx={50} cy={58} rx={25} ry={28} fill="#A82030" />
    <Ellipse cx={50} cy={58} rx={21} ry={24} fill={SKIN} />
    <Path d="M30 50 Q50 30 70 50 Q58 42 50 45 Q42 42 30 50 Z" fill="#7A4A2B" />
    <Eyes y={60} color="#3B2417" />
    <Cheeks y={68} />
    <Smile y={71} />
    <Path d="M40 86 L50 92 L60 86 L50 82 Z" fill="#8F1C2A" />
  </G>
);

const FrogPrince = () => (
  <G>
    <Rect width={100} height={100} fill="#D6EEF5" />
    <Ellipse cx={50} cy={62} rx={37} ry={28} fill="#6CBF4B" />
    <Circle cx={29} cy={38} r={12} fill="#6CBF4B" />
    <Circle cx={71} cy={38} r={12} fill="#6CBF4B" />
    <Circle cx={29} cy={38} r={8.5} fill="#fff" />
    <Circle cx={71} cy={38} r={8.5} fill="#fff" />
    <Circle cx={31} cy={39} r={4.2} fill={INK} />
    <Circle cx={69} cy={39} r={4.2} fill={INK} />
    <Circle cx={32.5} cy={37.5} r={1.4} fill="#fff" />
    <Circle cx={70.5} cy={37.5} r={1.4} fill="#fff" />
    <Path d="M20 66 Q50 90 80 66" stroke="#2F6B2A" strokeWidth={2.6} strokeLinecap="round" fill="none" />
    <Circle cx={45} cy={56} r={1.4} fill="#2F6B2A" />
    <Circle cx={55} cy={56} r={1.4} fill="#2F6B2A" />
    <Ellipse cx={26} cy={68} rx={5} ry={3} fill={BLUSH} opacity={0.6} />
    <Ellipse cx={74} cy={68} rx={5} ry={3} fill={BLUSH} opacity={0.6} />
    <Path d="M39 40 L40 26 L45 33 L50 22 L55 33 L60 26 L61 40 Z" fill="#F6C945" stroke="#C99A1A" strokeWidth={1.2} strokeLinejoin="round" />
    <Circle cx={50} cy={34} r={2} fill="#E85A8A" />
  </G>
);

const PussInBoots = () => (
  <G>
    <Rect width={100} height={100} fill="#F9E3C0" />
    <Path d="M16 58 L14 32 L38 46 Z" fill="#F0A04B" />
    <Path d="M84 58 L86 32 L62 46 Z" fill="#F0A04B" />
    <Ellipse cx={50} cy={62} rx={31} ry={27} fill="#F0A04B" />
    <Ellipse cx={50} cy={72} rx={15} ry={11} fill="#FFF1D6" />
    <Circle cx={38} cy={58} r={7} fill="#7EC850" />
    <Circle cx={62} cy={58} r={7} fill="#7EC850" />
    <Ellipse cx={38} cy={58} rx={3.2} ry={5.5} fill={INK} />
    <Ellipse cx={62} cy={58} rx={3.2} ry={5.5} fill={INK} />
    <Circle cx={39.5} cy={55.5} r={1.8} fill="#fff" />
    <Circle cx={63.5} cy={55.5} r={1.8} fill="#fff" />
    <Path d="M46 68 L54 68 L50 73 Z" fill="#E87A8C" />
    <Path d="M50 73 Q45 79 41 75 M50 73 Q55 79 59 75" stroke="#5A3A22" strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <Path d="M30 72 L14 69 M30 76 L14 79 M70 72 L86 69 M70 76 L86 79" stroke="#5A3A22" strokeWidth={1.2} strokeLinecap="round" />
    <Path d="M30 40 Q32 14 50 14 Q68 14 70 40 Z" fill="#7A4E2B" />
    <Ellipse cx={50} cy={40} rx={36} ry={7.5} fill="#5A3A22" />
    <Path d="M31 36 Q50 42 69 36 L69 31 Q50 37 31 31 Z" fill="#D6364B" />
    <Path d="M66 24 Q86 6 92 22 Q80 20 72 30 Z" fill="#E8453C" />
    <Path d="M66 24 Q80 14 90 20" stroke="#fff" strokeWidth={1.4} fill="none" />
  </G>
);

const Pinocchio = () => (
  <G>
    <Rect width={100} height={100} fill="#FBE9B7" />
    <Path d="M28 48 L24 62 L30 62 Z M72 48 L76 62 L70 62 Z" fill="#7A4A2B" />
    <Ellipse cx={50} cy={60} rx={22} ry={24} fill="#F5C98F" />
    <Path d="M46 62 L88 66 L46 72 Z" fill="#E8A96A" />
    <Circle cx={88} cy={66} r={2.4} fill="#E8A96A" />
    <Circle cx={40} cy={54} r={5.5} fill="#fff" stroke="#7A4A2B" strokeWidth={1.2} />
    <Circle cx={58} cy={54} r={5.5} fill="#fff" stroke="#7A4A2B" strokeWidth={1.2} />
    <Circle cx={41} cy={55} r={2.6} fill={INK} />
    <Circle cx={59} cy={55} r={2.6} fill={INK} />
    <Path d="M35 46 Q40 43 45 46 M53 46 Q58 43 63 46" stroke="#7A4A2B" strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <Ellipse cx={32} cy={66} rx={4} ry={3} fill={BLUSH} opacity={0.6} />
    <Path d="M42 77 Q50 82 58 77" stroke={INK} strokeWidth={2} strokeLinecap="round" fill="none" />
    <Path d="M26 46 Q28 20 56 12 Q52 26 76 46 Q50 38 26 46 Z" fill="#D6364B" />
    <Path d="M56 12 Q70 4 78 10 Q70 16 62 18 Z" fill="#4FA3E0" />
    <Path d="M34 90 L50 96 L34 100 Z M66 90 L50 96 L66 100 Z" fill="#F6C945" />
    <Circle cx={50} cy={96} r={3} fill="#E0A800" />
  </G>
);

const MadHatter = () => (
  <G>
    <Rect width={100} height={100} fill="#E3D7F3" />
    <Ellipse cx={26} cy={58} rx={9} ry={15} fill="#F28C28" />
    <Ellipse cx={74} cy={58} rx={9} ry={15} fill="#F28C28" />
    <Ellipse cx={50} cy={62} rx={21} ry={23} fill={SKIN} />
    <Circle cx={41} cy={58} r={5} fill="#fff" stroke={INK} strokeWidth={1} />
    <Circle cx={59} cy={58} r={5} fill="#fff" stroke={INK} strokeWidth={1} />
    <Circle cx={41} cy={58.5} r={2.4} fill="#2E8B57" />
    <Circle cx={59} cy={58.5} r={2.4} fill="#2E8B57" />
    <Path d="M36 50 Q41 46 46 50 M54 50 Q59 46 64 50" stroke="#B85F10" strokeWidth={2} strokeLinecap="round" fill="none" />
    <Path d="M38 70 Q50 84 62 70 Z" fill="#fff" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
    <Circle cx={30} cy={68} r={3.5} fill={BLUSH} opacity={0.55} />
    <Circle cx={70} cy={68} r={3.5} fill={BLUSH} opacity={0.55} />
    <Path d="M31 42 L35 6 L65 6 L69 42 Z" fill="#2B6B5A" />
    <Ellipse cx={50} cy={42} rx={35} ry={7} fill="#2B6B5A" />
    <Path d="M31.5 36 Q50 42 68.5 36 L69 41 Q50 47 31 41 Z" fill="#5B2B7A" />
    <Rect x={44} y={30} width={14} height={10} rx={1.5} fill="#F6E3A0" transform="rotate(-6 51 35)" />
    <Path d="M30 92 L50 98 L30 104 Z M70 92 L50 98 L70 104 Z" fill="#D6364B" />
    <Circle cx={50} cy={98} r={3.5} fill="#A82030" />
  </G>
);

// ------------------------------------------------------------ Spirits & folklore
const Tanuki = () => (
  <G>
    <Rect width={100} height={100} fill="#D7E8CC" />
    <Circle cx={26} cy={34} r={10} fill="#8A6B4B" />
    <Circle cx={74} cy={34} r={10} fill="#8A6B4B" />
    <Circle cx={26} cy={34} r={5} fill="#3F2F28" />
    <Circle cx={74} cy={34} r={5} fill="#3F2F28" />
    <Ellipse cx={50} cy={60} rx={35} ry={30} fill="#A38566" />
    <Ellipse cx={50} cy={72} rx={20} ry={15} fill="#F1E4CC" />
    <Ellipse cx={36} cy={54} rx={8.5} ry={11} fill="#3F2F28" transform="rotate(18 36 54)" />
    <Ellipse cx={64} cy={54} rx={8.5} ry={11} fill="#3F2F28" transform="rotate(-18 64 54)" />
    <Circle cx={36.5} cy={54} r={3.2} fill="#fff" />
    <Circle cx={63.5} cy={54} r={3.2} fill="#fff" />
    <Ellipse cx={50} cy={64} rx={5} ry={3.6} fill="#2B2B33" />
    <Path d="M50 67 Q50 73 44 73 M50 67 Q50 73 56 73" stroke="#2B2B33" strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <Path d="M50 32 Q58 12 78 14 Q74 36 50 32 Z" fill="#5FA55A" />
    <Path d="M50 32 Q62 24 74 17" stroke="#3E7A3F" strokeWidth={1.5} fill="none" />
  </G>
);

const Kitsune = () => (
  <G>
    <Rect width={100} height={100} fill="#F9E0C7" />
    <Path d="M20 48 L24 10 L47 32 Z" fill="#F08A3C" />
    <Path d="M80 48 L76 10 L53 32 Z" fill="#F08A3C" />
    <Path d="M26 38 L28 20 L40 32 Z" fill="#3B2A2A" />
    <Path d="M74 38 L72 20 L60 32 Z" fill="#3B2A2A" />
    <Ellipse cx={50} cy={58} rx={33} ry={27} fill="#F08A3C" />
    <Path d="M17 62 Q34 60 50 84 Q66 60 83 62 Q76 88 50 89 Q24 88 17 62 Z" fill="#fff" />
    <Path d="M50 32 L46 42 L54 42 Z" fill="#D6364B" />
    <Path d="M31 56 Q37 50 45 57" stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />
    <Path d="M69 56 Q63 50 55 57" stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />
    <Ellipse cx={50} cy={72} rx={4.5} ry={3.2} fill={INK} />
    <Path d="M50 75 Q50 80 45 80 M50 75 Q50 80 55 80" stroke={INK} strokeWidth={1.8} strokeLinecap="round" fill="none" />
  </G>
);

const LuckyCat = () => (
  <G>
    <Rect width={100} height={100} fill="#F9E6C9" />
    <Path d="M20 52 L20 20 L44 38 Z" fill="#fff" stroke="#E6E0D8" strokeWidth={1.5} strokeLinejoin="round" />
    <Path d="M80 52 L80 20 L56 38 Z" fill="#fff" stroke="#E6E0D8" strokeWidth={1.5} strokeLinejoin="round" />
    <Path d="M25 44 L25 29 L37 38 Z" fill="#F4A6B4" />
    <Path d="M75 44 L75 29 L63 38 Z" fill="#F4A6B4" />
    <Ellipse cx={50} cy={58} rx={32} ry={27} fill="#fff" stroke="#E6E0D8" strokeWidth={1.5} />
    <Path d="M22 48 Q24 34 40 36 Q34 52 22 56 Z" fill="#F0A04B" />
    <Path d="M78 46 Q76 34 62 36 Q68 50 78 54 Z" fill="#3A3A3A" />
    <Path d="M33 56 Q39 49 45 56 M55 56 Q61 49 67 56" stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none" />
    <Path d="M46.5 62 L53.5 62 L50 66 Z" fill="#E87A8C" />
    <Path d="M50 66 Q46 71 42 67 M50 66 Q54 71 58 67" stroke={INK} strokeWidth={1.6} strokeLinecap="round" fill="none" />
    <Path d="M26 64 L14 62 M26 68 L14 71 M74 64 L86 62 M74 68 L86 71" stroke="#B8B0A6" strokeWidth={1.2} strokeLinecap="round" />
    <Ellipse cx={30} cy={66} rx={4.5} ry={3} fill={BLUSH} opacity={0.55} />
    <Ellipse cx={70} cy={66} rx={4.5} ry={3} fill={BLUSH} opacity={0.55} />
    <Path d="M22 80 Q50 92 78 80 L78 87 Q50 99 22 87 Z" fill="#D32F3F" />
    <Circle cx={50} cy={92} r={6} fill="#F6C945" stroke="#C99A1A" strokeWidth={1.2} />
    <Path d="M46 92 L54 92" stroke="#C99A1A" strokeWidth={1.4} />
  </G>
);

const Kappa = () => (
  <G>
    <Rect width={100} height={100} fill="#D4EEF0" />
    <Ellipse cx={50} cy={58} rx={31} ry={27} fill="#7CC6A0" />
    <Path d="M20 46 Q22 20 50 20 Q78 20 80 46 Q66 36 50 38 Q34 36 20 46 Z" fill="#2B2B33" />
    <Ellipse cx={50} cy={24} rx={14} ry={5.5} fill="#BFE9F2" stroke="#4A9BA8" strokeWidth={1.4} />
    <Circle cx={39} cy={52} r={7} fill="#fff" />
    <Circle cx={61} cy={52} r={7} fill="#fff" />
    <Circle cx={40} cy={53} r={3.2} fill={INK} />
    <Circle cx={60} cy={53} r={3.2} fill={INK} />
    <Circle cx={41} cy={51.5} r={1.1} fill="#fff" />
    <Circle cx={61} cy={51.5} r={1.1} fill="#fff" />
    <Ellipse cx={50} cy={68} rx={15} ry={8.5} fill="#F6C945" />
    <Path d="M36 68 Q50 72 64 68" stroke="#B8860B" strokeWidth={1.6} fill="none" />
    <Circle cx={46} cy={65} r={1} fill="#B8860B" />
    <Circle cx={54} cy={65} r={1} fill="#B8860B" />
    <Ellipse cx={28} cy={64} rx={4.5} ry={3} fill={BLUSH} opacity={0.55} />
    <Ellipse cx={72} cy={64} rx={4.5} ry={3} fill={BLUSH} opacity={0.55} />
    <Rect x={64} y={82} width={28} height={10} rx={5} fill="#3E9B4F" transform="rotate(-25 78 87)" />
  </G>
);

// ------------------------------------------------------------ Anime
const SpikyHero = () => (
  <G>
    <Rect width={100} height={100} fill="#FFD9A8" />
    <Path d="M50 50 L0 20 L0 40Z M50 50 L100 20 L100 40Z M50 50 L0 80 L0 62Z M50 50 L100 80 L100 62Z" fill="#FFC27A" opacity={0.6} />
    <Ellipse cx={50} cy={60} rx={23} ry={25} fill={SKIN} />
    <Path d="M26 56 L14 34 L32 40 L30 12 L44 30 L52 4 L58 30 L72 10 L70 40 L86 34 L74 56 Q64 42 50 44 Q36 42 26 56 Z" fill="#F28C28" />
    <Path d="M27 50 Q50 40 73 50 L73 57 Q50 48 27 57 Z" fill="#2E5CB8" />
    <Rect x={43} y={44} width={14} height={8} rx={1.5} fill="#C9D3E8" transform="rotate(2 50 48)" />
    <Path d="M35 58 L45 61 M65 58 L55 61" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
    <Ellipse cx={40} cy={65} rx={3.4} ry={4.4} fill={INK} />
    <Ellipse cx={60} cy={65} rx={3.4} ry={4.4} fill={INK} />
    <Circle cx={41.2} cy={63.4} r={1.3} fill="#fff" />
    <Circle cx={61.2} cy={63.4} r={1.3} fill="#fff" />
    <Path d="M42 74 Q50 83 58 74 Z" fill="#fff" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
  </G>
);

const Ninja = () => (
  <G>
    <Rect width={100} height={100} fill="#C9D3E8" />
    <Circle cx={50} cy={54} r={31} fill="#2F3E6B" />
    <Ellipse cx={50} cy={52} rx={22} ry={10} fill={SKIN} />
    <Path d="M20 42 Q50 30 80 42 L80 50 Q50 38 20 50 Z" fill="#1F2B52" />
    <Rect x={40} y={34} width={20} height={11} rx={2.5} fill="#C9D3E8" />
    <Path d="M45 40 L50 36 L55 40 L50 44 Z" fill="#2F3E6B" />
    <Path d="M33 49 L44 53 M67 49 L56 53" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
    <Ellipse cx={39} cy={55} rx={3} ry={3.6} fill={INK} />
    <Ellipse cx={61} cy={55} rx={3} ry={3.6} fill={INK} />
    <Circle cx={40} cy={54} r={1.1} fill="#fff" />
    <Circle cx={62} cy={54} r={1.1} fill="#fff" />
  </G>
);

const MagicalGirl = () => (
  <G>
    <Rect width={100} height={100} fill="#FBD3E8" />
    <Star x={14} y={16} s={0.9} fill="#fff" />
    <Star x={88} y={80} s={1} fill="#fff" />
    <Ellipse cx={17} cy={64} rx={10} ry={23} fill="#FF8FC7" transform="rotate(8 17 64)" />
    <Ellipse cx={83} cy={64} rx={10} ry={23} fill="#FF8FC7" transform="rotate(-8 83 64)" />
    <Ellipse cx={50} cy={52} rx={31} ry={33} fill="#FF8FC7" />
    <Ellipse cx={50} cy={58} rx={22} ry={25} fill={SKIN} />
    <Path d="M27 54 Q30 24 52 24 Q74 26 73 54 Q64 38 52 40 Q40 36 27 54 Z" fill="#FF8FC7" />
    <Circle cx={22} cy={38} r={5} fill="#7A4BD6" />
    <Circle cx={78} cy={38} r={5} fill="#7A4BD6" />
    <Ellipse cx={41} cy={60} rx={5} ry={7} fill="#7A4BD6" />
    <Ellipse cx={59} cy={60} rx={5} ry={7} fill="#7A4BD6" />
    <Ellipse cx={41} cy={62} rx={2.6} ry={3.6} fill="#3E1F8F" />
    <Ellipse cx={59} cy={62} rx={2.6} ry={3.6} fill="#3E1F8F" />
    <Circle cx={39} cy={57.5} r={1.8} fill="#fff" />
    <Circle cx={57} cy={57.5} r={1.8} fill="#fff" />
    <Cheeks y={70} dx={15} />
    <Path d="M46 72 Q48 75 50 72 Q52 75 54 72" stroke={INK} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <Star x={68} y={33} s={1.1} />
  </G>
);

const Samurai = () => (
  <G>
    <Rect width={100} height={100} fill="#EBD9D2" />
    <Path d="M6 100 Q10 80 34 80 L66 80 Q90 80 94 100 Z" fill="#B8323F" />
    <Path d="M14 92 L86 92 M20 86 L80 86" stroke="#F6C945" strokeWidth={1.6} />
    <Circle cx={50} cy={13} r={7} fill="#1F1F26" />
    <Rect x={46} y={18} width={8} height={9} fill="#1F1F26" />
    <Ellipse cx={50} cy={42} rx={24} ry={16} fill="#1F1F26" />
    <Ellipse cx={50} cy={60} rx={21} ry={23} fill={SKIN} />
    <Path d="M28 50 Q50 34 72 50 Q62 44 50 46 Q38 44 28 50 Z" fill="#1F1F26" />
    <Path d="M28 46 Q50 38 72 46 L72 53 Q50 45 28 53 Z" fill="#fff" />
    <Circle cx={50} cy={46} r={3.6} fill="#D6364B" />
    <Path d="M33 59 L44 62 M67 59 L56 62" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
    <Ellipse cx={40} cy={65} rx={2.8} ry={3.4} fill={INK} />
    <Ellipse cx={60} cy={65} rx={2.8} ry={3.4} fill={INK} />
    <Path d="M44 75 L56 75" stroke={INK} strokeWidth={2} strokeLinecap="round" />
  </G>
);

const Slime = () => (
  <G>
    <Rect width={100} height={100} fill="#DDF0FF" />
    <Path d="M50 14 Q64 38 80 60 Q92 90 66 90 L34 90 Q8 90 20 60 Q36 38 50 14 Z" fill="#5AB9F0" />
    <Path d="M50 14 Q64 38 80 60 Q92 90 66 90 L34 90 Q8 90 20 60 Q36 38 50 14 Z" fill="none" stroke="#3A94CC" strokeWidth={2} />
    <Ellipse cx={34} cy={52} rx={5} ry={10} fill="#fff" opacity={0.5} transform="rotate(20 34 52)" />
    <Ellipse cx={40} cy={66} rx={5} ry={7} fill={INK} />
    <Ellipse cx={60} cy={66} rx={5} ry={7} fill={INK} />
    <Circle cx={41.5} cy={63.5} r={2} fill="#fff" />
    <Circle cx={61.5} cy={63.5} r={2} fill="#fff" />
    <Path d="M44 76 Q50 82 56 76" stroke={INK} strokeWidth={2} strokeLinecap="round" fill="none" />
    <Ellipse cx={30} cy={74} rx={4.5} ry={3} fill="#FF9AA2" opacity={0.6} />
    <Ellipse cx={70} cy={74} rx={4.5} ry={3} fill="#FF9AA2" opacity={0.6} />
  </G>
);

// ------------------------------------------------------------ Animals
const Cat = () => (
  <G>
    <Rect width={100} height={100} fill="#E0E7F5" />
    <Path d="M18 54 L20 18 L44 36 Z" fill="#9AA3B5" />
    <Path d="M82 54 L80 18 L56 36 Z" fill="#9AA3B5" />
    <Path d="M24 42 L25 27 L37 36 Z" fill="#F4A6B4" />
    <Path d="M76 42 L75 27 L63 36 Z" fill="#F4A6B4" />
    <Ellipse cx={50} cy={58} rx={33} ry={28} fill="#9AA3B5" />
    <Path d="M50 32 L50 42 M42 34 L43 42 M58 34 L57 42" stroke="#6E778C" strokeWidth={2.6} strokeLinecap="round" />
    <Ellipse cx={50} cy={71} rx={13} ry={9} fill="#F1F3F8" />
    <Circle cx={37} cy={55} r={6.5} fill="#F2D13C" />
    <Circle cx={63} cy={55} r={6.5} fill="#F2D13C" />
    <Ellipse cx={37} cy={55} rx={2} ry={5} fill={INK} />
    <Ellipse cx={63} cy={55} rx={2} ry={5} fill={INK} />
    <Circle cx={38.4} cy={52.6} r={1.4} fill="#fff" />
    <Circle cx={64.4} cy={52.6} r={1.4} fill="#fff" />
    <Path d="M46.5 65 L53.5 65 L50 69 Z" fill="#E87A8C" />
    <Path d="M50 69 Q46 75 42 71 M50 69 Q54 75 58 71" stroke={INK} strokeWidth={1.6} strokeLinecap="round" fill="none" />
    <Path d="M30 68 L12 64 M30 72 L12 75 M70 68 L88 64 M70 72 L88 75" stroke="#6E778C" strokeWidth={1.2} strokeLinecap="round" />
  </G>
);

const Dog = () => (
  <G>
    <Rect width={100} height={100} fill="#FCE7C8" />
    <Ellipse cx={19} cy={54} rx={10} ry={23} fill="#8B5A2B" transform="rotate(10 19 54)" />
    <Ellipse cx={81} cy={54} rx={10} ry={23} fill="#8B5A2B" transform="rotate(-10 81 54)" />
    <Ellipse cx={50} cy={55} rx={28} ry={28} fill="#E8B777" />
    <Circle cx={36} cy={50} r={9} fill="#8B5A2B" opacity={0.85} />
    <Ellipse cx={50} cy={68} rx={16} ry={12} fill="#FFF1D6" />
    <Eyes y={50} dx={12} />
    <Ellipse cx={50} cy={62} rx={6.5} ry={4.5} fill="#2B2B33" />
    <Ellipse cx={48} cy={60.5} rx={2} ry={1.1} fill="#fff" opacity={0.6} />
    <Ellipse cx={50} cy={79} rx={4.5} ry={6} fill="#F08FA0" />
    <Path d="M50 66 L50 72 M50 72 Q44 77 40 72 M50 72 Q56 77 60 72" stroke="#5A3A22" strokeWidth={1.8} strokeLinecap="round" fill="none" />
  </G>
);

const Panda = () => (
  <G>
    <Rect width={100} height={100} fill="#DCEFD8" />
    <Circle cx={25} cy={27} r={11} fill="#2B2B33" />
    <Circle cx={75} cy={27} r={11} fill="#2B2B33" />
    <Circle cx={50} cy={57} r={33} fill="#fff" stroke="#E5E5E5" strokeWidth={1.5} />
    <Ellipse cx={35} cy={52} rx={8} ry={11} fill="#2B2B33" transform="rotate(22 35 52)" />
    <Ellipse cx={65} cy={52} rx={8} ry={11} fill="#2B2B33" transform="rotate(-22 65 52)" />
    <Circle cx={36} cy={52} r={3.4} fill="#fff" />
    <Circle cx={64} cy={52} r={3.4} fill="#fff" />
    <Circle cx={36.4} cy={52.4} r={1.8} fill="#111" />
    <Circle cx={63.6} cy={52.4} r={1.8} fill="#111" />
    <Ellipse cx={50} cy={65} rx={5.5} ry={3.8} fill="#2B2B33" />
    <Path d="M50 68 Q50 75 44 74 M50 68 Q50 75 56 74" stroke="#2B2B33" strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <Cheeks y={70} dx={20} />
  </G>
);

const Bunny = () => (
  <G>
    <Rect width={100} height={100} fill="#FBE0EA" />
    <Ellipse cx={35} cy={28} rx={9} ry={24} fill="#fff" stroke="#EADDE2" strokeWidth={1.5} transform="rotate(-8 35 40)" />
    <Ellipse cx={65} cy={28} rx={9} ry={24} fill="#fff" stroke="#EADDE2" strokeWidth={1.5} transform="rotate(8 65 40)" />
    <Ellipse cx={35} cy={30} rx={4.5} ry={17} fill="#F4A6B4" transform="rotate(-8 35 40)" />
    <Ellipse cx={65} cy={30} rx={4.5} ry={17} fill="#F4A6B4" transform="rotate(8 65 40)" />
    <Ellipse cx={50} cy={64} rx={30} ry={26} fill="#fff" stroke="#EADDE2" strokeWidth={1.5} />
    <Eyes y={60} dx={12} />
    <Path d="M46.5 67 L53.5 67 L50 71 Z" fill="#E87A8C" />
    <Path d="M50 71 Q46 75 43 72 M50 71 Q54 75 57 72" stroke={INK} strokeWidth={1.6} strokeLinecap="round" fill="none" />
    <Rect x={46} y={74} width={8} height={7} rx={1.5} fill="#fff" stroke="#D9CDD2" strokeWidth={1.2} />
    <Cheeks y={70} dx={19} />
  </G>
);

const Penguin = () => (
  <G>
    <Rect width={100} height={100} fill="#D6ECFA" />
    <Ellipse cx={14} cy={76} rx={8} ry={20} fill="#2B3342" transform="rotate(18 14 76)" />
    <Ellipse cx={86} cy={76} rx={8} ry={20} fill="#2B3342" transform="rotate(-18 86 76)" />
    <Ellipse cx={50} cy={56} rx={33} ry={38} fill="#2B3342" />
    <Path d="M50 40 Q30 34 28 54 Q28 76 50 82 Q72 76 72 54 Q70 34 50 40 Z" fill="#fff" />
    <Circle cx={39} cy={52} r={4.5} fill="#fff" stroke="#2B3342" strokeWidth={1} />
    <Circle cx={61} cy={52} r={4.5} fill="#fff" stroke="#2B3342" strokeWidth={1} />
    <Circle cx={39.5} cy={52.5} r={2.4} fill={INK} />
    <Circle cx={60.5} cy={52.5} r={2.4} fill={INK} />
    <Path d="M42 60 Q50 55 58 60 Q50 71 42 60 Z" fill="#F59E0B" />
    <Path d="M43 61 Q50 64 57 61" stroke="#C97A00" strokeWidth={1.2} fill="none" />
    <Ellipse cx={33} cy={63} rx={4} ry={2.6} fill={BLUSH} opacity={0.6} />
    <Ellipse cx={67} cy={63} rx={4} ry={2.6} fill={BLUSH} opacity={0.6} />
  </G>
);

const Owl = () => (
  <G>
    <Rect width={100} height={100} fill="#EADFCB" />
    <Path d="M20 40 L22 14 L42 28 Z" fill="#8B6B4A" />
    <Path d="M80 40 L78 14 L58 28 Z" fill="#8B6B4A" />
    <Ellipse cx={14} cy={68} rx={9} ry={20} fill="#6B4F35" transform="rotate(14 14 68)" />
    <Ellipse cx={86} cy={68} rx={9} ry={20} fill="#6B4F35" transform="rotate(-14 86 68)" />
    <Ellipse cx={50} cy={58} rx={34} ry={37} fill="#8B6B4A" />
    <Path d="M38 76 L44 82 L50 76 L56 82 L62 76 M38 86 L44 92 L50 86 L56 92 L62 86" stroke="#C9AA82" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Circle cx={36} cy={48} r={16} fill="#F3E3C3" />
    <Circle cx={64} cy={48} r={16} fill="#F3E3C3" />
    <Circle cx={36} cy={48} r={9} fill="#F2B134" />
    <Circle cx={64} cy={48} r={9} fill="#F2B134" />
    <Circle cx={36} cy={48} r={4.6} fill={INK} />
    <Circle cx={64} cy={48} r={4.6} fill={INK} />
    <Circle cx={37.6} cy={46.2} r={1.5} fill="#fff" />
    <Circle cx={65.6} cy={46.2} r={1.5} fill="#fff" />
    <Path d="M45 58 L55 58 L50 70 Z" fill="#F08A3C" />
  </G>
);

const Bear = () => (
  <G>
    <Rect width={100} height={100} fill="#F2E4D3" />
    <Circle cx={24} cy={28} r={11} fill="#8B5A2B" />
    <Circle cx={76} cy={28} r={11} fill="#8B5A2B" />
    <Circle cx={24} cy={28} r={5.5} fill="#D9A878" />
    <Circle cx={76} cy={28} r={5.5} fill="#D9A878" />
    <Circle cx={50} cy={57} r={33} fill="#A9703A" />
    <Ellipse cx={50} cy={68} rx={15} ry={12} fill="#E9C99B" />
    <Eyes y={50} dx={14} ry={3.8} />
    <Ellipse cx={50} cy={62} rx={6} ry={4.2} fill="#2B1B14" />
    <Ellipse cx={48.2} cy={60.6} rx={1.8} ry={1} fill="#fff" opacity={0.6} />
    <Path d="M50 66 Q50 73 44 72 M50 66 Q50 73 56 72" stroke="#2B1B14" strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <Cheeks y={64} dx={24} />
  </G>
);

const Koala = () => (
  <G>
    <Rect width={100} height={100} fill="#DCE8EF" />
    <Circle cx={19} cy={42} r={16} fill="#9AA0A8" />
    <Circle cx={81} cy={42} r={16} fill="#9AA0A8" />
    <Circle cx={19} cy={42} r={9} fill="#E8E8EE" />
    <Circle cx={81} cy={42} r={9} fill="#E8E8EE" />
    <Ellipse cx={50} cy={58} rx={29} ry={28} fill="#B7BCC4" />
    <Ellipse cx={50} cy={74} rx={13} ry={10} fill="#E8E8EE" />
    <Eyes y={50} dx={14} ry={3.6} />
    <Ellipse cx={50} cy={61} rx={8.5} ry={11.5} fill="#2B2B33" />
    <Ellipse cx={47} cy={56} rx={2.4} ry={3.4} fill="#fff" opacity={0.45} />
    <Path d="M45 76 Q50 80 55 76" stroke={INK} strokeWidth={1.8} strokeLinecap="round" fill="none" />
  </G>
);

// ------------------------------------------------------------ More animals
const Fox = () => (
  <G>
    <Rect width={100} height={100} fill="#FFE8D1" />
    <Path d="M18 52 L20 12 L46 34 Z" fill="#E8762B" />
    <Path d="M82 52 L80 12 L54 34 Z" fill="#E8762B" />
    <Path d="M24 38 L21 20 L36 32 Z" fill="#3B2A2A" />
    <Path d="M76 38 L79 20 L64 32 Z" fill="#3B2A2A" />
    <Ellipse cx={50} cy={58} rx={32} ry={27} fill="#E8762B" />
    <Path d="M22 60 Q50 54 78 60 Q72 88 50 90 Q28 88 22 60 Z" fill="#fff" />
    <Eyes y={54} dx={14} ry={4} />
    <Ellipse cx={50} cy={72} rx={5} ry={3.6} fill={INK} />
    <Path d="M50 75 Q50 80 45 79 M50 75 Q50 80 55 79" stroke={INK} strokeWidth={1.8} strokeLinecap="round" fill="none" />
  </G>
);

const Pig = () => (
  <G>
    <Rect width={100} height={100} fill="#FDE2E4" />
    <Path d="M18 44 L22 18 L42 30 Z" fill="#F4A6B4" />
    <Path d="M82 44 L78 18 L58 30 Z" fill="#F4A6B4" />
    <Ellipse cx={50} cy={57} rx={33} ry={29} fill="#F8B8C4" />
    <Ellipse cx={50} cy={66} rx={15} ry={11} fill="#F08FA0" />
    <Ellipse cx={45} cy={66} rx={2.6} ry={4} fill="#C45C70" />
    <Ellipse cx={55} cy={66} rx={2.6} ry={4} fill="#C45C70" />
    <Eyes y={48} dx={15} />
    <Ellipse cx={24} cy={62} rx={5} ry={3.4} fill="#F27C95" opacity={0.5} />
    <Ellipse cx={76} cy={62} rx={5} ry={3.4} fill="#F27C95" opacity={0.5} />
  </G>
);

const Monkey = () => (
  <G>
    <Rect width={100} height={100} fill="#F6E7C8" />
    <Circle cx={15} cy={54} r={11} fill="#8B5A2B" />
    <Circle cx={85} cy={54} r={11} fill="#8B5A2B" />
    <Circle cx={15} cy={54} r={6} fill="#F3C9A0" />
    <Circle cx={85} cy={54} r={6} fill="#F3C9A0" />
    <Circle cx={50} cy={50} r={32} fill="#8B5A2B" />
    <Circle cx={39} cy={47} r={11} fill="#F3C9A0" />
    <Circle cx={61} cy={47} r={11} fill="#F3C9A0" />
    <Ellipse cx={50} cy={64} rx={22} ry={19} fill="#F3C9A0" />
    <Eyes y={48} dx={11} />
    <Circle cx={46.5} cy={60} r={1.3} fill="#8B5A2B" />
    <Circle cx={53.5} cy={60} r={1.3} fill="#8B5A2B" />
    <Path d="M40 69 Q50 79 60 69" stroke={INK} strokeWidth={2} strokeLinecap="round" fill="none" />
  </G>
);

const Lion = () => (
  <G>
    <Rect width={100} height={100} fill="#FBE3B0" />
    <Circle cx={50} cy={54} r={39} fill="#B5651D" />
    <Circle cx={27} cy={26} r={9} fill="#D99A4E" />
    <Circle cx={73} cy={26} r={9} fill="#D99A4E" />
    <Circle cx={27} cy={26} r={4.5} fill="#F6C99A" />
    <Circle cx={73} cy={26} r={4.5} fill="#F6C99A" />
    <Circle cx={50} cy={55} r={27} fill="#F2C27A" />
    <Ellipse cx={50} cy={66} rx={14} ry={10} fill="#FFF1D6" />
    <Path d="M44.5 58 L55.5 58 L50 65 Z" fill="#5A3A22" />
    <Path d="M50 65 L50 69 M50 69 Q45 74 41 69 M50 69 Q55 74 59 69" stroke="#5A3A22" strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <Eyes y={49} dx={11} />
  </G>
);

const Elephant = () => (
  <G>
    <Rect width={100} height={100} fill="#DDE8F2" />
    <Circle cx={17} cy={50} r={20} fill="#A9B2BD" />
    <Circle cx={83} cy={50} r={20} fill="#A9B2BD" />
    <Circle cx={17} cy={50} r={12} fill="#E9B7C0" />
    <Circle cx={83} cy={50} r={12} fill="#E9B7C0" />
    <Circle cx={50} cy={50} r={29} fill="#BCC5CF" />
    <Path d="M41 56 Q40 84 52 90 Q62 92 60 82 Q56 84 55 76 L59 56 Z" fill="#BCC5CF" stroke="#9AA3AE" strokeWidth={1.5} strokeLinejoin="round" />
    <Path d="M45 66 L55 66 M44 73 L55 73" stroke="#9AA3AE" strokeWidth={1.2} strokeLinecap="round" />
    <Eyes y={46} dx={13} ry={3.8} />
    <Ellipse cx={30} cy={58} rx={4.5} ry={3} fill={BLUSH} opacity={0.55} />
    <Ellipse cx={70} cy={58} rx={4.5} ry={3} fill={BLUSH} opacity={0.55} />
  </G>
);

const Tiger = () => (
  <G>
    <Rect width={100} height={100} fill="#FFE6BF" />
    <Circle cx={25} cy={28} r={10} fill="#F29B2E" />
    <Circle cx={75} cy={28} r={10} fill="#F29B2E" />
    <Circle cx={25} cy={28} r={5} fill="#FFF1D6" />
    <Circle cx={75} cy={28} r={5} fill="#FFF1D6" />
    <Circle cx={50} cy={56} r={32} fill="#F29B2E" />
    <Path d="M50 26 L50 38 M41 28 L43 38 M59 28 L57 38 M19 52 L29 54 M19 61 L28 60 M81 52 L71 54 M81 61 L72 60" stroke="#2B2B33" strokeWidth={3} strokeLinecap="round" />
    <Ellipse cx={50} cy={68} rx={16} ry={11} fill="#FFF1D6" />
    <Ellipse cx={36} cy={48} rx={6} ry={4} fill="#FFF1D6" />
    <Ellipse cx={64} cy={48} rx={6} ry={4} fill="#FFF1D6" />
    <Eyes y={51} dx={14} ry={3.8} />
    <Path d="M45 60 L55 60 L50 66 Z" fill="#E87A8C" />
    <Path d="M50 66 L50 70 M50 70 Q45 75 41 70 M50 70 Q55 75 59 70" stroke="#5A3A22" strokeWidth={1.8} strokeLinecap="round" fill="none" />
  </G>
);

const Hedgehog = () => {
  const quills = Array.from({ length: 15 }, (_, i) => {
    const a = Math.PI * (0.92 + (1.16 * i) / 14);
    const d = 0.13;
    const pt = (r: number, ang: number) => `${50 + Math.cos(ang) * r} ${58 + Math.sin(ang) * r}`;
    return `M${pt(28, a - d)} L${pt(44, a)} L${pt(28, a + d)} Z`;
  });
  return (
    <G>
      <Rect width={100} height={100} fill="#EDE3D3" />
      {quills.map((d, i) => (
        <Path key={i} d={d} fill="#6B4F35" />
      ))}
      <Circle cx={50} cy={58} r={30} fill="#7A5C3E" />
      <Ellipse cx={50} cy={64} rx={25} ry={23} fill="#F3D9B5" />
      <Circle cx={27} cy={46} r={6} fill="#F3D9B5" />
      <Circle cx={73} cy={46} r={6} fill="#F3D9B5" />
      <Ellipse cx={50} cy={72} rx={11} ry={8} fill="#E8C79B" />
      <Eyes y={58} dx={12} />
      <Circle cx={50} cy={71} r={3.6} fill={INK} />
      <Path d="M50 74 Q50 78 46 78 M50 74 Q50 78 54 78" stroke={INK} strokeWidth={1.5} strokeLinecap="round" fill="none" />
      <Cheeks y={68} dx={19} />
    </G>
  );
};

const Giraffe = () => (
  <G>
    <Rect width={100} height={100} fill="#FFF0C9" />
    <Path d="M38 24 L37 12 M62 24 L63 12" stroke="#C99A1A" strokeWidth={3} strokeLinecap="round" />
    <Circle cx={37} cy={11} r={4} fill="#8B5A2B" />
    <Circle cx={63} cy={11} r={4} fill="#8B5A2B" />
    <Ellipse cx={20} cy={40} rx={12} ry={7} fill="#F2C14E" transform="rotate(-25 20 40)" />
    <Ellipse cx={80} cy={40} rx={12} ry={7} fill="#F2C14E" transform="rotate(25 80 40)" />
    <Ellipse cx={50} cy={56} rx={26} ry={30} fill="#F2C14E" />
    <Circle cx={36} cy={36} r={5} fill="#B5742A" />
    <Circle cx={61} cy={32} r={4} fill="#B5742A" />
    <Circle cx={66} cy={46} r={3.2} fill="#B5742A" />
    <Circle cx={30} cy={50} r={3} fill="#B5742A" />
    <Ellipse cx={50} cy={73} rx={17} ry={13} fill="#F9E4A8" />
    <Eyes y={52} dx={12} />
    <Ellipse cx={43} cy={70} rx={2.4} ry={3.4} fill="#8B5A2B" />
    <Ellipse cx={57} cy={70} rx={2.4} ry={3.4} fill="#8B5A2B" />
    <Path d="M44 79 Q50 84 56 79" stroke="#5A3A22" strokeWidth={1.8} strokeLinecap="round" fill="none" />
  </G>
);

// ------------------------------------------------------------ Fun & fantasy
const Robot = () => (
  <G>
    <Rect width={100} height={100} fill="#D5E3F0" />
    <Path d="M50 28 L50 14" stroke="#8896A6" strokeWidth={3} strokeLinecap="round" />
    <Circle cx={50} cy={12} r={5} fill="#E8453C" />
    <Rect x={12} y={44} width={10} height={20} rx={4} fill="#8896A6" />
    <Rect x={78} y={44} width={10} height={20} rx={4} fill="#8896A6" />
    <Rect x={20} y={28} width={60} height={56} rx={14} fill="#C5D0DC" stroke="#8896A6" strokeWidth={2} />
    <Rect x={28} y={38} width={44} height={34} rx={9} fill="#1F2B3A" />
    <Circle cx={40} cy={52} r={5.5} fill="#6EE7F9" />
    <Circle cx={60} cy={52} r={5.5} fill="#6EE7F9" />
    <Circle cx={41.6} cy={50.4} r={1.6} fill="#fff" />
    <Circle cx={61.6} cy={50.4} r={1.6} fill="#fff" />
    <Path d="M41 63 Q50 69 59 63" stroke="#6EE7F9" strokeWidth={2.4} strokeLinecap="round" fill="none" />
    <Circle cx={25} cy={78} r={2} fill="#8896A6" />
    <Circle cx={75} cy={78} r={2} fill="#8896A6" />
  </G>
);

const Alien = () => (
  <G>
    <Rect width={100} height={100} fill="#2A2F55" />
    <Star x={14} y={16} s={0.7} fill="#fff" />
    <Star x={86} y={24} s={0.5} fill="#fff" />
    <Star x={80} y={84} s={0.8} fill="#FFD84D" />
    <Star x={16} y={80} s={0.5} fill="#fff" />
    <Path d="M38 24 L32 8 M62 24 L68 8" stroke="#5FBF3F" strokeWidth={2.4} strokeLinecap="round" />
    <Circle cx={32} cy={8} r={3.2} fill="#F28FB1" />
    <Circle cx={68} cy={8} r={3.2} fill="#F28FB1" />
    <Path d="M50 18 Q82 18 80 52 Q78 82 50 90 Q22 82 20 52 Q18 18 50 18 Z" fill="#7ED957" />
    <Ellipse cx={36} cy={50} rx={9} ry={14} fill="#1A1A22" transform="rotate(-22 36 50)" />
    <Ellipse cx={64} cy={50} rx={9} ry={14} fill="#1A1A22" transform="rotate(22 64 50)" />
    <Ellipse cx={33.5} cy={45} rx={2.6} ry={4} fill="#fff" opacity={0.8} transform="rotate(-22 33.5 45)" />
    <Ellipse cx={61.5} cy={45} rx={2.6} ry={4} fill="#fff" opacity={0.8} transform="rotate(22 61.5 45)" />
    <Path d="M44 74 Q50 78 56 74" stroke="#2F6B2A" strokeWidth={2} strokeLinecap="round" fill="none" />
  </G>
);

const Ghost = () => (
  <G>
    <Rect width={100} height={100} fill="#E6DDF5" />
    <Path d="M22 90 L22 50 Q22 16 50 16 Q78 16 78 50 L78 90 L68 82 L59 90 L50 82 L41 90 L32 82 Z" fill="#fff" stroke="#CFC3E6" strokeWidth={2} strokeLinejoin="round" />
    <Ellipse cx={39} cy={46} rx={4.2} ry={6} fill={INK} />
    <Ellipse cx={61} cy={46} rx={4.2} ry={6} fill={INK} />
    <Circle cx={40.4} cy={44} r={1.5} fill="#fff" />
    <Circle cx={62.4} cy={44} r={1.5} fill="#fff" />
    <Ellipse cx={50} cy={60} rx={4} ry={5} fill={INK} />
    <Ellipse cx={30} cy={56} rx={5} ry={3.2} fill={BLUSH} opacity={0.55} />
    <Ellipse cx={70} cy={56} rx={5} ry={3.2} fill={BLUSH} opacity={0.55} />
  </G>
);

const Unicorn = () => (
  <G>
    <Rect width={100} height={100} fill="#F3E0F7" />
    <Ellipse cx={24} cy={54} rx={12} ry={26} fill="#FF8FC7" transform="rotate(8 24 54)" />
    <Ellipse cx={78} cy={56} rx={11} ry={24} fill="#7A4BD6" transform="rotate(-8 78 56)" />
    <Ellipse cx={26} cy={74} rx={8} ry={14} fill="#63C7F5" transform="rotate(10 26 74)" />
    <Path d="M36 34 L33 16 L46 28 Z" fill="#fff" stroke="#E6D8EC" strokeWidth={1.2} strokeLinejoin="round" />
    <Path d="M64 34 L67 16 L54 28 Z" fill="#fff" stroke="#E6D8EC" strokeWidth={1.2} strokeLinejoin="round" />
    <Ellipse cx={50} cy={60} rx={26} ry={27} fill="#fff" stroke="#E6D8EC" strokeWidth={1.5} />
    <Path d="M30 46 Q48 26 70 42 Q58 34 50 44 Q40 36 30 46 Z" fill="#FF8FC7" />
    <Path d="M50 4 L44 32 L56 32 Z" fill="#F6C945" />
    <Path d="M47.4 17 L52.6 17 M46 25 L54 25" stroke="#E0A800" strokeWidth={1.6} />
    <Eyes y={58} dx={11} color="#7A4BD6" />
    <Ellipse cx={50} cy={74} rx={12} ry={8} fill="#F8D7E8" />
    <Circle cx={46} cy={74} r={1.4} fill="#C45C8A" />
    <Circle cx={54} cy={74} r={1.4} fill="#C45C8A" />
    <Cheeks y={66} dx={18} />
  </G>
);

const Dragon = () => (
  <G>
    <Rect width={100} height={100} fill="#E6F2D5" />
    <Path d="M30 34 L24 10 L42 28 Z" fill="#F3E7C9" />
    <Path d="M70 34 L76 10 L58 28 Z" fill="#F3E7C9" />
    <Path d="M42 30 L46 18 L50 28 L54 18 L58 30 Z" fill="#F2C14E" />
    <Ellipse cx={50} cy={58} rx={31} ry={27} fill="#4FB06D" />
    <Ellipse cx={50} cy={72} rx={17} ry={12} fill="#8AD39E" />
    <Circle cx={36} cy={52} r={7} fill="#F6C945" />
    <Circle cx={64} cy={52} r={7} fill="#F6C945" />
    <Ellipse cx={36} cy={52} rx={2} ry={5.2} fill={INK} />
    <Ellipse cx={64} cy={52} rx={2} ry={5.2} fill={INK} />
    <Circle cx={37.4} cy={49.6} r={1.4} fill="#fff" />
    <Circle cx={65.4} cy={49.6} r={1.4} fill="#fff" />
    <Ellipse cx={44} cy={70} rx={2.2} ry={3} fill="#2F7A48" />
    <Ellipse cx={56} cy={70} rx={2.2} ry={3} fill="#2F7A48" />
    <Path d="M42 79 Q50 84 58 79" stroke="#2F7A48" strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <Cheeks y={64} dx={24} />
  </G>
);

const Wizard = () => (
  <G>
    <Rect width={100} height={100} fill="#D9D4F5" />
    <Ellipse cx={50} cy={58} rx={20} ry={20} fill={SKIN} />
    <Path d="M28 58 Q28 92 50 98 Q72 92 72 58 Q62 72 50 68 Q38 72 28 58 Z" fill="#F4F4F8" />
    <Path d="M36 64 Q50 56 64 64 Q50 70 36 64 Z" fill="#fff" stroke="#DCDCE6" strokeWidth={1} />
    <Ellipse cx={50} cy={58} rx={4.5} ry={3.6} fill="#F2B99A" />
    <Ellipse cx={41} cy={52} rx={2.6} ry={3} fill={INK} />
    <Ellipse cx={59} cy={52} rx={2.6} ry={3} fill={INK} />
    <Path d="M36 47 Q41 44 46 47 M54 47 Q59 44 64 47" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
    <Path d="M24 44 Q38 34 50 4 Q60 34 76 44 Q50 50 24 44 Z" fill="#3B3FA8" />
    <Ellipse cx={50} cy={44} rx={32} ry={7.5} fill="#2E3190" />
    <Star x={50} y={30} s={1.1} />
    <Star x={42} y={16} s={0.5} />
    <Star x={60} y={22} s={0.5} />
  </G>
);

const Astronaut = () => (
  <G>
    <Rect width={100} height={100} fill="#1F2548" />
    <Star x={14} y={18} s={0.6} fill="#fff" />
    <Star x={88} y={14} s={0.8} fill="#FFD84D" />
    <Star x={90} y={82} s={0.5} fill="#fff" />
    <Star x={10} y={78} s={0.8} fill="#fff" />
    <Circle cx={50} cy={54} r={36} fill="#F3F5F8" stroke="#C5CBD6" strokeWidth={2} />
    <Ellipse cx={50} cy={54} rx={27} ry={24} fill="#2D3A66" />
    <Ellipse cx={50} cy={57} rx={16} ry={17} fill={SKIN} />
    <Path d="M34 52 Q50 36 66 52 Q58 46 50 48 Q42 46 34 52 Z" fill="#6B3E26" />
    <Eyes y={58} dx={7} />
    <Path d="M45 66 Q50 70 55 66" stroke={INK} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <Path d="M30 44 Q38 34 50 32" stroke="#fff" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.55} />
    <Circle cx={84} cy={60} r={5} fill="#E8453C" />
    <Circle cx={16} cy={60} r={5} fill="#4FA3E0" />
  </G>
);

// ------------------------------------------------------------ Parrot, spider, flower, frog, black cat
const Parrot = () => (
  <G>
    <Rect width={100} height={100} fill="#D5F0E3" />
    <Ellipse cx={40} cy={22} rx={5} ry={13} fill="#2E7DD6" transform="rotate(-18 40 30)" />
    <Ellipse cx={50} cy={18} rx={5} ry={14} fill="#F6C945" />
    <Ellipse cx={60} cy={22} rx={5} ry={13} fill="#4FB06D" transform="rotate(18 60 30)" />
    <Ellipse cx={50} cy={58} rx={30} ry={32} fill="#E8453C" />
    <Circle cx={34} cy={50} r={11} fill="#fff" />
    <Circle cx={66} cy={50} r={11} fill="#fff" />
    <Circle cx={35} cy={51} r={5} fill={INK} />
    <Circle cx={65} cy={51} r={5} fill={INK} />
    <Circle cx={36.6} cy={49.2} r={1.8} fill="#fff" />
    <Circle cx={66.6} cy={49.2} r={1.8} fill="#fff" />
    <Path d="M40 60 Q50 50 60 60 Q62 74 50 84 Q38 74 40 60 Z" fill="#F6C945" stroke="#C99A1A" strokeWidth={1.4} strokeLinejoin="round" />
    <Path d="M43 68 Q50 72 57 68" stroke="#C99A1A" strokeWidth={1.4} fill="none" />
    <Circle cx={46.5} cy={61} r={1.2} fill="#C99A1A" />
    <Circle cx={53.5} cy={61} r={1.2} fill="#C99A1A" />
  </G>
);

const Spider = () => (
  <G>
    <Rect width={100} height={100} fill="#E8DDF5" />
    <Path d="M50 0 L50 34" stroke="#B8A9CF" strokeWidth={1.6} />
    <G stroke="#2B2236" strokeWidth={4.5} strokeLinecap="round" fill="none">
      <Path d="M28 48 Q10 34 8 52" />
      <Path d="M26 58 Q7 54 8 70" />
      <Path d="M28 66 Q12 70 14 86" />
      <Path d="M34 72 Q24 82 28 94" />
      <Path d="M72 48 Q90 34 92 52" />
      <Path d="M74 58 Q93 54 92 70" />
      <Path d="M72 66 Q88 70 86 86" />
      <Path d="M66 72 Q76 82 72 94" />
    </G>
    <Ellipse cx={50} cy={58} rx={28} ry={26} fill="#3B2F4A" />
    <Circle cx={40} cy={54} r={8} fill="#fff" />
    <Circle cx={60} cy={54} r={8} fill="#fff" />
    <Circle cx={41} cy={55} r={4} fill={INK} />
    <Circle cx={59} cy={55} r={4} fill={INK} />
    <Circle cx={42.4} cy={53.4} r={1.4} fill="#fff" />
    <Circle cx={60.4} cy={53.4} r={1.4} fill="#fff" />
    <Circle cx={46} cy={42} r={2.6} fill="#fff" />
    <Circle cx={54} cy={42} r={2.6} fill="#fff" />
    <Path d="M43 68 Q50 74 57 68" stroke="#fff" strokeWidth={2} strokeLinecap="round" fill="none" />
    <Ellipse cx={30} cy={64} rx={4.5} ry={3} fill="#F28FB1" opacity={0.6} />
    <Ellipse cx={70} cy={64} rx={4.5} ry={3} fill="#F28FB1" opacity={0.6} />
  </G>
);

const Flower = () => (
  <G>
    <Rect width={100} height={100} fill="#E3F4D9" />
    {Array.from({ length: 8 }, (_, i) => (
      <Ellipse key={i} cx={50} cy={27} rx={11.5} ry={18} fill="#FF8FC7" stroke="#F06DB0" strokeWidth={1.2} transform={`rotate(${i * 45} 50 52)`} />
    ))}
    <Circle cx={50} cy={52} r={22} fill="#F6C945" />
    <Eyes y={49} dx={9} />
    <Cheeks y={58} dx={14} />
    <Smile y={58} w={6} />
  </G>
);

const Frog = () => (
  <G>
    <Rect width={100} height={100} fill="#FFF4C9" />
    <Ellipse cx={50} cy={62} rx={38} ry={28} fill="#8FD14F" />
    <Circle cx={28} cy={38} r={13} fill="#8FD14F" />
    <Circle cx={72} cy={38} r={13} fill="#8FD14F" />
    <Circle cx={28} cy={38} r={9} fill="#fff" />
    <Circle cx={72} cy={38} r={9} fill="#fff" />
    <Circle cx={29.5} cy={39} r={4.6} fill={INK} />
    <Circle cx={70.5} cy={39} r={4.6} fill={INK} />
    <Circle cx={31} cy={37} r={1.5} fill="#fff" />
    <Circle cx={72} cy={37} r={1.5} fill="#fff" />
    <Circle cx={44} cy={30} r={3} fill="#6FB03A" />
    <Circle cx={56} cy={26} r={2.4} fill="#6FB03A" />
    <Circle cx={50} cy={40} r={2.6} fill="#6FB03A" />
    <Path d="M20 64 Q50 96 80 64 Q50 72 20 64 Z" fill="#C0394F" stroke="#2F6B2A" strokeWidth={2} strokeLinejoin="round" />
    <Ellipse cx={50} cy={80} rx={9} ry={5} fill="#F28FA0" />
    <Circle cx={46} cy={56} r={1.4} fill="#2F6B2A" />
    <Circle cx={54} cy={56} r={1.4} fill="#2F6B2A" />
    <Ellipse cx={24} cy={66} rx={5} ry={3} fill={BLUSH} opacity={0.7} />
    <Ellipse cx={76} cy={66} rx={5} ry={3} fill={BLUSH} opacity={0.7} />
  </G>
);

const BlackCat = () => (
  <G>
    <Rect width={100} height={100} fill="#FFE8B3" />
    <Path d="M18 54 L20 16 L44 36 Z" fill="#2B2B36" />
    <Path d="M82 54 L80 16 L56 36 Z" fill="#2B2B36" />
    <Path d="M24 42 L25 25 L37 35 Z" fill="#F4A6B4" />
    <Path d="M76 42 L75 25 L63 35 Z" fill="#F4A6B4" />
    <Ellipse cx={50} cy={58} rx={33} ry={28} fill="#2B2B36" />
    <Ellipse cx={50} cy={71} rx={13} ry={9} fill="#3E3E4D" />
    <Circle cx={37} cy={55} r={7} fill="#F6E04A" />
    <Circle cx={63} cy={55} r={7} fill="#F6E04A" />
    <Ellipse cx={37} cy={55} rx={2} ry={5.5} fill="#111" />
    <Ellipse cx={63} cy={55} rx={2} ry={5.5} fill="#111" />
    <Circle cx={38.6} cy={52.6} r={1.5} fill="#fff" />
    <Circle cx={64.6} cy={52.6} r={1.5} fill="#fff" />
    <Path d="M46.5 65 L53.5 65 L50 69 Z" fill="#E87A8C" />
    <Path d="M50 69 Q46 75 42 71 M50 69 Q54 75 58 71" stroke="#C9C9D6" strokeWidth={1.6} strokeLinecap="round" fill="none" />
    <Path d="M30 68 L12 64 M30 72 L12 75 M70 68 L88 64 M70 72 L88 75" stroke="#C9C9D6" strokeWidth={1.2} strokeLinecap="round" />
  </G>
);

export const AVATARS: AvatarDef[] = [
  { id: 'red-hood', Art: RedHood },
  { id: 'frog-prince', Art: FrogPrince },
  { id: 'puss-in-boots', Art: PussInBoots },
  { id: 'pinocchio', Art: Pinocchio },
  { id: 'mad-hatter', Art: MadHatter },
  { id: 'tanuki', Art: Tanuki },
  { id: 'kitsune', Art: Kitsune },
  { id: 'lucky-cat', Art: LuckyCat },
  { id: 'kappa', Art: Kappa },
  { id: 'ninja', Art: Ninja },
  { id: 'samurai', Art: Samurai },
  { id: 'magical-girl', Art: MagicalGirl },
  { id: 'spiky-hero', Art: SpikyHero },
  { id: 'slime', Art: Slime },
  { id: 'cat', Art: Cat },
  { id: 'dog', Art: Dog },
  { id: 'panda', Art: Panda },
  { id: 'bunny', Art: Bunny },
  { id: 'penguin', Art: Penguin },
  { id: 'owl', Art: Owl },
  { id: 'bear', Art: Bear },
  { id: 'koala', Art: Koala },
  { id: 'fox', Art: Fox },
  { id: 'pig', Art: Pig },
  { id: 'monkey', Art: Monkey },
  { id: 'lion', Art: Lion },
  { id: 'elephant', Art: Elephant },
  { id: 'tiger', Art: Tiger },
  { id: 'hedgehog', Art: Hedgehog },
  { id: 'giraffe', Art: Giraffe },
  { id: 'robot', Art: Robot },
  { id: 'alien', Art: Alien },
  { id: 'ghost', Art: Ghost },
  { id: 'unicorn', Art: Unicorn },
  { id: 'dragon', Art: Dragon },
  { id: 'wizard', Art: Wizard },
  { id: 'astronaut', Art: Astronaut },
  { id: 'parrot', Art: Parrot },
  { id: 'spider', Art: Spider },
  { id: 'flower', Art: Flower },
  { id: 'frog', Art: Frog },
  { id: 'black-cat', Art: BlackCat },
];


export const findAvatar = (value?: string | null) => {
  const id = avatarIdFrom(value);
  return id ? AVATARS.find((a) => a.id === id) ?? null : null;
};
