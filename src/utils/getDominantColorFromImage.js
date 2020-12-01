import makeColorMoreChill, { isBlackOrWhite } from 'make-color-more-chill';
import { getColorFromURL } from 'rn-dominant-color';

export default async function getDominantColorFromImage(imageUrl) {
  const { background, secondary } = await getColorFromURL(imageUrl);

  // if rn-dominant-color returned '#00000000' it means the color doesnt exist, in this
  // case we want to aboooort and let the consumer handle the correct fallback color depending on
  // their implementation / needs!
  if (background === '#00000000' && secondary === '#00000000') {
    return undefined;
  }

  if (isBlackOrWhite(background)) return makeColorMoreChill(secondary);
  if (isBlackOrWhite(secondary)) return makeColorMoreChill(background);

  return makeColorMoreChill(secondary);
}
