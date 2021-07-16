import { useRoute } from '@react-navigation/native';
import { capitalize, get, toLower } from 'lodash';
import React, { useCallback, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import ContactRowInfoButton from '../components/ContactRowInfoButton';
import L2Explainer from '../components/L2Disclaimer';
import Pill from '../components/Pill';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { ButtonPressAnimation } from '../components/animations';
import { CoinIcon } from '../components/coin-icon';
import { ContactAvatar } from '../components/contacts';
import { Centered, Column, Row } from '../components/layout';
import { SendButton } from '../components/send';
import { SheetDivider, SheetTitle, SlackSheet } from '../components/sheet';
import {
  Text,
  TruncatedAddress,
  TruncatedENS,
  TruncatedText,
} from '../components/text';
import { getRandomColor } from '../styles/colors';
import {
  addressHashedColorIndex,
  addressHashedEmoji,
} from '../utils/defaultProfileUtils';
import { isL2Network } from '@rainbow-me/handlers/web3';
import { convertAmountToNativeDisplay } from '@rainbow-me/helpers/utilities';
import { isENSAddressFormat } from '@rainbow-me/helpers/validators';
import {
  useAccountSettings,
  useAccountTransactions,
  useColorForAsset,
  useContacts,
  useDimensions,
  useUserAccounts,
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

export const SendConfirmationSheetHeight = android
  ? 600 - getSoftMenuBarHeight()
  : 594;

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

const defaultContactItem = randomColor => ({
  address: '',
  color: randomColor,
  nickname: '',
});

export default function SendConfirmationSheet() {
  const { colors, isDarkMode } = useTheme();
  const { nativeCurrency } = useAccountSettings();
  const { goBack, navigate, setParams } = useNavigation();
  const { height: deviceHeight, isSmallPhone, isTinyPhone } = useDimensions();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const insets = useSafeArea();
  const { contacts } = useContacts();

  const {
    params: { asset, amountDetails, callback, isNft, network, to, toAddress },
  } = useRoute();

  const [alreadySentTransactions, setAlreadySentTransactions] = useState(0);

  const { transactions } = useAccountTransactions(true, true);
  const { userAccounts } = useUserAccounts();
  const isSendingToUserAccount = useMemo(() => {
    const found = userAccounts?.find(account => {
      return toLower(account.address) === toLower(toAddress);
    });
    return !!found;
  }, [toAddress, userAccounts]);

  useEffect(() => {
    if (!isSendingToUserAccount) {
      let sends = 0;
      transactions.forEach(tx => {
        if (toLower(tx.to) === toLower(toAddress)) {
          sends++;
        }
      });
      if (sends > 0) {
        setAlreadySentTransactions(sends);
      }
    }
  }, [
    isSendingToUserAccount,
    setAlreadySentTransactions,
    toAddress,
    transactions,
  ]);

  const contact = useMemo(() => {
    return get(
      contacts,
      `${[toLower(to)]}`,
      defaultContactItem(getRandomColor())
    );
  }, [contacts, to]);

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
      type: asset.type,
    });
  }, [asset.type, navigate]);

  const nativeDisplayAmount = useMemo(
    () =>
      convertAmountToNativeDisplay(amountDetails.nativeAmount, nativeCurrency),
    [amountDetails.nativeAmount, nativeCurrency]
  );

  let color = useColorForAsset({
    address: asset.mainnet_address || asset.address,
  });

  if (isNft) {
    color = colors.appleBlue;
  }

  const isL2 = isL2Network(network);
  const shouldShowChecks =
    isL2 && !isSendingToUserAccount && alreadySentTransactions < 3;

  useEffect(() => {
    setParams({ shouldShowChecks });
  }, [setParams, shouldShowChecks]);

  const canSubmit =
    !shouldShowChecks ||
    checkboxes.filter(check => check.checked === false).length === 0;

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

  const avatarValue = contact?.nickname || addressHashedEmoji(toAddress);
  const avatarColor = contact?.color || addressHashedColorIndex(toAddress);

  const realSheetHeight = !shouldShowChecks
    ? SendConfirmationSheetHeight - 150
    : SendConfirmationSheetHeight;

  return (
    <Container
      deviceHeight={deviceHeight}
      height={realSheetHeight}
      insets={insets}
    >
      {ios && <StatusBar barStyle="light-content" />}
      {ios && <TouchableBackdrop onPress={goBack} />}

      <SlackSheet
        additionalTopPadding={android}
        contentHeight={realSheetHeight}
        scrollEnabled={false}
      >
        <SheetTitle>Sending</SheetTitle>
        <Column height={realSheetHeight - 50}>
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
              <Column flex={1}>
                {isENSAddressFormat(to) || contact?.nickname ? (
                  <Row>
                    <Column>
                      {isENSAddressFormat(to) ? (
                        <TruncatedENS ens={to} size="big" weight="bold" />
                      ) : (
                        <TruncatedText size="big" weight="bold">
                          {contact?.nickname}
                        </TruncatedText>
                      )}
                    </Column>
                    <Column>
                      <ContactRowInfoButton
                        item={{
                          address: toAddress,
                          name: contact?.nickname || to,
                        }}
                        network={network}
                      />
                    </Column>
                  </Row>
                ) : (
                  <TruncatedAddress
                    address={to}
                    firstSectionLength={6}
                    size="big"
                    truncationLength={4}
                    weight="bold"
                  />
                )}
                <Row paddingTop={4}>
                  <Text
                    color={colors.alpha(colors.blueGreyDark, 0.6)}
                    size="lmedium"
                    weight="700"
                  >
                    {isSendingToUserAccount
                      ? `You own this account`
                      : alreadySentTransactions === 0
                      ? `First time send`
                      : `${alreadySentTransactions} previous sends`}
                  </Text>
                </Row>
              </Column>
              <Column align="end" justify="end">
                <ContactAvatar
                  color={avatarColor}
                  size="lmedium"
                  value={avatarValue}
                />
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
            {shouldShowChecks &&
              checkboxes.map((check, i) => (
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
          <Column align="center" flex={1} justify="end">
            <SendButton
              backgroundColor={
                canSubmit
                  ? color
                  : isDarkMode
                  ? colors.darkGrey
                  : colors.lightGrey
              }
              disabled={!canSubmit}
              isAuthorizing={isAuthorizing}
              onLongPress={handleSubmit}
              smallButton={!isTinyPhone && (android || isSmallPhone)}
              testID="send-confirmation-button"
            />
          </Column>
        </Column>
      </SlackSheet>
    </Container>
  );
}
