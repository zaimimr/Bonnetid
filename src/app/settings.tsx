import { Linking, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
  AppText,
  Card,
  Divider,
  ListRow,
  Screen,
  SectionHeader,
  SegmentedControl,
  Toggle,
} from '@/components/ui';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import { notificationsSupported, requestNotificationPermission } from '@/lib/notifications';
import {
  dynamicIslandAvailable,
  liveActivitiesEnabled,
  prayerWidgetAvailable,
} from '../../modules/prayer-widget';
import { getNotificationSound } from '@/lib/notificationSounds';
import { asrMethodLabel } from '@/lib/asrMethods';
import { calculationMethodLabel } from '@/lib/calculationMethods';
import { PRAYER_LABELS } from '@/lib/prayerSchedule';
import { useMosqueAsrOverride } from '@/hooks/useEffectiveAsrMethod';
import { useAutoCalculationMethod } from '@/hooks/useEffectiveCalculationMethod';
import { track } from '@/lib/telemetry';
import { useFeature } from '@/hooks/useFeature';
import {
  NOTIFIABLE_PRAYERS,
  VOLUNTARY_FAST_KINDS,
  useActiveLocation,
  useActiveMosque,
  useSettings,
} from '@/store/settings';
import { PostHogMaskView } from 'posthog-react-native';
import { t } from '@/lib/i18n';

const lockScreenSupported =
  prayerWidgetAvailable && (Platform.OS === 'android' || liveActivitiesEnabled());
const hasIsland = Platform.OS === 'ios' && dynamicIslandAvailable();
const widgetJamatSupported = Platform.OS === 'android' && prayerWidgetAvailable;
const ROW = { paddingHorizontal: spacing.md } as const;

