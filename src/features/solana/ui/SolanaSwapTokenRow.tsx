import React from 'react';

import { triggerHaptics } from 'react-native-turbo-haptics';

import { CoinRowView } from '@/__swaps__/screens/Swap/components/CoinRow';
import { CoinRowButton } from '@/__swaps__/screens/Swap/components/CoinRowButton';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { type SwapAsset } from '@/features/solana/core/swap';
import { SolanaSwapIcon } from '@/features/solana/ui/SolanaSwapControls';
import { setClipboard } from '@/hooks/useClipboard';
import * as i18n from '@/languages';
import { openInBrowser } from '@/utils/openInBrowser';

export function SolanaSwapTokenRow({
  token,
  balance,
  output,
  onPress,
}: {
  token: SwapAsset;
  balance?: string;
  output: boolean;
  onPress: () => void;
}) {
  const asset = token;
  const mint = asset.asset.kind === 'token' ? asset.asset.address : undefined;
  return (
    <CoinRowView
      testID={`swap-token-${asset.id}`}
      output={output}
      name={asset.name}
      subtitle={output || !balance ? asset.symbol : `${balance} ${asset.symbol}`}
      onPress={onPress}
      icon={<SolanaSwapIcon token={token} />}
      actions={
        output ? (
          <>
            {mint ? (
              <ContextMenuButton
                testID={`coin-row-info-button-${mint}`}
                menuConfig={{
                  menuTitle: `${asset.chain === 'solana' && asset.isVerified ? i18n.t(i18n.l.token_search.section_header.verified) : i18n.t(i18n.l.token_search.section_header.unverified)} ${i18n.t(i18n.l.exchange.coin_row.token)}`,
                  menuItems: [
                    {
                      actionKey: 'copyAddress',
                      actionTitle: i18n.t(i18n.l.exchange.coin_row.copy_contract_address),
                      icon: { iconType: 'SYSTEM', iconValue: 'doc.on.doc' },
                    },
                    {
                      actionKey: 'blockExplorer',
                      actionTitle: i18n.t(i18n.l.exchange.coin_row.view_on, { blockExplorerName: 'Solscan' }),
                      icon: { iconType: 'SYSTEM', iconValue: 'link' },
                    },
                  ],
                }}
                onPressMenuItem={({ nativeEvent: { actionKey } }: { nativeEvent: { actionKey: string } }) => {
                  if (actionKey === 'copyAddress') {
                    triggerHaptics('selection');
                    setClipboard(mint);
                  } else if (actionKey === 'blockExplorer') {
                    openInBrowser(`https://solscan.io/token/${mint}`);
                  }
                }}
              >
                <CoinRowButton icon="􀅳" outline size="icon 14px" />
              </ContextMenuButton>
            ) : (
              // Native SOL has no token mint to copy or inspect.
              <CoinRowButton icon="􀅳" outline size="icon 14px" disabled />
            )}
            {/* shortcut: enable favorites when token search/favorites support case-sensitive Solana mints. */}
            <CoinRowButton icon="􀋃" weight="black" disabled />
          </>
        ) : undefined
      }
    />
  );
}
