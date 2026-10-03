import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchConversationsToken,
  fetchSupportThread,
  formatFeedback,
  markSupportRead,
  newSupportSessionId,
  threadView,
  postToSlack,
  sendSupportMessage,
  type FetchLike,
} from './supportApi.ts';

function fake(status: number, body: unknown, seen: { url?: string; init?: unknown } = {}): FetchLike {
  return async (url, init) => {
    seen.url = url;
    seen.init = init;
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
}

test('token comes from remote config', async () => {
  assert.equal(await fetchConversationsToken(fake(200, { conversations: { enabled: true, token: 't1' } }), 'phc_x'), 't1');
  assert.equal(await fetchConversationsToken(fake(200, { conversations: { enabled: false, token: 't1' } }), 'phc_x'), null);
  assert.equal(await fetchConversationsToken(fake(500, {}), 'phc_x'), null);
});

test('send posts the widget payload and returns the ticket', async () => {
  const seen: { url?: string; init?: { headers?: Record<string, string>; body?: string } } = {};
  const result = await sendSupportMessage(fake(200, { ticket_id: 'k1' }, seen as never), {
    token: 't1', sessionId: 's1', distinctId: 'd1', ticketId: null, message: '  hei  ', email: null,
  });
  assert.deepEqual(result, { ok: true, ticketId: 'k1' });
  assert.equal(seen.url, 'https://eu.i.posthog.com/api/conversations/v1/widget/message');
  assert.equal(seen.init?.headers?.['X-Conversations-Token'], 't1');
  const body = JSON.parse(seen.init?.body ?? '{}');
  assert.equal(body.message, 'hei');
  assert.equal(body.widget_session_id, 's1');
  assert.equal(body.ticket_id, null);
});

test('send failure and thrown fetch both fail cleanly', async () => {
  const args = { token: 't', sessionId: 's', distinctId: 'd', ticketId: null, message: 'x', email: null };
  assert.deepEqual(await sendSupportMessage(fake(500, {}), args), { ok: false });
  assert.deepEqual(await sendSupportMessage(async () => { throw new Error('offline'); }, args), { ok: false });
});

test('thread maps messages and flags a deleted ticket', async () => {
  const thread = await fetchSupportThread(
    fake(200, { unread_count: 1, messages: [{ id: 'm1', content: 'svar', author_type: 'team', created_at: '2026-10-03T10:00:00Z' }] }),
    { token: 't', sessionId: 's', ticketId: 'k1' },
  );
  assert.deepEqual(thread, { ok: true, unread: 1, messages: [{ id: 'm1', content: 'svar', authorType: 'team', createdAt: '2026-10-03T10:00:00Z' }] });
  assert.deepEqual(await fetchSupportThread(fake(404, {}), { token: 't', sessionId: 's', ticketId: 'k1' }), { ok: false, missing: true });
  assert.deepEqual(await fetchSupportThread(fake(500, {}), { token: 't', sessionId: 's', ticketId: 'k1' }), { ok: false, missing: false });
});

test('slack fallback posts text and reports failure', async () => {
  const seen: { url?: string; init?: { body?: string } } = {};
  assert.equal(await postToSlack(fake(200, {}, seen as never), 'https://hooks.slack.com/x', 'hei'), true);
  assert.equal(seen.url, 'https://hooks.slack.com/x');
  assert.deepEqual(JSON.parse(seen.init?.body ?? '{}'), { text: 'hei' });
  assert.equal(await postToSlack(fake(500, {}), 'https://hooks.slack.com/x', 'hei'), false);
  assert.equal(await postToSlack(fake(200, {}), '', 'hei'), false);
  assert.equal(await postToSlack(async () => { throw new Error('offline'); }, 'https://hooks.slack.com/x', 'hei'), false);
});

test('formatFeedback prefixes kind and appends context', () => {
  assert.equal(formatFeedback('Feil', 'Krasjer', { versjon: '1.9.0', enhet: 'iPhone' }), '[Feil] Krasjer\n\nversjon: 1.9.0\nenhet: iPhone');
});

test('mark read posts the session to the read endpoint', async () => {
  const seen: { url?: string; init?: { method?: string; headers?: Record<string, string>; body?: string } } = {};
  assert.equal(await markSupportRead(fake(200, {}, seen as never), { token: 't', sessionId: 's1', ticketId: 'k1' }), true);
  assert.equal(seen.url, 'https://eu.i.posthog.com/api/conversations/v1/widget/messages/k1/read');
  assert.equal(seen.init?.method, 'POST');
  assert.equal(seen.init?.headers?.['X-Conversations-Token'], 't');
  assert.deepEqual(JSON.parse(seen.init?.body ?? '{}'), { widget_session_id: 's1' });
  assert.equal(await markSupportRead(fake(500, {}), { token: 't', sessionId: 's1', ticketId: 'k1' }), false);
});

test('support session id is unique per call and carries the distinct id', () => {
  const a = newSupportSessionId('d1', 1000, () => 0.25);
  const b = newSupportSessionId('d1', 1000, () => 0.75);
  assert.notEqual(a, b);
  assert.ok(a.startsWith('d1-'));
  assert.ok(a.length > 12);
});

test('threadView turns any failure into an empty thread instead of throwing', () => {
  assert.deepEqual(threadView({ ok: false, missing: true }), { messages: [], unread: 0 });
  assert.deepEqual(threadView({ ok: false, missing: false }), { messages: [], unread: 0 });
  const messages = [{ id: 'm', content: 'x', authorType: 'team' as const, createdAt: 't' }];
  assert.deepEqual(threadView({ ok: true, messages, unread: 2 }), { messages, unread: 2 });
});
