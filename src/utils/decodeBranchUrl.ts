// @ts-ignore (no declaration file)
import pako from 'pako';
// @ts-ignore (no declaration file)
import qs from 'qs';

/**
 * Sometimes branch deeplinks have the following form:
 * rainbow://open?_branch_referrer=a&link_click_id=b
 * in which case they seemingly don't contain any info about the original URL.
 *
 * However, it turns out that query param `_branch_referrer` contains that URL
 * that was processed like this: `encodeURI(base64(gzip(link)))`.
 *
 * This function decodes original URL and returns its `uri` param or `undefined`
 * If decoding was not successful.
 */
export default function decodeBranchUrl(source: string): string | undefined {
  try {
    const query = source.split('?')[1];

    // Before: _branch_referrer=A&link_click_id=B
    const queryParam = qs.parse(query)['_branch_referrer'];

    const base64Url = decodeURIComponent(queryParam);
    const ascii = Buffer.from(base64Url, 'base64');

    // https://rnbwapp.com/C?uri=D
    const originalUniversalUrl = pako.inflate(ascii, { to: 'string' });
    const uriParam = qs.parse(originalUniversalUrl.split('?')[1]).uri;

    return uriParam;
  } catch (error) {
    // This function relies on very specific undocumented behavior of provider.
    // Any part of the function might break. Returning `undefined` is possibly
    // valid situation.
  }
}
