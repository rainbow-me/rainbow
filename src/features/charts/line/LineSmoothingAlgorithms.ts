import { type SkPath } from '@shopify/react-native-skia';

/**
 * Available line smoothing algorithms for chart rendering.
 */
export enum LineSmoothing {
  /**
   * Curvature-Adaptive Monotone Spline (CAMS)
   *
   * Combines Makima-style weighted tangent estimation with full Fritsch-Carlson
   * monotone constraints. This is essentially "monotone Makima" — you get the
   * aesthetic tangent weighting of Makima, but with guaranteed no overshoot.
   *
   * Properties:
   * - C¹ continuous (continuous first derivative)
   * - Strictly monotone between data points (no overshoot)
   * - Uses Makima weights to bias tangents toward flatter adjacent segments
   * - Direction-preserving magnitude clamping at all points
   *
   * Tension: Blends between linear interpolation (0) and full CAMS (1).
   *
   * Best for: When you want Makima's aesthetic quality but need monotonicity.
   * Compare: Makima (same tangents, not monotone), PCHIP/Steffen (monotone,
   * different tangent formulas).
   */
  CAMS = 'cams',

  /** Cardinal spline - smooth curves with adjustable tension */
  Cardinal = 'cardinal',

  /** Centripetal Catmull-Rom spline - smooth curves that avoid cusps */
  CatmullRom = 'catmullRom',

  /** Simple polyline with no smoothing - straight line segments */
  Linear = 'linear',

  /**
   * Modified Akima (Makima) interpolation
   *
   * MATLAB's modified Akima algorithm. The Makima weights add a term that
   * reduces overshoot in flat regions compared to classic Akima, but this
   * method does NOT guarantee monotonicity — it can still overshoot in
   * oscillatory regions.
   *
   * Properties:
   * - C¹ continuous
   * - NOT strictly monotone (can overshoot in oscillatory data)
   * - Reduced overshoot in flat regions vs. classic Akima
   * - Boundary constraints prevent endpoint hooks
   *
   * Best for: Aesthetically smooth curves where some overshoot is acceptable.
   * Use CAMS, PCHIP, or Steffen if you need guaranteed monotonicity.
   */
  Makima = 'makima',

  /**
   * PCHIP (Piecewise Cubic Hermite Interpolating Polynomial)
   *
   * The classic Fritsch-Carlson monotone interpolation method. Uses weighted
   * harmonic mean of adjacent slopes for interior points, with shape-preserving
   * one-sided formulas at boundaries.
   *
   * Properties:
   * - C¹ continuous
   * - Strictly monotone between data points (no overshoot)
   * - Weighted harmonic mean preserves local shape characteristics
   * - Non-uniform spacing aware (uses actual segment lengths)
   *
   * Best for: The standard choice for monotone interpolation. Well-understood,
   * widely implemented (MATLAB's pchip, scipy.interpolate.PchipInterpolator).
   */
  PCHIP = 'pchip',

  /**
   * Steffen monotone interpolation
   *
   * Steffen's method directly computes monotone-preserving derivatives without
   * requiring a constraint pass. Tends to be slightly more conservative than
   * PCHIP, producing tighter curves near extrema.
   *
   * Properties:
   * - C¹ continuous
   * - Strictly monotone between data points (no overshoot)
   * - Direct formula (no iteration or constraint application needed)
   * - Slightly more conservative than PCHIP
   *
   * Best for: When you want guaranteed monotonicity with minimal computation.
   */
  MonotoneX = 'monotoneX',
}

// =============================================================================
// CONSTANTS
// =============================================================================

const EPSILON = 1e-12;

// =============================================================================
// SHARED UTILITIES
// =============================================================================

/**
 * Computes segment lengths (h) and slopes (delta) for the given points.
 * This is the common first step for all Hermite-based interpolation methods.
 *
 * @param points - Interleaved x,y coordinates as Float32Array
 * @param count - Number of points
 * @returns Tuple of [h, delta] arrays
 */
