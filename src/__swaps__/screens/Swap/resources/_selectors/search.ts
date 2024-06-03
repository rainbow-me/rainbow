import { TokenSearchResult } from '../search';

export function filterNonTokenIconAssets(tokens: TokenSearchResult) {
  return tokens.filter(token => token.icon_url);
}
