import { useFocusEffect, useRoute } from '@react-navigation/core';
import lang from 'i18n-js';
import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, ScrollView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useRecoilState } from 'recoil';
import { ButtonPressAnimation } from '../components/animations/';
import TintButton from '../components/buttons/TintButton';
import {
  RegistrationAvatar,
  RegistrationCover,
  TextRecordsForm,
} from '../components/ens-registration';
import SelectableButton from '../components/ens-registration/TextRecordsForm/SelectableButton';
import { SheetActionButton, SheetActionButtonRow } from '../components/sheet';
import { delayNext } from '../hooks/useMagicAutofocus';
import { useNavigation } from '../navigation/Navigation';
import { useTheme } from '../theme/ThemeContext';
import {
  ENSConfirmRegisterSheetHeight,
  ENSConfirmUpdateSheetHeight,
} from './ENSConfirmRegisterSheet';
import {
  AccentColorProvider,
  Bleed,
  Box,
  Cover,
  Heading,
  Inline,
  Inset,
  Row,
  Rows,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import {
  getSeenOnchainDataDisclaimer,
  saveSeenOnchainDataDisclaimer,
} from '@rainbow-me/handlers/localstorage/ens';
import {
  accentColorAtom,
  ENS_RECORDS,
  REGISTRATION_MODES,
  TextRecordField,
  textRecordFields,
} from '@rainbow-me/helpers/ens';
import {
  useDimensions,
  useENSModifiedRegistration,
  useENSRegistration,
  useENSRegistrationCosts,
  useENSRegistrationForm,
  useENSRegistrationStepHandler,
  useENSSearch,
  useKeyboardHeight,
  usePersistentDominantColorFromImage,
} from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

const BottomActionHeight = ios ? 281 : 250;
const BottomActionHeightSmall = 215;

export default function ENSAssignRecordsSheet() {
  const { params } = useRoute<any>();
  const { colors } = useTheme();
  const { isSmallPhone } = useDimensions();
  const { name } = useENSRegistration();
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
      [
        ENS_RECORDS.displayName,
        ENS_RECORDS.description,
        ENS_RECORDS.url,
        ENS_RECORDS.twitter,
      ].map(fieldName => textRecordFields[fieldName] as TextRecordField),
    []
  );
  const { profileQuery, isLoading } = useENSRegistrationForm({
    defaultFields,
    initializeForm: true,
  });

  const displayTitleLabel =
    params.mode !== REGISTRATION_MODES.EDIT || !isLoading;
  const isEmptyProfile = isEmpty(profileQuery.data?.records);

  useENSRegistrationCosts({
    name,
    rentPrice: registrationData?.rentPrice,
    step,
    yearsDuration: 1,
  });

  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [accentColor, setAccentColor] = useRecoilState(accentColorAtom);

  const avatarImage =
    avatarUrl || initialAvatarUrl || params?.externalAvatarUrl || '';
  const { result: dominantColor } = usePersistentDominantColorFromImage(
    avatarImage
  );

  const bottomActionHeight = isSmallPhone
    ? BottomActionHeightSmall
    : BottomActionHeight;

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
    }) => {
      params?.sheetRef.current.scrollTo({ y });
    },
    [params?.sheetRef]
  );

  const handleError = useCallback(
    ({ yOffset }) => {
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
        as={ScrollView}
        background="body"
        contentContainerStyle={{
          paddingBottom: bottomActionHeight + 20,
        }}
        flexGrow={1}
        scrollEnabled={android}
      >
        <Stack space="19px">
          <RegistrationCover
            hasSeenExplainSheet={hasSeenExplainSheet}
            onShowExplainSheet={handleFocus}
          />
          <Bleed top={{ custom: 38 }}>
            <Box alignItems="center">
              <RegistrationAvatar
                hasSeenExplainSheet={hasSeenExplainSheet}
                onChangeAvatarUrl={setAvatarUrl}
                onShowExplainSheet={handleFocus}
              />
            </Box>
          </Bleed>
          <Inset horizontal="19px">
            <Stack space="30px">
              <Stack alignHorizontal="center" space="15px">
                <Heading align="center" size="26px" weight="heavy">
                  {name}
                </Heading>
                <Text align="center" color="accent" size="16px" weight="heavy">
                  {displayTitleLabel
                    ? lang.t(
                        `profiles.${
                          isEmptyProfile &&
                          params.mode !== REGISTRATION_MODES.EDIT
                            ? 'create'
                            : 'edit'
                        }.label`
                      )
                    : ''}
                </Text>
              </Stack>
              <Box flexGrow={1}>
                <TextRecordsForm
                  autoFocusKey={params?.autoFocusKey}
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
  const { colors } = useTheme();
  const [accentColor, setAccentColor] = useRecoilState(accentColorAtom);
  const { mode } = useENSRegistration();
  const [fromRoute, setFromRoute] = useState(previousRouteName);
  const {
    disabled,
    isEmpty,
    selectedFields,
    onAddField,
    onRemoveField,
    submit,
    values,
  } = useENSRegistrationForm();
  const { profileQuery } = useENSModifiedRegistration();
  const handlePressBack = useCallback(() => {
    delayNext();
    navigate(fromRoute);
    setAccentColor(colors.purple);
  }, [colors.purple, fromRoute, navigate, setAccentColor]);

  const hasBackButton = useMemo(
    () =>
      fromRoute === Routes.ENS_SEARCH_SHEET ||
      fromRoute === Routes.ENS_INTRO_SHEET ||
      fromRoute === Routes.ENS_ASSIGN_RECORDS_SHEET,
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
            ? ENSConfirmUpdateSheetHeight
            : ENSConfirmRegisterSheetHeight + (values.avatar ? 70 : 0),
      });
    });
  }, [mode, navigate, submit, values.avatar]);

  const navigateToAdditionalRecords = useCallback(() => {
    android && Keyboard.dismiss();
    navigate(Routes.ENS_ADDITIONAL_RECORDS_SHEET, {});
  }, [navigate]);

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (mode === REGISTRATION_MODES.EDIT) {
      setTimeout(() => setVisible(profileQuery.isSuccess), 200);
    } else {
      setVisible(defaultVisible);
    }
  }, [defaultVisible, mode, profileQuery.isSuccess]);

  const bottomActionHeight = isSmallPhone
    ? BottomActionHeightSmall
    : BottomActionHeight;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      bottom: withSpring(visible ? 0 : -bottomActionHeight - 10, {
        damping: 40,
        mass: 1,
        stiffness: 420,
      }),
    };
  });

  const keyboardButtonWrapperStyle = useMemo(
    () => ({ bottom: keyboardHeight }),
    [keyboardHeight]
  );

  return (
    <>
      {visible && (
        <Box position="absolute" right="0px" style={keyboardButtonWrapperStyle}>
          <Inset bottom="19px" right="19px">
            <HideKeyboardButton color={accentColor} />
          </Inset>
        </Box>
      )}
      <Box
        as={Animated.View}
        background="body"
        style={[animatedStyle, { position: 'absolute', width: '100%' }]}
      >
        <AccentColorProvider color={accentColor}>
          <Box paddingBottom="19px" style={{ height: bottomActionHeight }}>
            {ios ? <Shadow /> : null}
            <Rows>
              <Row>
                <Inset horizontal="19px" top={isSmallPhone ? '19px' : '30px'}>
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
                  {hasBackButton && (
                    <TintButton onPress={handlePressBack}>
                      {lang.t('profiles.create.back')}
                    </TintButton>
                  )}
                  {isEmpty && mode === REGISTRATION_MODES.CREATE ? (
                    <TintButton
                      disabled={disabled}
                      onPress={handlePressContinue}
                      testID="ens-assign-records-skip"
                    >
                      {lang.t('profiles.create.skip')}
                    </TintButton>
                  ) : (
                    <Box>
                      {!disabled ? (
                        <SheetActionButton
                          color={accentColor}
                          // @ts-expect-error JavaScript component
                          label={lang.t('profiles.create.review')}
                          onPress={handlePressContinue}
                          // @ts-expect-error JavaScript component
                          size="big"
                          // @ts-expect-error JavaScript component
                          testID="ens-assign-records-review"
                          weight="heavy"
                        />
                      ) : (
                        <TintButton
                          onPress={() => goBack()}
                          testID="ens-assign-records-cancel"
                        >
                          {lang.t(`profiles.create.cancel`)}
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

  useEffect(() => {
    const handleShowKeyboard = () => (show.value = true);
    const handleHideKeyboard = () => (show.value = false);

    const showListener = android ? 'keyboardDidShow' : 'keyboardWillShow';
    const hideListener = android ? 'keyboardDidHide' : 'keyboardWillHide';

    Keyboard.addListener(showListener, handleShowKeyboard);
    Keyboard.addListener(hideListener, handleHideKeyboard);
    return () => {
      Keyboard.removeListener(showListener, handleShowKeyboard);
      Keyboard.removeListener(hideListener, handleHideKeyboard);
    };
  }, [show]);

  const style = useAnimatedStyle(() => {
    return {
      opacity: withTiming(show.value ? 1 : 0, { duration: 100 }),
    };
  });

  return (
    <Box as={Animated.View} style={style}>
      <ButtonPressAnimation onPress={() => Keyboard.dismiss()} scaleTo={0.8}>
        <AccentColorProvider color={color}>
          <Box
            background="accent"
            borderRadius={15}
            height={{ custom: 30 }}
            shadow="15px light"
            width={{ custom: 30 }}
          >
            <Cover alignHorizontal="center" alignVertical="center">
              <Text align="center" color="primary" size="14px" weight="heavy">
                􀆈
              </Text>
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
          background="body"
          height="30px"
          shadow={{
            custom: {
              android: {
                elevation: 30,
                opacity: 0.08,
              },
              ios: [
                {
                  blur: 30,
                  offset: {
                    x: 0,
                    y: -10,
                  },
                  opacity: 0.08,
                },
              ],
            },
          }}
          width="full"
        />
      </Cover>
      <Cover>
        <Box background="body" height="46px" width="full" />
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
  onAddField: (
    fieldsToAdd: TextRecordField,
    selectedFields: TextRecordField[]
  ) => void;
  onRemoveField: (
    fieldsToRemove: TextRecordField,
    selectedFields: TextRecordField[]
  ) => void;
  navigateToAdditionalRecords: () => void;
}) {
  const dotsButtonIsSelected = useMemo(() => {
    const nonPrimaryRecordsIds = Object.values(textRecordFields)
      .slice(MAX_DISPLAY_BUTTONS)
      .map(({ id }) => id);
    const dotsSelected = selectedFields.some(field =>
      nonPrimaryRecordsIds.includes(field.id)
    );
    return dotsSelected;
  }, [selectedFields]);

  return (
    <Inline space="10px">
      {Object.values(textRecordFields)
        .slice(0, MAX_DISPLAY_BUTTONS)
        .map((textRecordField, i) => {
          const isSelected = selectedFields.some(
            field => field.id === textRecordField.id
          );
          return (
            <SelectableButton
              isSelected={isSelected}
              key={i}
              onSelect={() => {
                if (isSelected) {
                  const index = selectedFields.findIndex(
                    ({ id }) => textRecordField.id === id
                  );
                  const fieldToRemove = selectedFields[index];
                  let newFields = [...selectedFields];
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
      <SelectableButton
        isSelected={dotsButtonIsSelected}
        onSelect={navigateToAdditionalRecords}
        testID="ens-selectable-attribute-dots"
      >
        􀍠
      </SelectableButton>
    </Inline>
  );
}
