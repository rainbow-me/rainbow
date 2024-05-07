import React from 'react';
import { RowWithMargins } from '../layout';
import TokenInfoValue from './TokenInfoValue';
import { useColorForAsset } from '@/hooks';
import styled from '@/styled-thing';
import { magicMemo } from '@/utils';
import RainbowCoinIcon from '../coin-icon/RainbowCoinIcon';
import { useTheme } from '@/theme';
import { View } from 'react-native';

const InfoValue = styled(TokenInfoValue)(android ? { height: 37.7 } : {});

const TokenInfoBalanceValue = ({ align, asset, ...props }) => {
  const { address, balance, symbol, type, value } = asset;
  const color = useColorForAsset(asset);

  const theme = useTheme();

  return (
    <RowWithMargins
      {...props}
      align="center"
      direction={align === 'left' ? 'row' : 'row-reverse'}
      margin={5}
      marginKey={align === 'left' ? 'marginRight' : 'marginLeft'}
    >
      <View style={{ marginRight: 5 }}>
        <RainbowCoinIcon
          size={20}
          icon={asset?.icon_url}
          network={asset?.network}
          symbol={asset?.symbol}
          theme={theme}
          colors={asset?.colors}
          ignoreBadge
        />
      </View>
      <InfoValue color={color}>{balance?.display || value}</InfoValue>
    </RowWithMargins>
  );
};

export default magicMemo(TokenInfoBalanceValue, 'asset');
