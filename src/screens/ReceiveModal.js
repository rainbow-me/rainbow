import { toLower } from 'lodash';
import React from 'react';
import { Platform, Share } from 'react-native';
// import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { useSelector } from 'react-redux';
import styled from 'styled-components/primitives';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { ButtonPressAnimation } from '../components/animations';
// import { FloatingEmojis } from '../components/floating-emojis';
import { Icon } from '../components/icons';
import { Centered, Column } from '../components/layout';
import { Text, TruncatedAddress } from '../components/text';
// import { useClipboard } from '../hooks';
// import { useNavigation } from '../navigation/Navigation';
import { colors, fonts, position } from '../styles';
// import { haptics } from '../utils';

// const statusBarHeight = getStatusBarHeight(true);
const QRCodeSize = Platform.OS === 'ios' ? 250 : 190;

const AddressText = styled(TruncatedAddress).attrs({
  color: colors.alpha(colors.white, 0.6),
})`
  font-size: 18px;
  letter-spacing: null;
  line-height: 19;
  text-align: center;
  width: 100%;
`;

const TopHandle = styled.View`
  width: 35px;
  height: 5px;
  border-radius: 3px;
  background-color: ${colors.white};
`;

const ButtonWrapper = styled(Centered)`
  width: 123px;
  height: 56px;
  border-radius: 28px;
  border: 0.5px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0px 10px 30px rgba(37, 41, 46, 0.2);
  background-color: #25292e;
  justify-content: center;
  padding-bottom: 2px;
  margin-top: 24px;
`;

const ButtonIcon = styled(Icon)`
  ${position.maxSize('110%')};
  margin-right: 9;
`;

const QRwrapper = styled(Column)`
  box-shadow: 0px 10px 50px rgba(0, 0, 0, 0.6);
`;

const IconContainer = styled(Centered).attrs({
  grow: 0,
  shrink: 0,
})`
  ${position.size(18)};
`;

const ReceiveModal = () => {
  // const { setClipboard } = useClipboard();
  // const { goBack } = useNavigation();
  const accountAddress = useSelector(({ settings: { accountAddress } }) =>
    toLower(accountAddress)
  );

  return (
    <Centered flex={1} bottom={16}>
      <Column align="center">
        <TopHandle />
        <QRwrapper
          align="center"
          marginTop={19}
          margin={24}
          padding={24}
          borderRadius={40}
          backgroundColor={colors.white}
        >
          <QRCodeDisplay size={QRCodeSize} value={accountAddress} />
        </QRwrapper>
        <AddressText
          address={accountAddress}
          firstSectionLength={10}
          size="smaller"
          truncationLength={4}
          weight="medium"
        />
        <ButtonPressAnimation
          onPress={() =>
            Share.share({
              message: accountAddress,
              title: 'My account address:',
            })
          }
        >
          <ButtonWrapper>
            <IconContainer>
              <ButtonIcon color="white" name="share" />
            </IconContainer>
            <Text color="white" size={fonts.size.larger} weight="semibold">
              Share
            </Text>
          </ButtonWrapper>
        </ButtonPressAnimation>
      </Column>
    </Centered>
    //     <FloatingEmojis
    //       distance={250}
    //       duration={500}
    //       fadeOut={false}
    //       flex={1}
    //       scaleTo={0}
    //       size={50}
    //       wiggleFactor={0}
    //     >
    //       {({ onNewEmoji }) => (
    //         <ModalFooterButton
    //           icon="copy"
    //           label="Copy"
    //           onPress={() => {
    //             haptics.impactLight();
    //             onNewEmoji();
    //             setClipboard(accountAddress);
    //           }}
    //         />
    //       )}
    //     </FloatingEmojis>
  );
};

export default React.memo(ReceiveModal);
