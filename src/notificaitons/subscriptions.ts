import messaging from '@react-native-firebase/messaging';
import { transactionTopics } from './constants';

export const subscribeToTransactionTopics = async (
  type: string,
  chainId: number,
  address: string
) => {
  transactionTopics.forEach(topic => {
    global.console.log(
      `Subscribed to ${type}_${chainId}_${address.toLowerCase()}_${topic}`
    );
    messaging().subscribeToTopic(
      `${type}_${chainId}_${address.toLowerCase()}_${topic}`
    );
  });
};

export const unsubscribeFromTransactionTopics = async (
  type: string,
  chainId: number,
  address: string
) => {
  transactionTopics.forEach(topic => {
    global.console.log(
      `Unsubscribed from ${type}_${chainId}_${address.toLowerCase()}_${topic}`
    );
    messaging().unsubscribeFromTopic(
      `${type}_${chainId}_${address.toLowerCase()}_${topic}`
    );
  });
};
