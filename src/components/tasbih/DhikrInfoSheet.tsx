import { View } from 'react-native';
import { AppText, Sheet } from '@/components/ui';
import { t } from '@/lib/i18n';
import type { DhikrId } from '@/lib/tasbih';
import { spacing } from '@/theme/tokens';

const isHeading = (text: string) => text.length < 40 && !/[.:!?)”»؟۔؀-ۿ]/.test(text);

function Section({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText size="sm" weight="semibold" tone="primary">
        {label}
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
        <Section label={t('tasbih.virtue')} text={t(`tasbih.virtues.${dhikr}`)} />
        <Section label={t('tasbih.explanation')} text={t(`tasbih.explanations.${dhikr}`)} />
      </View>
    </Sheet>
  );
}
