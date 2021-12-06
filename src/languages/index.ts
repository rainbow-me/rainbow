import i18next from 'i18next';
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

export const updateLanguage = code => i18next.changeLanguage(code);

i18next.on('languageChanged', () => {});

export default i18next;
