import { useMemo } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, IconButton } from '@/components/ui';
import { useHijriLookahead } from '@/hooks/useHijriSeason';
import { upcomingEidLeave } from '@/lib/eidLeave';
import { formatGregorianShort } from '@/lib/hijri';
import { track } from '@/lib/telemetry';
import { osloDateKey } from '@/lib/time';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

function dateOf(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

export function EidLeaveCard({ now }: { now: Date }) {
  const theme = useTheme();
  const rows = useHijriLookahead(now);
  const todayIso = osloDateKey(now);
  const leave = useMemo(() => upcomingEidLeave(rows, todayIso), [rows, todayIso]);
  const dismissed = useSettings((state) => state.dismissedEidLeave);
  const dismiss = useSettings((state) => state.dismissEidLeave);

  if (!leave || dismissed.includes(leave.eidIso)) return null;

  const deadline =
    leave.daysToDeadline === 0 ? 'i dag' : `innen ${formatGregorianShort(dateOf(leave.deadlineIso))}`;

  return (
    <Card rounded="xl" padding="md">
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Ionicons name="megaphone-outline" size={15} color={theme.colors.primary} />
            <AppText size="xs" weight="semibold" tone="primary" style={{ flex: 1 }}>
              {leave.eid === 'adha' ? 'Fri til Eid al-Adha' : 'Fri til Eid al-Fitr'}
            </AppText>
          </View>
          <AppText size="sm" tone="textSecondary">
            {`Eid er ${formatGregorianShort(dateOf(leave.eidIso))}. Gi beskjed til arbeidsgiver ${deadline}.`}
          </AppText>
        </View>
        <IconButton
          name="close"
          accessibilityLabel="Skjul"
          onPress={() => {
            track('eid_leave_dismissed', { eid: leave.eid });
            dismiss(leave.eidIso);
          }}
        />
      </View>
    </Card>
  );
}
