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
import { intlLocale, t } from '@/lib/i18n';
import { useActiveLocation, useActiveMosque, useIsCalculatedMode } from '@/store/settings';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

const KINDS: { value: FeedbackKind; label: string }[] = [
  { value: 'Feil', label: t({ nb: 'Feil', en: 'Bug', ar: 'خطأ', ur: 'خرابی' }) },
  { value: 'Forslag', label: t({ nb: 'Forslag', en: 'Idea', ar: 'اقتراح', ur: 'تجویز' }) },
  { value: 'Ros', label: t({ nb: 'Ros', en: 'Praise', ar: 'إشادة', ur: 'تعریف' }) },
  { value: 'Annet', label: t({ nb: 'Annet', en: 'Other', ar: 'أخرى', ur: 'دیگر' }) },
];

const timeFormat = new Intl.DateTimeFormat(intlLocale(), {
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
            {t({ nb: 'Takk for tilbakemeldingen!', en: 'Thanks for your feedback!', ar: 'شكرًا على ملاحظاتك!', ur: 'آپ کی رائے کا شکریہ!' })}
          </AppText>
          {status === 'thread' && (
            <AppText tone="textSecondary" align="center">
              {t({ nb: 'Vi svarer her.', en: 'We will reply here.', ar: 'سنرد عليك هنا.', ur: 'ہم یہیں جواب دیں گے۔' })}
            </AppText>
          )}
        </View>
        <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          <Button label={t({ nb: 'Ferdig', en: 'Done', ar: 'تم', ur: 'ہو گیا' })} fullWidth onPress={() => router.back()} />
          <Button label={t({ nb: 'Send en til', en: 'Send another', ar: 'أرسل رسالة أخرى', ur: 'ایک اور بھیجیں' })} variant="ghost" fullWidth onPress={() => setStatus('idle')} />
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
                    {mine ? t({ nb: 'Du', en: 'You', ar: 'أنت', ur: 'آپ' }) : 'Bønnetid'} · {timeFormat.format(new Date(message.createdAt))}
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
            placeholder={
              hasTicket
                ? t({ nb: 'Skriv et svar', en: 'Write a reply', ar: 'اكتب ردًا', ur: 'جواب لکھیں' })
                : t({ nb: 'Hva vil du fortelle oss?', en: 'What would you like to tell us?', ar: 'ماذا تود أن تخبرنا؟', ur: 'آپ ہمیں کیا بتانا چاہتے ہیں؟' })
            }
            maxLength={2000}
          />
          {!hasTicket && (
            <TextField
              value={email}
              onChangeText={setEmail}
              placeholder={t({ nb: 'E-post (valgfritt)', en: 'Email (optional)', ar: 'البريد الإلكتروني (اختياري)', ur: 'ای میل (اختیاری)' })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
          <Button
            label={t({ nb: 'Send', en: 'Send', ar: 'إرسال', ur: 'بھیجیں' })}
            fullWidth
            loading={status === 'sending'}
            disabled={text.trim().length === 0}
            onPress={submit}
          />
          {status === 'failed' && (
            <AppText size="sm" tone="danger">
              {t({
                nb: 'Kunne ikke sende. Sjekk nettet og prøv igjen.',
                en: 'Could not send. Check your connection and try again.',
                ar: 'تعذّر الإرسال. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.',
                ur: 'بھیجا نہیں جا سکا۔ انٹرنیٹ چیک کریں اور دوبارہ کوشش کریں۔',
              })}
            </AppText>
          )}
        </Card>
      </View>
    </Screen>
  );
}
