import buildLayoutStyles from './buildLayoutStyles';

export default function margin(...options) {
  return buildLayoutStyles(options, 'margin', true);
}

margin.object = (...options) => {
  return buildLayoutStyles.object(options, 'margin');
};
