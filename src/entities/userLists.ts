/**
 * A single user list, with fields based on the data found in
 * `src/references/default-token-lists.json`.
 */
export interface UserList {
  emoji: string;
  id: string;
  name: string;
  tokens: string[];
}
