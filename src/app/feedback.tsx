import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, Card, SegmentedControl, Screen, TextField } from '@/components/ui';
import { useRefresh } from '@/hooks/useRefresh';
import { useSupportThread } from '@/hooks/useSupportThread';
import { formatFeedback, type FeedbackKind } from '@/lib/supportApi';
import { appVersion, track } from '@/lib/telemetry';
import { useActiveLocation, useActiveMosque, useIsCalculatedMode } from '@/store/settings';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

const KINDS: { value: FeedbackKind; label: string }[] = [
  { value: 'Feil', label: 'Feil' },
  { value: 'Forslag', label: 'Forslag' },
  { value: 'Ros', label: 'Ros' },
  { value: 'Annet', label: 'Annet' },
];

const timeFormat = new Intl.DateTimeFormat('nb-NO', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

type Status = 'idle' | 'sending' | 'thread' | 'slack' | 'failed';

export default function FeedbackScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { messages, unread, hasTicket, send, markRead } = useSupportThread();
  const { refreshing, onRefresh } = useRefresh();
  const location = useActiveLocation();
  const calculated = useIsCalculatedMode();
  const mosque = useActiveMosque();
  const [kind, setKind] = useState<FeedbackKind>('Forslag');
  const [text, setText] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    track('feedback_opened');
  }, []);

  useEffect(() => {
    if (unread > 0) void markRead();
  }, [unread, markRead]);

  const submit = async () => {
    if (status === 'sending') return;
    setStatus('sending');
    const message = hasTicket
      ? text.trim()
      : formatFeedback(kind, text, {
          versjon: appVersion(),
          plattform: `${Platform.OS} ${Platform.Version}`,
          enhet: Device.modelName ?? 'ukjent',
          sted: location.name,
          tider: calculated ? 'beregnet' : mosque ? `moské (${mosque.name})` : 'kommune',
        });
    const outcome = await send(message, email.trim() || null);
    if (outcome === 'failed') {
      track('feedback_failed');
      setStatus('failed');
      return;
    }
    track('feedback_sent', { kind, channel: outcome });
    setText('');
    setStatus(outcome);
  };

  if (status === 'thread' || status === 'slack') {
    return (
      <Screen edges={['bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
          <Ionicons name="checkmark-circle" size={72} color={theme.colors.success} />
          <AppText size="xl" weight="semibold" align="center">
            Takk for tilbakemeldingen!
          </AppText>
          {status === 'thread' && (
            <AppText tone="textSecondary" align="center">
              Vi svarer her.
            </AppText>
          )}
        </View>
        <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          <Button label="Ferdig" fullWidth onPress={() => router.back()} />
          <Button label="Send en til" variant="ghost" fullWidth onPress={() => setStatus('idle')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll edges={[]} refreshing={refreshing} onRefresh={hasTicket ? onRefresh : undefined}>
      <View style={{ gap: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.xl }}>
        {messages.length > 0 && (
          <Card rounded="xl" style={{ gap: spacing.sm }}>
            {messages.map((message) => {
              const mine = message.authorType === 'customer';
              return (
                <View
                  key={message.id}
                  style={{
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    backgroundColor: mine ? theme.colors.primarySoft : theme.colors.surfaceSunken,
                    borderRadius: radius.lg,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    gap: spacing.xxs,
                  }}>
                  <AppText tone={mine ? 'onPrimarySoft' : 'textPrimary'}>{message.content}</AppText>
                  <AppText size="xs" tone="textMuted">
                    {mine ? 'Du' : 'Bønnetid'} · {timeFormat.format(new Date(message.createdAt))}
                  </AppText>
                </View>
              );
            })}
          </Card>
        )}

        <Card rounded="xl" style={{ gap: spacing.md }}>
          {!hasTicket && <SegmentedControl value={kind} options={KINDS} onChange={setKind} />}
          <TextField
            multiline
            value={text}
            onChangeText={(value) => {
              setText(value);
              if (status !== 'sending') setStatus('idle');
            }}
            placeholder={hasTicket ? 'Skriv et svar' : 'Hva vil du fortelle oss?'}
            maxLength={2000}
          />
          {!hasTicket && (
            <TextField
              value={email}
              onChangeText={setEmail}
              placeholder="E-post (valgfritt)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
          <Button
            label="Send"
            fullWidth
            loading={status === 'sending'}
            disabled={text.trim().length === 0}
            onPress={submit}
          />
          {status === 'failed' && (
            <AppText size="sm" tone="danger">
              Kunne ikke sende. Sjekk nettet og prøv igjen.
            </AppText>
          )}
        </Card>
      </View>
    </Screen>
  );
}
