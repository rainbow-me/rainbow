import type { DelegationWithChainId } from '@rainbow-me/delegation';

// ============ Enums and Types ================================================ //

enum DelegationStatus {
  RainbowDelegated = 'DELEGATION_STATUS_RAINBOW_DELEGATED',
  ThirdPartyDelegated = 'DELEGATION_STATUS_THIRD_PARTY_DELEGATED',
}

type DelegationState = Pick<DelegationWithChainId, 'delegationStatus'>;
type DelegationStatusValue = DelegationWithChainId['delegationStatus'];
type DelegationStatusInput = DelegationStatusValue | DelegationState | null | undefined;

// ============ Public Status Helpers ========================================== //

export function isRainbowDelegated(value: DelegationStatusInput): boolean {
  return getDelegationStatus(value) === DelegationStatus.RainbowDelegated;
}

export function isThirdPartyDelegated(value: DelegationStatusInput): boolean {
  return getDelegationStatus(value) === DelegationStatus.ThirdPartyDelegated;
}

export function hasActiveDelegation(value: DelegationStatusInput): boolean {
  return isRainbowDelegated(value) || isThirdPartyDelegated(value);
}

export function getDelegationContractAddress(
  delegation: Pick<DelegationWithChainId, 'currentContract' | 'revokeAddress'> | null | undefined
): DelegationWithChainId['currentContract'] | DelegationWithChainId['revokeAddress'] | null {
  return delegation?.revokeAddress ?? delegation?.currentContract ?? null;
}

// ============ Local Helpers ================================================== //

function getDelegationStatus(value: DelegationStatusInput): DelegationStatusValue | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.delegationStatus;
}
