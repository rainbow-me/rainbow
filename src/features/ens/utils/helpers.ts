import { formatsByName } from '@ensdomains/address-encoder';
import { atom } from 'recoil';
import { formatUnits } from 'viem';

import { type InlineFieldProps } from '@/components/inputs/InlineField';
import { convertAmountAndPriceToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { gweiToWei } from '@/features/gas/core/gasParams';
import { add, divide, fromWei, multiply } from '@/helpers/utilities';
import * as i18n from '@/languages';
import { colors } from '@/styles';

import { encodeContenthash } from '../core/contenthash';
import { ENS_MIN_COMMITMENT_AGE } from '../core/contracts';
import { ENS_RECORDS } from '../core/records';
import { ENS_PAYMENT_TOKEN } from '../data/registration';

export const ENS_SECONDS_PADDING = 5;
export const ENS_SECONDS_WAIT_WITH_PADDING = ENS_MIN_COMMITMENT_AGE + ENS_SECONDS_PADDING;
export const ENS_SECONDS_WAIT_PROVIDER_PADDING = ENS_MIN_COMMITMENT_AGE + 4 * ENS_SECONDS_PADDING;

export type TextRecordField = {
  id: string;
  key: ENS_RECORDS;
  label: InlineFieldProps['label'];
  placeholder: InlineFieldProps['placeholder'];
  inputProps?: InlineFieldProps['inputProps'];
  validation?: {
    validator: (value: string) => boolean;
    message: string;
  };
  startsWith?: string;
};

export const textRecordFields = {
  [ENS_RECORDS.name]: {
    id: 'name',
    inputProps: {
      maxLength: 50,
    },
    key: ENS_RECORDS.name,
    get label() {
      return i18n.t(i18n.l.profiles.create.name);
    },
    get placeholder() {
      return i18n.t(i18n.l.profiles.create.name_placeholder);
    },
  },
  [ENS_RECORDS.description]: {
    id: 'bio',
    inputProps: {
      maxLength: 160,
      multiline: true,
    },
    key: ENS_RECORDS.description,
    get label() {
      return i18n.t(i18n.l.profiles.create.bio);
    },
    get placeholder() {
      return i18n.t(i18n.l.profiles.create.bio_placeholder);
    },
  },
  [ENS_RECORDS.url]: {
    id: 'website',
    inputProps: {
      keyboardType: 'url',
      maxLength: 100,
    },
    key: ENS_RECORDS.url,
    get label() {
      return i18n.t(i18n.l.profiles.create.website);
    },
    get placeholder() {
      return i18n.t(i18n.l.profiles.create.website_placeholder);
    },
    validation: {
      get message() {
        return i18n.t(i18n.l.profiles.create.invalid_website);
      },
      validator: value => /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/.test(value),
    },
  },
  [ENS_RECORDS.twitter]: {
    id: 'twitter',
    inputProps: {
      maxLength: 16,
    },
    key: ENS_RECORDS.twitter,
    get label() {
      return i18n.t(i18n.l.profiles.create.twitter);
    },
    get placeholder() {
      return i18n.t(i18n.l.profiles.create.username_placeholder);
    },
    startsWith: '@',
    validation: {
      get message() {
        return i18n.t(i18n.l.profiles.create.invalid_username, {
          app: i18n.t(i18n.l.profiles.create.twitter),
        });
      },
      validator: value => /^\w*$/.test(value),
    },
  },
  [ENS_RECORDS.email]: {
    id: 'email',
    inputProps: {
      keyboardType: 'email-address',
      maxLength: 50,
    },
    key: ENS_RECORDS.email,
    get label() {
      return i18n.t(i18n.l.profiles.create.email);
    },
    get placeholder() {
      return i18n.t(i18n.l.profiles.create.email_placeholder);
    },
    validation: {
      get message() {
        return i18n.t(i18n.l.profiles.create.invalid_email);
      },
      validator: value => /^\S+@\S+\.\S+$/.test(value),
    },
  },
  [ENS_RECORDS.instagram]: {
    id: 'instagram',
    inputProps: {
      maxLength: 30,
    },
    key: ENS_RECORDS.instagram,
    get label() {
      return i18n.t(i18n.l.profiles.create.instagram);
    },
    get placeholder() {
      return i18n.t(i18n.l.profiles.create.username_placeholder);
    },
    startsWith: '@',
    validation: {
      get message() {
        return i18n.t(i18n.l.profiles.create.invalid_username, {
          app: i18n.t(i18n.l.profiles.create.instagram),
        });
      },
      validator: value => /^([\w.])*$/.test(value),
    },
  },
  [ENS_RECORDS.discord]: {
    id: 'discord',
    inputProps: {
      maxLength: 50,
    },
    key: ENS_RECORDS.discord,
    get label() {
      return i18n.t(i18n.l.profiles.create.discord);
    },
    get placeholder() {
      return i18n.t(i18n.l.profiles.create.username_placeholder);
    },
    startsWith: '@',
    validation: {
      get message() {
        return i18n.t(i18n.l.profiles.create.invalid_username, {
          app: i18n.t(i18n.l.profiles.create.discord),
        });
      },
      validator: value => /^(\w)+#[0-9]{4}$/.test(value),
    },
  },
  [ENS_RECORDS.github]: {
    id: 'github',
    inputProps: {
      maxLength: 20,
    },
    key: ENS_RECORDS.github,
    get label() {
      return i18n.t(i18n.l.profiles.create.github);
    },
    get placeholder() {
      return i18n.t(i18n.l.profiles.create.username_placeholder);
    },
    startsWith: '@',
    validation: {
      get message() {
        return i18n.t(i18n.l.profiles.create.invalid_username, {
          app: i18n.t(i18n.l.profiles.create.github),
        });
      },
      validator: value => /^([\w.-])*$/.test(value),
    },
  },
  [ENS_RECORDS.BTC]: {
    id: 'btc',
    inputProps: {
      maxLength: 42,
      multiline: true,
    },
    key: ENS_RECORDS.BTC,
    get label() {
      return i18n.t(i18n.l.profiles.create.btc);
    },
    get placeholder() {
      return i18n.t(i18n.l.profiles.create.wallet_placeholder, {
        coin: i18n.t(i18n.l.profiles.create.btc),
      });
    },
    validation: {
      get message() {
        return i18n.t(i18n.l.profiles.create.invalid_asset, {
          coin: ENS_RECORDS.BTC,
        });
      },
      validator: value => validateCoinRecordValue(value, ENS_RECORDS.BTC),
    },
  },
  [ENS_RECORDS.snapchat]: {
    id: 'snapchat',
    inputProps: {
      maxLength: 16,
    },
    key: ENS_RECORDS.snapchat,
    get label() {
      return i18n.t(i18n.l.profiles.create.snapchat);
    },
    get placeholder() {
      return i18n.t(i18n.l.profiles.create.username_placeholder);
    },
    startsWith: '@',
    validation: {
      get message() {
        return i18n.t(i18n.l.profiles.create.invalid_username, {
          app: i18n.t(i18n.l.profiles.create.snapchat),
        });
      },
      validator: value => /^([\w.])*$/.test(value),
    },
  },
  [ENS_RECORDS.telegram]: {
    id: 'telegram',
    inputProps: {
      maxLength: 30,
    },
    key: ENS_RECORDS.telegram,
    get label() {
      return i18n.t(i18n.l.profiles.create.telegram);
    },
    get placeholder() {
      return i18n.t(i18n.l.profiles.create.username_placeholder);
    },
    startsWith: '@',
    validation: {
      get message() {
        return i18n.t(i18n.l.profiles.create.invalid_username, {
          app: i18n.t(i18n.l.profiles.create.telegram),
        });
      },
      validator: value => /^([\w#.])*$/.test(value),
    },
  },
  [ENS_RECORDS.reddit]: {
    id: 'reddit',
    inputProps: {
      maxLength: 30,
    },
    key: ENS_RECORDS.reddit,
    get label() {
      return i18n.t(i18n.l.profiles.create.reddit);
    },
    get placeholder() {
      return i18n.t(i18n.l.profiles.create.username_placeholder);
    },
    startsWith: '@',
    validation: {
      get message() {
        return i18n.t(i18n.l.profiles.create.invalid_username, {
          app: i18n.t(i18n.l.profiles.create.reddit),
        });
      },
      validator: value => /^([\w#.])*$/.test(value),
    },
  },
  [ENS_RECORDS.notice]: {
    id: 'notice',
    inputProps: {
      maxLength: 100,
    },
    key: ENS_RECORDS.notice,
    get label() {
      return i18n.t(i18n.l.profiles.create.notice);
    },
    get placeholder() {
      return i18n.t(i18n.l.profiles.create.notice_placeholder);
    },
  },
  [ENS_RECORDS.keywords]: {
    id: 'keywords',
    inputProps: {
      maxLength: 100,
    },
    key: ENS_RECORDS.keywords,
    get label() {
      return i18n.t(i18n.l.profiles.create.keywords);
    },
    get placeholder() {
      return i18n.t(i18n.l.profiles.create.keywords_placeholder);
    },
  },
  [ENS_RECORDS.LTC]: {
    id: 'ltc',
    inputProps: {
      maxLength: 64,
    },
    key: ENS_RECORDS.LTC,
    get label() {
      return i18n.t(i18n.l.profiles.create.ltc);
    },
    get placeholder() {
      return i18n.t(i18n.l.profiles.create.wallet_placeholder, {
        coin: i18n.t(i18n.l.profiles.create.ltc),
      });
    },
    validation: {
      get message() {
        return i18n.t(i18n.l.profiles.create.invalid_asset, {
          coin: ENS_RECORDS.LTC,
        });
      },
      validator: value => validateCoinRecordValue(value, ENS_RECORDS.LTC),
    },
  },
  [ENS_RECORDS.DOGE]: {
    id: 'doge',
    inputProps: {
      maxLength: 34,
    },
    key: ENS_RECORDS.DOGE,
    get label() {
      return i18n.t(i18n.l.profiles.create.doge);
    },
    get placeholder() {
      return i18n.t(i18n.l.profiles.create.wallet_placeholder, {
        coin: i18n.t(i18n.l.profiles.create.doge),
      });
    },
    validation: {
      get message() {
        return i18n.t(i18n.l.profiles.create.invalid_asset, {
          coin: ENS_RECORDS.DOGE,
        });
      },
      validator: value => validateCoinRecordValue(value, ENS_RECORDS.DOGE),
    },
  },
  [ENS_RECORDS.contenthash]: {
    id: 'contenthash',
    inputProps: {},
    key: ENS_RECORDS.contenthash,
    get label() {
      return i18n.t(i18n.l.profiles.create.content);
    },
    get placeholder() {
      return i18n.t(i18n.l.profiles.create.content_placeholder);
    },
    validation: {
      get message() {
        return i18n.t(i18n.l.profiles.create.invalid_content_hash);
      },
      validator: value => encodeContenthash(value) !== null,
    },
  },
} as {
  [key in ENS_RECORDS]?: TextRecordField;
};

export const ENS_DOMAIN = '.eth';

const formatEstimatedNetworkFee = (
  gasLimit: string,
  maxBaseFee: string,
  maxPriorityFee: string,
  nativeCurrency: any,
  nativeAssetPrice: any
) => {
  const networkFeeInWei = multiply(gweiToWei(add(maxBaseFee, maxPriorityFee)), gasLimit);
  const networkFeeInEth = fromWei(networkFeeInWei);

  const { amount, display } = convertAmountAndPriceToNativeDisplay(networkFeeInEth, nativeAssetPrice, nativeCurrency);

  return {
    amount,
    display,
    wei: networkFeeInWei,
  };
};

const validateCoinRecordValue = (value: string, coin: string) => {
  try {
    formatsByName[coin].decoder(value);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Formats the registrar's USDC quote without treating token units as wei.
 */
export function formatRentPrice(rawAmount: string, duration: number) {
  const amount = formatUnits(BigInt(rawAmount), ENS_PAYMENT_TOKEN.decimals);
  return {
    amount,
    perYear: { display: `${divide(amount, duration)} ${ENS_PAYMENT_TOKEN.symbol}` },
    total: { display: `${amount} ${ENS_PAYMENT_TOKEN.symbol}` },
  };
}

const accentColorAtom = atom({
  default: colors.purple,
  key: 'ens.accentColor',
});

export { formatEstimatedNetworkFee, accentColorAtom };
