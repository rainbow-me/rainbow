const DisplayDappNames = Object.freeze({
  '88mph - Earn Upfront Fixed-Rate Interest': '88mph',
  'Pool - PoolTogether - App': 'PoolTogether',
});

export const convertDappNameToDisplay = name => {
  return DisplayDappNames[name] || name;
};
