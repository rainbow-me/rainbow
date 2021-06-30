import { useRoute } from '@react-navigation/native';
import { capitalize } from 'lodash';
import React, { useCallback } from 'react';
import { StatusBar } from 'react-native';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import L2Explainer from '../components/L2Disclaimer';
import Pill from '../components/Pill';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { ButtonPressAnimation } from '../components/animations';
import { CoinIcon } from '../components/coin-icon';
import { ContactAvatar } from '../components/contacts';
import { Centered, Column, Row } from '../components/layout';
import { SendButton } from '../components/send';
import {
  SheetActionButtonRow,
  SheetDivider,
  SheetTitle,
  SlackSheet,
} from '../components/sheet';
import { Text, TruncatedAddress } from '../components/text';
import { isL2Network } from '@rainbow-me/handlers/web3';
import { convertAmountToNativeDisplay } from '@rainbow-me/helpers/utilities';
import {
  useAccountSettings,
  useColorForAsset,
  useDimensions,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { position } from '@rainbow-me/styles';
import logger from 'logger';

const Container = styled(Centered).attrs({
  direction: 'column',
})`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

export const sheetHeight = android ? 600 - getSoftMenuBarHeight() : 594;

const ChevronDown = () => {
  const { colors } = useTheme();
  return (
    <Text
      color={colors.alpha(colors.blueGreyDark, 0.09)}
      size="larger"
      style={{ top: -5, transform: [{ rotate: '90deg' }] }}
      weight="600"
    >
      􀰫
    </Text>
  );
};

const Checkbox = ({ id, checked, label, onPress, activeColor }) => {
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    onPress({ checked: !checked, id, label });
  }, [checked, id, label, onPress]);
  return (
    <Column marginBottom={20}>
      <ButtonPressAnimation onPress={handlePress}>
        <Row>
          <Text
            color={(checked && activeColor) || colors.blueGreyDark80}
            size="lmedium"
            weight="700"
          >
            {checked ? '􀃳 ' : '􀂒 '}
          </Text>
          <Text
            color={(checked && activeColor) || colors.blueGreyDark80}
            size="lmedium"
            weight="700"
          >
            {label}
          </Text>
        </Row>
      </ButtonPressAnimation>
    </Column>
  );
};

export default function SendConfirmationSheet() {
  const { nativeCurrency } = useAccountSettings();
  const { goBack, navigate } = useNavigation();
  const { height: deviceHeight } = useDimensions();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const insets = useSafeArea();
  const {
    params: { asset, amountDetails, callback, network, to },
  } = useRoute();

  const { colors } = useTheme();
  const [checkboxes, setCheckboxes] = useState([
    { checked: false, label: 'I’m not sending to an exchange' },
    {
      checked: false,
      label: `The person I’m sending to has a wallet that supports ${capitalize(
        network
      )}`,
    },
  ]);

  const handleCheckbox = useCallback(
    checkbox => {
      const newCheckboxesState = [...checkboxes];
      newCheckboxesState[checkbox.id] = checkbox;
      setCheckboxes(newCheckboxesState);
    },
    [checkboxes]
  );

  const handleL2ExplainerPress = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      network,
      type: asset.type,
    });
  }, [asset.type, navigate, network]);

  const nativeDisplayAmount = useMemo(
    () =>
      convertAmountToNativeDisplay(amountDetails.nativeAmount, nativeCurrency),
    [amountDetails.nativeAmount, nativeCurrency]
  );

  const color = useColorForAsset({
    address: asset.mainnet_address || asset.address,
  });

  const isL2 = isL2Network(network);

  const canSubmit =
    !isL2 || checkboxes.filter(check => check.checked === false).length === 0;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    try {
      setIsAuthorizing(true);
      await callback();
    } catch (e) {
      logger.sentry('TX submit failed', e);
    } finally {
      setIsAuthorizing(false);
    }
  }, [callback, canSubmit]);

  return (
    <Container deviceHeight={deviceHeight} height={sheetHeight} insets={insets}>
      {ios && <StatusBar barStyle="light-content" />}
      {ios && <TouchableBackdrop onPress={goBack} />}

      <SlackSheet
        additionalTopPadding={android}
        contentHeight={sheetHeight}
        scrollEnabled={false}
      >
        <SheetTitle>Sending</SheetTitle>
        <Column padding={24}>
          <Row>
            <Column>
              <Text size="big" weight="bold">
                {nativeDisplayAmount}
              </Text>
              <Row paddingTop={4}>
                <Text color={color} size="lmedium" weight="700">
                  {amountDetails.assetAmount} {asset.symbol}
                </Text>
              </Row>
            </Column>
            <Column align="end" flex={1} justify="end">
              <Row>
                <CoinIcon
                  badgeXPosition={-15}
                  badgeYPosition={-15}
                  size={50}
                  {...asset}
                />
              </Row>
            </Column>
          </Row>

          <Row marginBottom={22} marginTop={22}>
            <Column>
              <Pill borderRadius={20} paddingHorizontal={10}>
                <Column padding={5}>
                  <Text
                    color={colors.blueGreyDark60}
                    size="large"
                    weight="bold"
                  >
                    to
                  </Text>
                </Column>
              </Pill>
            </Column>
            <Column align="end" flex={1} justify="end" marginRight={15}>
              <ChevronDown />
            </Column>
          </Row>

          <Row marginBottom={30}>
            <Column>
              <TruncatedAddress
                address={to}
                firstSectionLength={6}
                size="big"
                truncationLength={4}
                weight="bold"
              />
              <Row paddingTop={4}>
                <Text
                  color={colors.alpha(colors.blueGreyDark, 0.6)}
                  size="lmedium"
                  weight="700"
                >
                  First time send
                </Text>
              </Row>
            </Column>
            <Column align="end" flex={1} justify="end">
              <ContactAvatar color={color} size="lmedium" value={to} />
            </Column>
          </Row>
        </Column>
        <SheetDivider />
        {isL2 && (
          <L2Explainer
            assetType={asset.type}
            colors={colors}
            onPress={handleL2ExplainerPress}
            sending
            symbol={asset.symbol}
          />
        )}
        <Column padding={24} paddingTop={19}>
          {checkboxes.map((check, i) => (
            <Checkbox
              activeColor={color}
              checked={check.checked}
              id={i}
              key={`check_${i}`}
              label={check.label}
              onPress={handleCheckbox}
            />
          ))}
        </Column>
        <SheetActionButtonRow>
          <SendButton
            backgroundColor={color}
            disabled={!canSubmit}
            isAuthorizing={isAuthorizing}
            onLongPress={handleSubmit}
            testID="send-confirmation-button"
          />
        </SheetActionButtonRow>
      </SlackSheet>
    </Container>
  );
}
