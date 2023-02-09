import * as React from 'react';
import { useRecoilState } from 'recoil';
import Clipboard from '@react-native-community/clipboard';
import { ButtonPressAnimation } from '@/components/animations';
import { Icon } from '@/components/icons';
import {
  Bleed,
  Box,
  Inline,
  Inset,
  Text,
  useForegroundColor,
} from '@/design-system';
import { useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import { abbreviateEnsForDisplay } from '@/utils/abbreviations';
import Routes from '@rainbow-me/routes';
import { addressCopiedToastAtom } from '@/screens/wallet/WalletScreen';
import { FloatingEmojis } from '@/components/floating-emojis';
import { haptics } from '@/utils';
import { Space } from '@/design-system/docs/system/tokens.css';
import { useCallback, useMemo, useRef } from 'react';

export const ProfileNameRowHeight = 16;

const HORIZONTAL_INSET = 19;
const ACCOUNT_NAME_LEFT_OFFSET = 15;
const CARET_ICON_WIDTH = 22;

type Props = {
  accountAddress?: string;
  accountName?: string;
  accountENS?: string;
  disableOnPress?: boolean;
  testIDPrefix?: string;
};

export const ProfileNameRow: React.FC<Props> = ({
  accountAddress,
  accountName,
  accountENS,
  disableOnPress,
  testIDPrefix,
}) => {
  const onNewEmoji = useRef<() => void>();
  const { navigate } = useNavigation();
  const [isToastActive, setToastActive] = useRecoilState(
    addressCopiedToastAtom
  );

  const onPressName = useCallback(() => {
    if (disableOnPress) return;
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [disableOnPress, navigate]);

  const onLongPressName = useCallback(() => {
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

  const name = useMemo(
    () => (accountENS ? abbreviateEnsForDisplay(accountENS, 20) : accountName),
    [accountName, accountENS]
  );
  const iconColor = useForegroundColor('secondary60 (Deprecated)');
  const { width: deviceWidth } = useDimensions();

  const maxWidth =
    deviceWidth -
    (CARET_ICON_WIDTH + ACCOUNT_NAME_LEFT_OFFSET) -
    HORIZONTAL_INSET * 2;

  const hitSlop: Space = '16px';
  return (
    <Box pointerEvents={disableOnPress ? 'none' : 'auto'}>
      {name && (
        <Bleed space={hitSlop}>
          <ButtonPressAnimation
            onLongPress={onLongPressName}
            onPress={onPressName}
            scale={0.8}
            testID={testIDPrefix ? `${testIDPrefix}-${name}` : undefined}
          >
            <Inset space={hitSlop}>
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
                  width={CARET_ICON_WIDTH}
                />
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
};
