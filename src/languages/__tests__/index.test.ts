import { describe, test, expect } from '@jest/globals';

import * as i18n from '@/languages';

describe('@/languages', () => {
  test('translate with keypath', () => {
    expect(i18n.t(i18n.l.account.hide)).toEqual('Hide');
  });

  test('translate with string', () => {
    expect(i18n.t('account.hide')).toEqual('Hide');
  });
});
