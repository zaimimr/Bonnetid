const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.bonnetid.no';
const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN ?? '';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiGet<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Api-Token': API_TOKEN,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new ApiError(response.status, path, body || response.statusText);
  }

  return response.json() as Promise<T>;
}
