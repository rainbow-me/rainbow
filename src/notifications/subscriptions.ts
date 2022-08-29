import messaging from '@react-native-firebase/messaging';
import { TRANSACTION_TOPICS } from './constants';

export const subscribeToTransactionTopics = async (
  type: string,
  chainId: number,
  address: string
) => {
  TRANSACTION_TOPICS.forEach(topic => {
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
  TRANSACTION_TOPICS.forEach(topic => {
    messaging().unsubscribeFromTopic(
      `${type}_${chainId}_${address.toLowerCase()}_${topic}`
    );
  });
};
