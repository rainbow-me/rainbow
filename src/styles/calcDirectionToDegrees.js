export default ({ direction }) => {
  if (direction === 'down') return '90';
  else if (direction === 'left') return '180';
  else if (direction === 'up') return '270';
  return '0';
};
