import React, { useCallback, useMemo, useState } from 'react';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { OpacityToggler } from '../animations';
import { UniqueTokenExpandedStateContent } from '../expanded-state/unique-token';
import { Column } from '../layout';
import { useDimensions, useImageMetadata } from '@rainbow-me/hooks';
import { padding, position } from '@rainbow-me/styles';

const defaultImageDimensions = { height: 512, width: 512 };

const ButtonWrapper = styled(Column).attrs({
  margin: 0,
})`
  ${padding(0, 19, 15)};
  margin-bottom: 21;
  width: 100%;
  z-index: 3;
`;

const Footer = styled(Column).attrs({ justify: 'end' })`
  width: 100%;
`;

const NFTSizer = styled.View`
  height: ${({ height }) => height};
  width: ${({ width }) => width};
`;

const NFTWrapper = styled(Column).attrs({
  align: 'center',
  flex: 1,
  justify: 'center',
})`
  width: 100%;
`;

const Gradient = styled(LinearGradient).attrs(
  ({ isTallPhone, theme: { colors } }) => ({
    colors: colors.gradients.sendBackground,
    end: { x: 0.5, y: isTallPhone ? 0.2 : 0.4 },
    pointerEvents: 'none',
    start: { x: 0.5, y: 0 },
  })
)`
  ${position.cover};
  overflow: hidden;
`;

const GradientToggler = styled(OpacityToggler).attrs({
  tension: 500,
})`
  ${position.cover};
`;

export default function SendAssetFormCollectible({
  asset,
  buttonRenderer,
  txSpeedRenderer,
  ...props
}) {
  const {
    height: deviceHeight,
    isTallPhone,
    isTinyPhone,
    width: deviceWidth,
  } = useDimensions();

  const [containerHeight, setContainerHeight] = useState();
  const [containerWidth, setContainerWidth] = useState();
  const [isGradientVisible, setIsGradientVisible] = useState(false);

  const { dimensions: cachedImageDimensions } = useImageMetadata(
    asset.image_preview_url
  );

  const { height: imageHeight, width: imageWidth } = useMemo(() => {
    const imgDims = cachedImageDimensions || defaultImageDimensions;

    const defaultWidth = deviceWidth - 38;
    const defaultHeight = (defaultWidth * imgDims.height) / imgDims.width;
    let width = defaultWidth;
    let height = defaultHeight;

    const calculatedHeight =
      deviceHeight - (isTallPhone ? 440 : isTinyPhone ? 360 : 420);

    if (height > calculatedHeight) {
      height = calculatedHeight;
      width = (height * imgDims.width) / imgDims.height;
      if (width > defaultWidth) {
        width = defaultWidth;
        height = defaultHeight;
      }
    }

    return { height, width };
  }, [
    cachedImageDimensions,
    deviceHeight,
    deviceWidth,
    isTallPhone,
    isTinyPhone,
  ]);

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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Column align="end" flex={1} width="100%">
        <NFTWrapper onLayout={handleLayout}>
          {!!containerHeight && !!containerWidth && (
            <NFTSizer height={imageHeight} width={imageWidth}>
              <UniqueTokenExpandedStateContent
                {...props}
                asset={asset}
                borderRadius={20}
                height={imageHeight}
                horizontalPadding={0}
                resizeMode="cover"
                width={imageWidth}
              />
            </NFTSizer>
          )}
        </NFTWrapper>
        <Footer>
          <ButtonWrapper isTallPhone={isTallPhone}>
            {buttonRenderer}
            {txSpeedRenderer}
          </ButtonWrapper>
          <GradientToggler isVisible={!isGradientVisible}>
            <Gradient isTallPhone={isTallPhone} />
          </GradientToggler>
        </Footer>
      </Column>
    </TouchableWithoutFeedback>
  );
}
