import { type Participant } from '@/features/sports/core/generated/external/sports/payload';

/**
 * Splits a participant's name into the part to display and an optional prefix, such as "Minnesota" in "Minnesota Vikings".
 * The short name is used only when it ends the full name, because providers also supply abbreviations ("S. Baez") and codes
 * ("SpiritAc") as short names.
 */
export function getParticipantDisplayName({ name, shortName }: Pick<Participant, 'name' | 'shortName'>): {
  displayName: string;
  prefix?: string;
} {
  if (!shortName || !name.endsWith(` ${shortName}`)) return { displayName: name };
  const prefix = name.slice(0, -shortName.length).trim();
  return prefix ? { displayName: shortName, prefix } : { displayName: shortName };
}
