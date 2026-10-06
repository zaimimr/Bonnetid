import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Linking, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { t } from '@/lib/i18n';
import { AppText, Button, Card, Divider, ListRow, Screen } from '@/components/ui';
import { PrayerIcon } from '@/components/prayer/PrayerIcon';
import { useLocations } from '@/api/queries';
import type { ApiLocation } from '@/api/types';
import { detectNearestLocation } from '@/hooks/useAutoLocation';
import { useNow } from '@/hooks/useNow';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import { ASR_METHOD_OPTIONS } from '@/lib/asrMethods';
import { formatDurationShort } from '@/lib/time';
import { resolvePlace, requestCoords } from '@/hooks/useTravelDetection';
import { isInsideNorwayBounds } from '@/lib/travelMode';
import { notificationsSupported, requestNotificationPermission } from '@/lib/notifications';
import { appVersion, track, trackError } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import {
  DEFAULT_LOCATION,
  calculatedLocation,
  useActiveLocation,
  useSettings,
  type SavedLocation,
} from '@/store/settings';
import { PostHogMaskView } from 'posthog-react-native';

type StepId = 'welcome' | 'location' | 'mosque' | 'asr' | 'notifications' | 'tracker' | 'ready';

const STEP_ORDER: StepId[] = [
  'welcome',
  'location',
  'mosque',
  'asr',
  'notifications',
  'tracker',
  'ready',
];

const LINE_ART = require('../../../assets/images/splash-icon.png');
const LINE_ART_RATIO = 1525 / 1537;

const CONTINUE = t('onboarding.continue');
const NOTIFY_TITLE = t('onboarding.notifyAtPrayerTime');

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
    () =>
      STEP_ORDER.filter(
        (step) => (step !== 'mosque' || !calculated) && (step !== 'asr' || mosque == null),
      ),
    [calculated, mosque],
  );
  const step = steps[Math.min(index, steps.length - 1)];

  const advance = useCallback(() => {
    setIndex((current) => Math.min(current + 1, steps.length - 1));
  }, [steps.length]);

  const finish = useCallback(() => {
    completeOnboarding(appVersion());
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
        {step === 'asr' && <AsrStep onNext={advance} />}
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
          {t('onboarding.assalamuAlaikum')}
        </AppText>
        <AppText size="display" weight="bold" heading>
          {t('onboarding.welcomeToBNnetid')}
        </AppText>
        <AppText size="md" tone="textSecondary" style={{ marginTop: spacing.xs }}>
          {t('onboarding.prayerTimesForYour')}
        </AppText>
      </Animated.View>

      <Animated.View
        entering={enter(160)}
        style={{ gap: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.lg }}>
        <Button
          label={t('onboarding.getStarted')}
          onPress={onNext}
          size="lg"
          fullWidth
        />
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
            {t('onboarding.prayerTimesFromThe')}
          </AppText>
        </View>
      </Animated.View>
    </View>
  );
}

async function detectOnboardingLocation(
  locations: ApiLocation[],
  setLocation: (location: SavedLocation) => void,
): Promise<boolean> {
  const inNorway = await detectNearestLocation(locations);
  if (inNorway) {
    setLocation(inNorway);
    track('location_detected', { iso: inNorway.iso, source: 'onboarding' });
    return true;
  }

  const coords = await requestCoords();
  if (!coords || isInsideNorwayBounds(coords.lat, coords.lon)) return false;
  const place = await resolvePlace(coords);
  const abroad = calculatedLocation(place.name, coords.lat, coords.lon, place);
  setLocation(abroad);
  track('location_detected', { iso: abroad.iso, source: 'onboarding-abroad' });
  return true;
}

