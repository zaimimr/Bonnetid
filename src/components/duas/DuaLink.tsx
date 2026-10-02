import { useRouter } from 'expo-router';
import { InlineLink } from '@/components/ui';

export type DuaLinkProps = {
  label: string;
} & ({ duaId: string; category?: never } | { category: string; duaId?: never });

export function DuaLink({ duaId, category, label }: DuaLinkProps) {
  const router = useRouter();

  return (
    <InlineLink
      label={label}
      icon="book-outline"
      onPress={() =>
        duaId
          ? router.push({ pathname: '/duas/[id]', params: { id: duaId } })
          : router.push({ pathname: '/duas', params: { category } })
      }
    />
  );
}
