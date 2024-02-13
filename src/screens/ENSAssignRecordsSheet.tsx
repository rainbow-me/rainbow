import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BottomSheetContext } from '@gorhom/bottom-sheet/src/contexts/external';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import { isEmpty } from 'lodash';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { EmitterSubscription, Keyboard, LayoutChangeEvent, ScrollView } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useRecoilState } from 'recoil';
import { ButtonPressAnimation } from '../components/animations/';
import TintButton from '../components/buttons/TintButton';
import { RegistrationAvatar, RegistrationCover, TextRecordsForm } from '../components/ens-registration';
import SelectableButton from '../components/ens-registration/TextRecordsForm/SelectableButton';
import { SheetActionButton, SheetActionButtonRow } from '../components/sheet';
import { delayNext } from '../hooks/useMagicAutofocus';
import { useNavigation } from '../navigation/Navigation';
import { useTheme } from '../theme/ThemeContext';
import { ENSConfirmRegisterSheetHeight, ENSConfirmUpdateSheetHeight } from './ENSConfirmRegisterSheet';
import { abbreviateEnsForDisplay } from '@/utils/abbreviations';
import { AccentColorProvider, Bleed, Box, Cover, Heading, Inline, Inset, Row, Rows, Stack, Text } from '@/design-system';
import { getSeenOnchainDataDisclaimer, saveSeenOnchainDataDisclaimer } from '@/handlers/localstorage/ens';
import { accentColorAtom, ENS_RECORDS, REGISTRATION_MODES, TextRecordField, textRecordFields } from '@/helpers/ens';
import {
  useAccountProfile,
  useDimensions,
  useENSModifiedRegistration,
  useENSRecords,
  useENSRegistration,
  useENSRegistrationCosts,
  useENSRegistrationForm,
  useENSRegistrationStepHandler,
  useENSSearch,
  useKeyboardHeight,
  useWalletSectionsData,
} from '@/hooks';
import Routes from '@/navigation/routesNames';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';

const BottomActionHeight = ios ? 281 : 250;
const BottomActionHeightSmall = 215;
const ExtraBottomPadding = 55;

