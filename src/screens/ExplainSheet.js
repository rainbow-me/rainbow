import { useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { StatusBar, View } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { Centered } from '../components/layout';
import { SheetActionButton, SheetTitle, SlackSheet } from '../components/sheet';
import { Emoji, Text } from '../components/text';
import { useNavigation } from '../navigation/Navigation';
import { useDimensions } from '@rainbow-me/hooks';
import { position } from '@rainbow-me/styles';

const sheetHeight = android ? 420 : 400;

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

const GAS_EXPLAINER = `The network fee is not controlled or received by Rainbow. It is the "gas fee" used by the Ethereum blockchain to validate your transaction. It changes constantly based on supply and demand.`;

const explainers = {
  gas: {
    emoji: '⛽️',
    text: GAS_EXPLAINER,
    title: 'What are network fees?',
  },
};

const SavingsSheet = () => {
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const insets = useSafeArea();
  const { params: { type = 'gas' } = {} } = useRoute();
  const { colors } = useTheme();
  const { goBack } = useNavigation();

  const handleClose = useCallback(() => {
    goBack();
  }, [goBack]);

  return (
    <Container deviceHeight={deviceHeight} height={sheetHeight} insets={insets}>
      {ios && <StatusBar barStyle="light-content" />}

      <SlackSheet
        additionalTopPadding={android}
        contentHeight={sheetHeight}
        scrollEnabled={false}
      >
        <Centered
          direction="column"
          height={sheetHeight}
          testID="add-token-sheet"
          width="100%"
        >
          <View
            style={{
              display: 'flex',
              height: sheetHeight,
              justifyContent: 'space-between',
              padding: 30,
              width: '100%',
            }}
          >
            <Emoji align="center" size="h1">
              {explainers[type].emoji}
            </Emoji>
            <SheetTitle>{explainers[type].title}</SheetTitle>
            <Text
              align="center"
              color={colors.alpha(colors.blueGreyDark, 0.5)}
              lineHeight="paragraphSmall"
              size="lmedium"
            >
              {explainers[type].text}
            </Text>
            <SheetActionButton
              androidWidth={deviceWidth - 60}
              color={colors.white}
              label="Got it"
              onPress={handleClose}
              size="big"
              textColor={colors.alpha(colors.blueGreyDark, 0.8)}
            />
          </View>
        </Centered>
      </SlackSheet>
    </Container>
  );
};

export default React.memo(SavingsSheet);
