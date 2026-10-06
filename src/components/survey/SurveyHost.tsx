import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { t } from '@/lib/i18n';
import { AppText, Button, Sheet } from '@/components/ui';
import { SurveyQuestionView } from './SurveyQuestionView';
import { featureResultEnabled } from '@/lib/featureFlags';
import {
  nextQuestionIndex,
  pickSurvey,
  responseProperties,
  type FlowQuestion,
  type FlowSurvey,
  type SurveyAnswer,
} from '@/lib/surveyFlow';
import { analyticsActive, posthog } from '@/lib/telemetry';
import { useSession } from '@/store/session';
import { useOnboardingDone, useSettings } from '@/store/settings';
import { spacing } from '@/theme/tokens';

const SURVEY_DELAY_MS = 4000;

let surveyChecked = false;

function isAnswered(question: FlowQuestion, answer: SurveyAnswer): boolean {
  if (question.optional || question.type === 'link') return true;
  if (answer == null) return false;
  if (typeof answer === 'string') return answer.trim().length > 0;
  if (Array.isArray(answer)) return answer.length > 0;
  return true;
}

export function SurveyHost() {
  const onboardingDone = useOnboardingDone();
  const openedFromNotification = useSession((state) => state.openedFromNotification);
  const markSurveySeen = useSettings((state) => state.markSurveySeen);
  const [survey, setSurvey] = useState<FlowSurvey | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, SurveyAnswer>>({});
  const [finished, setFinished] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!analyticsActive || !onboardingDone || openedFromNotification || surveyChecked) return;
    const timer = setTimeout(async () => {
      if (surveyChecked || useSession.getState().interruption != null) return;
      surveyChecked = true;
      try {
        const surveys = (await posthog.getSurveys()) as unknown as FlowSurvey[];
        const picked = pickSurvey(surveys, useSettings.getState().seenSurveys, (key) =>
          featureResultEnabled(posthog.getFeatureFlagResult(key)),
        );
        if (!picked || !useSession.getState().claimInterruption('survey')) return;
        posthog.capture('survey shown', { $survey_id: picked.id, $survey_name: picked.name });
        setSurvey(picked);
      } catch {
        return;
      }
    }, SURVEY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [onboardingDone, openedFromNotification]);

  if (!survey) return null;

  const question = survey.questions[index];
  const answer = answers[index] ?? null;
  const isLast = nextQuestionIndex(survey, index, answer) === 'end';

  const close = () => {
    if (!finished) {
      posthog.capture('survey dismissed', { $survey_id: survey.id, $survey_name: survey.name });
    }
    markSurveySeen(survey.id);
    setClosed(true);
  };

  const advance = () => {
    const next = nextQuestionIndex(survey, index, answer);
    if (next !== 'end') {
      setIndex(next);
      return;
    }
    posthog.capture('survey sent', responseProperties(survey, answers) as Parameters<typeof posthog.capture>[1]);
    markSurveySeen(survey.id);
    setFinished(true);
  };

  return (
    <Sheet visible={!closed} onClose={close} title={survey.name}>
      {finished ? (
        <View style={{ gap: spacing.lg }}>
          <AppText size="lg" weight="semibold">
            {t({ nb: 'Takk for svaret!', en: 'Thanks for your answer!', ar: 'شكرًا على إجابتك!', ur: 'جواب کا شکریہ!' })}
          </AppText>
          <Button label={t({ nb: 'Lukk', en: 'Close', ar: 'إغلاق', ur: 'بند کریں' })} fullWidth onPress={close} />
        </View>
      ) : (
        <View style={{ gap: spacing.xl }}>
          <SurveyQuestionView
            question={question}
            value={answer}
            onChange={(value) => setAnswers((current) => ({ ...current, [index]: value }))}
          />
          <Button
            label={
              question.buttonText ??
              (isLast
                ? t({ nb: 'Send', en: 'Send', ar: 'إرسال', ur: 'بھیجیں' })
                : t({ nb: 'Neste', en: 'Next', ar: 'التالي', ur: 'اگلا' }))
            }
            fullWidth
            disabled={!isAnswered(question, answer)}
            onPress={advance}
          />
        </View>
      )}
    </Sheet>
  );
}
