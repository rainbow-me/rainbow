import { convertToRGBA, processColor } from 'react-native-reanimated';
import { clampColor, interpolateHue, oklabToOklch, oklchToHex, rgbToOklab, standardizeColors } from './colors';

/**
 * Available color strategies for gradient generation
 */
export type ColorStrategy =
  | 'analogous' // Colors adjacent on the color wheel (harmonious, subtle)
  | 'complement' // Colors around complementary positions
  | 'split' // Split-complementary color scheme
  | 'triadic' // Three colors evenly spaced around the color wheel
  | 'monochromatic'; // Variations in lightness and chroma, same hue

/**
 * Parameters for the getMagicGradient function
 */
export interface GradientOptions {
  /** Color harmony strategy to use */
  strategy?: ColorStrategy;
  /** Number of colors in the gradient (minimum 3) */
  numberOfColors?: number;
  /** Amount of random variation (0-10, where 0 is none and 10 is maximum) */
  variance?: number;
  /** Standard lightness for all colors in the gradient (0-1, where 0.5 is middle lightness) */
  lightness?: number;
  /** Standard chroma for all colors in the gradient (typically 0-0.4, higher values may be out of gamut) */
  chroma?: number;
}

/**
 * Gets a balanced, multicolored gradient based on an input color.
 * The gradient will start and end with the input color and include intermediate
 * colors that align with the requested color strategy.
 *
 * @param color - Base color to build the gradient around (hex, rgb, etc.)
 * @param options - Parameters for gradient generation
 * @param options.numberOfColors - Number of colors in the gradient (minimum 3)
 * @param options.strategy - Color harmony strategy to use (`'analogous'`, `'complement'`, `'split'`, `'triadic'`, `'monochromatic'`)
 * @param options.chroma - Standard chroma for all colors in the gradient (typically 0-0.4, higher values may be out of gamut)
 * @param options.lightness - Standard lightness for all colors in the gradient (0-1, where 0.5 is middle lightness)
 * @param options.variance - Amount of random variation (0-20, where 0 is none and 20 is maximum)
 *
 * @returns Array of colors in hex format
 *
 * @example
 * ```ts
 * const gradientColors = generateRainbowGradient({
 *   color: '#FF1493',
 *   numberOfColors: 6,
 *   strategy: 'complement',
 * });
 * ```
 */
export function generateRainbowGradient(color: string, options: GradientOptions = {}): string[] {
  'worklet';
  const { chroma, lightness, numberOfColors = 7, strategy = 'analogous', variance = 0 } = options;

  // Clamp variance to a 0-20 scale
  const varFactor = clampColor(variance, 0, 20);

  // Ensure minimum of 3 colors
  const numColors = Math.max(3, numberOfColors);

  // Process the input color
  const processedColor = processColor(color);
  if (!processedColor) {
    return Array(numColors).fill('#FF1493'); // Default if invalid
  }

  // Convert to RGBA
  const [r, g, b] = convertToRGBA(processedColor);

  // Create the input color hex for first and last positions
  // const inputColorHex = colorToHex(r, g, b);

  // Convert to Oklab
  const { L, a: aLab, b: bLab } = rgbToOklab(r, g, b);

  // Convert to OkLCH for easier manipulation
  const { L: srcL, C: srcC, H: srcH } = oklabToOklch(L, aLab, bLab);

  // Ensure adequate lightness and chroma for gradient generation
  const baseL = clampColor(srcL, 0.3, 0.9);
  const baseC = Math.max(srcC, 0.05);

  // Create source color in OkLCH
  const sourceOklch = { L: baseL, C: baseC, H: srcH };

  // Generate only the intermediate colors (without first and last positions)
  // This is crucial for creating a seamless angular gradient
  const intermediatePoints = generateOklchPoints(
    // { L: baseL, C: baseC, H: srcH },
    sourceOklch,
    strategy,
    clampColor(numColors - 2, 1, 20), // Only generate intermediate colors
    varFactor
  );

  // Apply standardization to all colors (source and intermediates) if specified
  const standardizedSource = standardizeColors([sourceOklch], { lightness, chroma })[0];
  const standardizedIntermediates = standardizeColors(intermediatePoints, { lightness, chroma });

  // Convert to hex colors
  const sourceHex = oklchToHex(standardizedSource);
  const intermediateHexes = standardizedIntermediates.map(oklchToHex);

  // Return array with standardized source color at both start and end
  return [sourceHex, ...intermediateHexes, sourceHex];
}

