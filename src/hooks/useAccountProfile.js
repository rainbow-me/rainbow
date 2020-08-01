import { captureMessage } from '@sentry/react-native';
import GraphemeSplitter from 'grapheme-splitter';
import { get, toUpper } from 'lodash';
import { removeFirstEmojiFromString } from '../helpers/emojiHandler';
import { address } from '../utils/abbreviations';
import useAccountSettings from './useAccountSettings';
import useWallets from './useWallets';
import logger from 'logger';

export default function useAccountProfile() {
  const wallets = useWallets();
  const { selectedWallet, walletNames } = wallets;

  const settings = useAccountSettings();
  const { accountAddress } = settings;

  if (!selectedWallet) {
    logger.sentry('redux settings', settings);
    logger.sentry('redux wallets', wallets);
    captureMessage('DEADBEEF - no selectedWallet');
    return {};
  }

  if (!accountAddress) {
    logger.sentry('redux settings', settings);
    logger.sentry('redux wallets', wallets);
    captureMessage('DEADBEEF - no accountAddress');
    return {};
  }

  if (!selectedWallet?.addresses?.length) {
    logger.sentry('redux settings', settings);
    logger.sentry('redux wallets', wallets);
    captureMessage('DEADBEEF - no addresses');
    return {};
  }

  const accountENS = get(walletNames, `${accountAddress}`);

  const selectedAccount = selectedWallet.addresses.find(
    account => account.address === accountAddress
  );

  if (!selectedAccount) {
    logger.sentry('redux settings', settings);
    logger.sentry('redux wallets', wallets);
    captureMessage('DEADBEEF - no selectedAccount');
    return {};
  }

  const { label, color, index } = selectedAccount;

  const accountName = removeFirstEmojiFromString(
    label || accountENS || address(accountAddress, 6, 4)
  ).join('');

  const labelOrAccountName =
    accountName === label ? toUpper(accountName) : label;
  const accountSymbol = new GraphemeSplitter().splitGraphemes(
    labelOrAccountName || toUpper(accountENS) || `${index + 1}`
  )[0];
  const accountColor = color;

  return {
    accountAddress,
    accountColor,
    accountENS,
    accountName,
    accountSymbol,
  };
}
