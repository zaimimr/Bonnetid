import { Linking, Platform } from 'react-native';

const VIPPS_DONATION_NUMBERS: Record<string, string> = {
  '971258470': '101598',
};

const VIPPS_APP_URL = 'vipps://';
const VIPPS_STORE_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/no/app/vipps/id984380185'
    : 'https://play.google.com/store/apps/details?id=no.dnb.vipps';

export type MosqueDonation = {
  vippsNumber: string | null;
  url: string;
};

export function donationForMosque(orgNr: string): MosqueDonation {
  const vippsNumber = VIPPS_DONATION_NUMBERS[orgNr] ?? null;
  return {
    vippsNumber,
    url: vippsNumber
      ? `https://qr.vipps.no/donations/${vippsNumber}?reference=bonnetid`
      : VIPPS_APP_URL,
  };
}

export function openDonation(donation: MosqueDonation): void {
  Linking.openURL(donation.url).catch(() => {
    Linking.openURL(VIPPS_STORE_URL).catch(() => {});
  });
}
