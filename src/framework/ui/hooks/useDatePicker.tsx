import React, { useCallback, useState, type ReactNode } from 'react';
import { Keyboard, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import NativeDateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, useBackgroundColor, useColorMode } from '@/design-system';

type UseDatePickerOptions = {
  confirmLabel: string;
  initialDate: Date;
  onChange: (date: Date) => void;
  value: Date | null;
  maximumDate?: Date;
  minimumDate?: Date;
  testID?: string;
};

type UseDatePickerResult = {
  openPicker: () => void;
  picker: ReactNode;
};

export function useDatePicker({
  confirmLabel,
  initialDate,
  onChange,
  value,
  maximumDate,
  minimumDate,
  testID,
}: UseDatePickerOptions): UseDatePickerResult {
  const [draftDate, setDraftDate] = useState(initialDate);
  const [isIOSPickerVisible, setIsIOSPickerVisible] = useState(false);

  const closeIOSPicker = useCallback(() => setIsIOSPickerVisible(false), []);

  const confirmIOSPicker = useCallback(() => {
    onChange(draftDate);
    setIsIOSPickerVisible(false);
  }, [draftDate, onChange]);

  const openPicker = useCallback(() => {
    Keyboard.dismiss();
    const selectedDate = value ?? initialDate;
    setDraftDate(selectedDate);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        maximumDate,
        minimumDate,
        mode: 'date',
        onValueChange: (_event, date) => onChange(date),
        positiveButton: { label: confirmLabel },
        testID,
        value: selectedDate,
      });
      return;
    }

    setIsIOSPickerVisible(true);
  }, [confirmLabel, initialDate, maximumDate, minimumDate, onChange, testID, value]);

  const picker =
    Platform.OS === 'ios' ? (
      <DatePickerSheet
        confirmLabel={confirmLabel}
        date={draftDate}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        onChangeDate={setDraftDate}
        onClose={closeIOSPicker}
        onConfirm={confirmIOSPicker}
        testID={testID}
        visible={isIOSPickerVisible}
      />
    ) : null;

  return { openPicker, picker };
}

type DatePickerSheetProps = {
  confirmLabel: string;
  date: Date;
  onChangeDate: (date: Date) => void;
  onClose: () => void;
  onConfirm: () => void;
  visible: boolean;
  maximumDate?: Date;
  minimumDate?: Date;
  testID?: string;
};

function DatePickerSheet({
  confirmLabel,
  date,
  onChangeDate,
  onClose,
  onConfirm,
  visible,
  maximumDate,
  minimumDate,
  testID,
}: DatePickerSheetProps) {
  const surfacePrimaryElevated = useBackgroundColor('surfacePrimaryElevated');
  const { isDarkMode } = useColorMode();
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modal}>
        <Pressable accessibilityRole="button" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.pickerContainer, { backgroundColor: surfacePrimaryElevated, paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.pickerHeader}>
            <Pressable accessibilityRole="button" onPress={onConfirm} testID={testID ? `${testID}-confirm` : undefined}>
              <Text color="blue" size="17pt" weight="bold">
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
          <NativeDateTimePicker
            display="spinner"
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            mode="date"
            onValueChange={(_event, newDate) => onChangeDate(newDate)}
            style={styles.iosPicker}
            testID={testID}
            themeVariant={isDarkMode ? 'dark' : 'light'}
            value={date}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  iosPicker: {
    height: 216,
    width: '100%',
  },
  modal: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  pickerHeader: {
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
});
