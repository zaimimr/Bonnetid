const VIPPS_DONATION_NUMBERS: Record<string, string> = {
  '971258470': '101598',
};

export type MosqueDonation = {
  vippsNumber: string;
  url: string;
};

export function donationForMosque(orgNr: string): MosqueDonation | null {
  const vippsNumber = VIPPS_DONATION_NUMBERS[orgNr];
  if (!vippsNumber) return null;
  return {
    vippsNumber,
    url: `https://qr.vipps.no/donations/${vippsNumber}?reference=bonnetid`,
  };
}
