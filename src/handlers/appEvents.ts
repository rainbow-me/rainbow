import { createEventBus } from '@/state/internal/events/createEventBus';

/**
 * The event names as keys, and their corresponding payloads as the value.
 */
type Schema = {
  walletConnectV2SessionCreated: undefined;
  walletConnectV2SessionDeleted: undefined;
};

export const events = createEventBus<Schema>();
