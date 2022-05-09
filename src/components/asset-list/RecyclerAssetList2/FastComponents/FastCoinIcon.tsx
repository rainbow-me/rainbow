import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { atomFamily, useRecoilState } from 'recoil';
import { useColorForAsset } from '@rainbow-me/hooks';
import { ImageWithCachedMetadata } from '@rainbow-me/images';
import { borders, fonts } from '@rainbow-me/styles';
import { FallbackIcon, getUrlForTrustIconFallback } from '@rainbow-me/utils';

const LoadingStates = {
  FALLBACK: 'FALLBACK',
  TRUST: 'TRUST',
  UNKNOWN: 'UNKNOWN',
} as const;

const fallbackTextStyles = {
  fontFamily: fonts.family.SFProRounded,
  fontWeight: fonts.weight.bold,
  letterSpacing: fonts.letterSpacing.roundedTight,
  marginBottom: 0.5,
  textAlign: 'center',
};

const isFallbackOrTrust = atomFamily<keyof typeof LoadingStates, string>({
  default: LoadingStates.UNKNOWN,
  key: 'isFallbackOrTrust',
});

const fallbackIconStyle = {
  ...borders.buildCircleAsObject(40),
  position: 'absolute',
};

export default function FastCoinIcon({
  address,
  symbol,
}: {
  address: string;
  symbol: string;
}) {
  const imageUrl = useMemo(() => getUrlForTrustIconFallback(address), [
    address,
  ]);

  const [status, setStatus] = useRecoilState(isFallbackOrTrust(address));

  const fallbackIconColor = useColorForAsset({ address });

  const onLoad = useCallback(() => {
    setStatus(LoadingStates.TRUST);
  }, [setStatus]);

  const onError = useCallback(() => {
    if (status === LoadingStates.TRUST) {
      setStatus(LoadingStates.UNKNOWN);
    }
  }, [setStatus, status]);

  return (
    <View>
      <FallbackIcon
        color={fallbackIconColor}
        height={40}
        style={fallbackIconStyle}
        symbol={symbol}
        textStyles={fallbackTextStyles}
        width={40}
      />
      <ImageWithCachedMetadata
        imageUrl={imageUrl}
        onError={onError}
        onLoad={onLoad}
        style={cx.coinIconFallback}
      />
    </View>
  );
}

const cx = StyleSheet.create({
  coinIconFallback: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
});
