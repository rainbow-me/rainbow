import React, { useCallback, useMemo, useState } from 'react';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { OpacityToggler } from '../animations';
import { UniqueTokenExpandedStateContent } from '../expanded-state/unique-token';
import { Column } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions, useImageMetadata } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
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

const NFTWrapper = styled(Column).attrs({
  align: 'center',
  flex: 1,
  justify: 'center',
})`
  width: 100%;
`;

const Gradient = styled(LinearGradient).attrs(
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'isTallPhone' does not exist on type 'Lin... Remove this comment to see the full error message
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
}: any) {
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
      // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
      setIsGradientVisible(newContainerHeight < containerHeight);
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'number' is not assignable to par... Remove this comment to see the full error message
      setContainerHeight(newContainerHeight);
      setContainerWidth(layout.width);
    },
    [containerHeight]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Column align="end" flex={1} width="100%">
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <NFTWrapper onLayout={handleLayout}>
          {!!containerHeight && !!containerWidth && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <UniqueTokenExpandedStateContent
              {...props}
              asset={asset}
              borderRadius={20}
              disablePreview
              height={imageHeight}
              horizontalPadding={24}
              resizeMode="cover"
              width={imageWidth}
            />
          )}
        </NFTWrapper>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Footer>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ButtonWrapper isTallPhone={isTallPhone}>
            {buttonRenderer}
            {txSpeedRenderer}
          </ButtonWrapper>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <GradientToggler isVisible={!isGradientVisible}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Gradient isTallPhone={isTallPhone} />
          </GradientToggler>
        </Footer>
      </Column>
    </TouchableWithoutFeedback>
  );
}
