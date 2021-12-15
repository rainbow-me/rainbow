import { useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { Linking, StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { Centered, Column, ColumnWithMargins } from '../components/layout';
import { SheetActionButton, SheetTitle, SlackSheet } from '../components/sheet';
import { Emoji, Text } from '../components/text';
import { useNavigation } from '../navigation/Navigation';
import { useTheme } from '@rainbow-me/context';
import { useDimensions } from '@rainbow-me/hooks';
import { fonts, fontWithWidth, position } from '@rainbow-me/styles';
import { formatURLForDisplay } from '@rainbow-me/utils';

export const ExternalLinkWarningSheetHeight = 380 + (android ? 20 : 0);

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

const ExternalLinkWarningSheet = () => {
  const { height: deviceHeight } = useDimensions();
  const insets = useSafeArea();
  // @ts-expect-error
  const { params: { url, onClose } = {} } = useRoute();
  const { colors } = useTheme();
  const { goBack } = useNavigation();

  const handleClose = useCallback(() => {
    goBack();
    onClose?.();
  }, [onClose, goBack]);

  const handleLink = useCallback(() => {
    goBack();
    onClose?.();
    Linking.openURL(url);
  }, [onClose, goBack, url]);

  const EmojiText = Emoji;
  const Title = SheetTitle;

  const sheetHeight = ExternalLinkWarningSheetHeight;

  return (
    <Container deviceHeight={deviceHeight} height={sheetHeight} insets={insets}>
      {ios && <StatusBar barStyle="light-content" />}

      {/* @ts-expect-error JavaScript component */}
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
          <ColumnWithMargins
            margin={15}
            style={{
              height: sheetHeight,
              padding: 19,
              width: '100%',
            }}
          >
            {/* @ts-expect-error JavaScript component */}
            <EmojiText
              align="center"
              size="h1"
              style={{ ...fontWithWidth(fonts.weight.bold) }}
            >
              🧭
            </EmojiText>
            <Title
              align="center"
              lineHeight="big"
              numberOfLines={1}
              size="big"
              weight="heavy"
            >
              Visit external link?
            </Title>

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
              You are attempting to visit a link that is not affiliated with
              Rainbow.
            </Text>

            <Column height={60}>
              <SheetActionButton
                color={colors.alpha(colors.appleBlue, 0.04)}
                isTransparent
                // @ts-expect-error
                label={`Visit ${formatURLForDisplay(url)}`}
                onPress={handleLink}
                // @ts-expect-error
                size="big"
                textColor={colors.appleBlue}
                truncate
                weight="heavy"
              />
            </Column>
            <SheetActionButton
              color={colors.blueGreyDarkLight}
              isTransparent
              // @ts-expect-error
              label="Go back"
              onPress={handleClose}
              // @ts-expect-error
              size="big"
              textColor={colors.blueGreyDark60}
              weight="heavy"
            />
          </ColumnWithMargins>
        </Centered>
      </SlackSheet>
    </Container>
  );
};

export default React.memo(ExternalLinkWarningSheet);
