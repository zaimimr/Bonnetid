const KOMMUNE_PUNKT_URL = 'https://api.kartverket.no/kommuneinfo/v1/punkt';
const TIMEOUT_MS = 5000;

export async function fetchKommuneIso(lat: number, lon: number): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${KOMMUNE_PUNKT_URL}?nord=${lat}&ost=${lon}&koordsys=4258`, {
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { kommunenummer?: string };
    return data.kommunenummer ? `NO${data.kommunenummer}` : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
