export const SecretDisplayStates = {
  loading: 'loading',
  revealed: 'revealed',
  hidden: 'hidden',
  noSeed: 'noSeed',
  securedWithBiometrics: 'securedWithBiometrics',
} as const;

export type SecretDisplayStatesType = typeof SecretDisplayStates[keyof typeof SecretDisplayStates];
