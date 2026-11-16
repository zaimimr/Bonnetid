import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/icons';
import { AppText, Sheet } from '@/components/ui';
import { t } from '@/lib/i18n';
import type { DhikrId } from '@/lib/tasbih';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';

const isHeading = (text: string) => text.length < 40 && !/[.:!?)”»؟۔؀-ۿ]/.test(text);

type Hadith = { text: string; source?: string };

function splitSource(paragraph: string): Hadith {
  const match = paragraph.match(/^([\s\S]*\S)\s*\(([^()]+)\)\s*$/);
  return match ? { text: match[1], source: match[2] } : { text: paragraph };
}

function SourceChip({ source }: { source: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingVertical: spacing.xxs,
        paddingHorizontal: spacing.md,
        borderRadius: radius.full,
        backgroundColor: theme.colors.surface,
      }}>
      <AppText size="sm" weight="semibold" color={theme.colors.onPrimarySoft}>
        {source}
      </AppText>
    </View>
  );
}

function LeadCard({ hadith }: { hadith: Hadith }) {
  const theme = useTheme();
  return (
    <View
      style={{
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.seriesLight,
        backgroundColor: theme.colors.primarySoft,
      }}>
      <AppText>{hadith.text}</AppText>
      {hadith.source ? <SourceChip source={hadith.source} /> : null}
    </View>
  );
}

function HadithRow({ hadith }: { hadith: Hadith }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen((value) => !value)}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      style={({ pressed }) => ({
        gap: spacing.xs,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        opacity: pressed ? opacity.pressed : 1,
      })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <AppText size="sm" weight="semibold" color={theme.colors.onPrimarySoft} style={{ flex: 1 }} numberOfLines={1}>
          {hadith.source ?? ''}
        </AppText>
        <Icon name={open ? 'caret-up' : 'caret-down'} size={14} color={theme.colors.textMuted} />
      </View>
      <AppText tone={open ? undefined : 'textSecondary'} numberOfLines={open ? undefined : 2}>
        {hadith.text}
      </AppText>
    </Pressable>
  );
}

function Virtues({ text }: { text: string }) {
  if (!text) return null;
  const [first, ...rest] = text.split('\n\n');
  const hadiths = rest.filter((paragraph) => !isHeading(paragraph));
  return (
    <View style={{ gap: spacing.md }}>
      {isHeading(first) ? <AppText weight="semibold">{first}</AppText> : <LeadCard hadith={splitSource(first)} />}
      {rest.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          {hadiths.length > 0 ? (
            <AppText size="sm" weight="semibold" tone="primary" tabular>
              {`${t('tasbih.moreHadith')} · ${hadiths.length}`}
            </AppText>
          ) : null}
          {rest.map((paragraph, i) =>
            isHeading(paragraph) ? (
              <AppText key={i} weight="semibold">
                {paragraph}
              </AppText>
            ) : (
              <HadithRow key={i} hadith={splitSource(paragraph)} />
            ),
          )}
        </View>
      ) : null}
    </View>
  );
}

function Explanation({ text }: { text: string }) {
  if (!text) return null;
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText size="sm" weight="semibold" tone="primary">
        {t('tasbih.explanation')}
      </AppText>
      {text.split('\n\n').map((paragraph, i) => (
        <AppText key={i} weight={isHeading(paragraph) ? 'semibold' : undefined}>
          {paragraph}
        </AppText>
      ))}
    </View>
  );
}

export function DhikrInfoSheet({ dhikr, visible, onClose }: { dhikr: DhikrId | null; visible: boolean; onClose: () => void }) {
  if (!dhikr) return null;
  return (
    <Sheet visible={visible} onClose={onClose} title={t(`tasbih.names.${dhikr}`)}>
      <View style={{ gap: spacing.lg }}>
        <Virtues text={t(`tasbih.virtues.${dhikr}`)} />
        <Explanation text={t(`tasbih.explanations.${dhikr}`)} />
      </View>
    </Sheet>
  );
}