function computeSegmentProperties(points: Float32Array, count: number): [h: Float32Array, delta: Float32Array] {
  'worklet';

  const h = new Float32Array(count - 1);
  const delta = new Float32Array(count - 1);

  for (let i = 0; i < count - 1; i++) {
    const dx = points[(i + 1) * 2] - points[i * 2];
    const dy = points[(i + 1) * 2 + 1] - points[i * 2 + 1];
    h[i] = dx;
    delta[i] = Math.abs(dx) < EPSILON ? 0 : dy / dx;
  }

  return [h, delta];
}

/**
 * Applies Fritsch-Carlson boundary constraints to endpoint derivatives.
 *
 * The constraint ensures that:
 * 1. The derivative has the same sign as the adjacent segment slope
 * 2. The derivative magnitude doesn't exceed 3× the adjacent slope magnitude
 *
 * This prevents "hooks" at the endpoints where the curve would bend away
 * from the data trend.
 *
 * @param d - Derivative array (modified in place)
 * @param delta - Segment slope array
 * @param count - Number of points
 */
function applyBoundaryConstraints(d: Float32Array, delta: Float32Array, count: number): void {
  'worklet';

  if (count < 2) return;

  // First point: constrain based on first segment slope
  const s0 = delta[0];
  if (Math.abs(s0) < EPSILON) {
    // Flat first segment: zero derivative
    d[0] = 0;
  } else if (d[0] * s0 < 0) {
    // Derivative opposes slope direction: clamp to zero
    d[0] = 0;
  } else if (Math.abs(d[0]) > 3 * Math.abs(s0)) {
    // Derivative too steep: clamp to 3× slope (Fritsch-Carlson bound)
    d[0] = 3 * s0;
  }

  // Last point: constrain based on last segment slope
  const sLast = delta[count - 2];
  if (Math.abs(sLast) < EPSILON) {
    // Flat last segment: zero derivative
    d[count - 1] = 0;
  } else if (d[count - 1] * sLast < 0) {
    // Derivative opposes slope direction: clamp to zero
    d[count - 1] = 0;
  } else if (Math.abs(d[count - 1]) > 3 * Math.abs(sLast)) {
    // Derivative too steep: clamp to 3× slope
    d[count - 1] = 3 * sLast;
  }
}

/**
 * Builds cubic Bézier segments from Hermite data (points + derivatives).
 *
 * Converts from Hermite form (point + tangent) to Bézier form (4 control points)
 * using the standard relationship:
 *   P1 = P0 + (h/3) * d0
 *   P2 = P3 - (h/3) * d1
 *
 * The tension parameter blends between linear interpolation and the computed
 * derivatives, allowing smooth adjustment of curve tightness.
 *
 * @param path - Skia path to append segments to
 * @param points - Interleaved x,y coordinates
 * @param h - Segment lengths
 * @param delta - Segment slopes
 * @param d - Derivatives at each point
 * @param count - Number of points
 * @param tension - Blend factor: 0 = linear, 1 = full curve
 */
function buildHermiteBezierSegments(
  path: SkPath,
  points: Float32Array,
  h: Float32Array,
  delta: Float32Array,
  d: Float32Array,
  count: number,
  tension: number
): void {
  'worklet';

  for (let i = 0; i < count - 1; i++) {
    const x0 = points[i * 2];
    const y0 = points[i * 2 + 1];
    const x1 = points[(i + 1) * 2];
    const y1 = points[(i + 1) * 2 + 1];

    const segSlope = delta[i];
    const dx = h[i] / 3;

    // Tension blending: 0 = linear (use segment slope), 1 = full curve (use computed derivative)
    const t0 = segSlope + (d[i] - segSlope) * tension;
    const t1 = segSlope + (d[i + 1] - segSlope) * tension;

    path.cubicTo(x0 + dx, y0 + t0 * dx, x1 - dx, y1 - t1 * dx, x1, y1);
  }
}

// =============================================================================
// LINEAR
// =============================================================================

function buildLinearPath(path: SkPath, points: Float32Array, count: number): void {
  'worklet';

  path.moveTo(points[0], points[1]);
  for (let i = 1; i < count; i++) {
    path.lineTo(points[i * 2], points[i * 2 + 1]);
  }
}

// =============================================================================
// CARDINAL SPLINE
// =============================================================================

