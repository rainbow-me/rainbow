import AppEth from '@ledgerhq/hw-app-eth';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';

export const getEthApp = async (deviceId: string) => {
  const transport = await TransportBLE.open(deviceId);
  const eth = new AppEth(transport);
  return eth;
};
