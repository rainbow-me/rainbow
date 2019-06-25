import i18next from 'i18next';
import english from './_english.json';
import french from './_french.json';

export const resources = {
  en: english,
  fr: french,
};

export const supportedLanguages = {
  en: 'English',
  fr: 'Français',
};

i18next.init({
  lng: 'en',
  resources,
});

export const updateLanguage = code => i18next.changeLanguage(code);

i18next.on('languageChanged', () => {});

export default i18next;
