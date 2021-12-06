import c from 'chroma-js';
import makeColorMoreChill from 'make-color-more-chill';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import Palette from 'react-native-palette-full';

export default async function getDominantColorFromImage(
  imageUrl: any,
  colorToMeasureAgainst: any
) {
  if (IS_TESTING === 'true') return undefined;
  let colors = await Palette.getNamedSwatchesFromUrl(imageUrl);

  // react-native-palette keys for Android are not the same as iOS so we fix here
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  if (android) {
    // @ts-expect-error ts-migrate(2740) FIXME: Type '{}' is missing the following properties from... Remove this comment to see the full error message
    colors = Object.keys(colors).reduce((acc, key) => {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      acc[key.toLowerCase()] = colors[key];
      return acc;
    }, {});
  }

  const color =
    // @ts-expect-error ts-migrate(2551) FIXME: Property 'vibrant' does not exist on type 'IPalett... Remove this comment to see the full error message
    colors.vibrant?.color ||
    // @ts-expect-error ts-migrate(2551) FIXME: Property 'muted' does not exist on type 'IPalette'... Remove this comment to see the full error message
    colors.muted?.color ||
    // @ts-expect-error ts-migrate(2551) FIXME: Property 'vibrantLight' does not exist on type 'IP... Remove this comment to see the full error message
    colors.vibrantLight?.color ||
    // @ts-expect-error ts-migrate(2551) FIXME: Property 'mutedLight' does not exist on type 'IPal... Remove this comment to see the full error message
    colors.mutedLight?.color ||
    // @ts-expect-error ts-migrate(2551) FIXME: Property 'mutedDark' does not exist on type 'IPale... Remove this comment to see the full error message
    colors.mutedDark?.color ||
    // @ts-expect-error ts-migrate(2551) FIXME: Property 'vibrantDark' does not exist on type 'IPa... Remove this comment to see the full error message
    colors.vibrantDark?.color;

  const fallbackColor =
    // @ts-expect-error ts-migrate(2551) FIXME: Property 'muted' does not exist on type 'IPalette'... Remove this comment to see the full error message
    colors.muted?.color ||
    // @ts-expect-error ts-migrate(2551) FIXME: Property 'vibrantLight' does not exist on type 'IP... Remove this comment to see the full error message
    colors.vibrantLight?.color ||
    // @ts-expect-error ts-migrate(2551) FIXME: Property 'mutedLight' does not exist on type 'IPal... Remove this comment to see the full error message
    colors.mutedLight?.color ||
    // @ts-expect-error ts-migrate(2551) FIXME: Property 'mutedDark' does not exist on type 'IPale... Remove this comment to see the full error message
    colors.mutedDark?.color ||
    // @ts-expect-error ts-migrate(2551) FIXME: Property 'vibrantDark' does not exist on type 'IPa... Remove this comment to see the full error message
    colors.vibrantDark?.color;

  // @ts-expect-error ts-migrate(2551) FIXME: Property 'vibrant' does not exist on type 'IPalett... Remove this comment to see the full error message
  if (colors.vibrant?.color) {
    const chillVibrant = makeColorMoreChill(
      // @ts-expect-error ts-migrate(2551) FIXME: Property 'vibrant' does not exist on type 'IPalett... Remove this comment to see the full error message
      colors.vibrant?.color,
      colorToMeasureAgainst
    );

    // @ts-expect-error ts-migrate(2551) FIXME: Property 'vibrant' does not exist on type 'IPalett... Remove this comment to see the full error message
    if (c.deltaE(colors.vibrant?.color, chillVibrant) < 13) {
      return chillVibrant;
    } else if (fallbackColor !== undefined && fallbackColor !== color) {
      const chillFallback = makeColorMoreChill(
        fallbackColor,
        colorToMeasureAgainst
      );

      if (fallbackColor === chillFallback) {
        return chillFallback;
      } else {
        return chillVibrant;
      }
    }
  }
  return makeColorMoreChill(color, colorToMeasureAgainst);
}
