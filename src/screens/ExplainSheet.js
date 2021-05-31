import { useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { Centered, ColumnWithMargins } from '../components/layout';
import { SheetActionButton, SheetTitle, SlackSheet } from '../components/sheet';
import { Emoji, Text } from '../components/text';
import { useNavigation } from '../navigation/Navigation';
import { useDimensions } from '@rainbow-me/hooks';
import { position } from '@rainbow-me/styles';

export const ExplainSheetHeight = android ? 454 : 434;

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

const GAS_EXPLAINER = `This is the "gas fee" used by the Ethereum blockchain to securely validate your transaction.

This fee varies depending on the complexity of your transaction and how busy the network is!`;

const explainers = {
  gas: {
    emoji: '⛽️',
    text: GAS_EXPLAINER,
    title: 'Ethereum network fee',
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
    <Container
      deviceHeight={deviceHeight}
      height={ExplainSheetHeight}
      insets={insets}
    >
      {ios && <StatusBar barStyle="light-content" />}

      <SlackSheet
        additionalTopPadding={android}
        contentHeight={ExplainSheetHeight}
        scrollEnabled={false}
      >
        <Centered
          direction="column"
          height={ExplainSheetHeight}
          testID="add-token-sheet"
          width="100%"
        >
          <ColumnWithMargins
            margin={15}
            style={{
              height: ExplainSheetHeight,
              paddingHorizontal: 19,
              paddingTop: 19,
              width: '100%',
            }}
          >
            <Emoji align="center" size="h1">
              {explainers[type].emoji}
            </Emoji>
            <SheetTitle size="big" weight="heavy">
              {explainers[type].title}
            </SheetTitle>
            <Text
              align="center"
              color={colors.alpha(colors.blueGreyDark, 0.6)}
              lineHeight="looser"
              size="large"
              style={{
                alignSelf: 'center',
                maxWidth: 376,
                paddingBottom: 15,
                paddingHorizontal: 23,
              }}
            >
              {explainers[type].text}
            </Text>
            <SheetActionButton
              androidWidth={deviceWidth - 60}
              color={colors.alpha(colors.appleBlue, 0.06)}
              isTransparent
              label="Got it"
              onPress={handleClose}
              size="big"
              textColor={colors.appleBlue}
              weight="heavy"
            />
          </ColumnWithMargins>
        </Centered>
      </SlackSheet>
    </Container>
  );
};

export default React.memo(SavingsSheet);
