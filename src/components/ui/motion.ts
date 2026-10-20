import { FadeInDown, LinearTransition, ReduceMotion } from 'react-native-reanimated';
import { duration, spring } from '@/theme/tokens';

const STAGGER = 40;
const MAX_STAGGERED = 8;

export const enterUp = (index = 0) =>
  FadeInDown.duration(duration.normal + 70)
    .delay(Math.min(index, MAX_STAGGERED) * STAGGER)
    .withInitialValues({ opacity: 0, transform: [{ translateY: 10 }] })
    .reduceMotion(ReduceMotion.System);

export const layoutSpring = LinearTransition.springify()
  .damping(spring.slide.damping)
  .stiffness(spring.slide.stiffness)
  .mass(spring.slide.mass)
  .reduceMotion(ReduceMotion.System);
