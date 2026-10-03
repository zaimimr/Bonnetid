export type SurveyAnswer = string | string[] | number | null;

export type FlowQuestion = {
  id?: string;
  type: string;
  question: string;
  description?: string | null;
  optional?: boolean;
  choices?: string[];
  scale?: number;
  lowerBoundLabel?: string;
  upperBoundLabel?: string;
  buttonText?: string;
  branching?: { type: string; index?: number; responseValues?: Record<string, string | number> };
};

export type FlowSurvey = {
  id: string;
  name: string;
  type: string;
  questions: FlowQuestion[];
  start_date?: string | null;
  end_date?: string | null;
  linked_flag_key?: string | null;
};

export function pickSurvey(
  surveys: FlowSurvey[],
  seen: string[],
  isFlagOn: (key: string) => boolean,
): FlowSurvey | null {
  return (
    surveys.find(
      (survey) =>
        survey.type === 'api' &&
        survey.start_date != null &&
        survey.end_date == null &&
        !seen.includes(survey.id) &&
        survey.questions.length > 0 &&
        (survey.linked_flag_key == null || isFlagOn(survey.linked_flag_key)),
    ) ?? null
  );
}

function ratingBucket(question: FlowQuestion, value: number): string {
  const scale = question.scale ?? 5;
  if (scale === 10) return value <= 6 ? 'detractors' : value <= 8 ? 'passives' : 'promoters';
  if (scale === 3) return value === 1 ? 'negative' : value === 2 ? 'neutral' : 'positive';
  return value <= 2 ? 'negative' : value === 3 ? 'neutral' : 'positive';
}

function responseKey(question: FlowQuestion, answer: SurveyAnswer): string | null {
  if (question.type === 'rating' && typeof answer === 'number') return ratingBucket(question, answer);
  if (question.type === 'single_choice' && typeof answer === 'string') {
    const index = question.choices?.indexOf(answer) ?? -1;
    return index >= 0 ? String(index) : null;
  }
  return null;
}

function resolve(target: string | number | undefined, current: number, count: number): number | 'end' {
  if (target === 'end') return 'end';
  const index = typeof target === 'number' ? target : current + 1;
  return index > current && index < count ? index : 'end';
}

export function nextQuestionIndex(survey: FlowSurvey, current: number, answer: SurveyAnswer): number | 'end' {
  const question = survey.questions[current];
  const count = survey.questions.length;
  const branching = question?.branching;
  if (!branching || branching.type === 'next_question') return resolve(undefined, current, count);
  if (branching.type === 'end') return 'end';
  if (branching.type === 'specific_question') return resolve(branching.index, current, count);
  if (branching.type === 'response_based') {
    const key = responseKey(question, answer);
    const target = key != null ? branching.responseValues?.[key] : undefined;
    return resolve(target, current, count);
  }
  return resolve(undefined, current, count);
}

export function responseProperties(
  survey: FlowSurvey,
  answers: Record<number, SurveyAnswer>,
): Record<string, unknown> {
  const props: Record<string, unknown> = {
    $survey_id: survey.id,
    $survey_name: survey.name,
    $survey_questions: survey.questions.map((question, index) => ({
      id: question.id,
      question: question.question,
      response: answers[index] ?? null,
    })),
  };
  survey.questions.forEach((question, index) => {
    if (!(index in answers)) return;
    props[index === 0 ? '$survey_response' : `$survey_response_${index}`] = answers[index];
    if (question.id) props[`$survey_response_${question.id}`] = answers[index];
  });
  return props;
}
