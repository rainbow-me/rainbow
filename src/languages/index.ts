import i18next from 'i18next';
// @ts-expect-error ts-migrate(2732) FIXME: Cannot find module './_english.json'. Consider usi... Remove this comment to see the full error message
import english from './_english.json';

export const resources = {
  en: english,
};

export const supportedLanguages = {
  en: 'English',
};

i18next.init({
  lng: 'en',
  resources,
});

export const updateLanguage = (code: any) => i18next.changeLanguage(code);

i18next.on('languageChanged', () => {});

export default i18next;
