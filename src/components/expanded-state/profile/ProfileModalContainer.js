import { useRoute } from '@react-navigation/native';
import React from 'react';
import TouchableBackdrop from '../../TouchableBackdrop';
import { AssetPanel, FloatingPanels } from '../../floating-panels';
import { KeyboardFixedOpenLayout } from '../../layout';
import { IS_IOS } from '@/env';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

const maxWidth = DEVICE_WIDTH - 110;

export default function ProfileModalContainer({ onPressBackdrop, ...props }) {
  const { params } = useRoute();

  return (
    <KeyboardFixedOpenLayout additionalPadding={params?.additionalPadding && IS_IOS ? 80 : 0} position="absolute">
      <TouchableBackdrop onPress={onPressBackdrop} />
      <FloatingPanels maxWidth={maxWidth}>
        <AssetPanel {...props} />
      </FloatingPanels>
    </KeyboardFixedOpenLayout>
  );
}
