import { useMemo } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/lib/i18n';
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

  const deadlineDate = formatGregorianShort(dateOf(leave.deadlineIso));
  const eidDate = formatGregorianShort(dateOf(leave.eidIso));
  const today = leave.daysToDeadline === 0;

  return (
    <Card rounded="xl" padding="md">
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Ionicons name="megaphone-outline" size={15} color={theme.colors.primary} />
            <AppText size="xs" weight="semibold" tone="primary" style={{ flex: 1 }}>
              {leave.eid === 'adha'
                ? t({
                    nb: 'Fri til Eid al-Adha',
                    en: 'Time off for Eid al-Adha',
                    ar: 'إجازة عيد الأضحى',
                    ur: 'عید الاضحیٰ کی چھٹی',
                  })
                : t({
                    nb: 'Fri til Eid al-Fitr',
                    en: 'Time off for Eid al-Fitr',
                    ar: 'إجازة عيد الفطر',
                    ur: 'عید الفطر کی چھٹی',
                  })}
            </AppText>
          </View>
          <AppText size="sm" tone="textSecondary">
            {t({
              nb: `Eid er ${eidDate}. Gi beskjed til arbeidsgiver ${today ? 'i dag' : `innen ${deadlineDate}`}.`,
              en: `Eid is on ${eidDate}. Let your employer know ${today ? 'today' : `by ${deadlineDate}`}.`,
              ar: `العيد في ${eidDate}. أبلغ صاحب العمل ${today ? 'اليوم' : `قبل ${deadlineDate}`}.`,
              ur: `عید ${eidDate} کو ہے۔ اپنے آجر کو ${today ? 'آج' : `${deadlineDate} تک`} مطلع کریں۔`,
            })}
          </AppText>
        </View>
        <IconButton
          name="close"
          accessibilityLabel={t({ nb: 'Skjul', en: 'Hide', ar: 'إخفاء', ur: 'چھپائیں' })}
          onPress={() => {
            track('eid_leave_dismissed', { eid: leave.eid });
            dismiss(leave.eidIso);
          }}
        />
      </View>
    </Card>
  );
}