export default function ENSAssignRecordsSheet() {
  const { params } = useRoute<any>();
  const { colors } = useTheme();
  const { isSmallPhone } = useDimensions();
  const { name } = useENSRegistration();
  const { hasNFTs } = useWalletSectionsData();
  const isInsideBottomSheet = !!useContext(BottomSheetContext);

  const {
    images: { avatarUrl: initialAvatarUrl },
  } = useENSModifiedRegistration({
    modifyChangedRecords: true,
    setInitialRecordsWhenInEditMode: true,
  });

  const { data: registrationData } = useENSSearch({
    name,
  });
  const { step } = useENSRegistrationStepHandler();

  const defaultFields = useMemo(
    () =>
      [ENS_RECORDS.name, ENS_RECORDS.description, ENS_RECORDS.url, ENS_RECORDS.twitter].map(
        fieldName => textRecordFields[fieldName] as TextRecordField
      ),
    []
  );

  const { isLoading } = useENSRegistrationForm({
    defaultFields,
    initializeForm: true,
  });

  const { data: { records } = {} } = useENSRecords(name);
  const isEmptyProfile = isEmpty(records);

  const displayTitleLabel = params.mode !== REGISTRATION_MODES.EDIT || !isLoading;

  useENSRegistrationCosts({
    name,
    rentPrice: registrationData?.rentPrice,
    step,
    yearsDuration: 1,
  });

  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [accentColor, setAccentColor] = useRecoilState(accentColorAtom);

  const avatarImage = avatarUrl || initialAvatarUrl || params?.externalAvatarUrl || '';
  const dominantColor = usePersistentDominantColorFromImage(avatarImage);

  const bottomActionHeight = isSmallPhone ? BottomActionHeightSmall : BottomActionHeight;

  useFocusEffect(() => {
    if (dominantColor || (!dominantColor && !avatarImage)) {
      setAccentColor(dominantColor || colors.purple);
    }
  });

  const handleAutoFocusLayout = useCallback(
    ({
      nativeEvent: {
        layout: { y },
      },
    }: LayoutChangeEvent) => {
      params?.sheetRef.current.scrollTo({ y });
    },
    [params?.sheetRef]
  );

  const handleError = useCallback(
    ({ yOffset }: { yOffset: number }) => {
      params?.sheetRef.current.scrollTo({ y: yOffset });
    },
    [params?.sheetRef]
  );

  const [hasSeenExplainSheet, setHasSeenExplainSheet] = useState(false);

  useEffect(() => {
    (async () => {
      setHasSeenExplainSheet(Boolean(await getSeenOnchainDataDisclaimer()));
    })();
  }, []);

  const { navigate } = useNavigation();

  const handleFocus = useCallback(() => {
    if (!hasSeenExplainSheet) {
      android && Keyboard.dismiss();
      navigate(Routes.EXPLAIN_SHEET, {
        type: 'ensOnChainDataWarning',
      });
      setHasSeenExplainSheet(true);
      saveSeenOnchainDataDisclaimer(true);
    }
  }, [hasSeenExplainSheet, navigate, setHasSeenExplainSheet]);

  return (
    <AccentColorProvider color={accentColor}>
      <Box
        as={(isInsideBottomSheet ? BottomSheetScrollView : ScrollView) as typeof ScrollView}
        background="body (Deprecated)"
        contentContainerStyle={{
          paddingBottom: bottomActionHeight + ExtraBottomPadding,
        }}
        flexGrow={1}
        scrollEnabled={android}
        testID={`ens-${REGISTRATION_MODES.EDIT.toLowerCase()}-records-sheet`}
      >
        <Stack space="19px (Deprecated)">
          <RegistrationCover enableNFTs={hasNFTs} hasSeenExplainSheet={hasSeenExplainSheet} onShowExplainSheet={handleFocus} />
          <Bleed top={{ custom: 38 }}>
            <Box alignItems="center">
              <RegistrationAvatar
                enableNFTs={hasNFTs}
                hasSeenExplainSheet={hasSeenExplainSheet}
                onChangeAvatarUrl={setAvatarUrl}
                onShowExplainSheet={handleFocus}
              />
            </Box>
          </Bleed>
          <Inset horizontal="19px (Deprecated)">
            <Stack space="30px (Deprecated)">
              <Stack alignHorizontal="center" space="15px (Deprecated)">
                <Heading align="center" numberOfLines={1} color="primary (Deprecated)" size="26px / 30px (Deprecated)" weight="heavy">
                  {abbreviateEnsForDisplay(name, 15)}
                </Heading>
                <Text align="center" color="accent" size="16px / 22px (Deprecated)" weight="heavy">
                  {displayTitleLabel
                    ? lang.t(`profiles.${isEmptyProfile && params.mode !== REGISTRATION_MODES.EDIT ? 'create' : 'edit'}.label`)
                    : ''}
                </Text>
              </Stack>
              <Box flexGrow={1}>
                <TextRecordsForm
                  autoFocusKey={params?.autoFocusKey}
                  key={name}
                  onAutoFocusLayout={handleAutoFocusLayout}
                  onError={handleError}
                  onFocus={handleFocus}
                  selectionColor={accentColor}
                />
              </Box>
            </Stack>
          </Inset>
        </Stack>
      </Box>
    </AccentColorProvider>
  );
}

