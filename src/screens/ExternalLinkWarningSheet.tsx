import { RouteProp, useRoute } from '@react-navigation/native';
import * as i18n from '@/languages';
import React, { useCallback } from 'react';
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
import { openInBrowser } from '@/utils/openInBrowser';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
export const ExternalLinkWarningSheetHeight = 380 + (IS_ANDROID ? 20 : 0);

const Container = styled(Centered).attrs({ direction: 'column' })(({ deviceHeight, height }) => ({
  ...position.coverAsObject,
  ...(height ? { height: height + deviceHeight } : {}),
}));

const ExternalLinkWarningSheet = () => {
  const { height: deviceHeight } = useDimensions();
  const insets = useSafeAreaInsets();
  const {
    params: { url, onClose },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.EXTERNAL_LINK_WARNING_SHEET>>();
  const { colors } = useTheme();
  const { goBack } = useNavigation();

  const handleClose = useCallback(() => {
    goBack();
    onClose?.();
  }, [onClose, goBack]);

  const handleLink = useCallback(() => {
    goBack();
    onClose?.();
    openInBrowser(url);
  }, [goBack, onClose, url]);

  return (
    <Container deviceHeight={deviceHeight} height={ExternalLinkWarningSheetHeight} insets={insets}>
      <SlackSheet additionalTopPadding contentHeight={ExternalLinkWarningSheetHeight} scrollEnabled={false}>
        <Centered direction="column" height={ExternalLinkWarningSheetHeight} width="100%">
          <ColumnWithMargins
            margin={15}
            style={{
              height: ExternalLinkWarningSheetHeight,
              padding: 19,
              width: '100%',
            }}
          >
            <Emoji align="center" size="h1" style={{ ...fontWithWidth(fonts.weight.bold) }}>
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
              {i18n.t(i18n.l.modal.external_link_warning.visit_external_link)}
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
              {i18n.t(i18n.l.modal.external_link_warning.you_are_attempting_to_visit)}
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
              label={i18n.t(i18n.l.modal.external_link_warning.go_back)}
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
