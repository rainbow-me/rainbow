import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { haptics } from '@/utils';
import { useDispatch, useSelector } from 'react-redux';
import { uniswapUpdateFavorites } from '../redux/uniswap';

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

const uniswapFavoritesSelector = state => state.uniswap.favorites;

export default function AddTokenSheet() {
  const { goBack } = useNavigation();
  const { height: deviceHeight } = useDimensions();
  const dispatch = useDispatch();
  const favorites = useSelector(uniswapFavoritesSelector);
  const insets = useSafeAreaInsets();
  const {
    params: { item, isL2 },
  } = useRoute();

  const isTokenInFavorites = useMemo(
    () =>
      !!favorites?.find(
        address => address.toLowerCase() === item?.address?.toLowerCase()
      ),
    [favorites, item.address]
  );

  const handleAdd = useCallback(() => {
    if (isTokenInFavorites) return;
    dispatch(uniswapUpdateFavorites(item.address, true));
    haptics.notificationSuccess();
  }, [dispatch, isTokenInFavorites, item.address]);

  const handleRemove = useCallback(() => {
    dispatch(uniswapUpdateFavorites(item.address, false));
    haptics.notificationSuccess();
  }, [dispatch, item.address]);

  const { colors } = useTheme();

  return (
    <Container deviceHeight={deviceHeight} height={sheetHeight} insets={insets}>
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
            <Row align="center" key={`list-favorites`}>
              <ListButton
                alreadyAdded={isTokenInFavorites}
                onPress={isTokenInFavorites ? handleRemove : handleAdd}
                testID={`add-to-favorites`}
              >
                <Row>
                  <ListEmoji name="star" />
                  <Text
                    color={
                      isTokenInFavorites
                        ? colors.alpha(colors.blueGreyDark, 0.6)
                        : colors.appleBlue
                    }
                    size="larger"
                    weight="bold"
                  >
                    {lang.t('button.favorites')}
                  </Text>
                </Row>
              </ListButton>
              {isTokenInFavorites && (
                <RemoveButton
                  onPress={handleRemove}
                  testID={`remove-from-favorites`}
                >
                  <RemoveButtonContent>
                    􀈔 {lang.t('button.remove')}
                  </RemoveButtonContent>
                </RemoveButton>
              )}
            </Row>
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
