import networkInfo from "./networkInfo";

export const NETWORK_MENU_ACTION_KEY_FILTER = 'switch-to-network-'

export const networksMenuItems = isDarkMode =>
  Object.values(networkInfo)
    .filter(({ disabled }) => !disabled)
    .map(netInfo => ({
      actionKey: `${NETWORK_MENU_ACTION_KEY_FILTER}${netInfo.value}`,
      actionTitle: netInfo.name,
      icon: {
        iconType: 'ASSET',
        iconValue: `${netInfo.layer2 ? netInfo.value : 'ethereum'}Badge${
          isDarkMode ? 'Dark' : ''
        }`,
      },
    }));

export const changeConnectionMenuItems = isDarkMode => [
    {
      actionKey: 'disconnect',
      actionTitle: 'Disconnect',
    },
    {
      actionKey: 'switch-account',
      actionTitle: 'Switch Account',
    },
    {
      menuItems: networksMenuItems(isDarkMode),
      menuTitle: 'Switch Network',
    },
  ];