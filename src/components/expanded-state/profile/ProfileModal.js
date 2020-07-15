import { useRoute } from '@react-navigation/native';
import React from 'react';
import isNativeStackAvailable from '../../../helpers/isNativeStackAvailable';
import TouchableBackdrop from '../../TouchableBackdrop';
import { AssetPanel, FloatingPanels } from '../../floating-panels';
import { KeyboardFixedOpenLayout } from '../../layout';
import { useDimensions } from '@rainbow-me/hooks';

export default function ProfileModal({ onPressBackdrop, ...props }) {
  const { width: deviceWidth } = useDimensions();
  const { params } = useRoute();

  return (
    <KeyboardFixedOpenLayout
      additionalPadding={
        params?.additionalPadding && isNativeStackAvailable ? 80 : 0
      }
    >
      <TouchableBackdrop onPress={onPressBackdrop} />
      <FloatingPanels maxWidth={deviceWidth - 110}>
        <AssetPanel {...props} />
      </FloatingPanels>
    </KeyboardFixedOpenLayout>
  );
}
