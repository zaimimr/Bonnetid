import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Divider, ListRow, Toggle } from '@/components/ui';
import { LockScreenPreview } from '@/components/settings/LockScreenPreview';
import {
  ROW,
  SettingsPage,
  hasIsland,
  lockScreenSupported,
  useLockScreenToggle,
  widgetJamatSupported,
} from '@/components/settings/shared';
import { useTheme } from '@/theme';
import { useFeature } from '@/hooks/useFeature';
import { useActiveLocation, useActiveMosque, useSettings } from '@/store/settings';
import { t } from '@/lib/i18n';

export default function TrackerSettingsScreen() {
  const theme = useTheme();
  const mosque = useActiveMosque();
  const calculated = useActiveLocation().mode === 'calculated';
  const trackerAllowed = useFeature('prayer-tracker');
  const trackerEnabled = useSettings((state) => state.prayerTrackerEnabled) && trackerAllowed;
  const setTrackerEnabled = useSettings((state) => state.setPrayerTrackerEnabled);
  const liveActivityEnabled = useSettings((state) => state.liveActivityEnabled);
  const widgetShowJamat = useSettings((state) => state.widgetShowJamat);
  const setWidgetShowJamat = useSettings((state) => state.setWidgetShowJamat);
  const toggleLockScreen = useLockScreenToggle();
  const ios = Platform.OS === 'ios';
  const iosCountdown = ios && lockScreenSupported;
  const androidLockCard = !ios && lockScreenSupported && trackerEnabled;
  const widgetJamat = widgetJamatSupported && !calculated;

  return (
    <SettingsPage>
      {iosCountdown && <LockScreenPreview enabled={liveActivityEnabled} />}

      {trackerAllowed && (
        <Card padding="sm" rounded="xl">
          <ListRow
            title={t({ nb: 'Marker bønner', en: 'Mark prayers', ar: 'تعليم الصلوات', ur: 'نمازیں نشان زد کریں' })}
            subtitle={t({ nb: 'Huk av bønnene du har bedt', en: 'Tick off the prayers you have prayed', ar: 'علّم الصلوات التي صلّيتها', ur: 'ادا کی گئی نمازوں پر نشان لگائیں' })}
            leading={<Ionicons name="checkmark-done-outline" size={20} color={theme.colors.primary} />}
            trailing={<Toggle value={trackerEnabled} onValueChange={setTrackerEnabled} />}
            style={ROW}
          />
        </Card>
      )}

      {(iosCountdown || androidLockCard || widgetJamat) && (
        <Card padding="sm" rounded="xl">
          {iosCountdown && (
            <ListRow
              title={t({ nb: 'Nedtelling på låseskjermen', en: 'Countdown on the lock screen', ar: 'العدّ التنازلي على شاشة القفل', ur: 'لاک اسکرین پر الٹی گنتی' })}
              subtitle={hasIsland ? t({ nb: 'Også i Dynamic Island', en: 'Also in the Dynamic Island', ar: 'وفي Dynamic Island أيضًا', ur: 'Dynamic Island میں بھی' }) : undefined}
              leading={<Ionicons name="timer-outline" size={20} color={theme.colors.primary} />}
              trailing={<Toggle value={liveActivityEnabled} onValueChange={toggleLockScreen} />}
              style={ROW}
            />
          )}
          {androidLockCard && (
            <ListRow
              title={t({ nb: 'Bønnekort på låseskjermen', en: 'Prayer card on the lock screen', ar: 'بطاقة الصلاة على شاشة القفل', ur: 'لاک اسکرین پر نماز کارڈ' })}
              subtitle={t({ nb: 'Nedtelling med Bedt og Hopp over', en: 'Countdown with Prayed and Skip', ar: 'عدّ تنازلي مع صلّيت وتخطَّ', ur: 'الٹی گنتی، ادا کی اور چھوڑیں کے ساتھ' })}
              leading={<Ionicons name="timer-outline" size={20} color={theme.colors.primary} />}
              trailing={<Toggle value={liveActivityEnabled} onValueChange={toggleLockScreen} />}
              style={ROW}
            />
          )}
          {androidLockCard && widgetJamat && <Divider />}
          {widgetJamat && (
            <ListRow
              title={t({ nb: 'Vis jamaat-tider i widget', en: 'Show jamaat times in widget', ar: 'عرض أوقات الجماعة في الأداة', ur: 'ویجیٹ میں جماعت کے اوقات دکھائیں' })}
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
          )}
        </Card>
      )}
    </SettingsPage>
  );
}