function LocationStep({ onNext }: { onNext: () => void }) {
  const { data: locations } = useLocations();
  const setLocation = useSettings((state) => state.setLocation);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  const running = useRef(false);

  const detect = useCallback(async () => {
    if (!locations || running.current) return;
    running.current = true;
    setBusy(true);
    setDenied(false);
    try {
      const found = await detectOnboardingLocation(locations, setLocation);
      if (found) onNext();
      else setDenied(true);
    } catch (error) {
      trackError(error, 'onboarding-location');
      setDenied(true);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, [locations, setLocation, onNext]);

  useEffect(() => {
    if (!locations) return;
    let cancelled = false;
    const detectIfGranted = () => {
      Promise.all([Location.getForegroundPermissionsAsync(), Location.hasServicesEnabledAsync()])
        .then(([permission, servicesEnabled]) => {
          if (!cancelled && permission.granted && servicesEnabled) return detect();
        })
        .catch((error) => trackError(error, 'onboarding-location'));
    };
    detectIfGranted();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') detectIfGranted();
    });
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [locations, detect]);

  return (
    <StepShell
      icon="location-outline"
      title={t('onboarding.whereAreYou')}
      body={t('onboarding.toShowTheRight')}
      primaryLabel={
        denied
          ? t('onboarding.openSettings')
          : t('onboarding.findMyLocation')
      }
      onPrimary={denied ? () => Linking.openSettings() : detect}
      primaryLoading={busy || !locations}
      secondaryLabel={
        denied
          ? t('onboarding.continueWith', { name: DEFAULT_LOCATION.name })
          : undefined
      }
      onSecondary={denied ? onNext : undefined}>
      {denied && (
        <StatusLine
          tone="textMuted"
          text={t('onboarding.noLocationFoundGive', { name: DEFAULT_LOCATION.name })}
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
      title={t('onboarding.chooseYourMosque')}
      body={t('onboarding.chooseYourMosqueAnd')}
      primaryLabel={mosque ? CONTINUE : t('onboarding.chooseMosque')}
      onPrimary={mosque ? onNext : () => router.push('/mosque-picker')}
      secondaryLabel={
        mosque
          ? t('onboarding.changeMosque')
          : t('onboarding.skip')
      }
      onSecondary={mosque ? () => router.push('/mosque-picker') : onNext}>
      {mosque && <StatusLine tone="success" text={mosque.name} />}
      {!mosque && (
        <StatusLine
          tone="textMuted"
          text={t('onboarding.youCanChooseA')}
        />
      )}
    </StepShell>
  );
}

function AsrStep({ onNext }: { onNext: () => void }) {
  const theme = useTheme();
  const asrMethod = useSettings((state) => state.asrMethod);
  const setAsrMethod = useSettings((state) => state.setAsrMethod);
  const current = asrMethod ?? 'irn';

  const choose = () => {
    if (asrMethod == null) setAsrMethod(current);
    track('asr_method_changed', { method: current, source: 'onboarding' });
    onNext();
  };

  return (
    <StepShell
      icon="partly-sunny-outline"
      title={t('onboarding.chooseAsrMethod')}
      body={t('onboarding.theAsrTimeDepends')}
      primaryLabel={CONTINUE}
      onPrimary={choose}>
      <Card padding="sm" rounded="xl">
        {ASR_METHOD_OPTIONS.map((option, index) => (
          <View key={option.value}>
            {index > 0 && <Divider />}
            <ListRow
              title={option.label}
              subtitle={option.description}
              trailing={
                option.value === current ? (
                  <Ionicons name="checkmark" size={22} color={theme.colors.primary} />
                ) : undefined
              }
              onPress={() => setAsrMethod(option.value)}
              style={{ paddingHorizontal: spacing.md }}
            />
          </View>
        ))}
      </Card>
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
        title={NOTIFY_TITLE}
        body={t('onboarding.notificationsRequireAnInstalled')}
        primaryLabel={CONTINUE}
        onPrimary={onNext}
      />
    );
  }

  return (
    <StepShell
      icon="notifications-outline"
      title={NOTIFY_TITLE}
      body={t('onboarding.getANotificationWhen')}
      primaryLabel={
        notificationsEnabled
          ? CONTINUE
          : t('onboarding.turnOnNotifications')
      }
      onPrimary={notificationsEnabled ? onNext : enable}
      primaryLoading={busy}
      secondaryLabel={
        notificationsEnabled ? undefined : t('onboarding.notNow')
      }
      onSecondary={notificationsEnabled ? undefined : onNext}>
      {notificationsEnabled && (
        <StatusLine
          tone="success"
          text={t('onboarding.notificationsAreOnFor')}
        />
      )}
      {!notificationsEnabled && denied && (
        <StatusLine
          tone="textMuted"
          text={t('onboarding.yourPhoneDeclinedNotifications')}
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
      ? t('onboarding.markThePrayersYou')
      : t('onboarding.markThePrayersYou2');

  const enable = () => {
    setTrackerEnabled(true);
    track('prayer_tracker_toggled', { enabled: true, source: 'onboarding' });
    onNext();
  };

  return (
    <StepShell
      icon="checkmark-done-outline"
      title={t('onboarding.keepTrackOfYour')}
      body={body}
      primaryLabel={
        trackerEnabled
          ? CONTINUE
          : t('onboarding.turnOnPrayerTracking')
      }
      onPrimary={trackerEnabled ? onNext : enable}
      secondaryLabel={
        trackerEnabled ? undefined : t('onboarding.noThanks')
      }
      onSecondary={trackerEnabled ? undefined : onNext}>
      {trackerEnabled && (
        <StatusLine
          tone="success"
          text={t('onboarding.prayerTrackingIsOn')}
        />
      )}
    </StepShell>
  );
}

function ReadyStep({ onFinish }: { onFinish: () => void }) {
  const theme = useTheme();
  const now = useNow(30_000);
  const location = useActiveLocation();
  const mosque = useSettings((state) => state.mosque);
  const { nextPrayer } = usePrayerDay(now);
  const current = nextPrayer?.current;
  const shown = current ?? nextPrayer?.next;
  const countdownTarget = current ? (current.end?.date ?? nextPrayer?.next.date) : shown?.date;
  const countdownLabel = current ? (current.end?.label ?? nextPrayer?.next.label) : null;
  const remaining = countdownTarget ? formatDurationShort(countdownTarget.getTime() - now.getTime()) : '';

  const body = mosque
    ? t('onboarding.prayerTimesForAre', { name: location.name, name2: mosque.name })
    : t('onboarding.prayerTimesForAre2', { name: location.name });

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, minHeight: 180, alignItems: 'center', justifyContent: 'center' }}>
        {shown ? (
          <Animated.View
            entering={FadeIn.duration(250).reduceMotion(ReduceMotion.System)}
            accessible
            accessibilityLabel={
              current
                ? t('onboarding.currentPrayerIsFrom', { label: shown.label, time: shown.time })
                : t('onboarding.nextPrayerIsAt', { label: shown.label, time: shown.time })
            }
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
              <PrayerIcon name={shown.name} size={40} color={theme.colors.primary} />
            </View>
            <AppText size="sm" weight="medium" tone="textSecondary">
              {current
                ? t('onboarding.currentPrayer')
                : nextPrayer?.isTomorrow
                  ? t('onboarding.firstPrayerTomorrow')
                  : t('onboarding.nextPrayer')}
            </AppText>
            <AppText size="display" weight="bold" heading>
              {shown.label}
            </AppText>
            <AppText size="lg" tone="textSecondary" tabular>
              {countdownLabel
                ? t('onboarding.in', { time: shown.time, countdownLabel, remaining })
                : t('onboarding.in2', { time: shown.time, remaining })}
            </AppText>
          </Animated.View>
        ) : (
          <LineArt />
        )}
      </View>

      <Animated.View entering={enter(80)} style={{ gap: spacing.sm }}>
        <AppText size="display" weight="bold" heading>
          {t('onboarding.readyToGo')}
        </AppText>
        <PostHogMaskView>
          <AppText size="md" tone="textSecondary">
            {body}
          </AppText>
        </PostHogMaskView>
        <AppText size="md" weight="medium" color={theme.colors.primary} style={{ marginTop: spacing.xs }}>
          {t('onboarding.mayAllahAcceptYour')}
        </AppText>
      </Animated.View>

      <Animated.View
        entering={enter(160)}
        style={{ gap: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.lg }}>
        <Button
          label={t('onboarding.openBNnetid')}
          onPress={onFinish}
          size="lg"
          fullWidth
        />
        <AppText size="sm" tone="textSecondary" align="center">
          {t('onboarding.youCanChangeEverything')}
        </AppText>
      </Animated.View>
    </View>
  );
}
