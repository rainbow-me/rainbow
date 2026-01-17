import { WithSpringConfig } from 'react-native-reanimated';

// ============ Spring Normalizer ============================================== //

export type DampingMassStiffnessConfig = WithSpringConfig & Required<Pick<WithSpringConfig, 'damping' | 'mass' | 'stiffness'>>;

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

  // TODO: Is this still needed?

  return {
    damping,
    mass,
    stiffness,
  };
}
