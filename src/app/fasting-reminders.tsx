import { View } from 'react-native';
import { AppText, Card, Divider, ListRow, Screen, Toggle } from '@/components/ui';
import { EVENING_REMINDER_CLOCK } from '@/lib/fasting';
import { notificationsSupported } from '@/lib/notifications';
import { SUHOOR_REMINDER_MINUTES } from '@/lib/ramadan';
import { track } from '@/lib/telemetry';
import { spacing } from '@/theme/tokens';
import { useSettings, type VoluntaryFastKind } from '@/store/settings';

const VOLUNTARY_ROWS: { kind: VoluntaryFastKind; title: string; subtitle: string }[] = [
  { kind: 'ashura', title: 'Ashura', subtitle: 'Den 9. og 10. Muharram' },
  { kind: 'whiteDays', title: 'De hvite dagene', subtitle: 'Den 13., 14. og 15. hver hijri-måned' },
  { kind: 'mondayThursday', title: 'Mandag og torsdag', subtitle: 'Hver uke' },
];

export default function FastingRemindersScreen() {
  const ramadanEnabled = useSettings((state) => state.ramadanRemindersEnabled);
  const setRamadanEnabled = useSettings((state) => state.setRamadanRemindersEnabled);
  const dhulHijjahEnabled = useSettings((state) => state.dhulHijjahRemindersEnabled);
  const setDhulHijjahEnabled = useSettings((state) => state.setDhulHijjahRemindersEnabled);
  const voluntaryFasts = useSettings((state) => state.voluntaryFasts);
  const toggleVoluntaryFast = useSettings((state) => state.toggleVoluntaryFast);

  return (
    <Screen scroll edges={[]}>
      <Card padding="sm" rounded="xl" style={{ marginTop: spacing.lg }}>
        <ListRow
          title="Suhoor i ramadan"
          subtitle={`${SUHOOR_REMINDER_MINUTES} minutter før Fajr`}
          trailing={
            <Toggle
              value={ramadanEnabled}
              onValueChange={(enabled) => {
                setRamadanEnabled(enabled);
                track('fasting_reminder_toggled', { kind: 'ramadan', enabled });
              }}
              disabled={!notificationsSupported}
            />
          }
          style={{ paddingHorizontal: spacing.md }}
        />
        <Divider />
        <ListRow
          title="Arafah"
          subtitle="Kvelden før den 9. Dhul Hijjah"
          trailing={
            <Toggle
              value={dhulHijjahEnabled}
              onValueChange={(enabled) => {
                setDhulHijjahEnabled(enabled);
                track('fasting_reminder_toggled', { kind: 'arafah', enabled });
              }}
              disabled={!notificationsSupported}
            />
          }
          style={{ paddingHorizontal: spacing.md }}
        />
        {VOLUNTARY_ROWS.map((row) => (
          <View key={row.kind}>
            <Divider />
            <ListRow
              title={row.title}
              subtitle={row.subtitle}
              trailing={
                <Toggle
                  value={voluntaryFasts[row.kind]}
                  onValueChange={() => {
                    toggleVoluntaryFast(row.kind);
                    track('fasting_reminder_toggled', {
                      kind: row.kind,
                      enabled: !voluntaryFasts[row.kind],
                    });
                  }}
                  disabled={!notificationsSupported}
                />
              }
              style={{ paddingHorizontal: spacing.md }}
            />
          </View>
        ))}
      </Card>

      <View style={{ marginTop: spacing.md, paddingHorizontal: spacing.md, gap: spacing.sm }}>
        <AppText size="xs" tone="textMuted">
          {`Påminnelsen kommer kl. ${EVENING_REMINDER_CLOCK} kvelden før. Datoene kan flytte seg ved månesikting.`}
        </AppText>
      </View>
    </Screen>
  );
}