const PRIVACY_POLICY_URL = 'https://zaimimr.github.io/bonnetid-personvern/';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const location = useActiveLocation();
  const calculationMethod = useSettings((state) => state.calculationMethod);
  const autoCalculationMethod = useAutoCalculationMethod(location);
  const calculated = location.mode === 'calculated';
  const mosque = useActiveMosque();
  const asrMethod = useSettings((state) => state.asrMethod);
  const themePreference = useSettings((state) => state.themePreference);
  const analyticsEnabled = useSettings((state) => state.analyticsEnabled);
  const setAnalyticsEnabled = useSettings((state) => state.setAnalyticsEnabled);
  const setThemePreference = useSettings((state) => state.setThemePreference);
  const notificationsEnabled = useSettings((state) => state.notificationsEnabled);
  const setNotificationsEnabled = useSettings((state) => state.setNotificationsEnabled);
  const notificationSound = useSettings((state) => state.notificationSound);
  const notificationPrayers = useSettings((state) => state.notificationPrayers);
  const liveActivityEnabled = useSettings((state) => state.liveActivityEnabled);
  const widgetShowJamat = useSettings((state) => state.widgetShowJamat);
  const setWidgetShowJamat = useSettings((state) => state.setWidgetShowJamat);
  const setLiveActivityEnabled = useSettings((state) => state.setLiveActivityEnabled);
  const endReminderEnabled = useSettings((state) => state.endReminderEnabled);
  const setEndReminderEnabled = useSettings((state) => state.setEndReminderEnabled);
  const trackerAllowed = useFeature('prayer-tracker');
  const duasEnabled = useFeature('duas');
  const trackerEnabled = useSettings((state) => state.prayerTrackerEnabled) && trackerAllowed;
  const setTrackerEnabled = useSettings((state) => state.setPrayerTrackerEnabled);
  const asrOverride = useMosqueAsrOverride();
  const ramadanRemindersEnabled = useSettings((state) => state.ramadanRemindersEnabled);
  const dhulHijjahRemindersEnabled = useSettings((state) => state.dhulHijjahRemindersEnabled);
  const voluntaryFasts = useSettings((state) => state.voluntaryFasts);

  const toggleNotifications = async (value: boolean) => {
    if (!value) {
      setNotificationsEnabled(false);
      track('notifications_toggled', { enabled: false });
      return;
    }
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    track('notifications_toggled', { enabled: granted });
  };

  const toggleLockScreen = async (value: boolean) => {
    if (!value || Platform.OS !== 'android') {
      setLiveActivityEnabled(value);
      return;
    }
    const granted = await requestNotificationPermission();
    setLiveActivityEnabled(granted);
  };

  const chosenFasts = [
    ramadanRemindersEnabled,
    dhulHijjahRemindersEnabled,
    ...VOLUNTARY_FAST_KINDS.map((kind) => voluntaryFasts[kind]),
  ].filter(Boolean).length;
  const fastingSummary =
    chosenFasts === 0
      ? t({ nb: 'Ingen påminnelser', en: 'No reminders', ar: 'لا توجد تذكيرات', ur: 'کوئی یاد دہانی نہیں' })
      : chosenFasts === 1
        ? t({ nb: '1 påminnelse er på', en: '1 reminder is on', ar: 'التذكيرات المفعّلة: 1', ur: '1 یاد دہانی آن ہے' })
        : t({
            nb: `${chosenFasts} påminnelser er på`,
            en: `${chosenFasts} reminders are on`,
            ar: `التذكيرات المفعّلة: ${chosenFasts}`,
            ur: `${chosenFasts} یاد دہانیاں آن ہیں`,
          });

  const chosenPrayers = NOTIFIABLE_PRAYERS.filter((prayer) => notificationPrayers[prayer]);
  const prayerSummary =
    chosenPrayers.length === NOTIFIABLE_PRAYERS.length
      ? t({ nb: 'Alle bønner', en: 'All prayers', ar: 'كل الصلوات', ur: 'تمام نمازیں' })
      : chosenPrayers.length === 0
        ? t({ nb: 'Ingen valgt', en: 'None selected', ar: 'لم يُحدَّد شيء', ur: 'کوئی منتخب نہیں' })
        : chosenPrayers.map((prayer) => PRAYER_LABELS[prayer]).join(t({ nb: ', ', en: ', ', ar: '، ', ur: '، ' }));

  return (
    <Screen scroll edges={[]}>
      <SectionHeader title={t({ nb: 'Bønnetider', en: 'Prayer times', ar: 'مواقيت الصلاة', ur: 'نماز کے اوقات' })} />
      <Card padding="sm" rounded="xl">
        <PostHogMaskView>
          <ListRow
            title={t({ nb: 'Sted', en: 'Location', ar: 'الموقع', ur: 'مقام' })}
            subtitle={
              calculated
                ? t({
                    nb: `${location.name} · lokale tider, følger posisjonen din`,
                    en: `${location.name} · local times, follows your location`,
                    ar: `${location.name} · أوقات محلية، يتبع موقعك`,
                    ur: `${location.name} · مقامی اوقات، آپ کے مقام کے مطابق`,
                  })
                : t({
                    nb: `${location.name} · følger posisjonen din`,
                    en: `${location.name} · follows your location`,
                    ar: `${location.name} · يتبع موقعك`,
                    ur: `${location.name} · آپ کے مقام کے مطابق`,
                  })
            }
            leading={<Ionicons name="location-outline" size={20} color={theme.colors.primary} />}
            style={ROW}
          />
        </PostHogMaskView>
        {!calculated && (
          <>
            <Divider />
            <ListRow
              title={t({ nb: 'Min moské', en: 'My mosque', ar: 'مسجدي', ur: 'میری مسجد' })}
              subtitle={mosque?.name ?? t({ nb: 'Ikke valgt', en: 'Not selected', ar: 'غير محدد', ur: 'منتخب نہیں' })}
              leading={<Ionicons name="business-outline" size={20} color={theme.colors.primary} />}
              chevron
              onPress={() => router.push('/mosque-picker')}
              style={ROW}
            />
          </>
        )}
        <Divider />
        <ListRow
          title={t({ nb: 'Asr-metode', en: 'Asr method', ar: 'طريقة العصر', ur: 'عصر کا طریقہ' })}
          subtitle={
            asrOverride && mosque
              ? t({
                  nb: `Styres av ${mosque.name}`,
                  en: `Set by ${mosque.name}`,
                  ar: `يحددها ${mosque.name}`,
                  ur: `${mosque.name} کی طرف سے طے شدہ`,
                })
              : asrMethodLabel(asrMethod ?? 'irn')
          }
          leading={<Ionicons name="partly-sunny-outline" size={20} color={theme.colors.primary} />}
          chevron
          onPress={() => router.push('/asr-method')}
          style={ROW}
        />
        {calculated && (
          <>
            <Divider />
            <ListRow
              title={t({ nb: 'Beregningsmetode', en: 'Calculation method', ar: 'طريقة الحساب', ur: 'حساب کا طریقہ' })}
              subtitle={
                calculationMethod
                  ? calculationMethodLabel(calculationMethod)
                  : `${t({ nb: 'Automatisk', en: 'Automatic', ar: 'تلقائي', ur: 'خودکار' })} · ${calculationMethodLabel(autoCalculationMethod)}`
              }
              leading={<Ionicons name="calculator-outline" size={20} color={theme.colors.primary} />}
              chevron
              onPress={() => router.push('/calculation-method')}
              style={ROW}
            />
          </>
        )}
      </Card>

      <SectionHeader title={t({ nb: 'Varsler', en: 'Notifications', ar: 'الإشعارات', ur: 'اطلاعات' })} />
      <Card padding="sm" rounded="xl">
        <ListRow
          title={t({ nb: 'Slå på varsler', en: 'Turn on notifications', ar: 'تفعيل الإشعارات', ur: 'اطلاعات آن کریں' })}
          subtitle={notificationsSupported ? undefined : t({ nb: 'Ikke tilgjengelig i Expo Go på Android', en: 'Not available in Expo Go on Android', ar: 'غير متاح في Expo Go على أندرويد', ur: 'اینڈرائیڈ پر Expo Go میں دستیاب نہیں' })}
          leading={<Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />}
          trailing={
            <Toggle
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              disabled={!notificationsSupported}
            />
          }
          style={ROW}
        />
        {notificationsEnabled && (
          <>
            <Divider />
            <ListRow
              title={t({ nb: 'Bønnevarsler', en: 'Prayer notifications', ar: 'إشعارات الصلاة', ur: 'نماز کی اطلاعات' })}
              subtitle={`${prayerSummary} · ${getNotificationSound(notificationSound).label}`}
              leading={<Ionicons name="time-outline" size={20} color={theme.colors.primary} />}
              chevron
              onPress={() => router.push('/notification-prayers')}
              style={ROW}
            />
            <Divider />
            <ListRow
              title={t({ nb: 'Faste og merkedager', en: 'Fasting and special days', ar: 'الصيام والمناسبات', ur: 'روزے اور خاص دن' })}
              subtitle={fastingSummary}
              leading={<Ionicons name="moon-outline" size={20} color={theme.colors.primary} />}
              chevron
              onPress={() => router.push('/fasting-reminders')}
              style={ROW}
            />
            <Divider />
            <ListRow
              title={t({ nb: 'Varselsjekk', en: 'Notification check', ar: 'فحص الإشعارات', ur: 'اطلاعات کی جانچ' })}
              leading={<Ionicons name="pulse-outline" size={20} color={theme.colors.primary} />}
              chevron
              onPress={() => router.push('/notification-check')}
              style={ROW}
            />
            {trackerAllowed && (
              <>
                <Divider />
                <ListRow
                  title={t({ nb: 'Påminnelse før tiden går ut', en: 'Reminder before time runs out', ar: 'تذكير قبل خروج الوقت', ur: 'وقت ختم ہونے سے پہلے یاد دہانی' })}
                  subtitle={
                    trackerEnabled
                      ? t({ nb: '30 minutter før, hvis bønnen ikke er markert', en: '30 minutes before, if the prayer is not marked', ar: 'قبل 30 دقيقة، إذا لم تُعلَّم الصلاة', ur: '30 منٹ پہلے، اگر نماز نشان زد نہ ہو' })
                      : t({ nb: 'Slå på Marker bønner først', en: 'Turn on Mark prayers first', ar: 'فعّل تعليم الصلوات أولًا', ur: 'پہلے نمازیں نشان زد کریں آن کریں' })
                  }
                  leading={<Ionicons name="hourglass-outline" size={20} color={theme.colors.primary} />}
                  trailing={
                    <Toggle
                      value={trackerEnabled && endReminderEnabled}
                      onValueChange={setEndReminderEnabled}
                      disabled={!trackerEnabled}
                    />
                  }
                  style={ROW}
                />
              </>
            )}
          </>
        )}
      </Card>

      {trackerAllowed && (
        <>
          <SectionHeader title={t({ nb: 'Bønnesporing', en: 'Prayer tracker', ar: 'متابعة الصلوات', ur: 'نماز ٹریکر' })} />
          <Card padding="sm" rounded="xl">
            <ListRow
              title={t({ nb: 'Marker bønner', en: 'Mark prayers', ar: 'تعليم الصلوات', ur: 'نمازیں نشان زد کریں' })}
              subtitle={t({ nb: 'Huk av bønnene du har bedt', en: 'Tick off the prayers you have prayed', ar: 'علّم الصلوات التي صلّيتها', ur: 'ادا کی گئی نمازوں پر نشان لگائیں' })}
              leading={
                <Ionicons name="checkmark-done-outline" size={20} color={theme.colors.primary} />
              }
              trailing={<Toggle value={trackerEnabled} onValueChange={setTrackerEnabled} />}
              style={ROW}
            />
            {trackerEnabled && lockScreenSupported && Platform.OS === 'android' && (
              <>
                <Divider />
                <ListRow
                  title={t({ nb: 'Bønnekort på låseskjermen', en: 'Prayer card on the lock screen', ar: 'بطاقة الصلاة على شاشة القفل', ur: 'لاک اسکرین پر نماز کارڈ' })}
                  subtitle={t({ nb: 'Nedtelling med Bedt og Hopp over', en: 'Countdown with Prayed and Skip', ar: 'عدّ تنازلي مع صلّيت وتخطَّ', ur: 'الٹی گنتی، ادا کی اور چھوڑیں کے ساتھ' })}
                  leading={<Ionicons name="timer-outline" size={20} color={theme.colors.primary} />}
                  trailing={<Toggle value={liveActivityEnabled} onValueChange={toggleLockScreen} />}
                  style={ROW}
                />
              </>
            )}
          </Card>
        </>
      )}

      {lockScreenSupported && Platform.OS === 'ios' && (
        <>
          <SectionHeader title={t({ nb: 'Låseskjerm', en: 'Lock screen', ar: 'شاشة القفل', ur: 'لاک اسکرین' })} />
          <Card padding="sm" rounded="xl">
            <ListRow
              title={t({ nb: 'Nedtelling på låseskjermen', en: 'Countdown on the lock screen', ar: 'العدّ التنازلي على شاشة القفل', ur: 'لاک اسکرین پر الٹی گنتی' })}
              subtitle={hasIsland ? t({ nb: 'Også i Dynamic Island', en: 'Also in the Dynamic Island', ar: 'وفي Dynamic Island أيضًا', ur: 'Dynamic Island میں بھی' }) : undefined}
              leading={<Ionicons name="timer-outline" size={20} color={theme.colors.primary} />}
              trailing={<Toggle value={liveActivityEnabled} onValueChange={toggleLockScreen} />}
              style={ROW}
            />
          </Card>
        </>
      )}

      {widgetJamatSupported && !calculated && (
        <>
          <SectionHeader title={t({ nb: 'Widget', en: 'Widget', ar: 'الأداة', ur: 'ویجیٹ' })} />
          <Card padding="sm" rounded="xl">
            <ListRow
              title={t({ nb: 'Vis jamaat-tider', en: 'Show jamaat times', ar: 'عرض أوقات الجماعة', ur: 'جماعت کے اوقات دکھائیں' })}
              subtitle={mosque ? mosque.name : t({ nb: 'Velg en moské først', en: 'Choose a mosque first', ar: 'اختر مسجدًا أولًا', ur: 'پہلے مسجد منتخب کریں' })}
              leading={<Ionicons name="people-outline" size={20} color={theme.colors.primary} />}
              trailing={
                <Toggle
                  value={widgetShowJamat}
                  onValueChange={setWidgetShowJamat}
                  disabled={mosque == null}
                />
              }
              style={ROW}
            />
          </Card>
        </>
      )}

      <SectionHeader title={t({ nb: 'Utseende', en: 'Appearance', ar: 'المظهر', ur: 'ظاہری شکل' })} />
      <Card padding="sm" rounded="xl">
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          <AppText weight="medium">{t({ nb: 'Tema', en: 'Theme', ar: 'السمة', ur: 'تھیم' })}</AppText>
          <SegmentedControl
            value={themePreference}
            onChange={(preference) => {
              setThemePreference(preference);
              track('theme_changed', { theme: preference });
            }}
            options={[
              { value: 'system', label: t({ nb: 'System', en: 'System', ar: 'النظام', ur: 'سسٹم' }) },
              { value: 'light', label: t({ nb: 'Lys', en: 'Light', ar: 'فاتح', ur: 'روشن' }) },
              { value: 'dark', label: t({ nb: 'Mørk', en: 'Dark', ar: 'داكن', ur: 'تاریک' }) },
            ]}
          />
        </View>
      </Card>

      {duasEnabled && (
        <>
          <SectionHeader title={t({ nb: 'Duaer', en: 'Duas', ar: 'الأدعية', ur: 'دعائیں' })} />
          <Card padding="sm" rounded="xl">
            <ListRow
              title={t({ nb: 'Duainnstillinger', en: 'Dua settings', ar: 'إعدادات الأدعية', ur: 'دعا کی ترتیبات' })}
              chevron
              onPress={() => router.push('/dua-settings')}
              style={ROW}
            />
          </Card>
        </>
      )}

      <SectionHeader title={t({ nb: 'Om appen', en: 'About the app', ar: 'عن التطبيق', ur: 'ایپ کے بارے میں' })} />
      <Card padding="sm" rounded="xl">
        <ListRow
          title={t({ nb: 'Hjelp oss bli bedre', en: 'Help us improve', ar: 'ساعدنا على التحسين', ur: 'بہتر بنانے میں ہماری مدد کریں' })}
          subtitle={t({ nb: 'Del nyttig data', en: 'Share useful data', ar: 'شارك بيانات مفيدة', ur: 'مفید ڈیٹا شیئر کریں' })}
          leading={<Ionicons name="analytics-outline" size={20} color={theme.colors.primary} />}
          trailing={
            <Toggle
              value={analyticsEnabled}
              onValueChange={(next) => {
                track('analytics_toggled', { enabled: next });
                setAnalyticsEnabled(next);
              }}
            />
          }
          style={ROW}
        />
        <Divider />
        <ListRow
          title={t({ nb: 'Islamsk Råd Norge', en: 'Islamic Council of Norway', ar: 'المجلس الإسلامي النرويجي', ur: 'اسلامک کونسل ناروے' })}
          leading={
            <Image
              source={
                theme.scheme === 'dark'
                  ? require('../../assets/images/irn-logo-dark.png')
                  : require('../../assets/images/irn-logo.png')
              }
              style={{ width: 20, height: 22 }}
              contentFit="contain"
            />
          }
          chevron
          onPress={() => router.push('/irn')}
          style={ROW}
        />
        <Divider />
        <ListRow
          title={t({ nb: 'Personvern', en: 'Privacy', ar: 'الخصوصية', ur: 'رازداری' })}
          leading={<Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.primary} />}
          trailing={<Ionicons name="open-outline" size={18} color={theme.colors.textMuted} />}
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})}
          style={ROW}
        />
      </Card>

      <View style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.xl }}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={{ width: 56, height: 56, borderRadius: radius.lg }}
          contentFit="contain"
        />
        <AppText weight="semibold">Bønnetid</AppText>
        <AppText size="xs" tone="textMuted">
          {t({ nb: 'Versjon', en: 'Version', ar: 'الإصدار', ur: 'ورژن' })} {Constants.expoConfig?.version ?? '1.0.0'}
        </AppText>
        <AppText size="xs" tone="textMuted">
          {t({ nb: 'Laget av Zaim Imran', en: 'Made by Zaim Imran', ar: 'من تطوير Zaim Imran', ur: 'Zaim Imran کی تیار کردہ' })}
        </AppText>
      </View>
    </Screen>
  );
}

