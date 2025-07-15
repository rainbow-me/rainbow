import React from 'react';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { SFSymbolIcon } from '@/components/icons/SFSymbolIcon';
import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { RainbowToastSwap } from '@/components/rainbow-toast/types';
import { TransactionStatus } from '@/entities';
import { View } from 'react-native';
import { RainbowImage } from '@/components/RainbowImage';
import Svg, { Path } from 'react-native-svg';
import MaskedView from '@react-native-masked-view/masked-view';

const ICON_INTERSECT = TOAST_ICON_SIZE * 0.15;

export const SWAP_ICON_WIDTH = TOAST_ICON_SIZE * 2 - ICON_INTERSECT;

export const SwapToastIcon = ({ toast, size = TOAST_ICON_SIZE }: { toast: RainbowToastSwap; size?: number }) => {
  const chainImage = <ChainImage chainId={toast.fromChainId} size={16} />;

  return toast.status === TransactionStatus.swapped ? (
    <SFSymbolIcon size={size} name="check" />
  ) : (
    <View style={{ position: 'relative', flexDirection: 'row', height: TOAST_ICON_SIZE, width: SWAP_ICON_WIDTH }}>
      <View style={{ position: 'absolute', bottom: -4, right: 10, zIndex: 10 }}>{chainImage}</View>
      <MaskedView maskElement={<Mask />}>
        <RainbowImage style={{ width: TOAST_ICON_SIZE, height: TOAST_ICON_SIZE }} source={{ url: toast.fromAssetImage }} />
      </MaskedView>
      <View style={{ marginLeft: -ICON_INTERSECT, zIndex: 2 }}>
        <RainbowImage style={{ width: TOAST_ICON_SIZE, height: TOAST_ICON_SIZE }} source={{ url: toast.toAssetImage }} />
      </View>
    </View>
  );
};

const Mask = () => {
  const cutoutSize = 4;
  const circleRadius = TOAST_ICON_SIZE / 2;
  const shiftX = TOAST_ICON_SIZE - ICON_INTERSECT - cutoutSize;
  const circleCx = circleRadius + shiftX;
  const circleCy = circleRadius;

  // Create a path that fills the entire 34x34 area but cuts out a circle
  const pathData = `
    M 0,0 
    L 34,0 
    L 34,34 
    L 0,34 
    Z 
    M ${circleCx + circleRadius},${circleCy} 
    A ${circleRadius},${circleRadius} 0 0,0 ${circleCx - circleRadius},${circleCy} 
    A ${circleRadius},${circleRadius} 0 0,0 ${circleCx + circleRadius},${circleCy} 
    Z
  `;

  return (
    <Svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <Path d={pathData} fill="black" fillRule="evenodd" />
    </Svg>
  );
};
