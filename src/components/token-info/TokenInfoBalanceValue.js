import React from 'react';
import { RowWithMargins } from '../layout';
import TokenInfoValue from './TokenInfoValue';
import { useColorForAsset } from '@/hooks';
import styled from '@/styled-thing';
import { magicMemo } from '@/utils';
import RainbowCoinIcon from '../coin-icon/RainbowCoinIcon';
import { View } from 'react-native';

const InfoValue = styled(TokenInfoValue)(android ? { height: 37.7 } : {});

const TokenInfoBalanceValue = ({ align, asset, ...props }) => {
  const { balance, value } = asset;
  const color = useColorForAsset(asset);

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
          chainId={asset?.chainId}
          symbol={asset?.symbol}
          color={asset?.colors?.primary || asset?.colors?.fallback || undefined}
          showBadge={false}
        />
      </View>
      <InfoValue color={color}>{balance?.display || value}</InfoValue>
    </RowWithMargins>
  );
};

export default magicMemo(TokenInfoBalanceValue, 'asset');
