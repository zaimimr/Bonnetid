import { DuaCard } from '@/components/duas/DuaCard';
import { duaById } from '@/lib/duas';

export function TakbirCard() {
  const takbir = duaById('takbir-dhul-hijjah');
  if (!takbir) return null;
  return <DuaCard dua={{ ...takbir, title: 'Takbir' }} />;
}
