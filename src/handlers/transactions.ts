import { FlashbotsStatus, RainbowTransaction, TransactionStatus } from '@/entities';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { logger, RainbowError } from '@/logger';

const flashbotsApi = new RainbowFetchClient({
  baseURL: 'https://protect.flashbots.net',
});

export const getTransactionFlashbotStatus = async (
  transaction: RainbowTransaction,
  txHash: string
): Promise<{
  flashbotsStatus: FlashbotsStatus;
  status: 'failed';
  minedAt: number;
  title: string;
} | null> => {
  try {
    const fbStatus = await flashbotsApi.get<{ status: FlashbotsStatus }>(`/tx/${txHash}`);
    const flashbotsStatus = fbStatus.data.status;
    // Make sure it wasn't dropped after 25 blocks or never made it
    if (
      flashbotsStatus === FlashbotsStatus.FAILED ||
      flashbotsStatus === FlashbotsStatus.CANCELLED ||
      flashbotsStatus === FlashbotsStatus.UNKNOWN
    ) {
      const status = TransactionStatus.failed;
      const minedAt = Math.floor(Date.now() / 1000);
      const title = `${transaction.type}.${status}`;
      return { flashbotsStatus, status, minedAt, title };
    }
  } catch (e) {
    logger.error(new RainbowError('[getTransactionFlashbotStatus]: Failed to get flashbots status'), {
      error: e,
      transaction,
      txHash,
    });
  }
  return null;
};
