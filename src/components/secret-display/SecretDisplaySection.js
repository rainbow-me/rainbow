import { useRoute } from '@react-navigation/native';
import { captureException } from '@sentry/react-native';
import React, { useCallback, useEffect, useState } from 'react';
import ShadowStack from 'react-native-shadow-stack/dist/ShadowStack';
import styled from 'styled-components';
import {
  identifyWalletType,
  loadSeedPhraseAndMigrateIfNeeded,
} from '../../model/wallet';
import { deviceUtils } from '../../utils';
import { Button } from '../buttons';
import { CopyFloatingEmojis } from '../floating-emojis';
import { Icon } from '../icons';
import { Centered, Column, Row, RowWithMargins } from '../layout';
import SecretDisplayItem from '../secret-display/SecretDisplayItem';
import { Text } from '../text';
import BiometryTypes from '@rainbow-me/helpers/biometryTypes';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import { useBiometryType, useDimensions, useWallets } from '@rainbow-me/hooks';
import { colors, position, shadow } from '@rainbow-me/styles';
import logger from 'logger';

const BiometryIcon = styled(Icon).attrs(({ biometryType }) => ({
  name: biometryType.toLowerCase(),
  size: biometryType === BiometryTypes.passcode ? 19 : 20,
}))`
  margin-bottom: ${({ biometryType }) =>
    biometryType === BiometryTypes.passcode ? 1.5 : 0};
`;

const ButtonLabel = styled(Text).attrs({
  align: 'center',
  color: colors.white,
  size: 'large',
  weight: 'semibold',
})``;

const ToggleSecretButton = styled(Button)`
  ${shadow.build(0, 5, 15, colors.purple, 0.3)}
  background-color: ${colors.appleBlue};
  width: 235;
  width: 265;
`;

const PrivateKeyText = styled(SecretDisplayItem).attrs({
  align: 'center',
  color: 'dark',
  weight: 'semibold',
})`
  padding-horizontal: 30;
`;

const Shadow = styled(ShadowStack)`
  elevation: 15;
  margin-top: ${deviceUtils.isTallPhone ? '24' : '12'};
`;

const SecretDisplaySection = ({ onWalletTypeIdentified, secretLoaded }) => {
  const { params } = useRoute();
  const { selectedWallet, wallets } = useWallets();
  const walletId = params?.walletId || selectedWallet.id;
  const currentWallet = wallets[walletId];
  const { isTallPhone } = useDimensions();
  const [visible, setVisible] = useState(true);
  const [seed, setSeed] = useState(null);
  const [type, setType] = useState(currentWallet?.type);
  const { width: deviceWidth } = useDimensions();
  const biometryType = useBiometryType();
  let wordSectionHeight = 100;

  const showBiometryIcon =
    !seed &&
    (biometryType === BiometryTypes.passcode ||
      biometryType === BiometryTypes.TouchID);
  const showFaceIDCharacter = !seed && biometryType === BiometryTypes.FaceID;

  useEffect(() => {
    loadSeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSeed = useCallback(async () => {
    try {
      const s = await loadSeedPhraseAndMigrateIfNeeded(walletId);
      if (s) {
        const walletType = identifyWalletType(s);
        setType(walletType);
        onWalletTypeIdentified && onWalletTypeIdentified(walletType);
        setSeed(s);
        setVisible(true);
        secretLoaded && secretLoaded(true);
      } else {
        setVisible(false);
        secretLoaded && secretLoaded(false);
      }
    } catch (e) {
      logger.sentry('Error while trying to reveal secret', e);
      captureException(e);
      setVisible(false);
      secretLoaded && secretLoaded(false);
    }
  }, [onWalletTypeIdentified, secretLoaded, walletId]);

  let columns = [];
  if (seed && type === WalletTypes.mnemonic) {
    wordSectionHeight = (seed && (seed.split(' ').length || 12) / 2) * 39 + 10;
    const words = seed.split(' ');
    columns = [words.slice(0, words.length / 2), words.slice(words.length / 2)];
  } else if (type === WalletTypes.privateKey) {
    wordSectionHeight = 151;
  }

  if (!visible) {
    return (
      <Centered>
        <Column marginTop={40} paddingHorizontal={60}>
          <Text
            align="center"
            color="blueGreyDark"
            size="large"
            weight="normal"
          >
            You need to authenticate in order to access your recovery{' '}
            {type === WalletTypes.privateKey ? 'key' : 'phrase'}
          </Text>
          <Column margin={24} marginTop={20}>
            <ToggleSecretButton onPress={loadSeed}>
              {showBiometryIcon && <BiometryIcon biometryType={biometryType} />}
              <ButtonLabel
                color="appleBlue"
                letterSpacing="rounded"
                weight="semibold"
              >
                {showFaceIDCharacter && '􀎽  '}
                Show Recovery{' '}
                {`${type === WalletTypes.privateKey ? 'Key' : 'Phrase'}`}
              </ButtonLabel>
            </ToggleSecretButton>
          </Column>
        </Column>
      </Centered>
    );
  }

  return (
    <Centered direction="column">
      {visible && seed && (
        <React.Fragment>
          <Row>
            <CopyFloatingEmojis scaleTo={0.88} textToCopy={seed}>
              <RowWithMargins
                align="center"
                height={34}
                justify="start"
                margin={6}
                paddingBottom={2}
              >
                <Icon
                  color={colors.appleBlue}
                  marginTop={0.5}
                  name="copy"
                  style={position.sizeAsObject(16)}
                />
                <Text
                  color="appleBlue"
                  letterSpacing="roundedMedium"
                  size="lmedium"
                  weight="bold"
                >
                  Copy to clipboard
                </Text>
              </RowWithMargins>
            </CopyFloatingEmojis>
          </Row>
          <Row>
            <Shadow
              borderRadius={25}
              height={wordSectionHeight}
              shadows={[
                [0, 10, 30, colors.dark, 0.1],
                [0, 5, 15, colors.dark, 0.04],
              ]}
              width={deviceWidth - (isTallPhone ? 138 : 105)}
            >
              <Row
                justify="space-between"
                marginHorizontal={30}
                marginVertical={30}
              >
                {type === WalletTypes.privateKey ? (
                  <Column>
                    <PrivateKeyText>{seed}</PrivateKeyText>
                  </Column>
                ) : (
                  columns.map((wordColumn, colIndex) => (
                    <Column
                      key={`col_${colIndex}`}
                      marginLeft={15}
                      marginRight={15}
                    >
                      {wordColumn.map((word, index) => {
                        const number = index + 1 + colIndex * wordColumn.length;
                        return (
                          <SecretDisplayItem key={number} number={number}>
                            {word}
                          </SecretDisplayItem>
                        );
                      })}
                    </Column>
                  ))
                )}
              </Row>
            </Shadow>
          </Row>
        </React.Fragment>
      )}
    </Centered>
  );
};

export default SecretDisplaySection;
