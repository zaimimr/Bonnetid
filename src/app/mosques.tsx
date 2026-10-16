import { useLocalSearchParams } from 'expo-router';
import { MosqueList } from '@/components/mosque/MosqueList';

export default function MosquesScreen() {
  const { jumuah } = useLocalSearchParams<{ jumuah?: string }>();
  return <MosqueList mode="browse" initialJumuahOnly={jumuah === '1'} />;
}
