import { Migration, MigrationName } from '@/migrations/types';
import { saveLanguage } from '@/handlers/localstorage/globalSettings';
import { Language } from '@/languages';

export function changeLanguageKeys(): Migration {
  return {
    name: MigrationName.changeLanguageKeys,
    async migrate() {
      saveLanguage(Language.EN_US);
    },
  };
}
