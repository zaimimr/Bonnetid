const API_HOST = 'https://eu.i.posthog.com';
const CONFIG_HOST = 'https://eu-assets.i.posthog.com';

export type FeedbackKind = 'Feil' | 'Forslag' | 'Ros' | 'Annet';

export type SupportMessage = {
  id: string;
  content: string;
  authorType: 'customer' | 'team';
  createdAt: string;
};

export type SendResult = { ok: true; ticketId: string } | { ok: false };

export type ThreadResult =
  | { ok: true; messages: SupportMessage[]; unread: number }
  | { ok: false; missing: boolean };

export type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

type RawMessage = { id: string; content: string; author_type: string; created_at: string };

export async function fetchConversationsToken(fetcher: FetchLike, projectKey: string): Promise<string | null> {
  try {
    const response = await fetcher(`${CONFIG_HOST}/array/${projectKey}/config`);
    if (!response.ok) return null;
    const body = (await response.json()) as { conversations?: { enabled?: boolean; token?: string } };
    return body.conversations?.enabled && body.conversations.token ? body.conversations.token : null;
  } catch {
    return null;
  }
}

export async function sendSupportMessage(
  fetcher: FetchLike,
  args: { token: string; sessionId: string; distinctId: string; ticketId: string | null; message: string; email: string | null },
): Promise<SendResult> {
  try {
    const response = await fetcher(`${API_HOST}/api/conversations/v1/widget/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Conversations-Token': args.token },
      body: JSON.stringify({
        message: args.message.trim(),
        traits: { name: null, email: args.email },
        ticket_id: args.ticketId,
        widget_session_id: args.sessionId,
        distinct_id: args.distinctId,
      }),
    });
    if (!response.ok) return { ok: false };
    const body = (await response.json()) as { ticket_id?: string };
    return body.ticket_id ? { ok: true, ticketId: body.ticket_id } : { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function fetchSupportThread(
  fetcher: FetchLike,
  args: { token: string; sessionId: string; ticketId: string },
): Promise<ThreadResult> {
  try {
    const query = `widget_session_id=${encodeURIComponent(args.sessionId)}&limit=50`;
    const response = await fetcher(`${API_HOST}/api/conversations/v1/widget/messages/${args.ticketId}?${query}`, {
      headers: { 'X-Conversations-Token': args.token },
    });
    if (response.status === 404) return { ok: false, missing: true };
    if (!response.ok) return { ok: false, missing: false };
    const body = (await response.json()) as { unread_count?: number; messages?: RawMessage[] };
    return {
      ok: true,
      unread: body.unread_count ?? 0,
      messages: (body.messages ?? []).map((message) => ({
        id: message.id,
        content: message.content,
        authorType: message.author_type === 'customer' ? 'customer' : 'team',
        createdAt: message.created_at,
      })),
    };
  } catch {
    return { ok: false, missing: false };
  }
}

export async function markSupportRead(
  fetcher: FetchLike,
  args: { token: string; sessionId: string; ticketId: string },
): Promise<boolean> {
  try {
    const response = await fetcher(`${API_HOST}/api/conversations/v1/widget/messages/${args.ticketId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Conversations-Token': args.token },
      body: JSON.stringify({ widget_session_id: args.sessionId }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function newSupportSessionId(
  distinctId: string,
  now: number = Date.now(),
  random: () => number = Math.random,
): string {
  const noise = Array.from({ length: 3 }, () =>
    Math.floor(random() * 36 ** 8).toString(36).padStart(8, '0'),
  ).join('');
  return `${distinctId}-${now.toString(36)}-${noise}`;
}

export function formatFeedback(kind: FeedbackKind, message: string, context: Record<string, string>): string {
  const lines = Object.entries(context).map(([key, value]) => `${key}: ${value}`);
  return `[${kind}] ${message.trim()}\n\n${lines.join('\n')}`;
}

export async function postToSlack(fetcher: FetchLike, webhook: string, text: string): Promise<boolean> {
  if (!webhook) return false;
  try {
    const response = await fetcher(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
