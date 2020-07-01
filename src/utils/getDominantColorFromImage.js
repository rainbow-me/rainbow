import chroma from 'chroma-js';
import { getColorFromURL } from 'rn-dominant-color';
import { colors } from '@rainbow-me/styles';

// WCAG specification which states that a
// contrast ratio of at least 4.5:1 should
// exist between text and background behind the text
// 📎️ https://www.w3.org/TR/WCAG20-TECHS/G18.html
const minimumWCAGCompliantContrast = 4.5;

const contrast = color => chroma.contrast(color, colors.white);
const darker = color => colors.alpha(chroma(color).darken(0.5));
const isAcceptableContrast = color =>
  contrast(color).toFixed(2) > minimumWCAGCompliantContrast;

export default async function getDominantColorFromImage(imageUrl) {
  const { background, secondary } = await getColorFromURL(imageUrl);

  if (contrast(background) > contrast(secondary)) {
    return isAcceptableContrast(darker(secondary))
      ? darker(secondary)
      : background;
  }

  return isAcceptableContrast(darker(background))
    ? darker(background)
    : secondary;
}
