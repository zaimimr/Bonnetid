import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { track } from '@/lib/telemetry';

const MUTABLE_KEYS = new Set(['mosques', 'mosque', 'mosque-jamat-periods']);

export function useRefresh() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    track('pull_to_refresh');
    try {
      await queryClient.refetchQueries({
        type: 'active',
        predicate: (query) => MUTABLE_KEYS.has(String(query.queryKey[0])) || query.isStale(),
      });
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return { refreshing, onRefresh };
}
