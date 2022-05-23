import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { ButtonPressAnimation } from '../animations';
import ENSCircleIcon from '../icons/svg/ENSCircleIcon';
import { useTheme } from '@rainbow-me/context';
import {
  Box,
  Inline,
  Inset,
  Stack,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';

function Callout({
  after,
  before,
  children,
}: {
  after?: React.ReactNode;
  before?: React.ReactNode;
  children: string;
}) {
  const { colors } = useTheme();
  return (
    <Box
      as={LinearGradient}
      borderRadius={24}
      colors={colors.gradients.lightGreyWhite}
      end={{ x: 1, y: 0 }}
      height="40px"
      justifyContent="center"
      start={{ x: 0, y: 0 }}
    >
      <Inset horizontal="10px">
        <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
          <Inline alignVertical="center" space="8px" wrap={false}>
            {before}
            <Text color="secondary80" size="14px" weight="heavy">
              {children}
            </Text>
          </Inline>
          {after}
        </Inline>
      </Inset>
    </Box>
  );
}

function CheckboxField({ isChecked, label, onPress }) {
  const secondary15 = useForegroundColor('secondary15');
  const action = useForegroundColor('action');

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.925}>
      <Inline alignVertical="center" space="8px" wrap={false}>
        <Box
          alignItems="center"
          background={isChecked ? 'action' : 'body'}
          borderRadius={7}
          height={{ custom: 20 }}
          justifyContent="center"
          style={{
            borderColor: isChecked ? action : secondary15,
            borderWidth: 2,
          }}
          width={{ custom: 20 }}
        >
          {isChecked && (
            <Inset left="1px">
              <Text size="12px" weight="bold">
                􀆅
              </Text>
            </Inset>
          )}
        </Box>
        <Box flexShrink={1}>
          <Text
            color={isChecked ? 'action' : 'secondary80'}
            size="16px"
            weight="bold"
          >
            {label}
          </Text>
        </Box>
      </Inline>
    </ButtonPressAnimation>
  );
}

export default function SendENSConfigurationSection({
  checkboxes,
  onPressCheckbox,
}) {
  return (
    <Inset horizontal="19px">
      <Stack space="19px">
        <Callout
          after={
            <Text color="secondary30" weight="heavy">
              􀅵
            </Text>
          }
          before={
            <Box
              background="accent"
              borderRadius={20}
              shadow="12px heavy accent"
              style={{ height: 20, width: 20 }}
            >
              <ENSCircleIcon height={20} width={20} />
            </Box>
          }
        >
          ENS configuration options
        </Callout>
        <Inset horizontal="10px">
          <Stack space="24px">
            {checkboxes.map(({ checked, label }, i) => (
              <CheckboxField
                isChecked={checked}
                key={label}
                label={label}
                onPress={() =>
                  onPressCheckbox({ checked: !checked, id: i, label })
                }
              />
            ))}
          </Stack>
        </Inset>
      </Stack>
    </Inset>
  );
}
