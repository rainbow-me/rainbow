import React, { useCallback, useEffect } from 'react';
import { Keyboard, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSelector } from 'react-redux';
import { useRecoilState } from 'recoil';
import { MiniButton } from '../components/buttons';
import TintButton from '../components/buttons/TintButton';
import { TextRecordsForm } from '../components/ens-registration';
import SelectableButton from '../components/ens-registration/TextRecordsForm/SelectableButton';
import { SheetActionButton, SheetActionButtonRow } from '../components/sheet';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '../navigation/Navigation';
// import { usePersistentDominantColorFromImage } from '@rainbow-me/hooks';
import {
  AccentColorProvider,
  BackgroundProvider,
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
import { useENSProfileForm, useKeyboardHeight } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

const AnimatedBox = Animated.createAnimatedComponent(Box);

export const BottomActionHeight = ios ? 270 : 250;

export default function ENSAssignRecordsSheet() {
  const { colors } = useTheme();
  const ensName = useSelector(({ ensRegistration }) => ensRegistration.name);

  const [accentColor, setAccentColor] = useRecoilState(accentColorAtom);
  useEffect(() => {
    setAccentColor(colors.purple);
  }, [colors.purple, setAccentColor]);
  //   usePersistentDominantColorFromImage('TODO').result || colors.purple;   // add this when we implement avatars

  const {
    selectedFields,
    onChangeField,
    onBlurField,
    values,
  } = useENSProfileForm({
    defaultFields: [
      textRecordFields[ENS_RECORDS.displayName],
      textRecordFields[ENS_RECORDS.description],
      textRecordFields[ENS_RECORDS.url],
      textRecordFields[ENS_RECORDS.twitter],
    ],
  });

  const handleChooseCover = useCallback(() => {
    // TODO
  }, []);

  const handleChooseAvatar = useCallback(() => {
    // TODO
  }, []);

  const avatarSize = 70;

  return (
    <AccentColorProvider color={accentColor}>
      <Box
        background="body"
        flexGrow={1}
        style={{ paddingBottom: BottomActionHeight + 20 }}
      >
        <Stack space="19px">
          <Box flexDirection="column">
            <Pressable onPress={handleChooseCover}>
              <Box background="accent" height="126px" />
            </Pressable>
            <Bleed top="19px">
              <Box alignItems="center">
                <Box
                  height={{ custom: avatarSize }}
                  width={{ custom: avatarSize }}
                >
                  <Cover alignHorizontal="center">
                    <BackgroundProvider background="body">
                      {({ backgroundColor }) => (
                        <Svg
                          height="32"
                          style={{ top: -6 }}
                          viewBox="0 0 96 29"
                          width="96"
                        >
                          <Path
                            d="M9.22449 23.5H0V28.5H96V23.5H86.7755C85.0671 23.5 83.4978 22.5584 82.6939 21.051C67.8912 -6.70409 28.1088 -6.70408 13.3061 21.051C12.5022 22.5584 10.9329 23.5 9.22449 23.5Z"
                            fill={backgroundColor}
                          />
                        </Svg>
                      )}
                    </BackgroundProvider>
                  </Cover>
                  <Pressable onPress={handleChooseAvatar}>
                    <Box
                      background="accent"
                      borderRadius={avatarSize / 2}
                      height={{ custom: avatarSize }}
                      shadow="12px heavy accent"
                      width={{ custom: avatarSize }}
                    />
                  </Pressable>
                </Box>
              </Box>
            </Bleed>
          </Box>
          <Inset horizontal="19px">
            <Stack space="30px">
              <Stack alignHorizontal="center" space="15px">
                <Heading size="26px" weight="heavy">
                  {ensName}
                </Heading>
                <Text color="accent" size="16px" weight="heavy">
                  Create your profile
                </Text>
              </Stack>
              <Box flexGrow={1}>
                <TextRecordsForm
                  onBlurField={onBlurField}
                  onChangeField={onChangeField}
                  selectedFields={selectedFields}
                  values={values}
                />
              </Box>
            </Stack>
          </Inset>
        </Stack>
      </Box>
    </AccentColorProvider>
  );
}

export function ENSAssignRecordsBottomActions({ visible }) {
  const { navigate } = useNavigation();
  const keyboardHeight = useKeyboardHeight();
  const [accentColor] = useRecoilState(accentColorAtom);

  const {
    isEmpty,
    selectedFields,
    onAddField,
    onRemoveField,
  } = useENSProfileForm();

  const handlePressBack = useCallback(() => {
    navigate(Routes.ENS_SEARCH_SHEET);
  }, [navigate]);

  const handlePressContinue = useCallback(() => {
    navigate(Routes.ENS_CONFIRM_REGISTER_SHEET);
  }, [navigate]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      bottom: withTiming(visible ? 0 : -BottomActionHeight - 10, {
        duration: 100,
      }),
    };
  });

  return (
    <>
      {visible && (
        <Box position="absolute" right="0px" style={{ bottom: keyboardHeight }}>
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
          <Box paddingBottom="19px" style={{ height: BottomActionHeight }}>
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
                  <TintButton color="secondary60" onPress={handlePressBack}>
                    􀆉 Back
                  </TintButton>
                  {isEmpty ? (
                    <TintButton
                      color="secondary60"
                      onPress={handlePressContinue}
                    >
                      Skip
                    </TintButton>
                  ) : (
                    <SheetActionButton
                      color={accentColor}
                      label="Review"
                      onPress={handlePressContinue}
                      size="big"
                      weight="heavy"
                    />
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
        style={{ height: 30, width: 30 }}
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
