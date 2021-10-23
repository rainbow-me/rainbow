import { useRoute } from '@react-navigation/native';
import { toLower } from 'lodash';
import React, { useCallback } from 'react';
import { StatusBar } from 'react-native';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
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
import {
  useAccountSettings,
  useDimensions,
  useUserLists,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { position } from '@rainbow-me/styles';
import { haptics } from '@rainbow-me/utils';

const Container = styled(Centered).attrs({
  direction: 'column',
})`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

const RemoveButton = styled(ButtonPressAnimation)`
  background-color: ${({ theme: { colors } }) =>
    colors.alpha(colors.red, 0.06)};
  border-radius: 15;
  height: 30;
  padding-left: 6;
  padding-right: 10;
  padding-top: 5;
  margin-left: 8;
  top: ${android ? 0 : 2};
`;

const RemoveButtonContent = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.red,
  letterSpacing: 'roundedTight',
  size: 'lmedium',
  weight: 'bold',
}))`
  ${android && 'margin-top: -5px'}
`;

const ListButton = styled(ButtonPressAnimation)`
  padding-bottom: 15;
  padding-top: 15;
`;

const ListEmoji = styled(Emoji).attrs({
  size: 'large',
})`
  margin-top: ${android ? 4 : 1};
  margin-right: 6;
`;

const WRITEABLE_LISTS = ['watchlist', 'favorites'];

export const sheetHeight = android ? 490 - getSoftMenuBarHeight() : 394;

export default function AddTokenSheet() {
  const { goBack } = useNavigation();
  const { height: deviceHeight } = useDimensions();
  const { network } = useAccountSettings();
  const { favorites, lists, updateList } = useUserLists();
  const insets = useSafeArea();
  const {
    params: { item },
  } = useRoute();

  const isTokenInList = useCallback(
    listId => {
      if (listId === 'favorites') {
        return !!favorites.find(
          address => toLower(address) === toLower(item.address)
        );
      } else {
        const list = lists.find(list => list?.id === listId);
        return !!list.tokens.find(
          token => toLower(token) === toLower(item.address)
        );
      }
    },
    [favorites, item.address, lists]
  );

  const { colors } = useTheme();

  return (
    <Container deviceHeight={deviceHeight} height={sheetHeight} insets={insets}>
      {ios && <StatusBar barStyle="light-content" />}
      {ios && <TouchableBackdrop onPress={goBack} />}

      <SlackSheet
        additionalTopPadding={android}
        contentHeight={sheetHeight}
        scrollEnabled={false}
      >
        <Centered direction="column" testID="add-token-sheet">
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
              color={colors.dark}
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
              .filter(list => WRITEABLE_LISTS.indexOf(list?.id) !== -1)
              .map(list => {
                const alreadyAdded = isTokenInList(list?.id);
                const handleAdd = () => {
                  if (alreadyAdded) return;
                  updateList(item.address, list?.id, !alreadyAdded);
                  haptics.notificationSuccess();
                };
                const handleRemove = () => {
                  updateList(item.address, list?.id, false);
                  haptics.notificationSuccess();
                };
                return (
                  <Row align="center" key={`list-${list?.id}`}>
                    <ListButton
                      alreadyAdded={alreadyAdded}
                      onPress={alreadyAdded ? handleRemove : handleAdd}
                      testID={`add-to-${list?.id}`}
                    >
                      <Row>
                        <ListEmoji name={list.emoji} />
                        <Text
                          color={
                            alreadyAdded
                              ? colors.alpha(colors.blueGreyDark, 0.6)
                              : colors.appleBlue
                          }
                          size="larger"
                          weight="bold"
                        >
                          {list.name}
                        </Text>
                      </Row>
                    </ListButton>
                    {alreadyAdded && (
                      <RemoveButton
                        onPress={handleRemove}
                        testID={`remove-from-${list?.id}`}
                      >
                        <RemoveButtonContent>􀈔 Remove</RemoveButtonContent>
                      </RemoveButton>
                    )}
                  </Row>
                );
              })}
          </Column>

          <SheetActionButtonRow>
            <SheetActionButton
              color={colors.white}
              fullWidth
              label="Cancel"
              onPress={goBack}
              size="big"
              testID="close"
              textColor={colors.alpha(colors.blueGreyDark, 0.8)}
              weight="bold"
            />
          </SheetActionButtonRow>
        </Centered>
      </SlackSheet>
    </Container>
  );
}
