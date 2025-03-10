import * as React from 'react';
import { useRecoilState } from 'recoil';
import Clipboard from '@react-native-clipboard/clipboard';
import { ButtonPressAnimation } from '@/components/animations';
import { Icon } from '@/components/icons';
import { Bleed, Box, Inset, Text, useForegroundColor } from '@/design-system';
import { useAccountProfile, useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import { abbreviateEnsForDisplay } from '@/utils/abbreviations';
import Routes from '@rainbow-me/routes';
import { haptics } from '@/utils';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { NAVBAR_HORIZONTAL_INSET } from '@/components/navbar/Navbar';
import { NAVBAR_ICON_SIZE } from '@/components/navbar/NavbarTextIcon';

export const ProfileNameRowHeight = 16;
const CARET_ICON_WIDTH = 22;
const HIT_SLOP = 16;
const GAP = 4;

export function ProfileName() {
  const { accountENS, accountName } = useAccountProfile();

  const { navigate } = useNavigation();
  const [isToastActive, setToastActive] = useRecoilState(addressCopiedToastAtom);
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
    Clipboard.setString(accountAddress);
  }, [accountAddress, isToastActive, setToastActive]);

  const name = accountENS ? abbreviateEnsForDisplay(accountENS, 20) : accountName;

  // ////////////////////////////////////////////////////
  // Colors

  const iconColor = useForegroundColor('secondary60 (Deprecated)');

  // ////////////////////////////////////////////////////
  // Spacings

  const { width: deviceWidth } = useDimensions();

  const maxWidth = deviceWidth - 2 * (NAVBAR_ICON_SIZE + NAVBAR_HORIZONTAL_INSET + HIT_SLOP) - CARET_ICON_WIDTH - GAP;

  return (
    <Box
      style={{
        zIndex: 100,
      }}
    >
      {name && (
        <Bleed space={`${HIT_SLOP}px`}>
          <ButtonPressAnimation onLongPress={onLongPressName} onPress={onPressName} scaleTo={0.84} testID={`profile-name-${name}`}>
            <Inset space={`${HIT_SLOP}px`}>
              <Box flexDirection="row" alignItems="center" gap={GAP}>
                <Box style={{ maxWidth }}>
                  <Text color="label" numberOfLines={1} size="22pt" weight="bold" ellipsizeMode="middle">
                    {name}
                  </Text>
                </Box>
                <Icon color={iconColor} height={9} name="caretDownIcon" width={CARET_ICON_WIDTH} />
              </Box>
            </Inset>
          </ButtonPressAnimation>
        </Bleed>
      )}
    </Box>
  );
}
