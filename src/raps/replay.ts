export type ReplayCall = {
  to: string;
  data: string;
  value: string;
};

/**
 * Returns replay calldata from the broadcast transaction
 * so speed-up and cancel can replay the exact swap call.
 */
export function extractReplayCall(transaction: {
  to?: string | null;
  data?: string;
  value?: { toString: () => string } | string;
}): ReplayCall | null {
  if (!transaction.to || !transaction.data || transaction.value === undefined) return null;

  return {
    to: transaction.to,
    data: transaction.data,
    value: transaction.value.toString(),
  };
}
