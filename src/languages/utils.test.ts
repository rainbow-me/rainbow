import { describe, test, expect } from '@jest/globals';

import { simpleObjectProxy } from '@/languages/utils';

const english = {
  account: {
    hide: 'Hide',
  },
} as const;

const translation = simpleObjectProxy<typeof english>(english);

describe('@/languages/utils', () => {
  test('simpleObjectProxy', () => {
    // @ts-expect-error We're ignoring TypeScript here
    expect(translation.account.__keypath__).toEqual('account');
    // @ts-expect-error We're ignoring TypeScript here
    expect(translation.account.hide.__keypath__).toEqual('account.hide');
    // @ts-expect-error We're ignoring TypeScript here
    expect(translation.account['hide'].__keypath__).toEqual('account.hide');
  });

  test('simpleObjectProxy with actually undefined values', () => {
    // @ts-expect-error We're ignoring TypeScript here
    expect(translation.foo.bar.baz.__keypath__).toEqual('foo.bar.baz');
  });
});
