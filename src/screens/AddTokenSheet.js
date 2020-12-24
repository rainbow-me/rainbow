import { useRoute } from '@react-navigation/native';
import React from 'react';
import { StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
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
  margin-bottom: 30;
`;

const ListName = styled(Text)`
  margin-left: 5px;
  margin-top: -5px;
`;

const WRITEABLE_LISTS = ['watchlist', 'favorites', 'defi'];

export const sheetHeight = android ? 410 : 500;

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
        <Centered direction="column" paddingTop={9}>
          <Column marginTop={24}>
            <CoinIcon address={item.address} size={50} symbol={item.symbol} />
          </Column>
          <Column marginBottom={5} marginTop={14}>
            <Text
              color={colors.alpha(colors.blueGreyDark, 0.8)}
              lineHeight="loose"
              size="large"
              weight="regular"
            >
              {item.name}
            </Text>
          </Column>
          <Column marginBottom={50}>
            <Text
              color={colors.blueGreyDarker}
              lineHeight="paragraphSmall"
              size="larger"
              weight="bold"
            >
              Add to List
            </Text>
          </Column>

          {DefaultTokenLists[network]
            .filter(list => WRITEABLE_LISTS.indexOf(list.id) !== -1)
            .map(list => (
              <ListButton key={`list-${list.id}`} onPress={() => null}>
                <Row>
                  <Emoji name={list.emoji} size="smedium" />
                  <ListName
                    color={colors.appleBlue}
                    lineHeight="paragraphSmall"
                    size="larger"
                    weight="bold"
                  >
                    {list.name}
                  </ListName>
                </Row>
              </ListButton>
            ))}
          <SheetActionButtonRow>
            <SheetActionButton
              color={colors.white}
              label="Cancel"
              onPress={goBack}
              size="big"
              textColor={colors.alpha(colors.blueGreyDark, 0.8)}
              weight="heavy"
            />
          </SheetActionButtonRow>
        </Centered>
      </SlackSheet>
    </Container>
  );
}
