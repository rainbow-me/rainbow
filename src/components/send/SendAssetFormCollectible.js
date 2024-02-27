import React, { useCallback, useMemo, useState } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { OpacityToggler } from '../animations';
import { UniqueTokenExpandedStateContent } from '../expanded-state/unique-token';
import { Column } from '../layout';
import { useDimensions, useImageMetadata } from '@/hooks';
import styled from '@/styled-thing';
import { padding, position } from '@/styles';
import { IS_ANDROID } from '@/env';

const defaultImageDimensions = { height: 512, width: 512 };

const ButtonWrapper = styled(Column).attrs({
  margin: 0,
})({
  ...padding.object(0, 19, 15),
  marginBottom: 21,
  width: '100%',
  ...(ios ? { zIndex: 3 } : { elevation: 3 }),
});

const Footer = styled(Column).attrs({ justify: 'end' })({
  width: '100%',
});

const NFTWrapper = styled(Column).attrs({
  align: 'center',
  flex: 1,
  justify: 'center',
})({
  width: '100%',
});

const Gradient = styled(LinearGradient).attrs(({ isTallPhone, theme: { colors } }) => ({
  colors: colors.gradients.sendBackground,
  end: { x: 0.5, y: isTallPhone ? 0.2 : 0.4 },
  pointerEvents: 'none',
  start: { x: 0.5, y: 0 },
}))({
  ...position.coverAsObject,
  overflow: 'hidden',
});

const GradientToggler = styled(OpacityToggler).attrs({
  tension: 500,
})(position.coverAsObject);

export default function SendAssetFormCollectible({ asset, buttonRenderer, txSpeedRenderer, ...props }) {
  const { height: deviceHeight, isTallPhone, isTinyPhone, width: deviceWidth } = useDimensions();

  const [containerHeight, setContainerHeight] = useState();
  const [containerWidth, setContainerWidth] = useState();
  const [isGradientVisible, setIsGradientVisible] = useState(false);

  const { dimensions: cachedImageDimensions } = useImageMetadata(asset.image_preview_url);

  const { height: imageHeight, width: imageWidth } = useMemo(() => {
    const imgDims = cachedImageDimensions || defaultImageDimensions;

    const defaultWidth = deviceWidth - 38;
    const defaultHeight = (defaultWidth * imgDims.height) / imgDims.width;
    let width = defaultWidth;
    let height = defaultHeight;

    const calculatedHeight = deviceHeight - (isTallPhone ? 440 : isTinyPhone ? 360 : 420);

    if (height > calculatedHeight) {
      height = calculatedHeight;
      width = (height * imgDims.width) / imgDims.height;
      if (width > defaultWidth) {
        width = defaultWidth;
        height = defaultHeight;
      }
    }

    return { height, width };
  }, [cachedImageDimensions, deviceHeight, deviceWidth, isTallPhone, isTinyPhone]);

  const handleLayout = useCallback(
    ({ nativeEvent: { layout } }) => {
      const newContainerHeight = layout.height - layout.y * 2;
      setIsGradientVisible(newContainerHeight < containerHeight);
      setContainerHeight(newContainerHeight);
      setContainerWidth(layout.width);
    },
    [containerHeight]
  );

  return (
    <Column align="end" flex={1} width="100%">
      <NFTWrapper onLayout={handleLayout}>
        {!!containerHeight && !!containerWidth && (
          <UniqueTokenExpandedStateContent
            {...props}
            asset={asset}
            borderRadius={20}
            disablePreview
            height={imageHeight}
            horizontalPadding={24}
            width={imageWidth}
          />
        )}
      </NFTWrapper>
      <Footer>
        <ButtonWrapper isTallPhone={isTallPhone}>
          {buttonRenderer}
          {txSpeedRenderer}
        </ButtonWrapper>
        {!IS_ANDROID && (
          <GradientToggler isVisible={!isGradientVisible}>
            <Gradient isTallPhone={isTallPhone} />
          </GradientToggler>
        )}
      </Footer>
    </Column>
  );
}
