import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/lib/i18n';
import { AppText, TextField } from '@/components/ui';
import type { FlowQuestion, SurveyAnswer } from '@/lib/surveyFlow';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

export type SurveyQuestionViewProps = {
  question: FlowQuestion;
  value: SurveyAnswer;
  onChange: (value: SurveyAnswer) => void;
};

function ratingValues(scale: number): number[] {
  const start = scale === 10 ? 0 : 1;
  return Array.from({ length: scale - start + 1 }, (_, index) => start + index);
}

export function SurveyQuestionView({ question, value, onChange }: SurveyQuestionViewProps) {
  const theme = useTheme();
  const selectedList = Array.isArray(value) ? value : [];

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <AppText size="lg" weight="semibold">
          {question.question}
        </AppText>
        {question.description ? (
          <AppText size="sm" tone="textMuted">
            {question.description}
          </AppText>
        ) : null}
      </View>

      {question.type === 'open' && (
        <TextField
          multiline
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
          placeholder={t({ nb: 'Skriv her', en: 'Write here', ar: 'اكتب هنا', ur: 'یہاں لکھیں' })}
          maxLength={2000}
        />
      )}

      {question.type === 'rating' && (
        <View style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {ratingValues(question.scale ?? 5).map((option) => {
              const selected = value === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onChange(option)}
                  style={{
                    flexGrow: 1,
                    flexBasis: 0,
                    minWidth: 44,
                    minHeight: 44,
                    borderRadius: radius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceSunken,
                  }}>
                  <AppText weight="semibold" tone={selected ? 'onPrimary' : 'textPrimary'}>
                    {option}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          {(question.lowerBoundLabel || question.upperBoundLabel) && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
              <AppText size="xs" tone="textMuted">
                {question.lowerBoundLabel ?? ''}
              </AppText>
              <AppText size="xs" tone="textMuted">
                {question.upperBoundLabel ?? ''}
              </AppText>
            </View>
          )}
        </View>
      )}

      {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
        <View style={{ gap: spacing.xs }}>
          {(question.choices ?? []).map((choice) => {
            const multiple = question.type === 'multiple_choice';
            const selected = multiple ? selectedList.includes(choice) : value === choice;
            const icon = multiple
              ? selected
                ? 'checkbox'
                : 'square-outline'
              : selected
                ? 'radio-button-on'
                : 'radio-button-off';
            return (
              <Pressable
                key={choice}
                accessibilityRole={multiple ? 'checkbox' : 'radio'}
                accessibilityState={{ checked: selected }}
                onPress={() =>
                  onChange(
                    multiple
                      ? selected
                        ? selectedList.filter((entry) => entry !== choice)
                        : [...selectedList, choice]
                      : choice,
                  )
                }
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  minHeight: 44,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.md,
                  backgroundColor: theme.colors.surfaceSunken,
                }}>
                <Ionicons name={icon} size={20} color={theme.colors.primary} />
                <AppText style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }}>{choice}</AppText>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
