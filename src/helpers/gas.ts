export const getTrendKey = (trend: number) => {
  if (trend < -0.25) {
    return 'falling';
  } else if (trend >= -0.25 && trend <= 0.25) {
    return 'stable';
  } else if (trend > 0.25 && trend <= 0.6) {
    return 'rising';
  } else if (trend > 0.6) {
    return 'surging';
  }
};