/**
 * Cardinal spline interpolation.
 *
 * Uses a simple tangent formula based on the vector between neighboring points:
 *   tangent[i] = tension * (P[i+1] - P[i-1]) / 6
 *
 * This produces smooth C¹ curves but does NOT guarantee monotonicity.
 */
function buildCardinalPath(path: SkPath, points: Float32Array, count: number, tension: number): void {
  'worklet';

  const k = tension / 6;

  path.moveTo(points[0], points[1]);

  for (let i = 0; i < count - 1; i++) {
    const x0 = points[i * 2];
    const y0 = points[i * 2 + 1];
    const x1 = points[(i + 1) * 2];
    const y1 = points[(i + 1) * 2 + 1];

    // Use current point for missing neighbors at boundaries
    const xPrev = i > 0 ? points[(i - 1) * 2] : x0;
    const yPrev = i > 0 ? points[(i - 1) * 2 + 1] : y0;
    const xNext = i < count - 2 ? points[(i + 2) * 2] : x1;
    const yNext = i < count - 2 ? points[(i + 2) * 2 + 1] : y1;

    // Control points offset by scaled neighbor-to-neighbor vector
    const cp1x = x0 + k * (x1 - xPrev);
    const cp1y = y0 + k * (y1 - yPrev);
    const cp2x = x1 - k * (xNext - x0);
    const cp2y = y1 - k * (yNext - y0);

    path.cubicTo(cp1x, cp1y, cp2x, cp2y, x1, y1);
  }
}

// =============================================================================
// CATMULL-ROM SPLINE - Centripetal parameterization
// =============================================================================

/**
 * Centripetal Catmull-Rom spline interpolation.
 *
 * Uses centripetal parameterization (alpha = 0.5) which prevents cusps and
 * self-intersections that can occur with uniform Catmull-Rom. The tension
 * parameter controls the alpha value: tension=1 gives centripetal (alpha=0.5),
 * tension=0 degenerates to a cardinal-like spline.
 *
 * Reference: Yuksel, C., Schaefer, S., & Keyser, J. (2011).
 * "Parameterization and applications of Catmull-Rom curves."
 */
function buildCatmullRomPath(path: SkPath, points: Float32Array, count: number, tension: number): void {
  'worklet';

  const alpha = tension * 0.5;

  // When alpha ≈ 0, centripetal formula degenerates; use cardinal instead
  if (alpha < 1e-6) {
    buildCardinalPath(path, points, count, 1.0);
    return;
  }

  // Precompute chord lengths raised to power alpha and 2*alpha
  const L_a = new Float32Array(count - 1);
  const L_2a = new Float32Array(count - 1);

  for (let i = 0; i < count - 1; i++) {
    const dx = points[(i + 1) * 2] - points[i * 2];
    const dy = points[(i + 1) * 2 + 1] - points[i * 2 + 1];
    const chordSq = dx * dx + dy * dy;

    L_2a[i] = Math.pow(chordSq, alpha); // = chord^(2*alpha)
    L_a[i] = Math.sqrt(L_2a[i]); // = chord^alpha
  }

  path.moveTo(points[0], points[1]);

  for (let i = 0; i < count - 1; i++) {
    const x1 = points[i * 2];
    const y1 = points[i * 2 + 1];
    const x2 = points[(i + 1) * 2];
    const y2 = points[(i + 1) * 2 + 1];

    const l12_a = L_a[i];
    const l12_2a = L_2a[i];

    let cx1 = x1,
      cy1 = y1;
    let cx2 = x2,
      cy2 = y2;

    // Degenerate segment (coincident points): use linear
    if (l12_a < EPSILON) {
      path.lineTo(x2, y2);
      continue;
    }

    // First control point: uses P0, P1, P2
    if (i === 0) {
      // No P0 available: use simple 1/3 offset
      cx1 = x1 + (x2 - x1) / 3;
      cy1 = y1 + (y2 - y1) / 3;
    } else {
      const x0 = points[(i - 1) * 2];
      const y0 = points[(i - 1) * 2 + 1];
      const l01_a = L_a[i - 1];
      const l01_2a = L_2a[i - 1];

      if (l01_a > EPSILON) {
        const a = 2 * l01_2a + 3 * l01_a * l12_a + l12_2a;
        const n = 3 * l01_a * (l01_a + l12_a);
        cx1 = (x1 * a - x0 * l12_2a + x2 * l01_2a) / n;
        cy1 = (y1 * a - y0 * l12_2a + y2 * l01_2a) / n;
      }
    }

    // Second control point: uses P1, P2, P3
    if (i === count - 2) {
      // No P3 available: use simple 1/3 offset from end
      cx2 = x2 - (x2 - x1) / 3;
      cy2 = y2 - (y2 - y1) / 3;
    } else {
      const x3 = points[(i + 2) * 2];
      const y3 = points[(i + 2) * 2 + 1];
      const l23_a = L_a[i + 1];
      const l23_2a = L_2a[i + 1];

      if (l23_a > EPSILON) {
        const b = 2 * l23_2a + 3 * l23_a * l12_a + l12_2a;
        const m = 3 * l23_a * (l23_a + l12_a);
        cx2 = (x2 * b + x1 * l23_2a - x3 * l12_2a) / m;
        cy2 = (y2 * b + y1 * l23_2a - y3 * l12_2a) / m;
      }
    }

    path.cubicTo(cx1, cy1, cx2, cy2, x2, y2);
  }
}

