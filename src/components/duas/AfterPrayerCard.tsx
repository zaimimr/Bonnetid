import { FeaturedCategoryCard } from '@/components/duas/DuaHub';
import { useFeature } from '@/hooks/useFeature';
import { categoryById, prayedRecently } from '@/lib/duas';
import { usePrayerLog } from '@/store/prayerLog';

export function AfterPrayerCard({ now }: { now: Date }) {
  const duasEnabled = useFeature('duas');
  const log = usePrayerLog((state) => state.log);
  const category = categoryById('after-salah');

  if (!duasEnabled || !category || !prayedRecently(log, now.getTime())) return null;

  return <FeaturedCategoryCard category={category} />;
}
