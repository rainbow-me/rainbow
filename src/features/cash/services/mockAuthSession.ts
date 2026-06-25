import { type AuthSession, type LinkedCard } from './authSession';

export const MOCK_LINKED_CARD: LinkedCard = { id: 'mock-card-1', brand: 'Visa Debit', last4: '8990' };

export class MockAuthSession implements AuthSession {
  getLinkedCard(): LinkedCard {
    return MOCK_LINKED_CARD;
  }
}

export const mockAuthSession = new MockAuthSession();