// =============================================================================
// STEFFEN MONOTONE INTERPOLATION
// =============================================================================

/**
 * Steffen's slope formula for monotone interpolation.
 *
 * Computes a derivative that is guaranteed to preserve monotonicity by taking
 * a weighted harmonic-like mean of adjacent slopes, with sign checking.
 *
 * Reference: Steffen, M. (1990). "A simple method for monotonic interpolation
 * in one dimension." Astronomy and Astrophysics, 239, 443-450.
 */
function steffenSlope(s0: number, s1: number): number {
  'worklet';

  // Different signs or either zero: local extremum, use zero slope
  if (s0 * s1 <= 0) return 0;

  // Weighted average of slopes
  const p = (s0 + s1) / 2;

  // Clamp to minimum magnitude to ensure monotonicity
  return Math.sign(p) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p));
}

/**
 * Fritsch-Carlson boundary constraint for a single derivative.
 *
 * Ensures the endpoint derivative doesn't cause the curve to "hook" away
 * from the data trend.
 */
function constrainBoundarySlope(t: number, s: number): number {
  'worklet';

  // Flat segment: zero derivative
  if (Math.abs(s) < EPSILON) return 0;

  const alpha = t / s;

  // Derivative opposes slope: clamp to zero
  if (alpha < 0) return 0;

  // Derivative too steep: clamp to 3× slope
  if (alpha > 3) return 3 * s;

  return t;
}

/**
 * Steffen monotone interpolation.
 *
 * Directly computes monotonicity-preserving derivatives using Steffen's formula,
 * which combines slope averaging with magnitude limiting in a single step.
 */
function buildSteffenPath(path: SkPath, points: Float32Array, count: number, tension: number): void {
  'worklet';

  path.moveTo(points[0], points[1]);

  const [h, s] = computeSegmentProperties(points, count);

  // Compute Steffen derivatives
  const t = new Float32Array(count);

  // Interior points: Steffen formula
  for (let i = 1; i < count - 1; i++) {
    t[i] = steffenSlope(s[i - 1], s[i]);
  }

  // Boundary points: use segment slope with constraint
  if (count > 1) {
    t[0] = constrainBoundarySlope(s[0], s[0]);
    t[count - 1] = constrainBoundarySlope(s[count - 2], s[count - 2]);
  }

  // Build Bézier segments
  buildHermiteBezierSegments(path, points, h, s, t, count, tension);
}

// =============================================================================
// PCHIP (Piecewise Cubic Hermite Interpolating Polynomial)
// =============================================================================

/**
 * PCHIP interpolation - the classic Fritsch-Carlson monotone method.
 *
 * Computes derivatives using a weighted harmonic mean that accounts for
 * non-uniform spacing. Boundary derivatives use a shape-preserving one-sided
 * three-point formula.
 *
 * Reference: Fritsch, F. N., & Carlson, R. E. (1980). "Monotone piecewise
 * cubic interpolation." SIAM Journal on Numerical Analysis, 17(2), 238-246.
 */
