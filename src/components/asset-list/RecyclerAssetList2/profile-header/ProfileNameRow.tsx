import * as React from 'react';
import { useRecoilState } from 'recoil';
import Clipboard from '@react-native-community/clipboard';
import { ButtonPressAnimation } from '@/components/animations';
import { Icon } from '@/components/icons';
import { Box, Inline, Text, useForegroundColor } from '@/design-system';
import { useAccountProfile, useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import { abbreviateEnsForDisplay } from '@/utils/abbreviations';
import Routes from '@rainbow-me/routes';
import { addressCopiedToastAtom } from '@/screens/WalletScreen';
import { FloatingEmojis } from '@/components/floating-emojis';
import { haptics } from '@/utils';

export const ProfileNameRowHeight = 16;

export function ProfileNameRow({ testIDPrefix }: { testIDPrefix?: string }) {
  // ////////////////////////////////////////////////////
  // Account
  const { accountENS, accountName } = useAccountProfile();

  const onNewEmoji = React.useRef<() => void>();

  // ////////////////////////////////////////////////////
  // Name & press handler

  const { navigate } = useNavigation();
  const [isToastActive, setToastActive] = useRecoilState(
    addressCopiedToastAtom
  );
  const { accountAddress } = useAccountProfile();

  const onPressName = () => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  };
  const onLongPressName = React.useCallback(() => {
    if (!isToastActive) {
      setToastActive(true);
      setTimeout(() => {
        setToastActive(false);
      }, 2000);
    }
    haptics.notificationSuccess();
    onNewEmoji?.current && onNewEmoji.current();
    Clipboard.setString(accountAddress);
  }, [accountAddress, isToastActive, setToastActive]);

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
          onLongPress={onLongPressName}
          onPress={onPressName}
          scale={0.8}
          testID={testIDPrefix ? `${testIDPrefix}-${name}` : undefined}
        >
          {/* @ts-expect-error – JS component */}
          <FloatingEmojis
            distance={150}
            duration={500}
            fadeOut={false}
            scaleTo={0}
            size={50}
            wiggleFactor={0}
            // @ts-expect-error – JS component
            setOnNewEmoji={newOnNewEmoji =>
              (onNewEmoji.current = newOnNewEmoji)
            }
          />
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
