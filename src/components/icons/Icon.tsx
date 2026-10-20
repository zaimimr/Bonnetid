import { useId } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { CUSTOM_ICONS, type CustomIconName } from './custom';
import { PHOSPHOR, type PhosphorName } from './phosphor';

export type IconName = Exclude<PhosphorName, 'hand-palm'> | CustomIconName;

export type IconWeight = 'regular' | 'fill';

export type IconProps = {
  name: IconName;
  size?: number;
  color: string;
  weight?: IconWeight;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

function isCustom(name: IconName): name is CustomIconName {
  return name in CUSTOM_ICONS;
}

export function Icon({ name, size = 24, color, weight = 'regular', style, accessibilityLabel }: IconProps) {
  const id = `icon${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      style={style}
      accessible={accessibilityLabel !== undefined}
      accessibilityLabel={accessibilityLabel}>
      {isCustom(name)
        ? CUSTOM_ICONS[name](color, weight === 'fill', id)
        : PHOSPHOR[name][weight].map((d, i) => <Path key={i} d={d} fill={color} />)}
    </Svg>
  );
}