function buildPCHIPPath(path: SkPath, points: Float32Array, count: number, tension: number): void {
  'worklet';

  path.moveTo(points[0], points[1]);

  if (count < 3) {
    if (count === 2) {
      path.lineTo(points[2], points[3]);
    }
    return;
  }

  const [h, delta] = computeSegmentProperties(points, count);

  // Compute PCHIP derivatives
  const d = new Float32Array(count);

  // Interior points: weighted harmonic mean
  for (let i = 1; i < count - 1; i++) {
    const d0 = delta[i - 1];
    const d1 = delta[i];

    // Sign change or zero: local extremum
    if (d0 * d1 <= 0) {
      d[i] = 0;
    } else {
      // Weighted harmonic mean accounting for segment lengths
      // This formula weights by the segment on the opposite side,
      // so shorter segments have more influence on their side
      const h0 = h[i - 1];
      const h1 = h[i];
      const w1 = 2 * h1 + h0;
      const w2 = h1 + 2 * h0;

      // Harmonic mean: (w1 + w2) / (w1/d0 + w2/d1)
      d[i] = (w1 + w2) / (w1 / d0 + w2 / d1);
    }
  }

  // Boundary points: one-sided three-point formula with shape constraint
  // Left boundary (i = 0)
  {
    const h0 = h[0];
    const h1 = h[1];
    const d0 = delta[0];
    const d1 = delta[1];

    // Three-point one-sided derivative estimate
    // This is the derivative of the quadratic passing through P0, P1, P2
    // evaluated at P0
    d[0] = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1);

    // Shape-preserving constraints:
    // 1. Must have same sign as first segment slope
    if (d[0] * d0 <= 0) {
      d[0] = 0;
    }
    // 2. If first two segments have opposite signs (P1 is an extremum),
    //    don't let the derivative exceed 3× the first segment slope
    else if (d0 * d1 < 0 && Math.abs(d[0]) > 3 * Math.abs(d0)) {
      d[0] = 3 * d0;
    }
  }

  // Right boundary (i = count - 1)
  {
    const hn1 = h[count - 2]; // Last segment
    const hn2 = h[count - 3]; // Second-to-last segment
    const dn1 = delta[count - 2];
    const dn2 = delta[count - 3];

    // Three-point one-sided derivative estimate at right endpoint
    d[count - 1] = ((2 * hn1 + hn2) * dn1 - hn1 * dn2) / (hn1 + hn2);

    // Shape-preserving constraints
    if (d[count - 1] * dn1 <= 0) {
      d[count - 1] = 0;
    } else if (dn1 * dn2 < 0 && Math.abs(d[count - 1]) > 3 * Math.abs(dn1)) {
      d[count - 1] = 3 * dn1;
    }
  }

  // Build Bézier segments
  buildHermiteBezierSegments(path, points, h, delta, d, count, tension);
}

// =============================================================================
// MAKIMA (MONOTONE-CONSTRAINED MODIFIED AKIMA)
// =============================================================================

/**
 * Computes extended delta array with boundary extrapolation for Makima.
 *
 * The Makima formula requires delta values at indices -2, -1, n-1, n relative
 * to the actual data. We use slope repetition at boundaries to prevent hooks.
 */
function computeExtendedDeltas(delta: Float32Array, count: number): Float32Array {
  'worklet';

  // We need indices 0..count+2 (accessed as extDelta[i+3] where i goes up to count-1)
  const extDelta = new Float32Array(count + 3);

  // Left boundary: repeat first slope
  extDelta[0] = delta[0]; // delta[-2]
  extDelta[1] = delta[0]; // delta[-1]

  // Copy actual deltas (offset by 2)
  // delta has count-1 elements (indices 0 to count-2)
  // These go into extDelta[2] to extDelta[count]
  for (let i = 0; i < count - 1; i++) {
    extDelta[i + 2] = delta[i];
  }

  // Right boundary: repeat last slope
  // extDelta[count] was already set to delta[count-2] in the loop above
  extDelta[count + 1] = delta[count - 2]; // delta[n]
  extDelta[count + 2] = delta[count - 2]; // delta[n+1] - needed for last point's i+3 access

  return extDelta;
}

