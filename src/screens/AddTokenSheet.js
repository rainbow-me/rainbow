import { useRoute } from '@react-navigation/native';
import React from 'react';
import { StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import Divider from '../components/Divider';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { ButtonPressAnimation } from '../components/animations';
import { CoinIcon } from '../components/coin-icon';
import { Centered, Column, Row } from '../components/layout';
import {
  SheetActionButton,
  SheetActionButtonRow,
  SlackSheet,
} from '../components/sheet';
import { Emoji, Text } from '../components/text';
import { DefaultTokenLists } from '../references/';
import { useAccountSettings, useDimensions } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { colors, position } from '@rainbow-me/styles';

const Container = styled(Centered).attrs({
  direction: 'column',
})`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

const ListButton = styled(ButtonPressAnimation)`
  padding-bottom: 15;
  padding-top: 15;
`;

const ListEmoji = styled(Emoji).attrs({
  size: 'large',
})`
  margin-top: 1;
`;

const ListName = styled(Text).attrs({
  color: colors.appleBlue,
  size: 'larger',
  weight: 'bold',
})`
  margin-left: 6;
`;

const WRITEABLE_LISTS = ['watchlist', 'favorites', 'defi'];

export const sheetHeight = android ? 410 : 448;

export default function AddTokenSheet() {
  const { goBack } = useNavigation();
  const { height: deviceHeight } = useDimensions();
  const { network } = useAccountSettings();
  const insets = useSafeArea();
  const {
    params: { item },
  } = useRoute();

  return (
    <Container deviceHeight={deviceHeight} height={sheetHeight} insets={insets}>
      {ios && <StatusBar barStyle="light-content" />}
      {ios && <TouchableBackdrop onPress={goBack} />}

      <SlackSheet
        additionalTopPadding={android}
        contentHeight={sheetHeight}
        scrollEnabled={false}
      >
        <Centered direction="column">
          <Column marginTop={16}>
            <CoinIcon address={item.address} size={50} symbol={item.symbol} />
          </Column>
          <Column marginBottom={4} marginTop={12}>
            <Text
              align="center"
              color={colors.alpha(colors.blueGreyDark, 0.8)}
              letterSpacing="roundedMedium"
              size="large"
              weight="bold"
            >
              {item.name}
            </Text>
          </Column>
          <Column marginBottom={24}>
            <Text
              align="center"
              color={colors.blueGreyDarker}
              letterSpacing="roundedMedium"
              size="larger"
              weight="heavy"
            >
              Add to List
            </Text>
          </Column>

          <Centered marginBottom={9}>
            <Divider color={colors.rowDividerExtraLight} inset={[0, 143.5]} />
          </Centered>

          <Column align="center" marginBottom={8}>
            {DefaultTokenLists[network]
              .filter(list => WRITEABLE_LISTS.indexOf(list.id) !== -1)
              .map(list => (
                <ListButton key={`list-${list.id}`} onPress={() => null}>
                  <Row>
                    <ListEmoji name={list.emoji} />
                    <ListName>{list.name}</ListName>
                  </Row>
                </ListButton>
              ))}
          </Column>

          <SheetActionButtonRow>
            <SheetActionButton
              color={colors.white}
              fullWidth
              label="Cancel"
              onPress={goBack}
              size="big"
              textColor={colors.alpha(colors.blueGreyDark, 0.8)}
              weight="bold"
            />
          </SheetActionButtonRow>
        </Centered>
      </SlackSheet>
    </Container>
  );
}
