import type { TextStyle } from 'react-native';
import { isRTL } from '@/lib/i18n';

export const mirrored: TextStyle | undefined = isRTL() ? { transform: [{ scaleX: -1 }] } : undefined;
