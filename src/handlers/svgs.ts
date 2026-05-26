import { PixelRatio } from 'react-native';

import deviceUtils from '@/utils/deviceUtils';
import isSVGImage from '@/utils/isSVG';

const SVG2PNG_ENDPOINT = 'https://images.rainbow.me/svg2png';
const MAX_WIDTH = 2000;
const pixelRatio = PixelRatio.get();

function svgToPng(url: string, big = false) {
  const targetWidth = Math.min(
    MAX_WIDTH,
    big ? deviceUtils.dimensions.width * pixelRatio : (deviceUtils.dimensions.width / 2) * pixelRatio
  );
  return `${SVG2PNG_ENDPOINT}?url=${encodeURIComponent(url)}&w=${Math.round(targetWidth)}`;
}

export default function svgToPngIfNeeded(url: string | null | undefined, big?: boolean) {
  if (!url) return undefined;
  const isSVG = isSVGImage(url);
  return isSVG ? svgToPng(url, big) : url;
}
