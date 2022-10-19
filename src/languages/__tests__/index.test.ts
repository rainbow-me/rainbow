import { describe, test, expect } from '@jest/globals';

import * as i18n from '@/languages';

describe('@/languages', () => {
  test('translate with keypath', () => {
    expect(i18n.translate(i18n.translations.account.hide)).toEqual('Hide');
  });

  test('translate with string', () => {
    expect(i18n.translate('account.hide')).toEqual('Hide');
  });
});
