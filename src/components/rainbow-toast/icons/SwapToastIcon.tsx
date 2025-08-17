import { ChainImage } from '@/components/coin-icon/ChainImage';
import { SWAP_ICON_INTERSECT, SWAP_ICON_WIDTH, TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { ToastSFSymbolIcon } from '@/components/rainbow-toast/ToastSFSymbolIcon';
import { RainbowToast } from '@/components/rainbow-toast/types';
import { RainbowImage } from '@/components/RainbowImage';
import { TransactionStatus } from '@/entities';
import { ChainId } from '@/state/backendNetworks/types';
import MaskedView from '@react-native-masked-view/masked-view';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const isWideSwapIcon = (toast: RainbowToast) => {
  return toast.transaction.status === TransactionStatus.pending;
};

export const SwapToastIcon = ({ toast, size = TOAST_ICON_SIZE }: { toast: RainbowToast; size?: number }) => {
  const { transaction } = toast;
  const chainImage = <ChainImage chainId={transaction.chainId} size={16} />;
  const outAsset = transaction.changes?.find(c => c?.direction === 'out')?.asset;
  const inAsset = transaction.changes?.find(c => c?.direction === 'in')?.asset;

  return isWideSwapIcon(toast) ? (
    <View style={styles.wideContainer}>
      {transaction.chainId !== ChainId.mainnet && <View style={styles.chainImageContainer}>{chainImage}</View>}
      <MaskedView maskElement={<Mask size={size} />}>
        <View style={styles.imageContainer}>
          <RainbowImage
            style={{
              width: size,
              height: size,
            }}
            source={{ url: outAsset?.icon_url ?? '' }}
          />
        </View>
      </MaskedView>
      <View style={styles.secondImageContainer}>
        <View style={styles.imageContainer}>
          <RainbowImage
            style={{
              width: size,
              height: size,
            }}
            source={{ url: inAsset?.icon_url ?? '' }}
          />
        </View>
      </View>
    </View>
  ) : (
    <ToastSFSymbolIcon size={size} name={transaction.status === TransactionStatus.failed ? 'exclamationMark' : 'check'} />
  );
};

const Mask = memo(function Mask({ size = TOAST_ICON_SIZE }: { size?: number }) {
  const cutoutSize = 3;
  const circleRadius = size / 2 + cutoutSize;
  const shiftX = size - SWAP_ICON_INTERSECT - cutoutSize;
  const circleCx = circleRadius + shiftX;
  const circleCy = circleRadius - cutoutSize;

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
});

const styles = StyleSheet.create({
  wideContainer: {
    position: 'relative',
    flexDirection: 'row',
    height: TOAST_ICON_SIZE,
    width: SWAP_ICON_WIDTH,
  },
  chainImageContainer: {
    position: 'absolute',
    bottom: '-4%',
    right: '26%',
    zIndex: 10,
  },
  imageContainer: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  secondImageContainer: {
    marginLeft: -SWAP_ICON_INTERSECT,
    zIndex: 2,
  },
});
