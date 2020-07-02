import { useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
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
import { Text } from '../../text';

const PrivateKeyText = styled(Text).attrs({
  align: 'center',
  color: 'dark',
  letterSpacing: 0.6,
  lineHeight: 'looser',
  size: 'lmedium',
  weight: 'semibold',
})`
  padding-left: 30;
  padding-right: 30;
`;

const Shadow = styled(ShadowStack)`
  elevation: 15;
  margin-bottom: 85;
  margin-top: 19;
`;

const ShowSecretView = () => {
  const { setClipboard } = useClipboard();
  const { params } = useRoute();
  const { selectedWallet } = useWallets();
  const [seed, setSeed] = useState(null);
  const [type, setType] = useState(null);
  const { width: deviceWidth } = useDimensions();
  let wordSectionHeight = 100;

  useEffect(() => {
    const loadSeed = async () => {
      const wallet_id = params?.wallet_id || selectedWallet.id;
      const s = await loadSeedPhraseAndMigrateIfNeeded(wallet_id);
      const walletType = identifyWalletType(s);
      setType(walletType);
      setSeed(s);
    };
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
                  lineHeight={19}
                  size="large"
                  weight="bold"
                >
                  Copy to clipboard
                </Text>
              </RowWithMargins>
            </ButtonPressAnimation>
          )}
        </FloatingEmojis>
      </Row>
      <Row>
        {secretLayout && (
          <Shadow
            height={wordSectionHeight}
            width={deviceWidth - 108}
            borderRadius={16}
            shadows={[
              [0, 10, 30, colors.dark, 0.1],
              [0, 5, 15, colors.dark, 0.04],
            ]}
          >
            <Row margin={19}>{secretLayout}</Row>
          </Shadow>
        )}
      </Row>
    </Centered>
  );
};

export default ShowSecretView;
