import { useRoute } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useRecoilState } from 'recoil';
import SelectableButton from '../components/ens-registration/TextRecordsForm/SelectableButton';
import { SlackSheet } from '../components/sheet';
import { AccentColorProvider, Box, Inline } from '@/design-system';
import { accentColorAtom, textRecordFields } from '@/helpers/ens';
import { useENSRegistrationForm } from '@/hooks';
import { deviceUtils } from '@/utils';
import { IS_ANDROID } from '@/env';

export const ENSAdditionalRecordsSheetHeight = 262;
const recordLineHeight = 30;

export const getENSAdditionalRecordsSheetHeight = () => {
  const deviceWidth = deviceUtils.dimensions.width;
  if (deviceWidth > 400) return ENSAdditionalRecordsSheetHeight;
  if (deviceWidth > 380) return ENSAdditionalRecordsSheetHeight + recordLineHeight;
  return ENSAdditionalRecordsSheetHeight + 2 * recordLineHeight;
};

export default function ENSAdditionalRecordsSheet() {
  const { params } = useRoute<any>();
  const [accentColor] = useRecoilState(accentColorAtom);
  const { selectedFields, onAddField, onRemoveField } = useENSRegistrationForm();
  const { height: deviceHeight } = useWindowDimensions();

  const boxStyle = useMemo(
    () => ({
      height: params.longFormHeight || ENSAdditionalRecordsSheetHeight,
    }),
    [params.longFormHeight]
  );

  const androidTop = deviceHeight - boxStyle.height - recordLineHeight;

  return (
    <SlackSheet additionalTopPadding height="100%" scrollEnabled={false} style={IS_ANDROID ? { top: androidTop } : {}}>
      <AccentColorProvider color={accentColor}>
        <Box
          background="body (Deprecated)"
          paddingHorizontal="19px (Deprecated)"
          paddingVertical="24px"
          style={boxStyle}
          testID="ens-additional-records-sheet"
        >
          <Inline space="10px">
            {Object.values(textRecordFields).map((textRecordField, i) => {
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
          </Inline>
        </Box>
      </AccentColorProvider>
    </SlackSheet>
  );
}
