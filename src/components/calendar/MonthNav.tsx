import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t, isRTL } from '@/lib/i18n';
import { AppText, IconButton } from '@/components/ui';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius, spacing } from '@/theme/tokens';

const CONTROL_SIZE = 44;

export type MonthNavProps = {
  title: string;
  subtitle?: string;
  onPrev: () => void;
  onNext: () => void;
  onToday?: () => void;
  onSwap?: () => void;
  swapLabel?: string;
};

export function MonthNav({
  title,
  subtitle,
  onPrev,
  onNext,
  onToday,
  onSwap,
  swapLabel,
}: MonthNavProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: spacing.md,
      }}>
      <Pressable
        onPress={onSwap}
        disabled={!onSwap}
        accessibilityRole={onSwap ? 'button' : undefined}
        accessibilityLabel={onSwap ? `${title}, ${subtitle ?? ''}. ${swapLabel ?? ''}` : undefined}
        style={({ pressed }) => [
          {
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: 0,
            minWidth: 0,
            gap: spacing.xxs,
            minHeight: CONTROL_SIZE,
            justifyContent: 'center',
          },
          pressed && { opacity: opacity.pressed },
        ]}>
        <AppText size="xl" weight="bold" heading numberOfLines={1}>
          {title}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <AppText
            size="sm"
            tone="textMuted"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{ flexShrink: 1 }}>
            {subtitle ?? ' '}
          </AppText>
          {onSwap && <Ionicons name="swap-vertical" size={15} color={theme.colors.primary} />}
        </View>
      </Pressable>

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.sm,
          alignItems: 'center',
          height: CONTROL_SIZE,
        }}>
        {onToday && (
          <Pressable
            onPress={onToday}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={t({
              nb: 'Gå til denne måneden',
              en: 'Go to this month',
              ar: 'الانتقال إلى هذا الشهر',
              ur: 'اس مہینے پر جائیں',
            })}
            style={({ pressed }) => [
              {
                height: CONTROL_SIZE,
                justifyContent: 'center',
                paddingHorizontal: spacing.md,
                borderRadius: radius.full,
                backgroundColor: theme.colors.primarySoft,
              },
              pressed && { opacity: opacity.pressed },
            ]}>
            <AppText size="sm" weight="semibold" tone="onPrimarySoft">
              {t({ nb: 'I dag', en: 'Today', ar: 'اليوم', ur: 'آج' })}
            </AppText>
          </Pressable>
        )}
        <IconButton
          name={isRTL() ? 'chevron-forward' : 'chevron-back'}
          accessibilityLabel={t({ nb: 'Forrige måned', en: 'Previous month', ar: 'الشهر السابق', ur: 'پچھلا مہینہ' })}
          onPress={onPrev}
        />
        <IconButton
          name={isRTL() ? 'chevron-back' : 'chevron-forward'}
          accessibilityLabel={t({ nb: 'Neste måned', en: 'Next month', ar: 'الشهر التالي', ur: 'اگلا مہینہ' })}
          onPress={onNext}
        />
      </View>
    </View>
  );
}
