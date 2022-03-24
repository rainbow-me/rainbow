import { useRoute } from '@react-navigation/core';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useRecoilState } from 'recoil';
import { MiniButton } from '../components/buttons';
import TintButton from '../components/buttons/TintButton';
import {
  RegistrationAvatar,
  RegistrationCover,
  TextRecordsForm,
} from '../components/ens-registration';
import SelectableButton from '../components/ens-registration/TextRecordsForm/SelectableButton';
import { SheetActionButton, SheetActionButtonRow } from '../components/sheet';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '../navigation/Navigation';
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
  accentColorAtom,
  ENS_RECORDS,
  textRecordFields,
} from '@rainbow-me/helpers/ens';
import {
  useENSRegistration,
  useENSRegistrationForm,
  useKeyboardHeight,
  usePersistentDominantColorFromImage,
} from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

const AnimatedBox = Animated.createAnimatedComponent(Box);

export const BottomActionHeight = ios ? 270 : 250;

export default function ENSAssignRecordsSheet() {
  const { params } = useRoute();
  const { colors } = useTheme();
  const { name, mode } = useENSRegistration({
    setInitialRecordsWhenInEditMode: true,
  });
  useENSRegistrationForm({
    createForm: true,
    defaultFields: [
      ENS_RECORDS.displayName,
      ENS_RECORDS.description,
      ENS_RECORDS.email,
      ENS_RECORDS.twitter,
    ].map(fieldName => textRecordFields[fieldName]),
  });

  const [avatarUrl, setAvatarUrl] = useState();

  const [accentColor, setAccentColor] = useRecoilState(accentColorAtom);
  const { result: dominantColor } = usePersistentDominantColorFromImage(
    avatarUrl || ''
  );
  const [prevDominantColor, setPrevDominantColor] = useState(dominantColor);
  useEffect(() => {
    setAccentColor(dominantColor || prevDominantColor || colors.purple);
    if (dominantColor) {
      setPrevDominantColor(dominantColor);
    }
  }, [colors.purple, dominantColor, prevDominantColor, setAccentColor]);

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
  const { navigate } = useNavigation();
  const handleFocus = useCallback(() => {
    if (!hasSeenExplainSheet) {
      navigate(Routes.EXPLAIN_SHEET, {
        type: 'ensOnChainDataWarning',
      });
      setHasSeenExplainSheet(true);
    }
  }, [hasSeenExplainSheet, navigate, setHasSeenExplainSheet]);

  return (
    <AccentColorProvider color={accentColor}>
      <Box
        background="body"
        flexGrow={1}
        style={useMemo(() => ({ paddingBottom: BottomActionHeight + 20 }), [])}
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
                <Heading size="26px" weight="heavy">
                  {name}
                </Heading>
                {mode === 'create' && (
                  <Text color="accent" size="16px" weight="heavy">
                    {lang.t('profiles.create.description')}
                  </Text>
                )}
              </Stack>
              <Box flexGrow={1}>
                <TextRecordsForm
                  autoFocusKey={params?.autoFocusKey}
                  onAutoFocusLayout={handleAutoFocusLayout}
                  onError={handleError}
                  onFocus={handleFocus}
                />
              </Box>
            </Stack>
          </Inset>
        </Stack>
      </Box>
    </AccentColorProvider>
  );
}

export function ENSAssignRecordsBottomActions({ visible: defaultVisible }) {
  const { navigate } = useNavigation();
  const keyboardHeight = useKeyboardHeight();
  const [accentColor] = useRecoilState(accentColorAtom);

  const {
    mode,
    profileQuery,
    images: { avatarUrl },
  } = useENSRegistration();
  const {
    disabled,
    isEmpty,
    selectedFields,
    onAddField,
    onRemoveField,
    submit,
  } = useENSRegistrationForm();

  const handlePressBack = useCallback(() => {
    navigate(Routes.ENS_SEARCH_SHEET);
  }, [navigate]);

  const handlePressContinue = useCallback(() => {
    submit(() => {
      navigate(Routes.ENS_CONFIRM_REGISTER_SHEET, {
        longFormHeight:
          mode === 'edit'
            ? ENSConfirmUpdateSheetHeight
            : ENSConfirmRegisterSheetHeight + (avatarUrl ? 70 : 0),
      });
    });
  }, [mode, navigate, submit]);

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (mode === 'edit') {
      setTimeout(() => setVisible(profileQuery.isSuccess), 200);
    } else {
      setVisible(defaultVisible);
    }
  }, [defaultVisible, mode, profileQuery.isSuccess]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      bottom: withSpring(visible ? 0 : -BottomActionHeight - 10, {
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
      <AnimatedBox
        background="body"
        style={[animatedStyle, { position: 'absolute', width: '100%' }]}
      >
        <AccentColorProvider color={accentColor}>
          <Box
            paddingBottom="19px"
            style={useMemo(() => ({ height: BottomActionHeight }), [])}
          >
            {ios ? <Shadow /> : null}
            <Rows>
              <Row>
                <Inset horizontal="19px" top="30px">
                  <SelectableAttributesButtons
                    onAddField={onAddField}
                    onRemoveField={onRemoveField}
                    selectedFields={selectedFields}
                  />
                </Inset>
              </Row>
              <Row height="content">
                <SheetActionButtonRow
                  {...(android
                    ? {
                        ignorePaddingBottom: true,
                        paddingBottom: 8,
                      }
                    : {})}
                >
                  {mode === 'create' && (
                    <TintButton color="secondary60" onPress={handlePressBack}>
                      {lang.t('profiles.create.back')}
                    </TintButton>
                  )}
                  {isEmpty && mode === 'create' ? (
                    <TintButton
                      color="secondary60"
                      disabled={disabled}
                      onPress={handlePressContinue}
                    >
                      {lang.t('profiles.create.skip')}
                    </TintButton>
                  ) : (
                    <Box style={{ opacity: disabled ? 0.5 : 1 }}>
                      <SheetActionButton
                        color={accentColor}
                        disabled={disabled}
                        label={lang.t('profiles.create.review')}
                        onPress={handlePressContinue}
                        size="big"
                        weight="heavy"
                      />
                    </Box>
                  )}
                </SheetActionButtonRow>
              </Row>
            </Rows>
          </Box>
        </AccentColorProvider>
      </AnimatedBox>
    </>
  );
}

function HideKeyboardButton({ color }) {
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
    <AnimatedBox style={style}>
      <MiniButton
        backgroundColor={color}
        disablePadding
        height={30}
        onPress={() => Keyboard.dismiss()}
        style={useMemo(() => ({ height: 30, width: 30 }), [])}
        width={30}
      >
        􀆈
      </MiniButton>
    </AnimatedBox>
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

function SelectableAttributesButtons({
  selectedFields,
  onAddField,
  onRemoveField,
}) {
  return (
    <Inline space="10px">
      {Object.values(textRecordFields).map((textRecordField, i) => {
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
                onAddField(fieldToAdd, [...selectedFields, fieldToAdd]);
              }
            }}
          >
            {textRecordField.label}
          </SelectableButton>
        );
      })}
    </Inline>
  );
}
