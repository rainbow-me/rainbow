// Mock data is based on schema provided by Alexey
import { MOCK_OP_REWARDS_DATA } from '@/screens/op-rewards/mocks/constants';

export async function getMockOpData() {
  await new Promise(resolve => setTimeout(resolve, 5000));

  return MOCK_OP_REWARDS_DATA;
}
