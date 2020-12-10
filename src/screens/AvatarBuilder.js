import React, { useState } from 'react';
import Animated from 'react-native-reanimated';
import { useValues } from 'react-native-redash';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/primitives';
import TouchableBackdrop from '../components/TouchableBackdrop';
import ColorCircle from '../components/avatar-builder/ColorCircle';
import EmojiSelector from '../components/avatar-builder/EmojiSelector';
import { HeaderHeightWithStatusBar } from '../components/header';
import { Column, Row } from '../components/layout';
import { useWallets } from '../hooks';
import useAccountSettings from '../hooks/useAccountSettings';
import { useNavigation } from '../navigation/Navigation';
import { walletsSetSelected, walletsUpdate } from '../redux/wallets';
import { deviceUtils } from '../utils';
import { colors } from '@rainbow-me/styles';

const AvatarCircleHeight = 65;
const AvatarCircleMarginTop = 2;
const AvatarBuilderTopPoint =
  HeaderHeightWithStatusBar + AvatarCircleHeight + AvatarCircleMarginTop;

const Container = styled(Column)`
  background-color: ${colors.transparent};
`;

const SheetContainer = styled(Column)`
  background-color: ${colors.white};
  border-radius: 20px;
  height: 420px;
  overflow: hidden;
  width: 100%;
`;

const springTo = (node, toValue) =>
  // eslint-disable-next-line import/no-named-as-default-member
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
  const { wallets, selectedWallet } = useWallets();
  const [translateX] = useValues((params.initialAccountColor - 4) * 39);
  const { goBack } = useNavigation();
  const { accountAddress } = useAccountSettings();
  const [currentAccountColor, setCurrentAccountColor] = useState(
    colors.avatarColor[params.initialAccountColor]
  );
  const dispatch = useDispatch();

  const onChangeEmoji = event => {
    saveInfo(`${event} ${params.initialAccountName}`);
  };

  const avatarColors = colors.avatarColor.map((color, index) => (
    <ColorCircle
      backgroundColor={color}
      isSelected={index - 4 === 0}
      key={color}
      onPressColor={() => {
        const destination = (index - 4) * 39;
        springTo(translateX, destination);
        setCurrentAccountColor(color);
        saveInfo(null, index);
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
  };

  const colorCircleTopPadding = 15;
  const colorCircleBottomPadding = 19;

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
          maxWidth={375}
          paddingBottom={colorCircleBottomPadding + 7}
          paddingTop={colorCircleTopPadding + 7}
          width="100%"
        >
          <Animated.View
            alignSelf="center"
            borderColor={currentAccountColor}
            borderRadius={19}
            borderWidth={3}
            height={38}
            position="absolute"
            style={{
              transform: [{ translateX }],
            }}
            top={colorCircleTopPadding}
            width={38}
          />
          {avatarColors}
        </Row>

        <SheetContainer>
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
