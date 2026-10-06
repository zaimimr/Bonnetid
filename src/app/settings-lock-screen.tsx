import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, ListRow, Toggle } from '@/components/ui';
import { LockScreenPreview } from '@/components/settings/LockScreenPreview';
import {
  ROW,
  SettingsPage,
  hasIsland,
  useLockScreenToggle,
} from '@/components/settings/shared';
import { useTheme } from '@/theme';
import { useActiveMosque, useSettings } from '@/store/settings';
import { t } from '@/lib/i18n';

export default function LockScreenSettingsScreen() {
  const theme = useTheme();
  const mosque = useActiveMosque();
  const liveActivityEnabled = useSettings((state) => state.liveActivityEnabled);
  const widgetShowJamat = useSettings((state) => state.widgetShowJamat);
  const setWidgetShowJamat = useSettings((state) => state.setWidgetShowJamat);
  const toggleLockScreen = useLockScreenToggle();

  if (Platform.OS === 'android') {
    return (
      <SettingsPage>
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
      </SettingsPage>
    );
  }

  return (
    <SettingsPage>
      <LockScreenPreview enabled={liveActivityEnabled} />
      <Card padding="sm" rounded="xl">
        <ListRow
          title={t({ nb: 'Nedtelling på låseskjermen', en: 'Countdown on the lock screen', ar: 'العدّ التنازلي على شاشة القفل', ur: 'لاک اسکرین پر الٹی گنتی' })}
          subtitle={hasIsland ? t({ nb: 'Også i Dynamic Island', en: 'Also in the Dynamic Island', ar: 'وفي Dynamic Island أيضًا', ur: 'Dynamic Island میں بھی' }) : undefined}
          leading={<Ionicons name="timer-outline" size={20} color={theme.colors.primary} />}
          trailing={<Toggle value={liveActivityEnabled} onValueChange={toggleLockScreen} />}
          style={ROW}
        />
      </Card>
    </SettingsPage>
  );
}
