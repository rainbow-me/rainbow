import React, { useState } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated from 'react-native-reanimated';
import { useValues } from 'react-native-redash/src/v1';
import { useDispatch } from 'react-redux';
import TouchableBackdrop from '../components/TouchableBackdrop';
import ColorCircle from '../components/avatar-builder/ColorCircle';
import EmojiSelector from '../components/avatar-builder/EmojiSelector';
import { HeaderHeightWithStatusBar } from '../components/header';
import { Column, Row } from '../components/layout';
import { useNavigation } from '../navigation/Navigation';
import { walletsSetSelected, walletsUpdate } from '../redux/wallets';
import { deviceUtils } from '../utils';
import { useDimensions, useWallets, useWebData } from '@rainbow-me/hooks';
import useAccountSettings from '@rainbow-me/hooks/useAccountSettings';
import styled from '@rainbow-me/styled-components';

const AvatarCircleHeight = 65;
const AvatarCircleMarginTop = 2;
const AvatarBuilderTopPoint =
  HeaderHeightWithStatusBar + AvatarCircleHeight + AvatarCircleMarginTop;

const Container = styled(Column)({
  backgroundColor: ({ theme: { colors } }) => colors.transparent,
});

const SheetContainer = styled(Column)({
  backgroundColor: ({ theme: { colors } }) => colors.white,
  borderRadius: 20,
  height: ({ deviceHeight }) =>
    deviceHeight ? Math.floor((deviceHeight / 13) ** 1.5) : 420,
  overflow: 'hidden',
  width: '100%',
});

const ScrollableColorPicker = styled.ScrollView({
  marginHorizontal: 10,
  marginVertical: 0,
  overflow: 'visible',
});

const SelectedColorRing = styled(Animated.View)({
  alignSelf: 'center',
  borderColor: ({ selectedColor }) => selectedColor,
  borderRadius: 20,
  borderWidth: 3,
  height: 38,
  left: 1,
  position: 'absolute',
  width: 38,
});

const springTo = (node, toValue) =>
  Animated.spring(node, {
    damping: 38,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
    stiffness: 600,
    toValue,
  }).start();

const AvatarBuilder = ({ route: { params } }) => {
  const { height, width } = useDimensions();
  const { wallets, selectedWallet } = useWallets();
  const { updateWebProfile } = useWebData();
  const [translateX] = useValues(params.initialAccountColor * 40);
  const { goBack } = useNavigation();
  const { accountAddress } = useAccountSettings();
  const { colors } = useTheme();
  const [currentAccountColor, setCurrentAccountColor] = useState(
    colors.avatarBackgrounds[params.initialAccountColor]
  );
  const dispatch = useDispatch();

  const onChangeEmoji = event => {
    ReactNativeHapticFeedback.trigger('selection');
    saveInfo(`${event} ${params.initialAccountName}`);
  };

  const avatarColors = colors.avatarBackgrounds.map((color, index) => (
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
  ));

  const saveInfo = async (name, color) => {
    const walletId = selectedWallet.id;
    const newWallets = {
      ...wallets,
      [walletId]: {
        ...wallets[walletId],
        addresses: wallets[walletId].addresses.map(singleAddress =>
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
    <Container {...deviceUtils.dimensions}>
      <TouchableBackdrop onPress={goBack} />
      <Column
        align="center"
        pointerEvents="box-none"
        top={AvatarBuilderTopPoint}
      >
        <Row
          height={38 + colorCircleTopPadding + colorCircleBottomPadding}
          justify="center"
          paddingBottom={colorCircleBottomPadding + 7}
          paddingTop={colorCircleTopPadding + 7}
          width="100%"
        >
          <ScrollableColorPicker
            contentOffset={selectedOffset}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <SelectedColorRing
              selectedColor={currentAccountColor}
              style={{
                transform: [{ translateX }],
              }}
            />
            {avatarColors}
          </ScrollableColorPicker>
        </Row>
        <SheetContainer deviceHeight={height}>
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
