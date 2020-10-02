const DisplayDappNames = Object.freeze({
  '88mph - Earn Upfront Fixed-Rate Interest': '88mph',
  'Aave - Open Source Protocol for Money markets': 'Aave',
  'Pool - PoolTogether - App': 'PoolTogether',
});

export const convertDappNameToDisplay = name => {
  return DisplayDappNames[name] || name;
};
