import { values } from 'lodash';

import { CLOUD_BACKUP_ERRORS } from '@/handlers/cloudBackup';
import * as i18n from '@/languages';

export function getBackupErrorMessage(error: Error): string {
  switch (error.message) {
    case CLOUD_BACKUP_ERRORS.KEYCHAIN_ACCESS_ERROR:
      return i18n.t(i18n.l.back_up.errors.keychain_access);
    case CLOUD_BACKUP_ERRORS.ERROR_DECRYPTING_DATA:
      return i18n.t(i18n.l.back_up.errors.decrypting_data);
    case CLOUD_BACKUP_ERRORS.NO_BACKUPS_FOUND:
    case CLOUD_BACKUP_ERRORS.SPECIFIC_BACKUP_NOT_FOUND:
      return i18n.t(i18n.l.back_up.errors.no_backups_found);
    case CLOUD_BACKUP_ERRORS.ERROR_GETTING_ENCRYPTED_DATA:
      return i18n.t(i18n.l.back_up.errors.cant_get_encrypted_data);
    case CLOUD_BACKUP_ERRORS.MISSING_PIN:
      return i18n.t(i18n.l.back_up.errors.missing_pin);
    case CLOUD_BACKUP_ERRORS.WRONG_PIN:
      return i18n.t(i18n.l.back_up.wrong_pin);
    case CLOUD_BACKUP_ERRORS.MALFORMED_BACKUP_DATA:
      return i18n.t(i18n.l.back_up.errors.malformed_backup_data);
    default:
      return i18n.t(i18n.l.back_up.errors.generic, {
        errorCodes: values(CLOUD_BACKUP_ERRORS).indexOf(error.message),
      });
  }
}
