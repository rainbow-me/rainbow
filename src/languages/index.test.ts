import { afterEach, describe, expect, test } from 'vitest';

import { appSettingsActions } from '@/features/settings/data/appSettingsStore';
import * as i18n from '@/languages';
import { Language } from '@/languages/types';

afterEach(() => appSettingsActions.setLanguage(Language.EN_US));

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

describe('app language', () => {
  test('updates translations and date formatting directly from the preference', () => {
    appSettingsActions.setLanguage(Language.EN_US);
    expect(i18n.t(i18n.l.settings.label)).toBe('Settings');
    expect(i18n.getDateFnsLocale().code).toBe('en-US');

    appSettingsActions.setLanguage(Language.FR_FR);
    expect(i18n.t(i18n.l.settings.label)).toBe('Paramètres');
    expect(i18n.t('settings.label')).toBe('Paramètres');
    expect(i18n.getDateFnsLocale().code).toBe('fr');
  });

  test('retains English fallback and interpolation for untranslated entries', () => {
    appSettingsActions.setLanguage(Language.ES_419);
    expect(i18n.t(i18n.l.sports.title)).toBe('Sports');
    expect(i18n.t(i18n.l.sports.show_more, { count: 3 })).toBe('Show 3 more');
  });

  test('honors an explicit locale without changing the preference', () => {
    appSettingsActions.setLanguage(Language.EN_US);
    expect(i18n.t(i18n.l.settings.label, { locale: Language.FR_FR })).toBe('Paramètres');
    expect(i18n.t(i18n.l.settings.label)).toBe('Settings');
    expect(appSettingsActions.getLanguage()).toBe(Language.EN_US);
  });
});
