import { showLogSheet } from '@/components/debugging/LogSheet';
import { userAssetsStore } from '@/state/assets/userAssets';

function getRelativeTime(date: string | number | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffSec = diffMs / 1000;
  const diffMin = diffSec / 60;
  const diffHour = diffMin / 60;
  const diffDay = diffHour / 24;

  if (diffSec < 60) return `${diffSec.toFixed(2)} second${diffSec.toFixed(2) !== '1.00' ? 's' : ''} ago`;
  if (diffMin < 60) return `${diffMin.toFixed(2)} minute${diffMin.toFixed(2) !== '1.00' ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour.toFixed(2)} hour${diffHour.toFixed(2) !== '1.00' ? 's' : ''} ago`;
  return `${diffDay.toFixed(2)} day${diffDay.toFixed(2) !== '1.00' ? 's' : ''} ago`;
}

export function analyzeUserAssets() {
  const userAssetsLastFetchedAt = userAssetsStore.getState().lastFetchedAt;
  const userAssetsQueryKey = userAssetsStore.getState().queryKey;

  const lastFetchedData = {
    title: 'Last Fetched At',
    message: userAssetsLastFetchedAt
      ? `${new Date(userAssetsLastFetchedAt).toLocaleString()}\n${getRelativeTime(userAssetsLastFetchedAt)}`
      : 'N/A',
  };
  const queryKeyData = {
    title: 'Query Key',
    message: userAssetsQueryKey,
  };

  const topAssets = userAssetsStore.getState().getUserAssets().slice(0, 20);
  const topAssetsMessage = topAssets
    .map(asset => {
      const updatedAt = asset.updatedAt ? new Date(asset.updatedAt).toLocaleString() : 'N/A';
      const timeAgo = asset.updatedAt ? getRelativeTime(asset.updatedAt) : 'N/A';
      return `${asset.name} (${asset.chainName}) \nBalance: ${asset.balance.amount}\nUpdated At: ${updatedAt}\n${timeAgo}\n`;
    })
    .join('\n');

  const topAssetsData = {
    title: 'Top 20 Assets',
    message: topAssetsMessage,
  };

  showLogSheet({
    data: [lastFetchedData, queryKeyData, topAssetsData],
  });
}
