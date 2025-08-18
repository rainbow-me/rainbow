import { WithSpringConfig } from 'react-native-reanimated';

// ============ Spring Normalizer ============================================== //

export type DampingMassStiffnessConfig = WithSpringConfig & Required<Pick<WithSpringConfig, 'damping' | 'mass' | 'stiffness'>>;

const BASE_AMPLITUDE = 1000;
const BASE_THRESHOLD = 0.01;

/**
 * Normalizes a Reanimated spring config to ensure consistent perceptual settling time.
 *
 * @param from - The initial value.
 * @param to - The target value.
 * @param config - The spring config to normalize.
 * @returns The normalized spring config.
 */
export function normalizeSpringConfig(from: number, to: number, config: DampingMassStiffnessConfig): WithSpringConfig {
  'worklet';
  const { damping, mass, stiffness } = config;
  if (!damping || !mass || !stiffness) return config;

  const amplitude = Math.abs(to - from);
  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(mass * stiffness));

  const decayRate = -omega0 * (zeta - Math.sqrt(zeta * zeta - 1));
  const timeConstant = 1 / Math.abs(decayRate);

  const displacementScale = amplitude / BASE_AMPLITUDE;
  const velocityScale = amplitude / BASE_AMPLITUDE;
  const restDisplacementThreshold = BASE_THRESHOLD * displacementScale;
  const restSpeedThreshold = (BASE_THRESHOLD / timeConstant) * velocityScale;

  return {
    damping,
    mass,
    restDisplacementThreshold,
    restSpeedThreshold,
    stiffness,
  };
}
