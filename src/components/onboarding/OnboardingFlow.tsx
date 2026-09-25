import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { AppText, Button, Screen } from '@/components/ui';
import { PrayerIcon } from '@/components/prayer/PrayerIcon';
import { useLocations } from '@/api/queries';
import { detectNearestLocation } from '@/hooks/useAutoLocation';
import { useNow } from '@/hooks/useNow';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import { formatDurationShort } from '@/lib/time';
import { resolvePlace, requestCoords } from '@/hooks/useTravelDetection';
import { isInsideNorwayBounds } from '@/lib/travelMode';
import { notificationsSupported, requestNotificationPermission } from '@/lib/notifications';
import { track } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import {
  DEFAULT_LOCATION,
  calculatedLocation,
  useActiveLocation,
  useSettings,
  type SavedLocation,
} from '@/store/settings';

type StepId = 'welcome' | 'location' | 'mosque' | 'notifications' | 'tracker' | 'ready';

const STEP_ORDER: StepId[] = ['welcome', 'location', 'mosque', 'notifications', 'tracker', 'ready'];

const LINE_ART = require('../../../assets/images/splash-icon.png');
const LINE_ART_RATIO = 1525 / 1537;

const enter = (delay: number) =>
  FadeInDown.duration(250).delay(delay).reduceMotion(ReduceMotion.System);

export function OnboardingFlow() {
  const theme = useTheme();
  const [index, setIndex] = useState(0);

  const location = useSettings((state) => state.location);
  const mosque = useSettings((state) => state.mosque);
  const notificationsEnabled = useSettings((state) => state.notificationsEnabled);
  const trackerEnabled = useSettings((state) => state.prayerTrackerEnabled);
  const completeOnboarding = useSettings((state) => state.completeOnboarding);

  const calculated = location?.mode === 'calculated';
  const steps = useMemo(
    () => STEP_ORDER.filter((step) => step !== 'mosque' || !calculated),
    [calculated],
  );
  const step = steps[Math.min(index, steps.length - 1)];

  const advance = useCallback(() => {
    setIndex((current) => Math.min(current + 1, steps.length - 1));
  }, [steps.length]);

  const finish = useCallback(() => {
    completeOnboarding();
    track('onboarding_completed', {
      location: location?.mode ?? 'none',
      mosque: mosque ? 'valgt' : 'ingen',
      notifications: notificationsEnabled ? 'på' : 'av',
      tracker: trackerEnabled ? 'på' : 'av',
    });
  }, [completeOnboarding, location?.mode, mosque, notificationsEnabled, trackerEnabled]);

  const setupSteps: StepId[] = steps.filter((id) => id !== 'welcome' && id !== 'ready');
  const setupPosition = setupSteps.indexOf(step);

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, gap: spacing.xl, paddingTop: spacing.xl }}>
        {setupPosition >= 0 && (
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {setupSteps.map((id, position) => (
              <View
                key={id}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: radius.full,
                  backgroundColor:
                    position <= setupPosition ? theme.colors.primary : theme.colors.surfaceSunken,
                }}
              />
            ))}
          </View>
        )}

        {step === 'welcome' && <WelcomeStep onNext={advance} />}
        {step === 'location' && <LocationStep onNext={advance} />}
        {step === 'mosque' && <MosqueStep onNext={advance} />}
        {step === 'notifications' && <NotificationStep onNext={advance} />}
        {step === 'tracker' && <TrackerStep onNext={advance} />}
        {step === 'ready' && <ReadyStep onFinish={finish} />}
      </View>
    </Screen>
  );
}

function LineArt() {
  const theme = useTheme();
  return (
    <Image
      source={LINE_ART}
      tintColor={theme.colors.primary}
      contentFit="contain"
      accessible={false}
      style={{ height: '78%', maxWidth: 260, aspectRatio: LINE_ART_RATIO }}
    />
  );
}

type StepShellProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  children?: React.ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

function StepShell({
  icon,
  title,
  body,
  children,
  primaryLabel,
  onPrimary,
  primaryLoading = false,
  secondaryLabel,
  onSecondary,
}: StepShellProps) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, gap: spacing.xl }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.lg,
            backgroundColor: theme.colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name={icon} size={28} color={theme.colors.primary} />
        </View>

        <AppText size="xxl" weight="bold" heading>
          {title}
        </AppText>
        <AppText size="md" tone="textSecondary">
          {body}
        </AppText>

        {children}
      </ScrollView>

      <View style={{ gap: spacing.sm, paddingBottom: spacing.lg }}>
        <Button label={primaryLabel} onPress={onPrimary} fullWidth loading={primaryLoading} />
        {secondaryLabel && onSecondary && (
          <Button label={secondaryLabel} onPress={onSecondary} variant="ghost" fullWidth />
        )}
      </View>
    </View>
  );
}

