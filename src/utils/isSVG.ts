import isSupportedUriExtension from '@/helpers/isSupportedUriExtension';

const svgRegexList = [new RegExp(/https:\/\/metadata.ens.domains\/\w+\/0x[0-9a-fA-F]*\/(0x)?[0-9a-fA-f]+\/image/)];

export default function isSVG(url: string) {
  if (svgRegexList.some(regex => regex.test(url))) {
    return true;
  }
  return isSupportedUriExtension(url, ['.svg']);
}
