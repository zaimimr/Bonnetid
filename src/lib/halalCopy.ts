import type { HalalVerdict, VerdictBasis } from './halalVerdict';

export const HALAL_DISCLAIMER =
  'Dette er ikke en halal-sertifisering. Vurderingen leser kun ingredienslisten fra Open Food Facts, som er skrevet av frivillige og kan være feil eller utdatert. Sjekk alltid pakningen selv.';

export const HALAL_SHORT_DISCLAIMER = 'Ikke en sertifisering. Sjekk alltid pakningen selv.';

export const HALAL_METHOD =
  'Vi leser ingredienslisten ord for ord og slår opp kjente problemingredienser. Er noe ukjent eller omstridt blant lærde, sier vi usikker. Vi gjetter aldri.';

export function verdictTitle(verdict: HalalVerdict): string {
  if (verdict === 'avoid') return 'Frarådes';
  if (verdict === 'clear') return 'Ingen funn';
  return 'Usikker';
}

export function verdictSummary(verdict: HalalVerdict): string {
  if (verdict === 'avoid') {
    return 'Ingredienslisten inneholder noe som regnes som forbudt av alle lærde.';
  }
  if (verdict === 'clear') {
    return 'Vi kjente igjen hver eneste ingrediens, og ingen av dem er problematiske.';
  }
  return 'Vi kan ikke si dette trygt. Noe i listen er ukjent eller omstridt.';
}

export function basisExplanation(basis: VerdictBasis): string | null {
  if (basis === 'no-ingredients') {
    return 'Produktet finnes i databasen, men ingen har lagt inn ingredienslisten ennå.';
  }
  if (basis === 'unreadable-language') {
    return 'Ingredienslisten er verken på norsk, dansk, svensk eller engelsk, så vi kan ikke lese den trygt.';
  }
  if (basis === 'incomplete-data') {
    return 'Vi fant ingen problemingredienser, men databasen har ikke nok informasjon til at vi kan gå god for hele listen.';
  }
  return null;
}

export function unknownProductExplanation(): string {
  return 'Open Food Facts er en åpen database som fylles av frivillige. Norske varer mangler ofte. Du kan legge inn produktet selv, så hjelper du alle som skanner det etter deg.';
}

export function scanCountLabel(count: number): string {
  return count === 1 ? '1 skanning' : `${count} skanninger`;
}
