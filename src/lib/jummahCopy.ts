export const JUMMAH_MISSING_FOR_MOSQUE =
  'Vi har ingen registrert fredagstid for denne moskeen. Det betyr ikke at de ikke holder jummah, bare at tiden ikke er registrert hos oss.';

export const JUMMAH_MISSING_SHORT = 'Jumuah ikke registrert';

export function jummahMissingForPlace(placeName: string): string {
  return `Vi har ingen registrerte fredagstider i ${placeName}. Det betyr ikke at moskeene mangler jummah, bare at tiden ikke er registrert hos oss.`;
}
