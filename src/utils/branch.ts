// @ts-expect-error ts-migrate(2305) FIXME: Could not find a declaration file for module 'pako... Remove this comment to see the full error message
import pako from 'pako';
import qs from 'qs';
import branch from 'react-native-branch';
import { IS_TESTING } from 'react-native-dotenv';
import { analyticsV2 } from '@/analytics';
import * as ls from '@/storage';
import { logger, RainbowError } from '@/logger';

export const branchListener = async (handleOpenLinkingURL: (url: any) => void) => {
  logger.debug(`Branch: setting up listener`, {}, logger.DebugContext.deeplinks);

  /*
   * This is run every time the app is opened, whether from a cold start of from the background.
   */
  const unsubscribe = branch.subscribe(({ error, params, uri }) => {
    if (error) {
      switch (error) {
        case 'Trouble reaching the Branch servers, please try again shortly.':
          break;
        default:
          logger.error(new RainbowError('Branch: error when handling event'), {
            error,
          });
      }
    }

    logger.debug(`Branch: handling event`, { params, uri }, logger.DebugContext.deeplinks);

    if (!params && uri) {
      logger.debug(`Branch: no params but we have a URI`, {}, logger.DebugContext.deeplinks);
      handleOpenLinkingURL(uri);
    } else if (!params) {
      // We got absolutely nothing to work with.
      logger.warn(`Branch: received no params or URI when handling event`, {
        params,
        uri,
      });
    } else if (params['+non_branch_link']) {
      const nonBranchUrl = params['+non_branch_link'];

      logger.debug(`Branch: handling non-Branch link`, {}, logger.DebugContext.deeplinks);

      if (typeof nonBranchUrl === 'string' && nonBranchUrl?.startsWith('rainbow://open')) {
        logger.debug(`Branch: aggressive Safari redirect mode`, {}, logger.DebugContext.deeplinks);

        /**
         * This happens when the user hits the Branch-hosted fallback page in
         * their browser.
         *
         * When they click the button to open Rainbow, Branch
         * uses a native deeplink to refocus the app. This deeplink has a
         * base64 encoded parameter that contains the original universal link.
         *
         *    Example: rainbow://open?_branch_referrer=A&link_click_id=B
         *
         * We decode that here and then handle it normally.
         */
        let url = nonBranchUrl;

        try {
          url = decodeBranchUrl(nonBranchUrl);
        } finally {
          handleOpenLinkingURL(url);
        }
      } else {
        logger.debug(`Branch: non-Branch link handled directly`, {}, logger.DebugContext.deeplinks);

        /**
         * This can happen when the user clicks on a deeplink and we pass its handling on to Branch.
         *
         *   Example: WC connections on Android, looks like `wc:...`
         */
        handleOpenLinkingURL(nonBranchUrl);
      }
    } else if (!params['+clicked_branch_link']) {
      /*
       * Happens on a cold start and when the app is refocused from the
       * background because Branch re-runs `subscribe()` each time.
       *
       * No link was opened, so we don't typically need to do anything.
       */
      logger.debug(`Branch: handling event where no link was opened`, {}, logger.DebugContext.deeplinks);

      if (IS_TESTING === 'true' && !!uri) {
        handleOpenLinkingURL(uri);
      }
    } else if (params.uri) {
      /**
       * Sometimes `params.uri` differs from `uri`, and in these cases we
       * should use `params.uri`. This happens about 8k times per week, so it's
       * very expected.
       */
      logger.debug(`Branch: using preferred URI value from params`, {
        params,
        uri,
      });

      handleOpenLinkingURL(params.uri);
    } else if (uri) {
      logger.debug(`Branch: handling event default case`, {}, logger.DebugContext.deeplinks);

      handleOpenLinkingURL(uri);
    }
  });

  // getFirstReferringParams must be called after branch.subscribe()
  const branchFirstReferringParamsSet = ls.device.get(['branchFirstReferringParamsSet']);

  if (!branchFirstReferringParamsSet) {
    const branchParams = await branch
      .getFirstReferringParams()
      .then(branchParams => branchParams)
      .catch(e => {
        logger.error(new RainbowError('error calling branch.getFirstReferringParams()'), e);
        return null;
      });

    if (branchParams) {
      analyticsV2.identify({
        branchCampaign: branchParams['~campaign'],
        branchReferrer: branchParams['+referrer'],
        branchReferringLink: branchParams['~referring_link'],
      });
    }

    ls.device.set(['branchFirstReferringParamsSet'], true);
  }

  return unsubscribe;
};

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
