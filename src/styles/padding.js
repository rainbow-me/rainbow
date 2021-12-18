import buildLayoutStyles from './buildLayoutStyles';

export default function padding(...options) {
  return buildLayoutStyles(options, 'padding', true);
}

padding.object = (...options) => {
  return buildLayoutStyles.object(options, 'padding');
};
