import { globalStyle } from '@vanilla-extract/css';
import { colorModeVars } from '../system/colorModes.css';

globalStyle('*', {
  boxSizing: 'border-box',
  margin: 0,
});

globalStyle('html, body', {
  backgroundColor: colorModeVars.backgroundColors['body (Deprecated)'],
  color: colorModeVars.foregroundColors['primary (Deprecated)'],
  fontFamily: "'SFRounded', ui-rounded, 'SF Pro Rounded', system-ui, 'Helvetica Neue', Arial, Helvetica, sans-serif",
  margin: 0,
  MozOsxFontSmoothing: 'grayscale',
  padding: 0,
  textRendering: 'optimizeLegibility',
  WebkitFontSmoothing: 'antialiased',
  WebkitTextSizeAdjust: '100%',
});

globalStyle('body', {
  '@media': {
    'screen and (max-width: 768px)': {
      padding: '0 1rem',
    },
  },
});

globalStyle('button', {
  background: 'none',
  border: 'none',
  color: 'inherit',
  cursor: 'pointer',
  font: 'inherit',
  outline: 'none',
  padding: 0,
});

globalStyle('a', {
  color: 'inherit',
  textDecoration: 'none',
});

globalStyle('code', {
  fontFamily: "'Fira Mono', monospace",
});
