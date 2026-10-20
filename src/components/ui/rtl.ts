import type { ViewStyle } from 'react-native';
import { isRTL } from '@/lib/i18n';

export const mirrored: ViewStyle | undefined = isRTL() ? { transform: [{ scaleX: -1 }] } : undefined;