function StatusLine({ tone, text }: { tone: 'success' | 'textMuted'; text: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Ionicons
        name={tone === 'success' ? 'checkmark-circle' : 'information-circle-outline'}
        size={18}
        color={tone === 'success' ? theme.colors.success : theme.colors.textMuted}
      />
      <AppText size="sm" tone={tone} style={{ flex: 1 }}>
        {text}
      </AppText>
    </View>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        entering={FadeIn.duration(250).reduceMotion(ReduceMotion.System)}
        style={{ flex: 1, minHeight: 140, alignItems: 'center', justifyContent: 'center' }}>
        <LineArt />
      </Animated.View>

      <Animated.View entering={enter(80)} style={{ gap: spacing.sm }}>
        <AppText size="lg" weight="semibold" color={theme.colors.primary}>
          Assalamu alaikum
        </AppText>
        <AppText size="display" weight="bold" heading>
          Velkommen til Bønnetid
        </AppText>
        <AppText size="md" tone="textSecondary" style={{ marginTop: spacing.xs }}>
          Bønnetidene for kommunen din, varsel når det er tid, og jamat-tidene fra moskeen din.
          Oppsettet tar et halvt minutt.
        </AppText>
      </Animated.View>

      <Animated.View
        entering={enter(160)}
        style={{ gap: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.lg }}>
        <Button label="Kom i gang" onPress={onNext} size="lg" fullWidth />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
          }}>
          <Image
            source={
              theme.scheme === 'dark'
                ? require('../../../assets/images/irn-logo-dark.png')
                : require('../../../assets/images/irn-logo.png')
            }
            style={{ width: 16, height: 18 }}
            contentFit="contain"
            accessible={false}
          />
          <AppText size="sm" tone="textSecondary">
            Bønnetider fra Islamsk Råd Norge
          </AppText>
        </View>
      </Animated.View>
    </View>
  );
}

function LocationStep({ onNext }: { onNext: () => void }) {
  const { data: locations } = useLocations();
  const location = useSettings((state) => state.location);
  const setLocation = useSettings((state) => state.setLocation);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  const detect = async () => {
    setBusy(true);
    setDenied(false);
    try {
      const inNorway = locations ? await detectNearestLocation(locations) : null;
      if (inNorway) {
        setLocation(inNorway);
        track('location_detected', { iso: inNorway.iso, source: 'onboarding' });
        return;
      }

      const coords = await requestCoords();
      if (!coords) {
        setDenied(true);
        return;
      }
      if (isInsideNorwayBounds(coords.lat, coords.lon)) {
        setDenied(true);
        return;
      }
      const place = await resolvePlace(coords);
      const abroad: SavedLocation = calculatedLocation(place.name, coords.lat, coords.lon, place);
      setLocation(abroad);
      track('location_detected', { iso: abroad.iso, source: 'onboarding-abroad' });
    } finally {
      setBusy(false);
    }
  };

  const chosen = location != null;

  return (
    <StepShell
      icon="location-outline"
      title="Hvor er du?"
      body="Appen finner kommunen din og henter bønnetidene derfra. Er du utenfor Norge, regnes tidene ut for stedet du er på."
      primaryLabel={chosen ? 'Fortsett' : 'Finn posisjonen min'}
      onPrimary={chosen ? onNext : detect}
      primaryLoading={busy}
      secondaryLabel={chosen ? undefined : 'Hopp over'}
      onSecondary={chosen ? undefined : onNext}>
      {chosen && (
        <StatusLine
          tone="success"
          text={
            location.mode === 'calculated'
              ? `${location.name} · tidene regnes ut lokalt`
              : `${location.name} · bønnetider fra Islamsk Råd Norge`
          }
        />
      )}
      {!chosen && denied && (
        <StatusLine
          tone="textMuted"
          text={`Fant ingen posisjon. Appen bruker ${DEFAULT_LOCATION.name} til du gir tilgang i telefonens innstillinger.`}
        />
      )}
    </StepShell>
  );
}

function MosqueStep({ onNext }: { onNext: () => void }) {
  const router = useRouter();
  const mosque = useSettings((state) => state.mosque);
  const [mosqueOnArrival] = useState(() => mosque?.orgNr ?? null);
  const chosenOrgNr = mosque?.orgNr ?? null;

  useEffect(() => {
    if (chosenOrgNr != null && chosenOrgNr !== mosqueOnArrival) onNext();
  }, [chosenOrgNr, mosqueOnArrival, onNext]);

  return (
    <StepShell
      icon="business-outline"
      title="Velg moskeen din"
      body="Da står jamat-tidene og fredagsbønnen ved siden av bønnetidene, og Asr følger moskeens metode."
      primaryLabel={mosque ? 'Fortsett' : 'Velg moské'}
      onPrimary={mosque ? onNext : () => router.push('/mosque-picker')}
      secondaryLabel={mosque ? 'Bytt moské' : 'Hopp over'}
      onSecondary={mosque ? () => router.push('/mosque-picker') : onNext}>
      {mosque && <StatusLine tone="success" text={mosque.name} />}
      {!mosque && (
        <StatusLine tone="textMuted" text="Du kan velge moské senere under Innstillinger." />
      )}
    </StepShell>
  );
}

