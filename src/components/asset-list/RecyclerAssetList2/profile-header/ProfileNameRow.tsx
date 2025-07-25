import { ButtonPressAnimation } from '@/components/animations';
import { FloatingEmojis } from '@/components/floating-emojis';
import { Icon } from '@/components/icons';
import { NAVBAR_HORIZONTAL_INSET } from '@/components/navbar/Navbar';
import { NAVBAR_ICON_SIZE } from '@/components/navbar/NavbarTextIcon';
import { Bleed, Box, Inset, Text, useForegroundColor } from '@/design-system';
import { useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { formatAccountLabel, useAccountAddress, useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { haptics } from '@/utils';
import { abbreviateEnsForDisplay, address } from '@/utils/abbreviations';
import Routes from '@rainbow-me/routes';
import Clipboard from '@react-native-clipboard/clipboard';
import * as React from 'react';
import { useRecoilState } from 'recoil';

export const ProfileNameRowHeight = 16;
const CARET_ICON_WIDTH = 22;
const HIT_SLOP = 16;
const GAP = 4;

export const ProfileNameRow = React.memo(function ProfileNameRow({
  disableOnPress,
  testIDPrefix,
  variant,
}: {
  disableOnPress?: boolean;
  testIDPrefix?: string;
  variant?: string;
}) {
  // ////////////////////////////////////////////////////
  // Account
  const { accountENS, accountName } = useAccountProfileInfo();

  const onNewEmoji = React.useRef<() => void>();

  // ////////////////////////////////////////////////////
  // Name & press handler

  const { navigate } = useNavigation();
  const [isToastActive, setToastActive] = useRecoilState(addressCopiedToastAtom);
  const accountAddress = useAccountAddress();

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

  const name = React.useMemo(() => {
    return (
      formatAccountLabel({
        address: accountAddress,
        ens: abbreviateEnsForDisplay(accountENS, 20),
        label: accountName,
      }) || address(accountAddress, 4, 4)
    );
  }, [accountAddress, accountENS, accountName]);

  // ////////////////////////////////////////////////////
  // Colors

  const iconColor = useForegroundColor('secondary60 (Deprecated)');

  // ////////////////////////////////////////////////////
  // Spacings

  const { width: deviceWidth } = useDimensions();

  const maxWidth = deviceWidth - 2 * (NAVBAR_ICON_SIZE + NAVBAR_HORIZONTAL_INSET + HIT_SLOP) - CARET_ICON_WIDTH - GAP;

  return (
    <Box
      pointerEvents={disableOnPress ? 'none' : 'auto'}
      position="absolute"
      style={{
        zIndex: 100,
      }}
    >
      {name && (
        <Bleed space={`${HIT_SLOP}px`}>
          <ButtonPressAnimation
            onLongPress={onLongPressName}
            onPress={onPressName}
            scaleTo={0.84}
            testID={testIDPrefix ? `${testIDPrefix}-${name}` : undefined}
          >
            <Inset space={`${HIT_SLOP}px`}>
              <Box flexDirection="row" alignItems="center" gap={GAP}>
                <Box style={{ maxWidth }}>
                  <Text color="label" numberOfLines={1} size={variant === 'header' ? '22pt' : '22pt'} weight="bold" ellipsizeMode="middle">
                    {name}
                  </Text>
                </Box>
                <Icon color={iconColor} height={9} name="caretDownIcon" width={CARET_ICON_WIDTH} />
              </Box>
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
        setOnNewEmoji={newOnNewEmoji => (onNewEmoji.current = newOnNewEmoji)}
      />
    </Box>
  );
});
