import { useEffect, useRef, useState } from 'react';
import { useTvSettings, type TvSettings } from './settings';

export const REMOTE_URL = 'https://bonnetid-tv.zaim-imran.workers.dev';
const POLL_MS = 30_000;
const SAVE_DELAY_MS = 3_000;
const TOAST_MS = 10_000;
const SYNCED = ['orgNr', 'configured', 'rotation', 'seconds', 'iqamahLead', 'hide', 'dim', 'brand', 'art', 'duaFont', 'translation', 'texture', 'hall'] as const;

type Synced = Pick<TvSettings, (typeof SYNCED)[number]>;
type Remote = { config: Partial<Synced> | null; source: 'tv' | 'phone'; updated: number };

function randomText(length: number): string {
  let out = '';
  while (out.length < length) out += Math.random().toString(36).slice(2);
  return out.slice(0, length);
}

function syncedOf(source: Partial<Synced>): Synced {
  return Object.fromEntries(SYNCED.map((key) => [key, source[key]])) as Synced;
}

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${REMOTE_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json() as Promise<T>;
}

export function pairUrl(id: string, secret: string): string {
  return `${REMOTE_URL}/#${id}.${secret}`;
}

export async function newPair() {
  const state = useTvSettings.getState();
  const pairId = randomText(12);
  const pairSecret = randomText(32);
  state.set({ pairId, pairSecret, pairUpdated: 0 });
  await post('/api/register', { id: pairId, secret: pairSecret, config: syncedOf(state) }).catch(() => undefined);
}

export function useRemoteSync(): boolean {
  const pairId = useTvSettings((state) => state.pairId);
  const pairSecret = useTvSettings((state) => state.pairSecret);
  const [toast, setToast] = useState(false);
  const last = useRef('');

  useEffect(() => {
    if (!pairId || !pairSecret) return;
    const auth = { id: pairId, secret: pairSecret };
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    let toastTimer: ReturnType<typeof setTimeout> | null = null;
    let alive = true;
    last.current = JSON.stringify(syncedOf(useTvSettings.getState()));

    const poll = async () => {
      try {
        const remote = await post<Remote>('/api/load', auth);
        const state = useTvSettings.getState();
        if (!alive || !remote.config || remote.updated <= state.pairUpdated) return;
        const merged = syncedOf({ ...syncedOf(state), ...remote.config });
        const json = JSON.stringify(merged);
        last.current = json;
        const changed = json !== JSON.stringify(syncedOf(state));
        state.set({ ...merged, pairUpdated: remote.updated });
        if (changed && remote.source === 'phone') {
          setToast(true);
          if (toastTimer) clearTimeout(toastTimer);
          toastTimer = setTimeout(() => setToast(false), TOAST_MS);
        }
      } catch {}
    };

    const save = async () => {
      const synced = syncedOf(useTvSettings.getState());
      const json = JSON.stringify(synced);
      try {
        const remote = await post<Remote>('/api/save', { ...auth, source: 'tv', config: synced });
        last.current = json;
        if (alive) useTvSettings.getState().set({ pairUpdated: remote.updated });
      } catch {}
    };

    const off = useTvSettings.subscribe((state) => {
      if (JSON.stringify(syncedOf(state)) === last.current) return;
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(save, SAVE_DELAY_MS);
    });

    post('/api/register', { ...auth, config: syncedOf(useTvSettings.getState()) })
      .catch(() => undefined)
      .then(poll);
    const interval = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      off();
      clearInterval(interval);
      if (saveTimer) clearTimeout(saveTimer);
      if (toastTimer) clearTimeout(toastTimer);
    };
  }, [pairId, pairSecret]);

  return toast;
}
