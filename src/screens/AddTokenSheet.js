import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { StatusBar } from 'react-native';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { useSafeArea } from 'react-native-safe-area-context';
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
import { useAccountSettings, useDimensions, useUserLists } from '@/hooks';
import { useNavigation } from '@/navigation';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { haptics } from '@/utils';

const Container = styled(Centered).attrs({
  direction: 'column',
})(({ deviceHeight, height }) => ({
  ...position.coverAsObject,
  ...(height ? { height: height + deviceHeight } : {}),
}));

const RemoveButton = styled(ButtonPressAnimation)({
  backgroundColor: ({ theme: { colors } }) => colors.alpha(colors.red, 0.06),
  borderRadius: 15,
  height: 30,
  marginLeft: 8,
  paddingLeft: 6,
  paddingRight: 10,
  paddingTop: 5,
  top: android ? 0 : 2,
});

const RemoveButtonContent = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.red,
  letterSpacing: 'roundedTight',
  size: 'lmedium',
  weight: 'bold',
}))(android ? { marginTop: -5 } : {});

const ListButton = styled(ButtonPressAnimation)({
  paddingBottom: 15,
  paddingTop: 15,
});

const ListEmoji = styled(Emoji).attrs({
  size: 'large',
})({
  marginRight: 6,
  marginTop: android ? 4 : 1,
});

export const sheetHeight = android ? 490 - getSoftMenuBarHeight() : 394;

export default function AddTokenSheet() {
  const { goBack } = useNavigation();
  const { height: deviceHeight } = useDimensions();
  const { network } = useAccountSettings();
  const { favorites, lists, updateList } = useUserLists();
  const insets = useSafeArea();
  const {
    params: { item, isL2 },
  } = useRoute();
  const writeableLists = isL2 ? ['watchlist'] : ['watchlist', 'favorites'];

  const isTokenInList = useCallback(
    listId => {
      if (listId === 'favorites') {
        return !!favorites?.find(
          address => address.toLowerCase() === item?.address?.toLowerCase()
        );
      } else {
        const list = lists?.find(list => list?.id === listId);
        return !!list?.tokens?.find(
          token => token.toLowerCase() === item?.address?.toLowerCase()
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
            <CoinIcon
              address={item.address}
              size={50}
              symbol={item.symbol}
              type={item.type}
            />
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
              {lang.t('button.add_to_list')}
            </Text>
          </Column>

          <Centered marginBottom={9}>
            <Divider color={colors.rowDividerExtraLight} inset={[0, 143.5]} />
          </Centered>

          <Column align="center" marginBottom={isL2 ? 63 : 8}>
            {DefaultTokenLists[network]
              .filter(list => writeableLists.includes(list?.id))
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
                        <RemoveButtonContent>
                          􀈔 {lang.t('button.remove')}
                        </RemoveButtonContent>
                      </RemoveButton>
                    )}
                  </Row>
                );
              })}
          </Column>

          <SheetActionButtonRow>
            <SheetActionButton
              color={colors.white}
              label={lang.t('button.cancel')}
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
