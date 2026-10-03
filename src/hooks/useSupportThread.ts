import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchConversationsToken,
  fetchSupportThread,
  markSupportRead,
  newSupportSessionId,
  postToSlack,
  sendSupportMessage,
  type FetchLike,
  type SupportMessage,
} from '@/lib/supportApi';
import { posthog } from '@/lib/telemetry';
import { useSettings } from '@/store/settings';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const SLACK_WEBHOOK = process.env.EXPO_PUBLIC_FEEDBACK_WEBHOOK ?? '';
const DAY = 24 * 60 * 60 * 1000;
const fetcher: FetchLike = (url, init) => fetch(url, init);

export type SendOutcome = 'thread' | 'slack' | 'failed';

export function useSupportThread(enabled = true) {
  const queryClient = useQueryClient();
  const ticketId = useSettings((state) => state.supportTicketId);
  const sessionId = useSettings((state) => state.supportSessionId);
  const setSupportTicket = useSettings((state) => state.setSupportTicket);

  const token = useQuery({
    queryKey: ['support-token'],
    queryFn: () => fetchConversationsToken(fetcher, POSTHOG_KEY),
    enabled: POSTHOG_KEY.length > 0,
    staleTime: DAY,
  });

  const thread = useQuery({
    queryKey: ['support-thread', ticketId],
    queryFn: async () => {
      const result = await fetchSupportThread(fetcher, {
        token: token.data ?? '',
        sessionId: sessionId ?? '',
        ticketId: ticketId ?? '',
      });
      if (!result.ok && result.missing) setSupportTicket(null, sessionId);
      if (!result.ok) throw new Error('support thread unavailable');
      return result;
    },
    enabled: enabled && ticketId != null && sessionId != null && token.data != null,
    staleTime: 0,
    retry: false,
  });

  const send = useCallback(
    async (text: string, email: string | null): Promise<SendOutcome> => {
      const session = sessionId ?? newSupportSessionId(posthog.getDistinctId());
      const supportToken = token.data ?? (await fetchConversationsToken(fetcher, POSTHOG_KEY));
      if (supportToken) {
        const result = await sendSupportMessage(fetcher, {
          token: supportToken,
          sessionId: session,
          distinctId: posthog.getDistinctId(),
          ticketId,
          message: text,
          email,
        });
        if (result.ok) {
          setSupportTicket(result.ticketId, session);
          await queryClient.invalidateQueries({ queryKey: ['support-thread'] });
          return 'thread';
        }
      }
      const slackText = email ? `${text}\ne-post: ${email}` : text;
      return (await postToSlack(fetcher, SLACK_WEBHOOK, slackText)) ? 'slack' : 'failed';
    },
    [sessionId, token.data, ticketId, setSupportTicket, queryClient],
  );

  const markRead = useCallback(async () => {
    if (!token.data || !ticketId || !sessionId) return;
    if (await markSupportRead(fetcher, { token: token.data, sessionId, ticketId })) {
      await queryClient.invalidateQueries({ queryKey: ['support-thread'] });
    }
  }, [token.data, ticketId, sessionId, queryClient]);

  const messages: SupportMessage[] = thread.data?.messages ?? [];

  return {
    messages,
    unread: thread.data?.unread ?? 0,
    hasTicket: ticketId != null,
    send,
    markRead,
  };
}
