import React, { useCallback, useEffect, useState } from 'react';
import ShadowStack from 'react-native-shadow-stack/dist/ShadowStack';
import { useNavigation } from 'react-navigation-hooks';
import { useClipboard, useDimensions, useWallets } from '../../hooks';
import { loadSeedPhraseAndMigrateIfNeeded } from '../../model/wallet';
import { colors, fonts, padding, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { FloatingEmojis } from '../floating-emojis';
import { Icon } from '../icons';
import {
  Centered,
  Column,
  ColumnWithMargins,
  Row,
  RowWithMargins,
} from '../layout';
import { SheetButton } from '../sheet';
import { Text } from '../text';

const TitleStyle = {
  fontSize: parseFloat(fonts.size.big),
  fontWeight: fonts.weight.bold,
};

const Title = p => <Text {...p} style={TitleStyle} />;

const BackupManualStep = () => {
  const { setClipboard } = useClipboard();
  const { goBack } = useNavigation();
  const { wallets } = useWallets();
  const [seed, setSeed] = useState(null);
  const { width: deviceWidth } = useDimensions();
  const wordSectionHeight = (seed && (seed.split(' ').length || 12) / 2) * 39;

  useEffect(() => {
    const loadSeed = async () => {
      const nonImportedWalletId = Object.keys(wallets).find(
        key => wallets[key].imported === false
      );
      const s = await loadSeedPhraseAndMigrateIfNeeded(nonImportedWalletId);
      setSeed(s);
      console.log('seed', s);
    };
    loadSeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onComplete = useCallback(() => {
    goBack();
  }, [goBack]);
  let columns = [];
  if (seed) {
    const words = seed.split(' ');
    columns = [words.slice(0, words.length / 2), words.slice(words.length / 2)];
  }

  return (
    <Centered direction="column" paddingTop={9} paddingBottom={15}>
      <Row marginBottom={12} marginTop={15}>
        <Text
          align="center"
          angle={false}
          letterSpacing="roundedTight"
          weight="bold"
          size={48}
          color={colors.appleBlue}
        >
          􀉆
        </Text>
      </Row>
      <Row marginBottom={12}>
        <Title>Back up manually </Title>
      </Row>
      <Text
        align="center"
        color={colors.alpha(colors.blueGreyDark, 0.5)}
        lineHeight="looser"
        size="large"
        style={{ paddingBottom: 65, paddingHorizontal: 50 }}
      >
        <Text
          weight="500"
          size="large"
          color={colors.alpha(colors.blueGreyDark, 0.5)}
          lineHeight="looser"
        >
          These words are the keys to your wallet!
        </Text>
        &nbsp;Write them down or save them in your password manager.
      </Text>
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
        <ShadowStack
          height={wordSectionHeight}
          width={deviceWidth - 130}
          borderRadius={16}
          shadows={[
            [0, 10, 30, colors.dark, 0.1],
            [0, 5, 15, colors.dark, 0.04],
          ]}
          style={{ elevation: 15, marginBottom: 85, marginTop: 19 }}
        >
          <Row margin={19}>
            {seed &&
              columns.map((wordColumn, colIndex) => (
                <Column
                  // eslint-disable-next-line react/no-array-index-key
                  key={`col_${colIndex}`}
                  marginLeft={11}
                  marginRight={11}
                >
                  {wordColumn.map((word, index) => (
                    <Text
                      align="left"
                      color={colors.alpha(colors.appleBlue, 1)}
                      lineHeight="looser"
                      size="lmedium"
                      style={{ marginBottom: 9 }}
                      // eslint-disable-next-line react/no-array-index-key
                      key={`word_${index}`}
                    >
                      {index + 1 + colIndex * wordColumn.length} &nbsp;
                      <Text
                        align="center"
                        color={colors.alpha(colors.blueGreyDark, 1)}
                        lineHeight="looser"
                        size="lmedium"
                        weight="bold"
                        style={{ paddingBottom: 30, paddingHorizontal: 50 }}
                      >
                        {word}
                      </Text>
                    </Text>
                  ))}
                </Column>
              ))}
          </Row>
        </ShadowStack>
      </Row>

      <ColumnWithMargins css={padding(19, 15)} margin={19} width="100%">
        <SheetButton
          color={colors.appleBlue}
          label="􀁣 I’ve saved these words"
          onPress={onComplete}
        />
      </ColumnWithMargins>
    </Centered>
  );
};

export default BackupManualStep;
