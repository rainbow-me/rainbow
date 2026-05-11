import { describe, expect, test } from '@jest/globals';

import * as i18n from '@/languages';

describe('@/languages', () => {
  test('translate with keypath', () => {
    expect(i18n.t(i18n.l.account.tab_tokens)).toEqual('Tokens');
  });

  test('translate with string for backwards compat', () => {
    expect(i18n.t('account.tab_tokens')).toEqual('Tokens');
  });

  test('falls back with undefined values', () => {
    // @ts-ignore We know it's undefined
    const translations = i18n.l.promos.foo.bar.baz;
    expect(i18n.t(translations.header)).toEqual(`[missing "en_US.promos.foo.bar.baz.header" translation]`);
  });
});
