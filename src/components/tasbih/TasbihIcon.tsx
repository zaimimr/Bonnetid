import Svg, { Circle } from 'react-native-svg';

const BEADS = 11;
const FILLED = 8;

export function TasbihIcon({ size = 24, color }: { size?: number; color: string }) {
  const center = size / 2;
  const ring = size * 0.38;
  const bead = size * 0.085;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: BEADS }, (_, index) => {
        const angle = (index / BEADS) * Math.PI * 2 - Math.PI / 2;
        const filled = index < FILLED;
        return (
          <Circle
            key={index}
            cx={center + Math.cos(angle) * ring}
            cy={center + Math.sin(angle) * ring}
            r={bead}
            fill={filled ? color : 'none'}
            stroke={color}
            strokeWidth={filled ? 0 : size * 0.04}
          />
        );
      })}
    </Svg>
  );
}
