import { saveLanguage } from '@/handlers/localstorage/globalSettings';
import { Language } from '@/languages';
import { MigrationName, type Migration } from '@/migrations/types';

export function changeLanguageKeys(): Migration {
  return {
    name: MigrationName.changeLanguageKeys,
    async migrate() {
      saveLanguage(Language.EN_US);
    },
  };
}
