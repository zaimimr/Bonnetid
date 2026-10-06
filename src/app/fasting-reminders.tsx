import { View } from 'react-native';
import { AppText, Card, Divider, ListRow, Screen, Toggle } from '@/components/ui';
import { EVENING_REMINDER_CLOCK } from '@/lib/fasting';
import { notificationsSupported } from '@/lib/notifications';
import { SUHOOR_REMINDER_MINUTES } from '@/lib/ramadan';
import { track } from '@/lib/telemetry';
import { spacing } from '@/theme/tokens';
import { useSettings, type VoluntaryFastKind } from '@/store/settings';
import { t } from '@/lib/i18n';

const VOLUNTARY_ROWS: { kind: VoluntaryFastKind; title: string; subtitle: string }[] = [
  {
    kind: 'ashura',
    title: t({ nb: 'Ashura', en: 'Ashura', ar: 'عاشوراء', ur: 'عاشورہ' }),
    subtitle: t({ nb: 'Den 9. og 10. Muharram', en: '9th and 10th of Muharram', ar: 'التاسع والعاشر من محرم', ur: '9 اور 10 محرم' }),
  },
  {
    kind: 'whiteDays',
    title: t({ nb: 'De hvite dagene', en: 'The white days', ar: 'الأيام البيض', ur: 'ایامِ بیض' }),
    subtitle: t({
      nb: 'Den 13., 14. og 15. hver hijri-måned',
      en: '13th, 14th and 15th of every Hijri month',
      ar: 'الثالث عشر والرابع عشر والخامس عشر من كل شهر هجري',
      ur: 'ہر ہجری مہینے کی 13، 14 اور 15 تاریخ',
    }),
  },
  {
    kind: 'mondayThursday',
    title: t({ nb: 'Mandag og torsdag', en: 'Monday and Thursday', ar: 'الاثنين والخميس', ur: 'پیر اور جمعرات' }),
    subtitle: t({ nb: 'Hver uke', en: 'Every week', ar: 'كل أسبوع', ur: 'ہر ہفتے' }),
  },
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
          title={t({ nb: 'Suhoor i ramadan', en: 'Suhoor in Ramadan', ar: 'السحور في رمضان', ur: 'رمضان میں سحری' })}
          subtitle={t({
            nb: `${SUHOOR_REMINDER_MINUTES} minutter før Fajr`,
            en: `${SUHOOR_REMINDER_MINUTES} minutes before Fajr`,
            ar: `قبل الفجر بـ ${SUHOOR_REMINDER_MINUTES} دقيقة`,
            ur: `فجر سے ${SUHOOR_REMINDER_MINUTES} منٹ پہلے`,
          })}
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
          title={t({ nb: 'Arafah', en: 'Arafah', ar: 'عرفة', ur: 'عرفہ' })}
          subtitle={t({ nb: 'Kvelden før den 9. Dhul Hijjah', en: 'The evening before 9th Dhul Hijjah', ar: 'عشية التاسع من ذي الحجة', ur: '9 ذوالحجہ سے پہلے کی شام' })}
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
          {t({
            nb: `Påminnelsen kommer kl. ${EVENING_REMINDER_CLOCK} kvelden før. Datoene kan flytte seg ved månesikting.`,
            en: `The reminder arrives at ${EVENING_REMINDER_CLOCK} the evening before. Dates may shift with the moon sighting.`,
            ar: `يصل التذكير الساعة ${EVENING_REMINDER_CLOCK} مساء اليوم السابق. قد تتغير التواريخ بحسب رؤية الهلال.`,
            ur: `یاد دہانی ایک دن پہلے شام ${EVENING_REMINDER_CLOCK} بجے آتی ہے۔ چاند نظر آنے کے مطابق تاریخیں بدل سکتی ہیں۔`,
          })}
        </AppText>
      </View>
    </Screen>
  );
}
