import * as i18n from '@/languages';
import React from 'react';
import CopyTooltip from '../copy-tooltip';
import { Centered } from '../layout';
import { Text } from '../text';
import { Box, Inset } from '@/design-system';
import WalletTypes, { EthereumWalletType } from '@/helpers/walletTypes';
import { SeedWordGrid } from '@/components/secret-display/SeedWordGrid';

interface SecretDisplayCardProps {
  seed: string;
  type?: EthereumWalletType;
}

export default function SecretDisplayCard({
  seed,
  type,
}: SecretDisplayCardProps) {
  return (
    <Centered>
      <Inset vertical="10px">
        <Box
          background="card (Deprecated)"
          borderRadius={25}
          height={{ custom: type === WalletTypes.privateKey ? 90 : 240 }}
          paddingHorizontal="30px (Deprecated)"
          paddingVertical="19px (Deprecated)"
          shadow="21px light (Deprecated)"
        >
          <CopyTooltip
            textToCopy={seed}
            tooltipText={i18n.t(i18n.l.back_up.secret.copy_to_clipboard)}
          >
            <Box alignItems="center" height="full" justifyContent="center">
              {seed && type === WalletTypes.mnemonic && (
                <SeedWordGrid seed={seed} />
              )}
              {seed && type === WalletTypes.privateKey && (
                <Text
                  align="center"
                  weight="semibold"
                  lineHeight="looser"
                  size="lmedium"
                >
                  {seed}
                </Text>
              )}
            </Box>
          </CopyTooltip>
        </Box>
      </Inset>
    </Centered>
  );
}
