import { useRoute } from '@react-navigation/core';
import React from 'react';
import { useRecoilState } from 'recoil';
import SelectableButton from '../components/ens-registration/TextRecordsForm/SelectableButton';
import { SlackSheet } from '../components/sheet';
import { AccentColorProvider, Box, Inline } from '@rainbow-me/design-system';
import { accentColorAtom, textRecordFields } from '@rainbow-me/helpers/ens';
import { useENSRegistrationForm } from '@rainbow-me/hooks';

export const ENSAdditionalRecordsSheetHeight = 280;

export default function ENSAdditionalRecordsSheet() {
  const { params } = useRoute();
  const [accentColor] = useRecoilState(accentColorAtom);
  const {
    selectedFields,
    onAddField,
    onRemoveField,
  } = useENSRegistrationForm();

  const boxStyle = useMemo(
    () => ({
      height: params.longFormHeight || ENSAdditionalRecordsSheetHeight,
    }),
    [params.longFormHeight]
  );

  return (
    <SlackSheet additionalTopPadding height="100%" scrollEnabled={false}>
      <AccentColorProvider color={accentColor}>
        <Box
          background="body"
          paddingHorizontal="19px"
          paddingVertical="30px"
          style={boxStyle}
          testID="ens-confirm-register-sheet"
        >
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
