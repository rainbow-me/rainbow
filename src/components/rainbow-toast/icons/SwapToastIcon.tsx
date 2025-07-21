import { ChainImage } from '@/components/coin-icon/ChainImage';
import { SWAP_ICON_INTERSECT, SWAP_ICON_WIDTH, TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { ToastSFSymbolIcon } from '@/components/rainbow-toast/ToastSFSymbolIcon';
import { RainbowToastSwap } from '@/components/rainbow-toast/types';
import { RainbowImage } from '@/components/RainbowImage';
import { TransactionStatus } from '@/entities';
import MaskedView from '@react-native-masked-view/masked-view';
import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const isWideSwapIcon = (toast: RainbowToastSwap) => {
  if (
    toast.status === TransactionStatus.swapped ||
    toast.status === TransactionStatus.confirmed ||
    toast.status === TransactionStatus.failed
  ) {
    return false;
  }
  return true;
};

export const SwapToastIcon = ({ toast, size = TOAST_ICON_SIZE }: { toast: RainbowToastSwap; size?: number }) => {
  const chainImage = <ChainImage chainId={toast.chainId} size={16} />;

  return isWideSwapIcon(toast) ? (
    <View style={{ position: 'relative', flexDirection: 'row', height: TOAST_ICON_SIZE, width: SWAP_ICON_WIDTH }}>
      <View style={{ position: 'absolute', bottom: -4, right: 10, zIndex: 10 }}>{chainImage}</View>
      <MaskedView maskElement={<Mask />}>
        <View style={{ borderRadius: 100, overflow: 'hidden' }}>
          <RainbowImage style={{ width: TOAST_ICON_SIZE, height: TOAST_ICON_SIZE }} source={{ url: toast.fromAssetImage }} />
        </View>
      </MaskedView>
      <View style={{ marginLeft: -SWAP_ICON_INTERSECT, zIndex: 2 }}>
        <View style={{ borderRadius: 100, overflow: 'hidden' }}>
          <RainbowImage style={{ width: TOAST_ICON_SIZE, height: TOAST_ICON_SIZE }} source={{ url: toast.toAssetImage }} />
        </View>
      </View>
    </View>
  ) : (
    <ToastSFSymbolIcon size={size} name={toast.status === TransactionStatus.failed ? 'exclamationMark' : 'check'} />
  );
};

const Mask = () => {
  const cutoutSize = 4;
  const circleRadius = TOAST_ICON_SIZE / 2;
  const shiftX = TOAST_ICON_SIZE - SWAP_ICON_INTERSECT - cutoutSize;
  const circleCx = circleRadius + shiftX;
  const circleCy = circleRadius;

  // Create a path that fills the 34x34 area but cuts out a circle
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
