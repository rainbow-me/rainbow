export const WYRE_ORDER_STATUS_TYPES = {
  checking: 'RUNNING_CHECKS',
  failed: 'FAILED',
  pending: 'PROCESSING',
  success: 'COMPLETE',
} as const;

export type WyreOrderStatusType = typeof WYRE_ORDER_STATUS_TYPES[keyof typeof WYRE_ORDER_STATUS_TYPES];

export const ADD_CASH_DISPLAYED_STATUS_TYPES = {
  checking: 'RUNNING_CHECKS',
  failed: 'FAILED',
  pending: 'PENDING',
  success: 'COMPLETED',
} as const;

export type AddCashDisplayedStatusType = typeof ADD_CASH_DISPLAYED_STATUS_TYPES[keyof typeof ADD_CASH_DISPLAYED_STATUS_TYPES];

export interface WyreError {
  errorCategory: string;
  errorCode: string;
  errorMessage: string;
}

export interface WyreReferenceInfo {
  referenceId: string;
  orderId: string;
  transferId?: string;
}
