import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import ShadowStack from 'react-native-shadow-stack/dist/ShadowStack';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import WalletBackupTypes from '../../helpers/walletBackupTypes';
import WalletTypes from '../../helpers/walletTypes';
import { useClipboard, useDimensions, useWallets } from '../../hooks';
import {
  identifyWalletType,
  loadSeedPhraseAndMigrateIfNeeded,
} from '../../model/wallet';
import { setWalletBackedUp } from '../../redux/wallets';
import { colors, padding, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { FloatingEmojis } from '../floating-emojis';
import { Icon } from '../icons';
import { Centered, Column, Row, RowWithMargins } from '../layout';
import { SheetActionButton } from '../sheet';
import { Text } from '../text';

const Title = styled(Text).attrs({
  size: 'big',
  weight: 'bold',
})`
  margin-bottom: 12;
`;
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

const TopIcon = styled(Text).attrs({
  align: 'center',
  color: 'appleBlue',
  size: 48,
  weight: 'bold',
})``;

const SeedWordNumberText = styled(Text).attrs({
  align: 'left',
  color: 'appleBlue',
  lineHeight: 'looser',
  size: 'lmedium',
})``;

const SeedWordText = styled(Text).attrs({
  align: 'left',
  color: 'blueGreyDark',
  lineHeight: 'looser',
  size: 'lmedium',
  weight: 'bold',
})``;

const DescriptionText = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'looser',
  size: 'large',
})``;

const ImportantText = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'looser',
  size: 'large',
  weight: '600',
})``;

const Shadow = styled(ShadowStack)`
  elevation: 15;
  margin-bottom: 85;
  margin-top: 19;
`;

const BackupManualStep = () => {
  const { selectedWallet } = useWallets();
  const { setClipboard } = useClipboard();
  const dispatch = useDispatch();
  const { goBack } = useNavigation();
  const { params } = useRoute();
  const [seed, setSeed] = useState(null);
  const [type, setType] = useState(null);
  const walletId = params?.wallet_id || selectedWallet.id;
  const { width: deviceWidth } = useDimensions();
  let wordSectionHeight = 100;

  useEffect(() => {
    const loadSeed = async () => {
      const s = await loadSeedPhraseAndMigrateIfNeeded(walletId);
      const walletType = identifyWalletType(s);
      setType(walletType);
      setSeed(s);
    };
    loadSeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onComplete = useCallback(async () => {
    await dispatch(setWalletBackedUp(walletId, WalletBackupTypes.manual));
    goBack();
  }, [dispatch, goBack, walletId]);

  let columns = [];
  let secretLayout = null;
  if (seed && type === WalletTypes.mnemonic) {
    wordSectionHeight = (seed && (seed.split(' ').length || 12) / 2) * 41;
    const words = seed.split(' ');
    columns = [words.slice(0, words.length / 2), words.slice(words.length / 2)];
    secretLayout = columns.map((wordColumn, colIndex) => (
      <Column key={`col_${colIndex}`} marginLeft={30} marginRight={30}>
        {wordColumn.map((word, index) => (
          <RowWithMargins marginBottom={9} key={`word_${index}`}>
            <SeedWordNumberText>
              {index + 1 + colIndex * wordColumn.length} &nbsp;
              <SeedWordText>{word}</SeedWordText>
            </SeedWordNumberText>
          </RowWithMargins>
        ))}
      </Column>
    ));
  } else if (type === WalletTypes.privateKey) {
    wordSectionHeight = 150;
    secretLayout = <PrivateKeyText>{seed}</PrivateKeyText>;
  }

  return (
    <Centered direction="column" paddingBottom={15}>
      <Row marginBottom={12} marginTop={15}>
        <TopIcon>􀉆</TopIcon>
      </Row>
      <Title>Back up manually</Title>
      <Row paddingBottom={65} paddingHorizontal={60}>
        <DescriptionText>
          <ImportantText>
            {type === WalletTypes.privateKey
              ? `This is the key to your wallet!`
              : `These words are the keys to your wallet!`}
          </ImportantText>
          &nbsp;
          {type === WalletTypes.privateKey
            ? `Copy it and save it in your password manager, or in another secure spot.`
            : `Write them down or save them in your password manager.`}
        </DescriptionText>
      </Row>
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
                justify="start"
                margin={6}
                paddingBottom={5}
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
        <Shadow
          height={wordSectionHeight}
          width={deviceWidth - 130}
          borderRadius={25}
          shadows={[
            [0, 10, 30, colors.dark, 0.1],
            [0, 5, 15, colors.dark, 0.04],
          ]}
        >
          <Row margin={19}>{secretLayout}</Row>
        </Shadow>
      </Row>

      <Column css={padding(0, 15)} width="100%">
        <SheetActionButton
          color={colors.appleBlue}
          label={`􀁣 I’ve saved ${
            type === WalletTypes.privateKey ? 'my key' : 'these words'
          }`}
          onPress={onComplete}
          size="big"
          weight="bold"
        />
      </Column>
    </Centered>
  );
};

export default BackupManualStep;
