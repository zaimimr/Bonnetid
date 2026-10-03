import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextQuestionIndex, pickSurvey, responseProperties, type FlowSurvey } from './surveyFlow.ts';

const base: FlowSurvey = {
  id: 's1',
  name: 'Test',
  type: 'api',
  start_date: '2026-10-01T00:00:00Z',
  end_date: null,
  questions: [
    { id: 'q1', type: 'rating', question: 'Hvor fornøyd?', scale: 5 },
    { id: 'q2', type: 'open', question: 'Hvorfor?' },
    { id: 'q3', type: 'single_choice', question: 'Hva?', choices: ['A', 'B'] },
  ],
};

test('pickSurvey skips seen, drafts, ended, non-api and flag-gated surveys', () => {
  assert.equal(pickSurvey([base], [], () => true)?.id, 's1');
  assert.equal(pickSurvey([base], ['s1'], () => true), null);
  assert.equal(pickSurvey([{ ...base, start_date: null }], [], () => true), null);
  assert.equal(pickSurvey([{ ...base, end_date: '2026-10-02T00:00:00Z' }], [], () => true), null);
  assert.equal(pickSurvey([{ ...base, type: 'popover' }], [], () => true), null);
  assert.equal(pickSurvey([{ ...base, linked_flag_key: 'x' }], [], () => false), null);
});

test('default branching goes to next question then end', () => {
  assert.equal(nextQuestionIndex(base, 0, 4), 1);
  assert.equal(nextQuestionIndex(base, 2, 'A'), 'end');
});

test('end and specific_question branching', () => {
  const s: FlowSurvey = {
    ...base,
    questions: [
      { ...base.questions[0], branching: { type: 'end' } },
      base.questions[1],
      base.questions[2],
    ],
  };
  assert.equal(nextQuestionIndex(s, 0, 3), 'end');
  const jump: FlowSurvey = { ...base, questions: [{ ...base.questions[0], branching: { type: 'specific_question', index: 2 } }, base.questions[1], base.questions[2]] };
  assert.equal(nextQuestionIndex(jump, 0, 3), 2);
});

test('response_based branching on rating and choice, out of range ends', () => {
  const s: FlowSurvey = {
    ...base,
    questions: [
      { ...base.questions[0], branching: { type: 'response_based', responseValues: { negative: 1, positive: 'end' } } },
      base.questions[1],
      { ...base.questions[2], branching: { type: 'response_based', responseValues: { '0': 9 } } },
    ],
  };
  assert.equal(nextQuestionIndex(s, 0, 1), 1);
  assert.equal(nextQuestionIndex(s, 0, 5), 'end');
  assert.equal(nextQuestionIndex(s, 2, 'A'), 'end');
});

test('responseProperties uses id keyed and legacy index keys', () => {
  const props = responseProperties(base, { 0: 4, 1: 'Bra app' });
  assert.equal(props.$survey_id, 's1');
  assert.equal(props.$survey_name, 'Test');
  assert.equal(props.$survey_response, 4);
  assert.equal(props.$survey_response_1, 'Bra app');
  assert.equal(props.$survey_response_q1, 4);
  assert.equal(props.$survey_response_q2, 'Bra app');
  assert.deepEqual(props.$survey_questions, [
    { id: 'q1', question: 'Hvor fornøyd?', response: 4 },
    { id: 'q2', question: 'Hvorfor?', response: 'Bra app' },
    { id: 'q3', question: 'Hva?', response: null },
  ]);
});
