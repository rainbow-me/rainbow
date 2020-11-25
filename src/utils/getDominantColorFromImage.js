import chroma from 'chroma-js';
import makeColorMoreChill from 'make-color-more-chill';
import { getColorFromURL } from 'rn-dominant-color';
import { colors } from '@rainbow-me/styles';

const contrast = color => chroma.contrast(color, colors.white);

export default async function getDominantColorFromImage(imageUrl) {
  const { background, secondary } = await getColorFromURL(imageUrl);

  // rn-dominant-color returns '#00000000' when a color doesnt exist
  if (background === '#00000000' && secondary === '#00000000') {
    return undefined;
  }

  return contrast(background) > contrast(secondary)
    ? makeColorMoreChill(background)
    : makeColorMoreChill(secondary);
}
