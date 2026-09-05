import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card } from '@/components/ui';
import type { VerdictFinding } from '@/lib/halalVerdict';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

function MatchChip({ text, tint, surface }: { text: string; tint: string; surface: string }) {
  return (
    <View
      style={{
        backgroundColor: surface,
        borderRadius: radius.sm,
        paddingVertical: spacing.xxs,
        paddingHorizontal: spacing.sm,
      }}>
      <AppText size="xs" weight="semibold" color={tint}>
        {text}
      </AppText>
    </View>
  );
}

export function FindingList({ findings }: { findings: VerdictFinding[] }) {
  const theme = useTheme();

  return (
    <View style={{ gap: spacing.md }}>
      {findings.map((finding) => {
        const tint =
          finding.severity === 'avoid'
            ? theme.colors.onVerdictAvoidSurface
            : theme.colors.onVerdictUncertainSurface;
        const surface =
          finding.severity === 'avoid'
            ? theme.colors.verdictAvoidSurface
            : theme.colors.verdictUncertainSurface;

        return (
          <Card key={finding.ruleId} rounded="lg" padding="lg">
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Ionicons
                  name={finding.severity === 'avoid' ? 'alert-circle' : 'help-circle'}
                  size={18}
                  color={tint}
                />
                <AppText weight="semibold" style={{ flex: 1 }}>
                  {finding.label}
                </AppText>
              </View>

              <AppText size="sm" tone="textSecondary">
                {finding.reason}
              </AppText>

              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: spacing.xs,
                  marginTop: spacing.xxs,
                }}>
                <AppText size="xs" tone="textMuted">
                  Funnet på pakningen:
                </AppText>
                {finding.matched.map((match) => (
                  <MatchChip key={match} text={match} tint={tint} surface={surface} />
                ))}
              </View>
            </View>
          </Card>
        );
      })}
    </View>
  );
}
