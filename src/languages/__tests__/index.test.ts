import { describe, test, expect } from '@jest/globals';

import i18n from '@/languages';

describe('@/languages', () => {
  test('translate with callable syntax', () => {
    expect(i18n.account.hide()).toEqual('Hide');
  });

  test('translate with toString()', () => {
    expect(i18n.account.hide.toString()).toEqual('Hide');
  });

  test('proxy behavior - typeof checks', () => {
    expect(typeof i18n.account).toEqual('object');
    expect(typeof i18n.account.hide).toEqual('function');
  });

  test('__keypath__ property', () => {
    expect(i18n.account.hide.__keypath__).toEqual('account.hide');
  });

  test('falls back with undefined values', () => {
    // @ts-ignore We know it's undefined
    expect(i18n.promos.foo.bar.baz.header()).toEqual(`[missing "en_US.promos.foo.bar.baz.header" translation]`);
  });
});
