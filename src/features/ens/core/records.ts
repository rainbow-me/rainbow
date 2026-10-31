import type { Records } from '../types/registration';

export const deprecatedTextRecordFields: Partial<Record<string, string>> = {
  'me.rainbow.displayName': 'name',
  'content': 'contenthash',
};

/**
 * Returns the record writes needed to apply an edit, including empty values for deletions.
 */
export function getChangedRecords(records: Records, initialRecords: Records): Records {
  const changed: Records = {};
  for (const [key, value] of Object.entries(records)) {
    if (value && value !== initialRecords[key]) changed[key] = value;
  }
  for (const key of Object.keys(initialRecords)) {
    if (initialRecords[key] && !records[key]) changed[key] = '';
  }
  return changed;
}
