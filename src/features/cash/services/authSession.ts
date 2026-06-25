export type LinkedCard = {
  /** Rainbow internal card token id, sent as `cardId` on a buy order. */
  id: string;
  /** e.g. "Visa Debit" */
  brand: string;
  /** e.g. "8990" (no mask prefix) */
  last4: string;
};

export interface AuthSession {
  getLinkedCard(): LinkedCard;
}
