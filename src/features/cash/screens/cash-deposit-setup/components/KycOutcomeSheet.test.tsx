import { isValidElement } from 'react';

import { expect, it, vi } from 'vitest';

import { KycRejectionReasonCode, type UnsupportedLocation } from '../../../services/userClient';
import { KycOutcomeSheet } from './KycOutcomeSheet';

vi.mock('react', () => ({
  ...vi.requireActual('react'),
  memo: (component: unknown) => component,
}));

vi.mock('@/features/cash/components/CashStatusHalfSheet', () => ({ CashStatusHalfSheet: () => null }));
vi.mock('@/navigation/Navigation', () => ({ goBack: vi.fn(), navigate: vi.fn() }));
vi.mock('@/utils/openInBrowser', () => ({ openInBrowser: vi.fn() }));

it.each<{ location?: UnsupportedLocation; name: string; code: string }>([
  { location: { countryCode: 'US', regionName: 'New York', regionCode: 'NY' }, name: 'New York', code: 'NY' },
  { location: { countryCode: 'US', regionName: 'California', regionCode: 'CA' }, name: 'California', code: 'CA' },
  { location: { regionCode: 'CA' }, name: '', code: 'CA' },
  { location: { regionName: 'California' }, name: 'California', code: 'your state' },
  { location: { regionName: '', regionCode: '' }, name: '', code: 'your state' },
  { location: {}, name: '', code: 'your state' },
  { name: '', code: 'your state' },
])('shows the backend location or generic copy for $location', ({ location, name, code }) => {
  const sheet = KycOutcomeSheet({
    outcome: 'unsupportedState',
    onContinue: vi.fn(),
    kycRejectionReason: { code: KycRejectionReasonCode.StateNotSupported, unsupportedLocation: location },
  });
  if (!isValidElement<{ title: string; description: string }>(sheet)) throw new Error('Expected a KYC outcome sheet');

  expect(sheet.props.title).toBe(name ? `${name} support coming soon` : 'Support coming soon');
  expect(sheet.props.description).toBe(
    `Sorry, instant cash deposits are not available in ${code} yet.\n\nWe’ll let you know as soon as your state is supported.`
  );
});
