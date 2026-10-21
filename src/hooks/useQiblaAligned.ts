import { useState } from 'react';
import { isQiblaAligned } from '@/lib/geo';

export function useQiblaAligned(
  heading: number | null,
  bearing: number,
  uncertaintyDegrees: number,
): boolean {
  const [wasAligned, setWasAligned] = useState(false);
  const aligned =
    heading != null && isQiblaAligned(heading, bearing, uncertaintyDegrees, wasAligned);
  if (aligned !== wasAligned) setWasAligned(aligned);
  return aligned;
}
