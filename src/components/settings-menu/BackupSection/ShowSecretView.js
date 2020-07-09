import { useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import ShadowStack from 'react-native-shadow-stack/dist/ShadowStack';
import styled from 'styled-components';
import WalletTypes from '../../../helpers/walletTypes';
import { useClipboard, useDimensions, useWallets } from '../../../hooks';
import {
  identifyWalletType,
  loadSeedPhraseAndMigrateIfNeeded,
} from '../../../model/wallet';
import { colors, position } from '../../../styles';
import { ButtonPressAnimation } from '../../animations';
import { FloatingEmojis } from '../../floating-emojis';
import { Icon } from '../../icons';
import { Centered, Column, Row, RowWithMargins } from '../../layout';
import { SheetButton } from '../../sheet';
import { Text } from '../../text';

const PrivateKeyText = styled(Text).attrs({
  align: 'center',
  color: 'dark',
  lineHeight: 'looser',
  size: 'lmedium',
  weight: 'semibold',
})`
  padding-horizontal: 30;
`;

const Shadow = styled(ShadowStack)`
  elevation: 15;
  margin-top: 24;
`;

const ShowSecretView = () => {
  const { setClipboard } = useClipboard();
  const { params } = useRoute();
  const { selectedWallet } = useWallets();
  const [error, setError] = useState(false);
  const [seed, setSeed] = useState(null);
  const [type, setType] = useState(null);
  const { width: deviceWidth } = useDimensions();
  let wordSectionHeight = 100;

  const loadSeed = useCallback(async () => {
    const wallet_id = params?.wallet_id || selectedWallet.id;
    const s = await loadSeedPhraseAndMigrateIfNeeded(wallet_id);
    if (s) {
      const walletType = identifyWalletType(s);
      setType(walletType);
      setSeed(s);
      setError(false);
    } else {
      setError(true);
    }
  }, [params?.wallet_id, selectedWallet.id]);

  useEffect(() => {
    loadSeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let columns = [];
  let secretLayout = null;
  if (seed && type === WalletTypes.mnemonic) {
    wordSectionHeight = (seed && (seed.split(' ').length || 12) / 2) * 39 + 10;
    const words = seed.split(' ');
    columns = [words.slice(0, words.length / 2), words.slice(words.length / 2)];
    secretLayout = columns.map((wordColumn, colIndex) => (
      <Column key={`col_${colIndex}`} marginLeft={19} marginRight={30}>
        {wordColumn.map((word, index) => (
          <RowWithMargins marginBottom={9} key={`word_${index}`}>
            <Text
              align="left"
              color="appleBlue"
              lineHeight="looser"
              size="lmedium"
            >
              {index + 1 + colIndex * wordColumn.length} &nbsp;
              <Text
                align="left"
                color="blueGreyDark"
                lineHeight="looser"
                size="lmedium"
                weight="bold"
              >
                {word}
              </Text>
            </Text>
          </RowWithMargins>
        ))}
      </Column>
    ));
  } else if (type === WalletTypes.privateKey) {
    wordSectionHeight = 150;
    secretLayout = <PrivateKeyText>{seed}</PrivateKeyText>;
  }

  return (
    <Centered direction="column" paddingTop={90} paddingBottom={15}>
      <Row>
        {secretLayout && (
          <FloatingEmojis
            distance={250}
            duration={500}
            fadeOut={false}
            scaleTo={0}
            size={50}
            wiggleFactor={0}
          >
            {({ onNewEmoji }) => (
              <ButtonPressAnimation
                scaleTo={0.88}
                onPress={() => {
                  onNewEmoji();
                  setClipboard(seed);
                }}
              >
                <RowWithMargins
                  align="center"
                  backgroundColor={colors.transparent}
                  height={34}
                  justify="flex-start"
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
              </ButtonPressAnimation>
            )}
          </FloatingEmojis>
        )}
      </Row>
      <Row>
        {secretLayout && (
          <Shadow
            borderRadius={25}
            height={wordSectionHeight}
            shadows={[
              [0, 10, 30, colors.dark, 0.1],
              [0, 5, 15, colors.dark, 0.04],
            ]}
            width={deviceWidth - 138}
          >
            <Row marginVertical={19}>{secretLayout}</Row>
          </Shadow>
        )}
        {error && (
          <Centered>
            <Column marginTop={40} paddingHorizontal={24}>
              <Text align="center" size="large" weight="normal">
                You need to authenticate in order to access your recovery{' '}
                {type === WalletTypes.privateKey ? 'key' : 'phrase'}
              </Text>
              <Column margin={24} marginTop={0}>
                <SheetButton
                  color={colors.appleBlue}
                  label="Try again"
                  onPress={loadSeed}
                />
              </Column>
            </Column>
          </Centered>
        )}
      </Row>
    </Centered>
  );
};

export default ShowSecretView;
