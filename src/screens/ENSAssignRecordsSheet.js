import React, { useCallback } from 'react';
import { Keyboard, ScrollView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { MiniButton } from '../components/buttons';
import TintButton from '../components/buttons/TintButton';
import { TextRecordsForm } from '../components/ens-registration';
import SelectableButton from '../components/ens-registration/TextRecordsForm/SelectableButton';
import { SheetActionButton, SheetActionButtonRow } from '../components/sheet';
import { useNavigation } from '../navigation/Navigation';
// import { usePersistentDominantColorFromImage } from '@rainbow-me/hooks';
import {
  AccentColorProvider,
  Box,
  Cover,
  Heading,
  Inline,
  Inset,
  Row,
  Rows,
  Stack,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';
import { ENS_RECORDS, textRecordFields } from '@rainbow-me/helpers/ens';
import { useENSProfileForm, useKeyboardHeight } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

export default function ENSAssignRecordsSheet() {
  const { navigate } = useNavigation();
  const keyboardHeight = useKeyboardHeight();
  const ensName = useSelector(({ ensRegistration }) => ensRegistration.name);

  const avatarColor = useForegroundColor('action');
  //   usePersistentDominantColorFromImage('TODO').result || colors.purple;   // add this when we implement avatars

  const handlePressBack = useCallback(() => {
    navigate(Routes.ENS_SEARCH_SHEET);
  }, [navigate]);

  const handlePressContinue = useCallback(() => {
    navigate(Routes.ENS_CONFIRM_REGISTER_SHEET, { color: avatarColor });
  }, [avatarColor, navigate]);

  const {
    formIsEmpty,
    selectedFields,
    onAddField,
    onRemoveField,
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

  const avatarRadius = 35;

  return (
    <AccentColorProvider color={avatarColor}>
      <Box background="body" flexGrow={1}>
        <Rows>
          <Row>
            <Box as={ScrollView} flexGrow={1}>
              <Box
                background="accent"
                height={{ custom: 125 }}
                marginBottom={{ custom: 70 }}
              >
                <Cover alignHorizontal="center">
                  <Box
                    background="swap"
                    borderRadius={avatarRadius}
                    height={{ custom: avatarRadius * 2 }}
                    top={{ custom: 105 }}
                    width={{ custom: avatarRadius * 2 }}
                  />
                </Cover>
              </Box>
              <Inset horizontal="19px" top="4px">
                <Stack space="30px">
                  <Stack alignHorizontal="center" space="15px">
                    <Heading size="26px" weight="heavy">
                      {ensName}
                    </Heading>
                    <Text color="accent" size="16px" weight="heavy">
                      Create your profile
                    </Text>
                  </Stack>
                  <Box as={ScrollView} flexGrow={1}>
                    <TextRecordsForm
                      onBlurField={onBlurField}
                      onChangeField={onChangeField}
                      selectedFields={selectedFields}
                      values={values}
                    />
                  </Box>
                </Stack>
              </Inset>
            </Box>
          </Row>
          <Row height="content">
            <Box style={{ height: 250 }}>
              <Shadow />
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
                  <SheetActionButtonRow>
                    <TintButton color="secondary60" onPress={handlePressBack}>
                      􀆉 Back
                    </TintButton>
                    {formIsEmpty ? (
                      <SheetActionButton
                        color={avatarColor}
                        label="Review"
                        onPress={handlePressContinue}
                        size="big"
                        weight="heavy"
                      />
                    ) : (
                      <TintButton
                        color="secondary60"
                        onPress={handlePressContinue}
                      >
                        Skip
                      </TintButton>
                    )}
                  </SheetActionButtonRow>
                </Row>
              </Rows>
            </Box>
          </Row>
        </Rows>
      </Box>
      <Box
        position="absolute"
        right="0px"
        style={{ bottom: keyboardHeight - 40 }}
      >
        <Inset bottom="19px" right="19px">
          <HideKeyboardButton color={avatarColor} />
        </Inset>
      </Box>
    </AccentColorProvider>
  );
}

const AnimatedBox = Animated.createAnimatedComponent(Box);

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
