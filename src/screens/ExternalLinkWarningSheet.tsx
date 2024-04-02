import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { Centered, Column, ColumnWithMargins } from '../components/layout';
import { SheetActionButton, SheetTitle, SlackSheet } from '../components/sheet';
import { Emoji, Text } from '../components/text';
import { useNavigation } from '../navigation/Navigation';
import { useDimensions } from '@/hooks';
import { fonts, fontWithWidth, position } from '@/styles';
import { useTheme } from '@/theme';
import { formatURLForDisplay } from '@/utils';
import { IS_ANDROID } from '@/env';

export const ExternalLinkWarningSheetHeight = 380 + (android ? 20 : 0);

const Container = styled(Centered).attrs({ direction: 'column' })(({ deviceHeight, height }) => ({
  ...position.coverAsObject,
  ...(height ? { height: height + deviceHeight } : {}),
}));

const ExternalLinkWarningSheet = () => {
  const { height: deviceHeight } = useDimensions();
  const insets = useSafeAreaInsets();
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

  return (
    <Container deviceHeight={deviceHeight} height={ExternalLinkWarningSheetHeight} insets={insets}>
      <SlackSheet additionalTopPadding={IS_ANDROID} contentHeight={ExternalLinkWarningSheetHeight} scrollEnabled={false}>
        <Centered direction="column" height={ExternalLinkWarningSheetHeight} width="100%">
          <ColumnWithMargins
            margin={15}
            style={{
              height: ExternalLinkWarningSheetHeight,
              padding: 19,
              width: '100%',
            }}
          >
            <Emoji
              align="center"
              size="h1"
              style={{ ...fontWithWidth(fonts.weight.bold) }}
              // @ts-expect-error JavaScript component
            >
              🧭
            </Emoji>
            <SheetTitle
              align="center"
              lineHeight="big"
              numberOfLines={1}
              // @ts-expect-error JavaScript component
              size="big"
              weight="heavy"
            >
              {lang.t('modal.external_link_warning.visit_external_link')}
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
              {lang.t('modal.external_link_warning.you_are_attempting_to_visit')}
            </Text>

            <Column height={60}>
              <SheetActionButton
                color={colors.alpha(colors.appleBlue, 0.04)}
                isTransparent
                label={`Visit ${formatURLForDisplay(url)}`}
                onPress={handleLink}
                size="big"
                textColor={colors.appleBlue}
                truncate
                weight="heavy"
              />
            </Column>
            <SheetActionButton
              color={colors.blueGreyDarkLight}
              isTransparent
              label={lang.t('modal.external_link_warning.go_back')}
              onPress={handleClose}
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
