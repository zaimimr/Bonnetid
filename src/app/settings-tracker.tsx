import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Divider, ListRow, Toggle } from '@/components/ui';
import {
  ROW,
  SettingsPage,
  lockScreenSupported,
  useLockScreenToggle,
} from '@/components/settings/shared';
import { useTheme } from '@/theme';
import { useFeature } from '@/hooks/useFeature';
import { useSettings } from '@/store/settings';
import { t } from '@/lib/i18n';

export default function TrackerSettingsScreen() {
  const theme = useTheme();
  const trackerAllowed = useFeature('prayer-tracker');
  const trackerEnabled = useSettings((state) => state.prayerTrackerEnabled) && trackerAllowed;
  const setTrackerEnabled = useSettings((state) => state.setPrayerTrackerEnabled);
  const liveActivityEnabled = useSettings((state) => state.liveActivityEnabled);
  const toggleLockScreen = useLockScreenToggle();

  return (
    <SettingsPage>
      <Card padding="sm" rounded="xl">
        <ListRow
          title={t({ nb: 'Marker bønner', en: 'Mark prayers', ar: 'تعليم الصلوات', ur: 'نمازیں نشان زد کریں' })}
          subtitle={t({ nb: 'Huk av bønnene du har bedt', en: 'Tick off the prayers you have prayed', ar: 'علّم الصلوات التي صلّيتها', ur: 'ادا کی گئی نمازوں پر نشان لگائیں' })}
          leading={<Ionicons name="checkmark-done-outline" size={20} color={theme.colors.primary} />}
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
    </SettingsPage>
  );
}
