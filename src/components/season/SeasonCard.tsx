import { DhulHijjahCard } from '@/components/season/DhulHijjahCard';
import { RamadanCard } from '@/components/season/RamadanCard';
import { useHijriSeasonNow } from '@/hooks/useHijriSeason';

export function SeasonCard() {
  const { now, status } = useHijriSeasonNow();

  if (!status) return null;
  if (status.id === 'ramadan') return <RamadanCard now={now} status={status} />;
  return <DhulHijjahCard status={status} />;
}
