import { EventEmitter } from 'events';
import { smitter } from 'smitter';

/**
 * @deprecated Move these to the `events` export of this file, which is
 * strongly typed
 */
const appEvents = new EventEmitter();

/**
 * @deprecated Move these to the `events` export of this file, which is
 * strongly typed
 */
export default appEvents;

/**
 * The event names as keys, and their corresponding payloads as the value.
 */
type Schema = {
  walletConnectV2SessionCreated: undefined;
  walletConnectV2SessionDeleted: undefined;
};

/**
 * Core smitter instance. To add events, update the schema above.
 */
export const events = smitter<Schema>();
