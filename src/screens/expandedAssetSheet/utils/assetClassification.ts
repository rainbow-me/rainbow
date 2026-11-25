import { type ChainId } from '@/features/network/types/backendNetworks';
import { AssetClass, type TokenAsset } from '@/graphql/__generated__/metadata';
import * as i18n from '@/languages';

export type AssetClassificationInput = Pick<TokenAsset, 'assetClass'> & {
  issuer?: { name: string; iconUrl: string } | null;
  underlyingAsset?: { name: string; ticker: string; iconUrl: string } | null;
};

type TokenInfo = {
  name: string;
  symbol: string;
  chainId: ChainId;
  chainLabel: string | undefined;
};

export type AboutRowIcon = { type: 'image'; url: string } | { type: 'chain'; chainId: ChainId };

export type AboutRow = {
  key: 'asset_type' | 'underlying_asset' | 'issuer' | 'onchain_ticker' | 'offchain_ticker' | 'blockchain';
  title: string;
  value: string;
  icon: string;
  valueIcon?: AboutRowIcon;
};

export type InfoTextPart = { text: string; emphasized: boolean };

export type AssetClassification = {
  label: string;
  rows: AboutRow[];
  infoText: InfoTextPart[] | undefined;
};

const PLACEHOLDER = /%\{(\w+)\}/g;

/**
 * Translates `keypath` and splits it at its placeholders, so the filled-in values can be styled apart from the copy.
 * Returns undefined when any placeholder has no value.
 */
function translateParts(keypath: string, values: Record<string, string | undefined>): InfoTextPart[] | undefined {
  if (Object.values(values).some(value => !value)) return undefined;

  const template = i18n.t(keypath, Object.fromEntries(Object.keys(values).map(name => [name, `%{${name}}`])));
  const parts: InfoTextPart[] = [];
  let cursor = 0;
  for (const match of template.matchAll(PLACEHOLDER)) {
    const value = values[match[1]];
    if (!value) return undefined;
    if (match.index > cursor) parts.push({ text: template.slice(cursor, match.index), emphasized: false });
    parts.push({ text: value, emphasized: true });
    cursor = match.index + match[0].length;
  }
  if (cursor < template.length) parts.push({ text: template.slice(cursor), emphasized: false });
  return parts;
}

/** "US Dollar" → "1 US dollar": the currency unit is a common noun, any qualifier before it keeps its case. */
function formatPeg(currencyName: string): string {
  const words = currencyName.split(' ');
  const unit = words[words.length - 1];
  if (/^[A-Z][a-z]+$/.test(unit)) words[words.length - 1] = unit.toLowerCase();
  return i18n.t(i18n.l.expanded_state.asset_type.peg, { currency: words.join(' ') });
}

function nonEmpty(value: string | null | undefined): string | undefined {
  return value || undefined;
}

function imageIcon(url: string | null | undefined): AboutRowIcon | undefined {
  return url ? { type: 'image', url } : undefined;
}

export function getAssetClassification(
  asset: AssetClassificationInput | null | undefined,
  token: TokenInfo
): AssetClassification | undefined {
  const issuerName = nonEmpty(asset?.issuer?.name);
  const underlyingName = nonEmpty(asset?.underlyingAsset?.name);
  const tokenName = nonEmpty(token.name);
  const issuerRow: AboutRow | undefined = issuerName
    ? {
        key: 'issuer',
        title: i18n.t(i18n.l.expanded_state.sections.about.issuer),
        value: issuerName,
        icon: '􀉭',
        valueIcon: imageIcon(asset?.issuer?.iconUrl),
      }
    : undefined;

  switch (asset?.assetClass) {
    case AssetClass.TokenizedEquity: {
      const symbol = nonEmpty(token.symbol);
      const ticker = nonEmpty(asset.underlyingAsset?.ticker);
      const rows: (AboutRow | undefined)[] = [
        {
          key: 'asset_type',
          title: i18n.t(i18n.l.expanded_state.sections.about.asset_type),
          value: i18n.t(i18n.l.expanded_state.asset_type.tokenized_stock),
          icon: '􀬎',
        },
        underlyingName
          ? {
              key: 'underlying_asset',
              title: i18n.t(i18n.l.expanded_state.sections.about.underlying_asset),
              value: underlyingName,
              icon: '􀐞',
              valueIcon: imageIcon(asset.underlyingAsset?.iconUrl),
            }
          : undefined,
        issuerRow,
        symbol
          ? { key: 'onchain_ticker', title: i18n.t(i18n.l.expanded_state.sections.about.onchain_ticker), value: symbol, icon: '􀉣' }
          : undefined,
        ticker
          ? { key: 'offchain_ticker', title: i18n.t(i18n.l.expanded_state.sections.about.offchain_ticker), value: ticker, icon: '􀆪' }
          : undefined,
        token.chainLabel
          ? {
              key: 'blockchain',
              title: i18n.t(i18n.l.expanded_state.sections.about.blockchain),
              value: token.chainLabel,
              icon: '􀤆',
              valueIcon: { type: 'chain', chainId: token.chainId },
            }
          : undefined,
      ];
      return {
        label: i18n.t(i18n.l.expanded_state.asset_type.stock_label),
        rows: rows.filter(row => !!row),
        infoText: translateParts(i18n.l.expanded_state.asset_type.tokenized_stock_info, {
          token: tokenName,
          underlying: underlyingName,
          issuer: issuerName,
          chain: token.chainLabel,
        }),
      };
    }
    case AssetClass.Stablecoin: {
      const rows: (AboutRow | undefined)[] = [
        {
          key: 'asset_type',
          title: i18n.t(i18n.l.expanded_state.sections.about.asset_type),
          value: i18n.t(i18n.l.expanded_state.asset_type.stablecoin),
          icon: '􀬎',
        },
        issuerRow,
      ];
      return {
        label: i18n.t(i18n.l.expanded_state.asset_type.stablecoin_label),
        rows: rows.filter(row => !!row),
        infoText: translateParts(i18n.l.expanded_state.asset_type.stablecoin_info, {
          token: tokenName,
          peg: underlyingName ? formatPeg(underlyingName) : undefined,
          issuer: issuerName,
        }),
      };
    }
    default:
      return undefined;
  }
}
