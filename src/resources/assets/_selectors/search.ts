import { TokenSearchResult } from '@/resources/search';

export function filterNonTokenIconAssets(tokens: TokenSearchResult) {
  return tokens.filter(token => token.icon_url);
}
