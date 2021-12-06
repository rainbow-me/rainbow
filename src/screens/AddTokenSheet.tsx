import { useRoute } from '@react-navigation/native';
import { toLower } from 'lodash';
import React, { useCallback } from 'react';
import { StatusBar } from 'react-native';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Divider' was resolved to '/U... Remove this comment to see the full error message
import Divider from '../components/Divider';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/TouchableBackdrop' was resol... Remove this comment to see the full error message
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
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
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
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  top: ${android ? 0 : 2};
`;

const RemoveButtonContent = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.red,
  letterSpacing: 'roundedTight',
  size: 'lmedium',
  weight: 'bold',
}))`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${android && 'margin-top: -5px'}
`;

const ListButton = styled(ButtonPressAnimation)`
  padding-bottom: 15;
  padding-top: 15;
`;

const ListEmoji = styled(Emoji).attrs({
  size: 'large',
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  margin-top: ${android ? 4 : 1};
  margin-right: 6;
`;

const WRITEABLE_LISTS = ['watchlist', 'favorites'];

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
export const sheetHeight = android ? 490 - getSoftMenuBarHeight() : 394;

export default function AddTokenSheet() {
  const { goBack } = useNavigation();
  const { height: deviceHeight } = useDimensions();
  const { network } = useAccountSettings();
  const { favorites, lists, updateList } = useUserLists();
  const insets = useSafeArea();
  const {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'item' does not exist on type 'Readonly<o... Remove this comment to see the full error message
    params: { item },
  } = useRoute();

  const isTokenInList = useCallback(
    listId => {
      if (listId === 'favorites') {
        return !!favorites.find(
          (address: any) => toLower(address) === toLower(item.address)
        );
      } else {
        const list = lists.find((list: any) => list?.id === listId);
        return !!list.tokens.find(
          (token: any) => toLower(token) === toLower(item.address)
        );
      }
    },
    [favorites, item.address, lists]
  );

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container deviceHeight={deviceHeight} height={sheetHeight} insets={insets}>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      {ios && <StatusBar barStyle="light-content" />}
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      {ios && <TouchableBackdrop onPress={goBack} />}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SlackSheet
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        additionalTopPadding={android}
        contentHeight={sheetHeight}
        scrollEnabled={false}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Centered direction="column" testID="add-token-sheet">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Column marginTop={16}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <CoinIcon address={item.address} size={50} symbol={item.symbol} />
          </Column>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Column marginBottom={4} marginTop={12}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Column marginBottom={24}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Centered marginBottom={9}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Divider color={colors.rowDividerExtraLight} inset={[0, 143.5]} />
          </Centered>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Column align="center" marginBottom={8}>
            {DefaultTokenLists[network]
              .filter((list: any) => WRITEABLE_LISTS.indexOf(list?.id) !== -1)
              .map((list: any) => {
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
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Row align="center" key={`list-${list?.id}`}>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <ListButton
                      alreadyAdded={alreadyAdded}
                      onPress={alreadyAdded ? handleRemove : handleAdd}
                      testID={`add-to-${list?.id}`}
                    >
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                      JSX unless the '--jsx' flag is provided... Remove this
                      comment to see the full error message
                      <Row>
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                        JSX unless the '--jsx' flag is provided... Remove this
                        comment to see the full error message
                        <ListEmoji name={list.emoji} />
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                        JSX unless the '--jsx' flag is provided... Remove this
                        comment to see the full error message
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
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <RemoveButton
                        onPress={handleRemove}
                        testID={`remove-from-${list?.id}`}
                      >
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                        JSX unless the '--jsx' flag is provided... Remove this
                        comment to see the full error message
                        <RemoveButtonContent>􀈔 Remove</RemoveButtonContent>
                      </RemoveButton>
                    )}
                  </Row>
                );
              })}
          </Column>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SheetActionButtonRow>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <SheetActionButton
              color={colors.white}
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
