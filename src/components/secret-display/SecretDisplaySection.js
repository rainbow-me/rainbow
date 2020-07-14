import { useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import ShadowStack from 'react-native-shadow-stack/dist/ShadowStack';
import styled from 'styled-components';
import WalletTypes from '../../helpers/walletTypes';
import { useWallets } from '../../hooks';
import {
  identifyWalletType,
  loadSeedPhraseAndMigrateIfNeeded,
} from '../../model/wallet';
import { colors, position } from '../../styles';
import { CopyFloatingEmojis } from '../floating-emojis';
import { Icon } from '../icons';
import { Centered, Column, Row, RowWithMargins } from '../layout';
import SecretDisplayItem from '../secret-display/SecretDisplayItem';
import { SheetButton } from '../sheet';
import { Text } from '../text';

const PrivateKeyText = styled(SecretDisplayItem).attrs({
  align: 'center',
  color: 'dark',
  weight: 'semibold',
})`
  padding-horizontal: 30;
`;

const Shadow = styled(ShadowStack)`
  elevation: 15;
  margin-top: 24;
`;

const SecretDisplaySection = ({ onWalletTypeIdentified }) => {
  const { params } = useRoute();
  const { selectedWallet } = useWallets();
  const [error, setError] = useState(false);
  const [seed, setSeed] = useState(null);
  const [type, setType] = useState(null);
  let wordSectionHeight = 100;

  const loadSeed = useCallback(async () => {
    const wallet_id = params?.wallet_id || selectedWallet.id;
    const s = await loadSeedPhraseAndMigrateIfNeeded(wallet_id);
    if (s) {
      const walletType = identifyWalletType(s);
      setType(walletType);
      onWalletTypeIdentified && onWalletTypeIdentified(walletType);
      setSeed(s);
      setError(false);
    } else {
      setError(true);
    }
  }, [onWalletTypeIdentified, params?.wallet_id, selectedWallet.id]);

  useEffect(() => {
    loadSeed();
  }, [loadSeed]);

  let columns = [];
  if (seed && type === WalletTypes.mnemonic) {
    wordSectionHeight = (seed && (seed.split(' ').length || 12) / 2) * 39 + 10;
    const words = seed.split(' ');
    columns = [words.slice(0, words.length / 2), words.slice(words.length / 2)];
  } else if (type === WalletTypes.privateKey) {
    wordSectionHeight = 151;
  }

  return (
    <Centered direction="column">
      {seed && (
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
              width={237}
            >
              <Row marginVertical={19}>
                {type === WalletTypes.privateKey ? (
                  <Column marginLeft={30} marginRight={30}>
                    <PrivateKeyText>{seed}</PrivateKeyText>
                  </Column>
                ) : (
                  columns.map((wordColumn, colIndex) => (
                    <Column
                      key={`col_${colIndex}`}
                      marginLeft={30}
                      marginRight={5}
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
    </Centered>
  );
};

export default SecretDisplaySection;