/**
 * Computes Makima derivative at a point using weighted average of adjacent slopes.
 *
 * The Makima weights add a term |d_{i+1} + d_i|/2 to the standard Akima weights,
 * which prevents overshoot in flat regions by biasing toward zero when adjacent
 * slopes are nearly opposite.
 */
function computeMakimaDerivative(d_im2: number, d_im1: number, d_i: number, d_ip1: number): number {
  'worklet';

  // Makima weights (modified Akima)
  // w1 weights toward d_{i-1}, w2 weights toward d_i
  const w1 = Math.abs(d_ip1 - d_i) + Math.abs(d_ip1 + d_i) / 2;
  const w2 = Math.abs(d_im1 - d_im2) + Math.abs(d_im1 + d_im2) / 2;

  // Degenerate case: equal weights, use simple average
  if (Math.abs(w1 + w2) < EPSILON) {
    return (d_im1 + d_i) / 2;
  }

  return (w1 * d_im1 + w2 * d_i) / (w1 + w2);
}

/**
 * Modified Akima (Makima) interpolation.
 *
 * Computes derivatives using Makima's weighted average, which biases toward
 * flatter adjacent slopes. This reduces (but does not eliminate) overshoot
 * compared to classic Akima. Boundary constraints prevent endpoint hooks.
 *
 * Note: This is NOT a monotone method. For guaranteed monotonicity with
 * Makima-style tangents, use CAMS instead.
 */
function buildMakimaPath(path: SkPath, points: Float32Array, count: number, tension: number): void {
  'worklet';

  path.moveTo(points[0], points[1]);

  if (count < 3) {
    if (count === 2) {
      path.lineTo(points[2], points[3]);
    }
    return;
  }

  const [h, delta] = computeSegmentProperties(points, count);
  const extDelta = computeExtendedDeltas(delta, count);

  // Compute Makima derivatives
  const d = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    d[i] = computeMakimaDerivative(
      extDelta[i], // delta[i-2]
      extDelta[i + 1], // delta[i-1]
      extDelta[i + 2], // delta[i]
      extDelta[i + 3] // delta[i+1]
    );
  }

  // Apply boundary constraints ONLY (not interior points)
  // This preserves standard Makima behavior: smooth curves that may overshoot
  // in oscillatory regions, but won't hook at endpoints
  applyBoundaryConstraints(d, delta, count);

  // Build Bézier segments
  buildHermiteBezierSegments(path, points, h, delta, d, count, tension);
}

// =============================================================================
// CURVATURE-ADAPTIVE MONOTONE SPLINE (CAMS)
// =============================================================================

/**
 * Curvature-Adaptive Monotone Spline (CAMS).
 *
 * Essentially "monotone Makima": uses Makima-style weighted averaging to
 * compute aesthetically pleasing tangents, then applies Fritsch-Carlson
 * constraints to guarantee monotonicity.
 *
 * The difference from Makima: Makima only constrains endpoints, so it can
 * overshoot in oscillatory regions. CAMS constrains all points.
 */
