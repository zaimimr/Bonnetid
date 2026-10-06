import { Card, SegmentedControl } from '@/components/ui';
import { Field, SettingsPage } from '@/components/settings/shared';
import { track } from '@/lib/telemetry';
import { useSettings } from '@/store/settings';
import { t } from '@/lib/i18n';

export default function AppearanceSettingsScreen() {
  const themePreference = useSettings((state) => state.themePreference);
  const setThemePreference = useSettings((state) => state.setThemePreference);

  return (
    <SettingsPage>
      <Card padding="sm" rounded="xl">
        <Field label={t({ nb: 'Tema', en: 'Theme', ar: 'السمة', ur: 'تھیم' })}>
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
        </Field>
      </Card>
    </SettingsPage>
  );
}
