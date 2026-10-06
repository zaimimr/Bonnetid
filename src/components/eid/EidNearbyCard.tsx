import { Fragment } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { t } from '@/lib/i18n';
import type { Mosque } from '@/api/types';
import { Card, Divider, ListRow, SectionHeader } from '@/components/ui';

export function EidNearbyCard({ mosques }: { mosques: Mosque[] }) {
  const router = useRouter();

  if (mosques.length === 0) return null;

  return (
    <View>
      <SectionHeader
        title={t({
          nb: 'Eid-bønn i nærheten',
          en: 'Eid prayer nearby',
          ar: 'صلاة العيد بالقرب منك',
          ur: 'قریب میں عید کی نماز',
        })}
      />
      <Card rounded="xl" padding="sm">
        {mosques.map((mosque, index) => (
          <Fragment key={mosque.org_nr}>
            {index > 0 && <Divider />}
            <ListRow
              title={mosque.name}
              subtitle={mosque.eid_prayers.join(' · ')}
              chevron
              onPress={() =>
                router.push({ pathname: '/mosque/[orgNr]', params: { orgNr: mosque.org_nr } })
              }
            />
          </Fragment>
        ))}
      </Card>
    </View>
  );
}
