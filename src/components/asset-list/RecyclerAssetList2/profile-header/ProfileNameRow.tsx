import * as React from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Icon } from '@/components/icons';
import { Box, Inline, Text, useForegroundColor } from '@/design-system';
import { useAccountProfile, useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import { abbreviateEnsForDisplay } from '@/utils/abbreviations';
import Routes from '@rainbow-me/routes';

export const ProfileNameRowHeight = 16;

export function ProfileNameRow({ testIDPrefix }: { testIDPrefix?: string }) {
  // ////////////////////////////////////////////////////
  // Account
  const { accountENS, accountName } = useAccountProfile();

  // ////////////////////////////////////////////////////
  // Name & press handler

  const { navigate } = useNavigation();

  const onPressName = () => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  };

  const name = accountENS
    ? abbreviateEnsForDisplay(accountENS, 20)
    : accountName;

  // ////////////////////////////////////////////////////
  // Colors

  const iconColor = useForegroundColor('secondary60 (Deprecated)');

  // ////////////////////////////////////////////////////
  // Spacings

  const { width: deviceWidth } = useDimensions();

  const horizontalInset = 19;
  const accountNameLeftOffset = 15;
  const caretIconWidth = 22;
  const maxWidth =
    deviceWidth -
    (caretIconWidth + accountNameLeftOffset) -
    horizontalInset * 2;

  return (
    <>
      {name && (
        <ButtonPressAnimation
          onPress={onPressName}
          scale={0.8}
          testID={testIDPrefix ? `${testIDPrefix}-${name}` : undefined}
        >
          <Inline alignVertical="center" space="4px" wrap={false}>
            <Box style={{ maxWidth }}>
              <Text
                color="label"
                numberOfLines={1}
                size="23px / 27px (Deprecated)"
                weight="bold"
              >
                {name}
              </Text>
            </Box>
            <Icon
              color={iconColor}
              height={9}
              name="caretDownIcon"
              width={caretIconWidth}
            />
          </Inline>
        </ButtonPressAnimation>
      )}
    </>
  );
}
