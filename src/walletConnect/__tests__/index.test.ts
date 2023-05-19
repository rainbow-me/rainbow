import { jest, test } from '@jest/globals';

jest.mock('@walletconnect/core');

jest.mock('@/redux/store');
jest.mock('@/redux/walletconnect');
jest.mock('@/redux/requests');
jest.mock('@/navigation/Navigation');
jest.mock('@/handlers/imgix');
jest.mock('@/utils/ethereumUtils');
jest.mock('@/parsers/requests');
jest.mock('@/handlers/localstorage/walletconnectRequests');
jest.mock('@/handlers/appEvents');
jest.mock('@/notifications/tokens');
jest.mock('@/model/wallet');
jest.mock('@/handlers/web3');
jest.mock('@/screens/Portal');
jest.mock('@/walletConnect/sheets/AuthRequest', () => ({
  AuthRequest: jest.fn(),
}));

// import { parseRPCParams } from '@/walletConnect';
// import { RPCMethod } from '@/walletConnect/types';

test(`works`, () => {});
