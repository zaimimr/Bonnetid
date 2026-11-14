import { View } from 'react-native';
import { AppText, Sheet } from '@/components/ui';
import { t } from '@/lib/i18n';
import { DHIKR_INFO, type DhikrId } from '@/lib/tasbih';
import { spacing } from '@/theme/tokens';

function Section({ label, children }: { label: string; children: string }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText size="sm" weight="semibold" tone="primary">
        {label}
      </AppText>
      <AppText>{children}</AppText>
    </View>
  );
}

export function DhikrInfoSheet({ dhikr, visible, onClose }: { dhikr: DhikrId | null; visible: boolean; onClose: () => void }) {
  if (!dhikr) return null;
  return (
    <Sheet visible={visible} onClose={onClose} title={t(`tasbih.names.${dhikr}`)}>
      <View style={{ gap: spacing.lg }}>
        <Section label={t('tasbih.virtue')}>{t(`tasbih.virtues.${dhikr}`)}</Section>
        <Section label={t('tasbih.explanation')}>{t(`tasbih.explanations.${dhikr}`)}</Section>
        <AppText size="sm" tone="textMuted">
          {t('tasbih.source')}: {DHIKR_INFO[dhikr].source}
        </AppText>
      </View>
    </Sheet>
  );
}
