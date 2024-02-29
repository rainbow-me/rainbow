import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import { useTheme } from '../../theme/ThemeContext';
import { deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import { isL2Network } from '@/handlers/web3';
import { useColorForAsset } from '@/hooks';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import RainbowCoinIcon from '../coin-icon/RainbowCoinIcon';

const isSmallPhone = android || deviceUtils.dimensions.height <= 667;
const isTinyPhone = deviceUtils.dimensions.height <= 568;
const selectedHeight = isTinyPhone ? 50 : android || isSmallPhone ? 64 : 70;

const containerStyles = {
  paddingTop: android ? 9 : 19,
};

const NativeAmountBubble = styled(LinearGradient).attrs(({ theme: { colors } }) => ({
  colors: colors.gradients.lighterGrey,
  end: { x: 0.5, y: 1 },
  start: { x: 0, y: 0 },
}))({
  borderRadius: 15,
  height: 30,
});

const NativeAmountBubbleText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  letterSpacing: 'roundedTight',
  size: 'lmedium',
  weight: 'bold',
}))(android ? padding.object(0, 10) : padding.object(4.5, 10, 6.5));

const BottomRow = ({ balance, native, nativeCurrencySymbol, selected, showNativeValue }) => {
  const { colors } = useTheme();
  const fiatValue = native?.balance?.display ?? `${nativeCurrencySymbol}0.00`;

  return (
    <Text
      color={selected ? colors.alpha(colors.blueGreyDark, 0.6) : colors.alpha(colors.blueGreyDark, 0.5)}
      letterSpacing="roundedMedium"
      numberOfLines={1}
      size="smedium"
      weight={selected ? 'bold' : 'regular'}
    >
      {showNativeValue
        ? `${fiatValue} available`
        : balance?.display
          ? `${balance?.display}${selected ? ' available' : ''}`
          : 'Fetching balances...'}
    </Text>
  );
};

const TopRow = ({ item, name, selected }) => {
  const { colors } = useTheme();
  const colorForAsset = useColorForAsset(item);

  return (
    <CoinName
      color={selected ? colorForAsset || colors.dark : colors.dark}
      size={selected ? 'large' : 'lmedium'}
      style={{
        marginBottom: android && selected ? -3 : 0,
        marginTop: android && selected ? 3 : 0,
      }}
      weight={selected ? 'bold' : 'regular'}
    >
      {name}
    </CoinName>
  );
};

const buildSendCoinRowIdentifier = props => {
  const uniqueId = buildAssetUniqueIdentifier(props.item);
  return [uniqueId, !!props?.showNativeValue];
};

const SendCoinRow = ({
  children,
  disablePressAnimation,
  item,
  native,
  onPress,
  rowHeight,
  selected,
  showNativeValue,
  testID,
  ...props
}) => {
  const theme = useTheme();
  const fiatValue = native?.balance?.display;
  const chopCents = fiatValue && fiatValue.split('.')[0].replace(/\D/g, '') > 100;
  // TODO i18n: relying on dots and commas for currency separator does not
  // scale to other locales than US-en.
  const fiatValueFormatted = !!fiatValue && chopCents ? fiatValue.replace(/\.\d+/, '') : fiatValue;

  const Wrapper = disablePressAnimation ? TouchableWithoutFeedback : ButtonPressAnimation;

  const isL2 = useMemo(() => {
    return isL2Network(item?.network);
  }, [item?.network]);

  const containerSelectedStyles = {
    height: selectedHeight,
    ...(isTinyPhone
      ? padding.object(10, 0, 0)
      : isSmallPhone
        ? padding.object(12, 12, 12, isL2 ? 17 : 12)
        : padding.object(15, 15, 15, isL2 ? 19 : 15)),
  };

  return (
    <Wrapper height={rowHeight} onPress={onPress} scaleTo={0.96}>
      <CoinRow
        {...item}
        {...props}
        mainnetAddress={item?.mainnet_address}
        icon={item?.icon_url}
        colors={item?.colors}
        badgeYPosition={0}
        bottomRowRender={BottomRow}
        containerStyles={selected ? containerSelectedStyles : containerStyles}
        coinIconRender={RainbowCoinIcon}
        isHidden={false}
        item={item}
        selected={selected}
        showNativeValue={showNativeValue}
        testID={testID}
        topRowRender={TopRow}
        theme={theme}
      >
        {selected || !fiatValue ? (
          children
        ) : (
          <NativeAmountBubble>
            <NativeAmountBubbleText>{fiatValueFormatted}</NativeAmountBubbleText>
          </NativeAmountBubble>
        )}
      </CoinRow>
    </Wrapper>
  );
};

SendCoinRow.displayName = 'SendCoinRow';
SendCoinRow.selectedHeight = selectedHeight;

export default SendCoinRow;
