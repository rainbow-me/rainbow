// Mock data is based on schema provided by Alexey
import { MOCK_REWARDS_DATA } from '@/screens/rewards/mocks/constants';

export async function getMockData() {
  await new Promise(resolve => setTimeout(resolve, 1000));

  return MOCK_REWARDS_DATA;
}