export function ENSAssignRecordsBottomActions({
  visible: defaultVisible,
  previousRouteName,
  currentRouteName,
}: {
  visible: boolean;
  previousRouteName?: string;
  currentRouteName: string;
}) {
  const { navigate, goBack } = useNavigation();
  const { isSmallPhone } = useDimensions();
  const keyboardHeight = useKeyboardHeight();
  const { accountENS } = useAccountProfile();
  const { colors } = useTheme();
  const [accentColor, setAccentColor] = useRecoilState(accentColorAtom);
  const { mode, name } = useENSRegistration();
  const [fromRoute, setFromRoute] = useState(previousRouteName);
  const {
    disabled,
    errors,
    isValidating,
    isEmpty: isEmptyForm,
    selectedFields,
    onAddField,
    onRemoveField,
    submit,
    values,
  } = useENSRegistrationForm();
  const { isSuccess } = useENSModifiedRegistration();
  const handlePressBack = useCallback(() => {
    delayNext();
    navigate(fromRoute);
    setAccentColor(colors.purple);
  }, [colors.purple, fromRoute, navigate, setAccentColor]);

  const hasBackButton = useMemo(
    () => fromRoute === Routes.ENS_SEARCH_SHEET || fromRoute === Routes.ENS_INTRO_SHEET || fromRoute === Routes.ENS_ASSIGN_RECORDS_SHEET,
    [fromRoute]
  );

  useEffect(() => {
    if (previousRouteName !== currentRouteName) {
      setFromRoute(previousRouteName);
    }
  }, [currentRouteName, previousRouteName]);

  const handlePressContinue = useCallback(() => {
    submit(() => {
      navigate(Routes.ENS_CONFIRM_REGISTER_SHEET, {
        longFormHeight:
          mode === REGISTRATION_MODES.EDIT
            ? ENSConfirmUpdateSheetHeight + (accountENS !== name ? 50 : 0) + (values.avatar ? 70 : 0)
            : ENSConfirmRegisterSheetHeight + (values.avatar ? 70 : 0),
      });
    });
  }, [accountENS, mode, name, navigate, submit, values.avatar]);

  const navigateToAdditionalRecords = useCallback(() => {
    android && Keyboard.dismiss();
    navigate(Routes.ENS_ADDITIONAL_RECORDS_SHEET, {});
  }, [navigate]);

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (mode === REGISTRATION_MODES.EDIT) {
      setTimeout(() => setVisible(isSuccess), 200);
    } else {
      setVisible(defaultVisible);
    }
  }, [defaultVisible, mode, isSuccess]);

  const bottomActionHeight = isSmallPhone ? BottomActionHeightSmall : BottomActionHeight;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      bottom: withSpring(visible ? 0 : -bottomActionHeight - 10, {
        damping: 40,
        mass: 1,
        stiffness: 420,
      }),
    };
  });

  const keyboardButtonWrapperStyle = useMemo(() => ({ bottom: keyboardHeight }), [keyboardHeight]);

  return (
    <>
      {visible && (
        <Box position="absolute" right="0px" style={keyboardButtonWrapperStyle}>
          <Inset bottom="19px (Deprecated)" right="19px (Deprecated)">
            <HideKeyboardButton color={accentColor} />
          </Inset>
        </Box>
      )}
      <Box
        as={Animated.View}
        background="body (Deprecated)"
        style={[animatedStyle, { position: 'absolute', width: '100%' }]}
        testID="ens-assign-records-sheet"
      >
        <AccentColorProvider color={accentColor}>
          <Box paddingBottom="19px (Deprecated)" style={{ height: bottomActionHeight }}>
            {ios ? <Shadow /> : null}
            <Rows>
              <Row>
                <Inset horizontal="19px (Deprecated)" top={isSmallPhone ? '19px (Deprecated)' : '30px (Deprecated)'}>
                  <SelectableAttributesButtons
                    navigateToAdditionalRecords={navigateToAdditionalRecords}
                    onAddField={onAddField}
                    onRemoveField={onRemoveField}
                    selectedFields={selectedFields}
                  />
                </Inset>
              </Row>
              <Row height="content">
                {/* @ts-expect-error JavaScript component */}
                <SheetActionButtonRow
                  {...(android
                    ? {
                        ignorePaddingBottom: true,
                        paddingBottom: 8,
                      }
                    : {
                        ignorePaddingBottom: true,
                        paddingBottom: isSmallPhone ? 0 : 36,
                      })}
                >
                  {hasBackButton && <TintButton onPress={handlePressBack}>{lang.t('profiles.create.back')}</TintButton>}
                  {isEmptyForm && mode === REGISTRATION_MODES.CREATE ? (
                    <TintButton disabled={disabled} onPress={handlePressContinue} testID="ens-assign-records-skip">
                      {lang.t('profiles.create.skip')}
                    </TintButton>
                  ) : (
                    <Box>
                      {!disabled ? (
                        <SheetActionButton
                          color={accentColor}
                          disabled={isValidating || !isEmpty(errors)}
                          label={lang.t('profiles.create.review')}
                          onPress={handlePressContinue}
                          size="big"
                          testID="ens-assign-records-review"
                          weight="heavy"
                        />
                      ) : (
                        <TintButton onPress={() => goBack()} testID="ens-assign-records-cancel">
                          {lang.t('profiles.create.cancel')}
                        </TintButton>
                      )}
                    </Box>
                  )}
                </SheetActionButtonRow>
              </Row>
            </Rows>
          </Box>
        </AccentColorProvider>
      </Box>
    </>
  );
}

