import React, { useCallback, useState } from 'react';
import { Keyboard, ScrollView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MiniButton } from '../components/buttons';
import {
  textRecordsFields,
  TextRecordsForm,
} from '../components/ens-registration';
import SelectableButton from '../components/ens-registration/TextRecordsForm/SelectableButton';
import { SheetActionButton, SheetActionButtonRow } from '../components/sheet';
import { useNavigation } from '../navigation/Navigation';
import {
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
import { useKeyboardHeight } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

export default function ENSAssignRecordsSheet() {
  const { navigate } = useNavigation();
  const keyboardHeight = useKeyboardHeight();

  const handlePressContinue = useCallback(() => {
    navigate(Routes.ENS_CONFIRM_REGISTER_SHEET);
  }, [navigate]);

  const [selectedFields, setSelectedFields] = useState([
    textRecordsFields.name,
    textRecordsFields.bio,
    textRecordsFields.website,
    textRecordsFields.twitter,
  ]);

  return (
    <Box background="body" flexGrow={1} paddingTop="30px">
      <Rows>
        <Row>
          <Box as={ScrollView} flexGrow={1}>
            <Inset horizontal="19px" top="4px">
              <Stack space="30px">
                <Stack alignHorizontal="center" space="15px">
                  <Heading size="26px" weight="heavy">
                    placeholder.eth
                  </Heading>
                  <Text color="action" size="16px" weight="heavy">
                    Create your profile
                  </Text>
                </Stack>
                <TextRecordsForm selectedFields={selectedFields} />
              </Stack>
            </Inset>
          </Box>
          <Box bottom="0px" position="absolute" right="0px">
            <Inset bottom="19px" right="19px">
              <HideKeyboardButton />
            </Inset>
          </Box>
        </Row>
        <Row height="content">
          <Box paddingBottom="30px" style={{ height: keyboardHeight }}>
            <Shadow />
            <Rows>
              <Row>
                <Inset space="19px">
                  <Inline space="10px">
                    {Object.values(textRecordsFields).map(
                      (textRecordField, i) => {
                        const isSelected = selectedFields.some(
                          field => field.id === textRecordField.id
                        );
                        return (
                          <SelectableButton
                            isSelected={isSelected}
                            key={i}
                            onSelect={() => {
                              setSelectedFields(fields => {
                                if (isSelected) {
                                  const index = selectedFields.findIndex(
                                    ({ id }) => textRecordField.id === id
                                  );
                                  let newFields = [...fields];
                                  newFields.splice(index, 1);
                                  return newFields;
                                } else {
                                  return [...fields, textRecordField];
                                }
                              });
                            }}
                          >
                            {textRecordField.label}
                          </SelectableButton>
                        );
                      }
                    )}
                  </Inline>
                </Inset>
              </Row>
              <Row height="content">
                <SheetActionButtonRow>
                  <SheetActionButton
                    label="Review"
                    onPress={handlePressContinue}
                    size="big"
                    weight="heavy"
                  />
                </SheetActionButtonRow>
              </Row>
            </Rows>
          </Box>
        </Row>
      </Rows>
    </Box>
  );
}

const AnimatedBox = Animated.createAnimatedComponent(Box);

function HideKeyboardButton() {
  const show = useSharedValue(false);

  useEffect(() => {
    const handleKeyboardWillShow = () => (show.value = true);
    const handleKeyboardWillHide = () => (show.value = false);

    Keyboard.addListener('keyboardWillShow', handleKeyboardWillShow);
    Keyboard.addListener('keyboardWillHide', handleKeyboardWillHide);
    return () => {
      Keyboard.removeListener('keyboardWillShow', handleKeyboardWillShow);
      Keyboard.removeListener('keyboardWillHide', handleKeyboardWillHide);
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
