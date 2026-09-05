export const JUMMAH_MISSING_FOR_MOSQUE =
  'Vi har ingen registrert fredagstid for denne moskeen. Det betyr ikke at de ikke holder jummah, bare at tiden ikke er registrert hos oss.';

export const JUMMAH_MISSING_SHORT = 'Fredagstid ikke registrert hos oss';

export const JUMMAH_MISSING_NEARBY =
  'Vi har ingen registrerte fredagstider i nærheten. Det betyr ikke at moskeene mangler jummah, bare at tiden ikke er registrert hos oss.';

export const JUMMAH_ALL_TOO_FAR =
  'Alle moskeene med registrert fredagstid ligger for langt unna deg akkurat nå.';

export function jummahMissingForPlace(placeName: string): string {
  return `Vi har ingen registrerte fredagstider i ${placeName}. Det betyr ikke at moskeene mangler jummah, bare at tiden ikke er registrert hos oss.`;
}
