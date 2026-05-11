import React from 'react';
import { Platform } from 'react-native';

import { useRoute } from '@react-navigation/native';

import useDimensions from '@/hooks/useDimensions';

import { AssetPanel, FloatingPanels } from '../../floating-panels';
import { KeyboardFixedOpenLayout } from '../../layout';
import TouchableBackdrop from '../../TouchableBackdrop';

export default function ProfileModalContainer({ onPressBackdrop, ...props }) {
  const { width: deviceWidth } = useDimensions();
  const { params } = useRoute();

  return (
    <KeyboardFixedOpenLayout additionalPadding={params?.additionalPadding && Platform.OS === 'ios' ? 80 : 0} position="absolute">
      <TouchableBackdrop onPress={onPressBackdrop} />
      <FloatingPanels maxWidth={deviceWidth - 110}>
        <AssetPanel {...props} />
      </FloatingPanels>
    </KeyboardFixedOpenLayout>
  );
}
