import { greaterThan } from '../../helpers/utilities';
import { getAllowance } from '../contract';

const accountAddress = '0x1492004547FF0eFd778CC2c14E794B26B4701105';

test('getAllowanceZrx', async () => {
  const exchangeAddress = '0xaE76c84C9262Cdb9abc0C2c8888e62Db8E22A0bF';
  const tokenAddress = '0xe41d2489571d322189246dafa5ebde1f4699f498';
  const allowance = await getAllowance(accountAddress, tokenAddress, exchangeAddress);
  const result = greaterThan(allowance, 0);
  expect(result).toBeTruthy();
});

test('getAllowanceMkr', async () => {
  const exchangeAddress = '0x2C4Bd064b998838076fa341A83d007FC2FA50957';
  const tokenAddress = '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2';
  const allowance = await getAllowance(accountAddress, tokenAddress, exchangeAddress);
  const result = greaterThan(allowance, 0);
  expect(result).toBeTruthy();
});

test('getAllowanceBatNotApproved', async () => {
  const exchangeAddress = '0x2E642b8D59B45a1D8c5aEf716A84FF44ea665914';
  const tokenAddress = '0x0d8775f648430679a709e98d2b0cb6250d2887ef';
  const allowance = await getAllowance(accountAddress, tokenAddress, exchangeAddress);
  const result = greaterThan(allowance, 0);
  expect(result).toBeFalsy();
});

