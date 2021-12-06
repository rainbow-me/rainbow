import React, { useState } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated from 'react-native-reanimated';
import { useValues } from 'react-native-redash/src/v1';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/TouchableBackdrop' was resol... Remove this comment to see the full error message
import TouchableBackdrop from '../components/TouchableBackdrop';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/avatar-builder/ColorCircle' ... Remove this comment to see the full error message
import ColorCircle from '../components/avatar-builder/ColorCircle';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/avatar-builder/EmojiSelector... Remove this comment to see the full error message
import EmojiSelector from '../components/avatar-builder/EmojiSelector';
import { HeaderHeightWithStatusBar } from '../components/header';
import { Column, Row } from '../components/layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../navigation/Navigation' was resolved to ... Remove this comment to see the full error message
import { useNavigation } from '../navigation/Navigation';
import { walletsSetSelected, walletsUpdate } from '../redux/wallets';
import { deviceUtils } from '../utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions, useWallets, useWebData } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks/useAccountSe... Remove this comment to see the full error message
import useAccountSettings from '@rainbow-me/hooks/useAccountSettings';

const AvatarCircleHeight = 65;
const AvatarCircleMarginTop = 2;
const AvatarBuilderTopPoint =
  HeaderHeightWithStatusBar + AvatarCircleHeight + AvatarCircleMarginTop;

const Container = styled(Column)`
  background-color: ${({ theme: { colors } }) => colors.transparent};
`;

const SheetContainer = styled(Column)`
  background-color: ${({ theme: { colors } }) => colors.white};
  border-radius: 20px;
  height: ${({ deviceHeight }) =>
    deviceHeight ? Math.floor((deviceHeight / 13) ** 1.5) : 420}px;
  overflow: hidden;
  width: 100%;
`;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'ScrollView' does not exist on type 'Styl... Remove this comment to see the full error message
const ScrollableColorPicker = styled.ScrollView`
  overflow: visible;
  margin: 0px 10px;
`;

const SelectedColorRing = styled(Animated.View)`
  height: 38;
  width: 38;
  border-radius: 20;
  border-width: 3;
  position: absolute;
  align-self: center;
  left: 1;
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedColor' does not exist on type '{... Remove this comment to see the full error message
  border-color: ${({ selectedColor }) => selectedColor};
`;

const springTo = (node: any, toValue: any) =>
  Animated.spring(node, {
    damping: 38,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
    stiffness: 600,
    toValue,
  }).start();

const AvatarBuilder = ({ route: { params } }: any) => {
  const { height, width } = useDimensions();
  const { wallets, selectedWallet } = useWallets();
  const { updateWebProfile } = useWebData();
  const [translateX] = useValues(params.initialAccountColor * 40);
  const { goBack } = useNavigation();
  const { accountAddress } = useAccountSettings();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const [currentAccountColor, setCurrentAccountColor] = useState(
    colors.avatarBackgrounds[params.initialAccountColor]
  );
  const dispatch = useDispatch();

  const onChangeEmoji = (event: any) => {
    ReactNativeHapticFeedback.trigger('selection');
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
    saveInfo(`${event} ${params.initialAccountName}`);
  };

  const avatarColors = colors.avatarBackgrounds.map(
    (color: any, index: any) => (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <ColorCircle
        backgroundColor={color}
        isSelected={index - 4 === 0}
        key={color}
        onPressColor={() => {
          const destination = index * 40;
          springTo(translateX, destination);
          setCurrentAccountColor(color);
          saveInfo(null, colors.avatarBackgrounds.indexOf(color));
        }}
      />
    )
  );

  const saveInfo = async (name: any, color: any) => {
    const walletId = selectedWallet.id;
    const newWallets = {
      ...wallets,
      [walletId]: {
        ...wallets[walletId],
        addresses: wallets[walletId].addresses.map((singleAddress: any) =>
          singleAddress.address.toLowerCase() === accountAddress.toLowerCase()
            ? {
                ...singleAddress,
                ...(name && { label: name }),
                ...(color !== undefined && { color }),
              }
            : singleAddress
        ),
      },
    };

    await dispatch(walletsSetSelected(newWallets[walletId]));
    await dispatch(walletsUpdate(newWallets));
    updateWebProfile(
      accountAddress,
      name,
      (color !== undefined && colors.avatarBackgrounds[color]) ||
        currentAccountColor
    );
  };

  const colorCircleTopPadding = 15;
  const colorCircleBottomPadding = 19;

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const selectedOffset = useMemo(() => {
    const maxOffset = colors.avatarBackgrounds.length * 40 - width + 20;
    const rawOffset =
      params.initialAccountColor * 40 - width / 2 + width ** 0.5 * 1.5;
    let finalOffset = rawOffset;
    if (rawOffset < 0) {
      finalOffset = 0;
    }
    if (rawOffset > maxOffset) {
      finalOffset = maxOffset;
    }
    return {
      x: finalOffset, // curve to have selected color in middle of scrolling colorpicker
    };
  }, [params.initialAccountColor, width, colors.avatarBackgrounds.length]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container {...deviceUtils.dimensions}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TouchableBackdrop onPress={goBack} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Column
        align="center"
        pointerEvents="box-none"
        top={AvatarBuilderTopPoint}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Row
          height={38 + colorCircleTopPadding + colorCircleBottomPadding}
          justify="center"
          paddingBottom={colorCircleBottomPadding + 7}
          paddingTop={colorCircleTopPadding + 7}
          width="100%"
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ScrollableColorPicker
            contentOffset={selectedOffset}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <SelectedColorRing
              // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
              selectedColor={currentAccountColor}
              style={{
                transform: [{ translateX }],
              }}
            />
            {avatarColors}
          </ScrollableColorPicker>
        </Row>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SheetContainer deviceHeight={height}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <EmojiSelector
            columns={7}
            onEmojiSelected={onChangeEmoji}
            showHistory={false}
            showSearchBar={false}
          />
        </SheetContainer>
      </Column>
    </Container>
  );
};

export default AvatarBuilder;
