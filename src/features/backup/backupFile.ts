export type CloudBackups = {
  files: BackupFile[];
};

export type BackupFile = {
  isDirectory: boolean;
  isFile: boolean;
  lastModified: string;
  name: string;
  path: string;
  size: number;
  uri: string;
};

export const REMOTE_BACKUP_WALLET_DIR = 'rainbow.me/wallet-backups';

export function parseTimestampFromBackupFile(filename: string | null): number | undefined {
  if (!filename) return;

  const match = filename.match(/backup_(\d+)\.json/);
  if (!match) return;

  const timestamp = Number(match[1]);
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

export function parseTimestampFromFilename(filename: string): number {
  const name = normalizeAndroidBackupFilename(filename);
  return Number(
    name
      .replace('.backup_', '')
      .replace('backup_', '')
      .replace('.json', '')
      .replace('.icloud', '')
      .replace('rainbow.me/wallet-backups/', '')
  );
}

export function normalizeAndroidBackupFilename(filename: string): string {
  return filename.replace(`${REMOTE_BACKUP_WALLET_DIR}/`, '');
}