/**
 * Add variance to a value with controlled range
 */
function addVariance(value: number, baseVariance: number, variance: number, min: number, max: number): number {
  'worklet';
  if (variance === 0) return value;

  // Scale variance directly (not normalized) with stronger effect
  const scaledVariance = variance / 10;
  const variationAmount = (Math.random() * 2 - 1) * baseVariance * scaledVariance;
  return clampColor(value + variationAmount, min, max);
}

/**
 * Generate OkLCH points based on selected color strategy
 */
function generateOklchPoints(
  source: { L: number; C: number; H: number },
  strategy: ColorStrategy,
  numColors: number,
  variance: number
): Array<{ L: number; C: number; H: number }> {
  'worklet';
  const points: Array<{ L: number; C: number; H: number }> = [];
  const steps = Array.from({ length: numColors }, (_, i) => i / (numColors - 1));

  switch (strategy) {
    case 'analogous': {
      // Analogous colors occupy a 60° slice of the color wheel centered on the source
      const hueRange = Math.PI / 3; // 60 degrees

      steps.forEach(t => {
        // Map t from [0,1] to [-0.5,0.5] for bidirectional shift around source
        const mappedT = t - 0.5;

        // Calculate new hue with smooth easing
        const newH = (source.H + mappedT * hueRange + 2 * Math.PI) % (2 * Math.PI);

        // Add variance with stronger effect
        const L = addVariance(source.L + 0.1 * Math.sin(t * Math.PI), 0.2, variance, 0.25, 0.95);
        const C = addVariance(source.C * (1 + 0.2 * Math.sin(t * Math.PI * 2)), 0.3, variance, 0.02, 0.4);
        const H = addVariance(newH, 0.3, variance, 0, 2 * Math.PI);

        points.push({ L, C, H });
      });
      break;
    }

    case 'complement': {
      // Complementary color scheme focuses on source and its opposite
      const complementH = (source.H + Math.PI) % (2 * Math.PI);

      steps.forEach(t => {
        // Use a different curve that emphasizes the endpoints (source and complement)
        // and creates a more distinct path than split complement
        const easing = 0.5 - 0.5 * Math.cos(t * Math.PI);

        // Linear interpolation between source and complement
        const newH = interpolateHue(source.H, complementH, easing);

        // Vary lightness and chroma to enhance the contrast between opposite colors
        // Middle colors have lower chroma and moderate lightness shift
        const chromaMod = Math.sin(t * Math.PI); // Peak at midpoint
        const lightnessMod = 0.2 * Math.sin(t * Math.PI * 2); // Oscillate

        const L = addVariance(source.L + lightnessMod, 0.2, variance, 0.25, 0.95);
        const C = addVariance(source.C * (0.8 + 0.3 * chromaMod), 0.3, variance, 0.02, 0.4);
        const H = addVariance(newH, 0.2, variance, 0, 2 * Math.PI);

        points.push({ L, C, H });
      });
      break;
    }

    case 'split': {
      // Split-complementary uses two colors that flank the complement
      const complementH = (source.H + Math.PI) % (2 * Math.PI);
      const splitAngle = Math.PI / 6; // 30 degrees
      const split1 = (complementH - splitAngle) % (2 * Math.PI);
      const split2 = (complementH + splitAngle) % (2 * Math.PI);

      steps.forEach(t => {
        let newH, L, C;

        // Create a distinct triangular path: source -> split1 -> split2 -> source
        if (t < 0.33) {
          // Source to first split complement
          const tt = t / 0.33;
          // Use an easing function for smoother transitions
          const eased = (1 - Math.cos(tt * Math.PI)) / 2;
          newH = interpolateHue(source.H, split1, eased);
          L = source.L + 0.15 * tt;
          C = source.C * (1 + 0.3 * tt);
        } else if (t < 0.66) {
          // First split to second split (distinctly different path than complement)
          const tt = (t - 0.33) / 0.33;
          const eased = (1 - Math.cos(tt * Math.PI)) / 2;
          // Direct path between splits - this is key to differentiating from complement
          newH = interpolateHue(split1, split2, eased);
          L = source.L + 0.15 - 0.3 * tt;
          C = source.C * (1.3 - 0.15 * tt);
        } else {
          // Second split back to source
          const tt = (t - 0.66) / 0.34;
          const eased = (1 - Math.cos(tt * Math.PI)) / 2;
          newH = interpolateHue(split2, source.H, eased);
          L = source.L - 0.15 + 0.15 * tt;
          C = source.C * (1.15 - 0.15 * tt);
        }

        // Add variance with stronger effect
        points.push({
          L: addVariance(L, 0.2, variance, 0.25, 0.95),
          C: addVariance(C, 0.3, variance, 0.02, 0.4),
          H: addVariance(newH, 0.25, variance, 0, 2 * Math.PI),
        });
      });
      break;
    }

    case 'triadic': {
      // Triadic - three colors equally spaced around the color wheel (120° apart)
      const triad1 = (source.H + (2 * Math.PI) / 3) % (2 * Math.PI);
      const triad2 = (source.H + (4 * Math.PI) / 3) % (2 * Math.PI);

      steps.forEach(t => {
        let newH, L, C;

        // Create a triangular path through all three triadic colors
        if (t < 0.33) {
          // Source to first triadic
          const tt = t / 0.33;
          const eased = (1 - Math.cos(tt * Math.PI)) / 2;
          newH = interpolateHue(source.H, triad1, eased);
          // More dramatic shifts for triadic scheme
          L = source.L + 0.2 * tt;
          C = source.C * (1 + 0.35 * tt);
        } else if (t < 0.66) {
          // First triadic to second triadic
          const tt = (t - 0.33) / 0.33;
          const eased = (1 - Math.cos(tt * Math.PI)) / 2;
          newH = interpolateHue(triad1, triad2, eased);
          L = source.L + 0.2 - 0.4 * tt;
          C = source.C * (1.35 - 0.1 * tt);
        } else {
          // Second triadic back to source
          const tt = (t - 0.66) / 0.34;
          const eased = (1 - Math.cos(tt * Math.PI)) / 2;
          newH = interpolateHue(triad2, source.H, eased);
          L = source.L - 0.2 + 0.2 * tt;
          C = source.C * (1.25 - 0.25 * tt);
        }

        // Add variance with stronger effect
        points.push({
          L: addVariance(L, 0.25, variance, 0.25, 0.95),
          C: addVariance(C, 0.3, variance, 0.02, 0.4),
          H: addVariance(newH, 0.25, variance, 0, 2 * Math.PI),
        });
      });
      break;
    }

    case 'monochromatic': {
      // Monochromatic - same hue with variations in lightness and chroma
      // Ensure we have a good middle lightness value for better results
      const baseL = clampColor(source.L, 0.3, 0.7);

      steps.forEach(t => {
        // Create an oscillating pattern with more dramatic shifts
        const phase = t * 2 * Math.PI;

        // Keep hue constant (with minimal variance if enabled)
        const H = addVariance(source.H, 0.1, variance, 0, 2 * Math.PI);

        // Create more significant lightness variation
        const L = addVariance(baseL + 0.3 * Math.sin(phase), 0.2, variance, 0.25, 0.95);

        // Chroma varies inversely with how extreme the lightness is
        const lightnessFactor = 1 - Math.abs(L - 0.5) * 2; // 1 at L=0.5, 0 at L=0 or L=1
        const C = addVariance(source.C * (0.6 + 0.8 * lightnessFactor * Math.cos(phase / 2)), 0.25, variance, 0.02, 0.4);

        points.push({ L, C, H });
      });
      break;
    }
  }

  return points;
}
