import { useRouter } from 'expo-router';
import { Card, ListRow, SegmentedControl } from '@/components/ui';
import { Field, ROW, SettingsPage } from '@/components/settings/shared';
import { track } from '@/lib/telemetry';
import { useHomeEdit } from '@/store/homeEdit';
import { useSettings } from '@/store/settings';
import { t } from '@/lib/i18n';

export default function AppearanceSettingsScreen() {
  const router = useRouter();
  const setHomeEditing = useHomeEdit((state) => state.setEditing);
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
          title={t('customize.customize')}
          chevron
          onPress={() => {
            setHomeEditing(true);
            router.navigate('/');
          }}
          style={ROW}
        />
      </Card>
    </SettingsPage>
  );
}
