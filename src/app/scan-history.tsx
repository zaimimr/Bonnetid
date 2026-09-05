import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Disclaimer } from '@/components/halal/Disclaimer';
import { VerdictBadge } from '@/components/halal/VerdictBadge';
import { AppText, Button, Card, Divider, EmptyState, ListRow, Screen } from '@/components/ui';
import { HALAL_METHOD } from '@/lib/halalCopy';
import { useScanHistory, type ScanEntry } from '@/store/halalScans';
import { spacing } from '@/theme/tokens';

function formatScannedAt(at: number): string {
  const date = new Date(at);
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  if (sameDay) return `I dag ${time}`;
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')} ${time}`;
}

export default function ScanHistoryScreen() {
  const router = useRouter();
  const entries = useScanHistory((state) => state.entries);
  const clearHistory = useScanHistory((state) => state.clearHistory);

  return (
    <Screen scroll>
      <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
        <Card rounded="lg">
          <AppText size="sm" tone="textSecondary">
            {HALAL_METHOD}
          </AppText>
        </Card>

        {entries.length === 0 ? (
          <EmptyState message="Du har ikke skannet noe ennå" icon="barcode-outline" />
        ) : (
          <Card rounded="lg" padding="md">
            {entries.map((entry, index) => (
              <View key={entry.barcode}>
                {index > 0 && <Divider />}
                <HistoryRow entry={entry} onPress={() =>
                    router.push({ pathname: '/scan/[barcode]', params: { barcode: entry.barcode } })
                  } />
              </View>
            ))}
          </Card>
        )}

        {entries.length > 0 && (
          <Button
            label="Tøm historikken"
            variant="ghost"
            fullWidth
            onPress={() => clearHistory()}
          />
        )}

        <Disclaimer />
      </View>
    </Screen>
  );
}

function HistoryRow({ entry, onPress }: { entry: ScanEntry; onPress: () => void }) {
  const subtitle = [entry.brand, formatScannedAt(entry.at)].filter(Boolean).join(' · ');

  return (
    <ListRow
      title={entry.name ?? `Strekkode ${entry.barcode}`}
      subtitle={subtitle}
      trailing={
        entry.verdict ? (
          <VerdictBadge verdict={entry.verdict} />
        ) : (
          <AppText size="xs" tone="textMuted">
            Ikke funnet
          </AppText>
        )
      }
      chevron
      onPress={onPress}
    />
  );
}
