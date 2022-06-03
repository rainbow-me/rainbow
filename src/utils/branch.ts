// @ts-expect-error ts-migrate(2305) FIXME: Could not find a declaration file for module 'pako... Remove this comment to see the full error message
import pako from 'pako';
import qs from 'qs';
import branch from 'react-native-branch';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import logger from 'logger';

export const branchListener = (handleOpenLinkingURL: (url: any) => void) =>
  branch.subscribe(({ error, params, uri }) => {
    if (error) {
      logger.error('Error from Branch: ' + error);
    }

    if (!params && uri) {
      handleOpenLinkingURL(uri);
    } else if (!params) {
      // We got absolutely nothing to work with.
      return;
    } else if (params['+non_branch_link']) {
      const nonBranchUrl = params['+non_branch_link'];
      if (
        typeof nonBranchUrl === 'string' &&
        nonBranchUrl?.startsWith('rainbow://open')
      ) {
        // This happens when branch.io redirects user to the app in the
        // aggressive redirect mode with a confirmation modal in Safari.
        // Those URLs have shape
        // rainbow://open?_branch_referrer=A&link_click_id=B
        // and we can attempt to decode them.
        let url = nonBranchUrl;
        try {
          url = decodeBranchUrl(nonBranchUrl);
        } finally {
          handleOpenLinkingURL(url);
        }
      } else {
        // This happens when user taps Rainbow universal link managed by
        // branch.io and it is handled by iOS.
        handleOpenLinkingURL(nonBranchUrl);
      }
      return;
    } else if (!params['+clicked_branch_link']) {
      // Indicates initialization success and some other conditions. No link was
      // opened.
      if (IS_TESTING === 'true' && !!uri) {
        handleOpenLinkingURL(uri);
      } else {
        return;
      }
    } else if (params.uri) {
      // Sometimes `uri` in `params` differs from `uri`. When it happens, plain
      // `uri` is usually incorrect.
      handleOpenLinkingURL(params.uri);
    } else if (uri) {
      handleOpenLinkingURL(uri);
    }
  });

/**
 * Sometimes branch deeplinks have the following form:
 * rainbow://open?_branch_referrer=a&link_click_id=b
 * in which case they seemingly don't contain any info about the original URL.
 *
 * However, it turns out that query param `_branch_referrer` contains that URL
 * that was processed like this: `encodeURI(base64(gzip(link)))`.
 *
 * This function decodes original URL and returns its `uri` param or whole URL
 * if it was not present.
 */
const decodeBranchUrl = (source: string) => {
  const query = source.split('?')[1];
  const queryParam = qs.parse(query)['_branch_referrer'];
  const base64Url = decodeURIComponent(queryParam as string);
  const ascii = Buffer.from(base64Url, 'base64');

  const originalUniversalUrl = pako.inflate(ascii, { to: 'string' });

  // If universal link had shape https://rnbwpapp.com/something?uri=...
  // we want to open that uri instead.
  const uriParam = qs.parse(originalUniversalUrl.split('?')[1]).uri;
  return uriParam || originalUniversalUrl;
};