function HideKeyboardButton({ color }: { color: string }) {
  const show = useSharedValue(false);
  const keyboardHideListener = useRef<EmitterSubscription>();
  const keyboardShowListener = useRef<EmitterSubscription>();

  useEffect(() => {
    const handleShowKeyboard = () => (show.value = true);
    const handleHideKeyboard = () => (show.value = false);

    const showListener = android ? 'keyboardDidShow' : 'keyboardWillShow';
    const hideListener = android ? 'keyboardDidHide' : 'keyboardWillHide';

    keyboardShowListener.current = Keyboard.addListener(showListener, handleShowKeyboard);
    keyboardHideListener.current = Keyboard.addListener(hideListener, handleHideKeyboard);
    return () => {
      keyboardHideListener.current?.remove();
      keyboardShowListener.current?.remove();
    };
  }, [show]);

  const style = useAnimatedStyle(() => {
    return {
      opacity: withTiming(show.value ? 1 : 0, { duration: 100 }),
    };
  });

  return (
    <Box as={Animated.View} style={style}>
      <ButtonPressAnimation onPress={() => Keyboard.dismiss()} scaleTo={0.8} testID="hide-keyboard-button">
        <AccentColorProvider color={color}>
          <Box background="accent" borderRadius={15} height={{ custom: 30 }} shadow="15px light (Deprecated)" width={{ custom: 30 }}>
            <Cover alignHorizontal="center" alignVertical="center">
              <Box paddingTop={android ? '4px' : '2px'}>
                <Text align="center" color="primary (Deprecated)" size="14px / 19px (Deprecated)" weight="heavy">
                  􀆈
                </Text>
              </Box>
            </Cover>
          </Box>
        </AccentColorProvider>
      </ButtonPressAnimation>
    </Box>
  );
}

function Shadow() {
  return (
    <>
      <Cover>
        <Box
          background="body (Deprecated)"
          height="30px"
          shadow={{
            custom: {
              android: {
                elevation: 30,
                color: 'shadowFar',
                opacity: 0.08,
              },
              ios: [
                {
                  blur: 30,
                  x: 0,
                  y: -10,
                  color: 'shadowFar',
                  opacity: 0.08,
                },
              ],
            },
          }}
          width="full"
        />
      </Cover>
      <Cover>
        <Box background="body (Deprecated)" height="46px" width="full" />
      </Cover>
    </>
  );
}

const MAX_DISPLAY_BUTTONS = 9;

function SelectableAttributesButtons({
  selectedFields,
  onAddField,
  onRemoveField,
  navigateToAdditionalRecords,
}: {
  selectedFields: TextRecordField[];
  onAddField: (fieldsToAdd: TextRecordField, selectedFields: TextRecordField[]) => void;
  onRemoveField: (fieldsToRemove: TextRecordField, selectedFields: TextRecordField[]) => void;
  navigateToAdditionalRecords: () => void;
}) {
  const dotsButtonIsSelected = useMemo(() => {
    const nonPrimaryRecordsIds = Object.values(textRecordFields)
      .slice(MAX_DISPLAY_BUTTONS)
      .map(({ id }) => id);
    const dotsSelected = selectedFields.some(field => nonPrimaryRecordsIds.includes(field.id));
    return dotsSelected;
  }, [selectedFields]);

  return (
    <Inline space="10px">
      {Object.values(textRecordFields)
        .slice(0, MAX_DISPLAY_BUTTONS)
        .map((textRecordField, i) => {
          const isSelected = selectedFields.some(field => field.id === textRecordField.id);
          return (
            <SelectableButton
              isSelected={isSelected}
              key={i}
              onSelect={() => {
                if (isSelected) {
                  const index = selectedFields.findIndex(({ id }) => textRecordField.id === id);
                  const fieldToRemove = selectedFields[index];
                  const newFields = [...selectedFields];
                  newFields.splice(index, 1);
                  onRemoveField(fieldToRemove, newFields);
                } else {
                  const fieldToAdd = textRecordField;
                  const newSelectedFields = [...selectedFields];
                  newSelectedFields.splice(i, 0, fieldToAdd);
                  onAddField(fieldToAdd, newSelectedFields);
                }
              }}
              testID={`ens-selectable-attribute-${textRecordField.id}`}
            >
              {textRecordField.label}
            </SelectableButton>
          );
        })}
      <SelectableButton isSelected={dotsButtonIsSelected} onSelect={navigateToAdditionalRecords} testID="ens-selectable-attribute-dots">
        􀍠
      </SelectableButton>
    </Inline>
  );
}
