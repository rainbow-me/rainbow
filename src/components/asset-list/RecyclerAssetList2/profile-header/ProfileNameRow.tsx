import * as React from 'react';
import { useRecoilState } from 'recoil';
import Clipboard from '@react-native-clipboard/clipboard';
import { ButtonPressAnimation } from '@/components/animations';
import { Icon } from '@/components/icons';
import { Bleed, Box, Inline, Inset, Text, useForegroundColor } from '@/design-system';
import { useAccountProfile, useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import { abbreviateEnsForDisplay } from '@/utils/abbreviations';
import Routes from '@rainbow-me/routes';
import { FloatingEmojis } from '@/components/floating-emojis';
import { haptics } from '@/utils';
import { Space } from '@/design-system/docs/system/tokens.css';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';

export const ProfileNameRowHeight = 16;

export function ProfileNameRow({
  disableOnPress,
  testIDPrefix,
  variant,
}: {
  disableOnPress?: any;
  testIDPrefix?: string;
  variant?: string;
}) {
  // ////////////////////////////////////////////////////
  // Account
  const { accountENS, accountName } = useAccountProfile();

  const onNewEmoji = React.useRef<() => void>();

  // ////////////////////////////////////////////////////
  // Name & press handler

  const { navigate } = useNavigation();
  const [isToastActive, setToastActive] = useRecoilState(addressCopiedToastAtom);
  const { accountAddress } = useAccountProfile();

  const onPressName = () => {
    if (disableOnPress) return;
    navigate(Routes.CHANGE_WALLET_SHEET);
  };
  const onLongPressName = React.useCallback(() => {
    if (disableOnPress) return;
    if (!isToastActive) {
      setToastActive(true);
      setTimeout(() => {
        setToastActive(false);
      }, 2000);
    }
    haptics.notificationSuccess();
    onNewEmoji?.current && onNewEmoji.current();
    Clipboard.setString(accountAddress);
  }, [accountAddress, disableOnPress, isToastActive, setToastActive]);

  const name = accountENS ? abbreviateEnsForDisplay(accountENS, 20) : accountName;

  // ////////////////////////////////////////////////////
  // Colors

  const iconColor = useForegroundColor('secondary60 (Deprecated)');

  // ////////////////////////////////////////////////////
  // Spacings

  const { width: deviceWidth } = useDimensions();

  const horizontalInset = 19;
  const accountNameLeftOffset = 15;
  const caretIconWidth = 22;
  const maxWidth = deviceWidth - (caretIconWidth + accountNameLeftOffset) - horizontalInset * 2;

  const hitSlop: Space = '16px';
  return (
    <Box pointerEvents={disableOnPress ? 'none' : 'auto'} position="absolute" style={{ zIndex: 100 }}>
      {name && (
        <Bleed space={hitSlop}>
          <ButtonPressAnimation
            onLongPress={onLongPressName}
            onPress={onPressName}
            scaleTo={0.84}
            testID={testIDPrefix ? `${testIDPrefix}-${name}` : undefined}
          >
            <Inset space={hitSlop}>
              <Inline alignVertical="center" space="4px" wrap={false}>
                <Box style={{ maxWidth }}>
                  <Text color="label" numberOfLines={1} size={variant === 'header' ? '22pt' : '22pt'} weight="bold">
                    {name}
                  </Text>
                </Box>
                <Icon color={iconColor} height={9} name="caretDownIcon" width={caretIconWidth} />
              </Inline>
            </Inset>
          </ButtonPressAnimation>
        </Bleed>
      )}
      {/* @ts-expect-error – JS component */}
      <FloatingEmojis
        distance={150}
        duration={500}
        fadeOut={false}
        scaleTo={0}
        size={50}
        wiggleFactor={0}
        // @ts-expect-error – JS component
        setOnNewEmoji={newOnNewEmoji => (onNewEmoji.current = newOnNewEmoji)}
      />
    </Box>
  );
}
