import { Linking, Platform } from 'react-native';

const VIPPS_APP_URL = 'vipps://';
const VIPPS_STORE_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/no/app/vipps/id984380185'
    : 'https://play.google.com/store/apps/details?id=no.dnb.vipps';
const VIPPS_NUMBER = /vipps\D{0,25}?(\d{3,6})(?!\d)/i;

export function vippsNumberFrom(...texts: (string | null | undefined)[]): string | null {
  for (const text of texts) {
    const match = text?.match(VIPPS_NUMBER);
    if (match) return match[1];
  }
  return null;
}

export function openVipps(vippsNumber: string | null): void {
  const url = vippsNumber
    ? `https://qr.vipps.no/donations/${vippsNumber}?reference=bonnetid`
    : VIPPS_APP_URL;
  Linking.openURL(url).catch(() => {
    Linking.openURL(VIPPS_STORE_URL).catch(() => {});
  });
}