function buildCAMSPath(path: SkPath, points: Float32Array, count: number, tension: number): void {
  'worklet';

  path.moveTo(points[0], points[1]);

  if (count < 3) {
    if (count === 2) {
      path.lineTo(points[2], points[3]);
    }
    return;
  }

  const [h, delta] = computeSegmentProperties(points, count);
  const extDelta = computeExtendedDeltas(delta, count);

  // 1. Compute unconstrained aesthetic tangents (Makima-style)
  const d_unconstrained = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    d_unconstrained[i] = computeMakimaDerivative(extDelta[i], extDelta[i + 1], extDelta[i + 2], extDelta[i + 3]);
  }

  // 2. Apply soft monotone constraints (separate pass)
  const d_constrained = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const d_unc = d_unconstrained[i];

    // Get adjacent segment slopes (use unconstrained derivative at boundaries)
    const sLeft = i > 0 ? delta[i - 1] : d_unc;
    const sRight = i < count - 1 ? delta[i] : d_unc;

    // Check for local extremum (slope sign change)
    const isExtremum = sLeft * sRight < 0;

    if (isExtremum) {
      // At extremum: zero tangent
      d_constrained[i] = 0;
    } else if (Math.abs(sLeft) < EPSILON && Math.abs(sRight) < EPSILON) {
      // Flat region: zero tangent
      d_constrained[i] = 0;
    } else {
      // Monotone region: apply Fritsch-Carlson bound
      const sMin = Math.min(Math.abs(sLeft), Math.abs(sRight));
      const maxAllowed = 3 * sMin;

      let d_result = d_unc;

      // If tangent opposes the slopes, clamp to zero
      if ((sLeft > 0 && sRight > 0 && d_unc < 0) || (sLeft < 0 && sRight < 0 && d_unc > 0)) {
        d_result = 0;
      }
      // If tangent magnitude exceeds monotone bound, scale it down
      else if (Math.abs(d_result) > maxAllowed) {
        d_result = Math.sign(d_result) * maxAllowed;
      }

      d_constrained[i] = d_result;
    }
  }

  // Apply boundary constraints
  applyBoundaryConstraints(d_constrained, delta, count);

  // Build Bézier segments
  buildHermiteBezierSegments(path, points, h, delta, d_constrained, count, tension);
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Builds a smoothed path using the specified algorithm.
 *
 * @param path - Skia path object to build into (should be empty)
 * @param points - Interleaved x,y coordinates as Float32Array [x0, y0, x1, y1, ...]
 * @param count - Number of points (not array length)
 * @param smoothing - Interpolation algorithm to use
 * @param tension - Curve tightness: 0 = linear, 1 = full smoothing
 */
export function buildSmoothedPath(path: SkPath, points: Float32Array, count: number, smoothing: LineSmoothing, tension: number): void {
  'worklet';

  // Edge cases
  if (count < 1) return;

  if (count === 1) {
    path.moveTo(points[0], points[1]);
    return;
  }

  if (count === 2) {
    path.moveTo(points[0], points[1]);
    path.lineTo(points[2], points[3]);
    return;
  }

  // Normalize and check tension
  const normalizedTension = Math.max(0, Math.min(1, tension));
  if (normalizedTension <= 0) {
    buildLinearPath(path, points, count);
    return;
  }

  // Dispatch to algorithm
  switch (smoothing) {
    case LineSmoothing.CAMS:
      buildCAMSPath(path, points, count, normalizedTension);
      break;
    case LineSmoothing.Cardinal:
      buildCardinalPath(path, points, count, normalizedTension);
      break;
    case LineSmoothing.CatmullRom:
      buildCatmullRomPath(path, points, count, normalizedTension);
      break;
    case LineSmoothing.Linear:
      buildLinearPath(path, points, count);
      break;
    case LineSmoothing.Makima:
      buildMakimaPath(path, points, count, normalizedTension);
      break;
    case LineSmoothing.MonotoneX:
      buildSteffenPath(path, points, count, normalizedTension);
      break;
    case LineSmoothing.PCHIP:
      buildPCHIPPath(path, points, count, normalizedTension);
      break;
  }
}

/**
 * Builds a smoothed path with animation interpolation.
 *
 * Linearly interpolates between previous and target point arrays based on
 * progress, then applies the smoothing algorithm. This is useful for animating
 * transitions between data states.
 *
 * @param path - Skia path object to build into
 * @param prev - Previous state point array
 * @param target - Target state point array
 * @param progress - Animation progress: 0 = prev, 1 = target
 * @param count - Number of points
 * @param smoothing - Interpolation algorithm to use
 * @param tension - Curve tightness
 */
export function buildSmoothedPathAnimated(
  path: SkPath,
  prev: Float32Array,
  target: Float32Array,
  progress: number,
  count: number,
  smoothing: LineSmoothing,
  tension: number
): void {
  'worklet';

  if (count < 1) return;

  // Clamp progress to [0, 1]
  const t = progress <= 0 ? 0 : progress >= 1 ? 1 : progress;

  // Interpolate points
  const points = new Float32Array(count * 2);
  for (let i = 0; i < count * 2; i++) {
    points[i] = prev[i] + (target[i] - prev[i]) * t;
  }

  buildSmoothedPath(path, points, count, smoothing, tension);
}
