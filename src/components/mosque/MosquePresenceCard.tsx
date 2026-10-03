import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MosqueAnnouncement } from '@/components/mosque/MosqueAnnouncement';
import { MosqueLogo } from '@/components/mosque/MosqueLogo';
import { AppText, Button, Card } from '@/components/ui';
import { useFeature } from '@/hooks/useFeature';
import { useMosquePresence } from '@/hooks/useMosquePresence';
import { openVipps } from '@/lib/mosqueDonations';
import { track } from '@/lib/telemetry';
import { useUnreadAnnouncement } from '@/store/settings';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

const trackedMosques = new Set<string>();

export function MosquePresenceCard() {
  const theme = useTheme();
  const router = useRouter();
  const presence = useMosquePresence();
  const donationEnabled = useFeature('mosque-donation');
  const orgNr = presence?.mosque.org_nr;
  const announcement = useUnreadAnnouncement(orgNr, presence?.mosque.announcement);

  useEffect(() => {
    if (!orgNr || trackedMosques.has(orgNr)) return;
    trackedMosques.add(orgNr);
    track('mosque_presence_shown');
  }, [orgNr]);

  if (!presence) return null;

  const { mosque } = presence;

  return (
    <Card
      rounded="xl"
      onPress={() => router.push({ pathname: '/mosque/[orgNr]', params: { orgNr: mosque.org_nr } })}
      style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <MosqueLogo uri={mosque.logo} size="sm" />
        <View style={{ flex: 1 }}>
          <AppText size="xs" weight="medium" tone="primary">
            Du er i moskeen
          </AppText>
          <AppText size="md" weight="semibold">
            {mosque.name}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </View>
      {announcement && <MosqueAnnouncement text={announcement} compact />}
      {donationEnabled && (
        <Button
          label={mosque.vipps_number ? `Doner med Vipps · ${mosque.vipps_number}` : 'Doner med Vipps'}
          variant="secondary"
          size="sm"
          fullWidth
          onPress={() => {
            track('mosque_donation_opened', { source: 'presence' });
            openVipps();
          }}
        />
      )}
    </Card>
  );
}