function NotificationStep({ onNext }: { onNext: () => void }) {
  const notificationsEnabled = useSettings((state) => state.notificationsEnabled);
  const setNotificationsEnabled = useSettings((state) => state.setNotificationsEnabled);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  const enable = async () => {
    setBusy(true);
    try {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
      setDenied(!granted);
      track('notifications_toggled', { enabled: granted, source: 'onboarding' });
      if (granted) onNext();
    } finally {
      setBusy(false);
    }
  };

  if (!notificationsSupported) {
    return (
      <StepShell
        icon="notifications-outline"
        title="Varsle ved bønnetid"
        body="Varsler krever en installert versjon av appen. Du kan slå dem på under Innstillinger når du har den."
        primaryLabel="Fortsett"
        onPrimary={onNext}
      />
    );
  }

  return (
    <StepShell
      icon="notifications-outline"
      title="Varsle ved bønnetid"
      body="Få et varsel når hver bønn begynner. Adhan-lyd og hvilke bønner som skal varsle velger du under Innstillinger."
      primaryLabel={notificationsEnabled ? 'Fortsett' : 'Slå på varsler'}
      onPrimary={notificationsEnabled ? onNext : enable}
      primaryLoading={busy}
      secondaryLabel={notificationsEnabled ? undefined : 'Ikke nå'}
      onSecondary={notificationsEnabled ? undefined : onNext}>
      {notificationsEnabled && <StatusLine tone="success" text="Varsler er på for alle fem bønner" />}
      {!notificationsEnabled && denied && (
        <StatusLine
          tone="textMuted"
          text="Telefonen sa nei til varsler. Du kan gi tilgang i telefonens innstillinger senere."
        />
      )}
    </StepShell>
  );
}

function TrackerStep({ onNext }: { onNext: () => void }) {
  const trackerEnabled = useSettings((state) => state.prayerTrackerEnabled);
  const setTrackerEnabled = useSettings((state) => state.setPrayerTrackerEnabled);

  const body =
    Platform.OS === 'ios'
      ? 'Marker bønnene du har bedt. Du får en nedtelling på låseskjermen der du kan svare uten å åpne appen.'
      : 'Marker bønnene du har bedt. Du får et varsel på låseskjermen der du kan svare uten å åpne appen.';

  const enable = () => {
    setTrackerEnabled(true);
    track('prayer_tracker_toggled', { enabled: true, source: 'onboarding' });
    onNext();
  };

  return (
    <StepShell
      icon="checkmark-done-outline"
      title="Hold oversikt over bønnene"
      body={body}
      primaryLabel={trackerEnabled ? 'Fortsett' : 'Slå på bønnesporing'}
      onPrimary={trackerEnabled ? onNext : enable}
      secondaryLabel={trackerEnabled ? undefined : 'Nei takk'}
      onSecondary={trackerEnabled ? undefined : onNext}>
      {trackerEnabled && <StatusLine tone="success" text="Bønnesporing er på" />}
    </StepShell>
  );
}

function ReadyStep({ onFinish }: { onFinish: () => void }) {
  const theme = useTheme();
  const now = useNow(30_000);
  const location = useActiveLocation();
  const mosque = useSettings((state) => state.mosque);
  const { nextPrayer } = usePrayerDay(now);
  const next = nextPrayer?.next;

  const body = mosque
    ? `Bønnetidene for ${location.name} er klare, med jamat-tidene fra ${mosque.name}.`
    : `Bønnetidene for ${location.name} er klare.`;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, minHeight: 180, alignItems: 'center', justifyContent: 'center' }}>
        {next ? (
          <Animated.View
            entering={FadeIn.duration(250).reduceMotion(ReduceMotion.System)}
            accessible
            accessibilityLabel={`Neste bønn er ${next.label} klokken ${next.time}`}
            style={{ alignItems: 'center', gap: spacing.xs }}>
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: radius.full,
                backgroundColor: theme.colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.md,
              }}>
              <PrayerIcon name={next.name} size={40} color={theme.colors.primary} />
            </View>
            <AppText size="sm" weight="medium" tone="textSecondary">
              {nextPrayer.isTomorrow ? 'Første bønn i morgen' : 'Neste bønn'}
            </AppText>
            <AppText size="display" weight="bold" heading>
              {next.label}
            </AppText>
            <AppText size="lg" tone="textSecondary" tabular>
              {`kl. ${next.time} · om ${formatDurationShort(next.date.getTime() - now.getTime())}`}
            </AppText>
          </Animated.View>
        ) : (
          <LineArt />
        )}
      </View>

      <Animated.View entering={enter(80)} style={{ gap: spacing.sm }}>
        <AppText size="display" weight="bold" heading>
          Klar for bruk
        </AppText>
        <AppText size="md" tone="textSecondary">
          {body}
        </AppText>
        <AppText size="md" weight="medium" color={theme.colors.primary} style={{ marginTop: spacing.xs }}>
          Må Allah ta imot bønnene dine.
        </AppText>
      </Animated.View>

      <Animated.View
        entering={enter(160)}
        style={{ gap: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.lg }}>
        <Button label="Åpne Bønnetid" onPress={onFinish} size="lg" fullWidth />
        <AppText size="sm" tone="textSecondary" align="center">
          Alt kan endres senere under Mer.
        </AppText>
      </Animated.View>
    </View>
  );
}
