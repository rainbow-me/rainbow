// // import { keyframes } from 'styled-components/primitives';

// const appendMsUnit = value => (
//   (typeof value === 'number')
//     ? `${value}ms`
//     : value
// );

// const handleNumberValues = animationValue => (
//   (typeof animationValue === 'number')
//     ? appendMsUnit(animationValue)
//     : animationValue
// );

// const parseAnimationValue = (animationValue) => {
//   if (!animationValue) return null;

//   return Array.isArray(animationValue)
//     ? animationValue.map(value => handleNumberValues(value)).join(', ')
//     : handleNumberValues(animationValue);
// };

const animations = {};

// animations.ease = {
//   inOutBack: 'cubic-bezier(0.680, -0.550, 0.265, 1.550)',
//   inOutCirc: 'cubic-bezier(0.785, 0.135, 0.150, 0.860)',
//   inOutExpo: 'cubic-bezier(1.000, 0.000, 0.000, 1.000)',
//   inOutSine: 'cubic-bezier(0.445, 0.050, 0.550, 0.950)',
//   inOutQuint: 'cubic-bezier(0.860, 0.000, 0.070, 1.000)',
//   inOutQuart: 'cubic-bezier(0.770, 0.000, 0.175, 1.000)',
//   inOutCubic: 'cubic-bezier(0.645, 0.045, fta0.355, 1.000)',
//   inOutQuad: 'cubic-bezier(0.455, 0.030, 0.515, 0.955)',
//   outBack: 'cubic-bezier(0.175, 0.885, 0.320, 1.275)',
//   outCirc: 'cubic-bezier(0.075, 0.820, 0.165, 1.000)',
//   outExpo: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
//   outSine: 'cubic-bezier(0.390, 0.575, 0.565, 1.000)',
//   outQuint: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
//   outQuart: 'cubic-bezier(0.165, 0.840, 0.440, 1.000)',
//   outCubic: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
//   outQuad: 'cubic-bezier(0.250, 0.460, 0.450, 0.940)',
//   inBack: 'cubic-bezier(0.600, -0.280, 0.735, 0.045)',
//   inCirc: 'cubic-bezier(0.600, 0.040, 0.980, 0.335)',
//   inExpo: 'cubic-bezier(0.950, 0.050, 0.795, 0.035)',
//   inSine: 'cubic-bezier(0.470, 0.000, 0.745, 0.715)',
//   inQuint: 'cubic-bezier(0.755, 0.050, 0.855, 0.060)',
//   inQuart: 'cubic-bezier(0.895, 0.030, 0.685, 0.220)',
//   inCubic: 'cubic-bezier(0.550, 0.055, 0.675, 0.190)',
//   inQuad: 'cubic-bezier(0.550, 0.085, 0.680, 0.530)',
// };

// // animations.fadeIn = keyframes`
// //   from { opacity: 0 }
// //   to { opacity: 1 }
// // `;

// animations.build = ({
//   delay,
//   direction,
//   duration = 200,
//   ease = 'ease-out',
//   fillMode = 'forwards',
//   iterationCount = 1,
//   name = animations.fadeIn,
// }) => (`
//   animation-delay: ${parseAnimationValue(delay)};
//   animation-direction: ${direction};
//   animation-duration: ${parseAnimationValue(duration)};
//   animation-fill-mode: ${fillMode};
//   animation-iteration-count: ${iterationCount};
//   animation-name: ${name};
//   animation-timing-function: ${parseAnimationValue(ease)};
// `);

// // animations.spin = keyframes`
// //   from { transform: rotate(0deg) }
// //   to { transform: rotate(360deg) }
// // `;

export default animations;
