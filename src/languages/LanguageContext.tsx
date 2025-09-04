import React, { createContext, PropsWithChildren, useContext, useCallback, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as i18n from '@/languages';
import { Language } from './index';
import { settingsChangeLanguage } from '@/redux/settings';
import { AppState } from '@/redux/store';

export interface LanguageContextProps {
  language: Language;
  setLanguage: (language: Language) => void;
  persistLanguage: () => void;
}

export const LanguageContext = createContext<LanguageContextProps | null>(null);

export const LanguageProvider = (props: PropsWithChildren) => {
  const dispatch = useDispatch();
  const persistedLanguage = useSelector((state: AppState) => state.settings.language);

  // Local language state, decoupled from Redux
  const [language, _setLanguage] = React.useState<Language>(persistedLanguage);

  // Update i18n locale when current language changes
  useEffect(() => {
    i18n.updateLanguageLocale(language);
  }, [language]);

  const setLanguage = useCallback((language: Language) => {
    _setLanguage(language);
  }, []);

  // Decoupled persistence to avoid re-rendering the entire app until SettingsSheet is closed
  const persistLanguage = useCallback(() => {
    if (language !== persistedLanguage) {
      dispatch(settingsChangeLanguage(language));
    }
  }, [dispatch, language, persistedLanguage]);

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      persistLanguage,
    }),
    [language, setLanguage, persistLanguage]
  );

  // Add key to the children to force a re-render when the persisted language changes
  // Don't create new View element; re-use downstream View component
  const childWithKey = useMemo(() => {
    return React.isValidElement(props.children)
      ? React.cloneElement(props.children as React.ReactElement, { key: language })
      : props.children;
  }, [props.children, persistedLanguage]);

  return <LanguageContext.Provider value={contextValue}>{childWithKey}</LanguageContext.Provider>;
};

/**
 * Custom hook to get the language context
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
