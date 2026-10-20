import { useRouter } from 'expo-router';
import { Card, Divider, ListRow, SegmentedControl } from '@/components/ui';
import { Field, ROW, SettingsPage } from '@/components/settings/shared';
import { track } from '@/lib/telemetry';
import { useSettings } from '@/store/settings';
import { t } from '@/lib/i18n';

export default function AppearanceSettingsScreen() {
  const router = useRouter();
  const themePreference = useSettings((state) => state.themePreference);
  const setThemePreference = useSettings((state) => state.setThemePreference);

  return (
    <SettingsPage>
      <Card padding="sm" rounded="xl">
        <Field label={t('settings.theme')}>
          <SegmentedControl
            value={themePreference}
            onChange={(preference) => {
              setThemePreference(preference);
              track('theme_changed', { theme: preference });
            }}
            options={[
              { value: 'system', label: t('settings.system') },
              { value: 'light', label: t('settings.light') },
              { value: 'dark', label: t('settings.dark') },
            ]}
          />
        </Field>
      </Card>
      <Card padding="sm" rounded="xl">
        <ListRow
          title={t('customize.tabBar')}
          chevron
          onPress={() => router.push('/settings-tabs')}
          style={ROW}
        />
        <Divider />
        <ListRow
          title={t('customize.customizeHome')}
          chevron
          onPress={() => router.push('/settings-home')}
          style={ROW}
        />
      </Card>
    </SettingsPage>
  );
}
