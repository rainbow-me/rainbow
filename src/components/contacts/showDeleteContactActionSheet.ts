import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/emojiHandl... Remove this comment to see the full error message
import { removeFirstEmojiFromString } from '@rainbow-me/helpers/emojiHandler';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { showActionSheetWithOptions } from '@rainbow-me/utils';

const showDeleteContactActionSheet = ({
  address,
  nickname,
  onDelete,
  removeContact,
}: any) =>
  showActionSheetWithOptions(
    {
      cancelButtonIndex: 1,
      destructiveButtonIndex: 0,
      message: `Are you sure you want to delete "${
        removeFirstEmojiFromString(nickname) || address
      }" from your contacts?`,
      options: ['Delete Contact', 'Cancel'],
    },
    async (buttonIndex: any) => {
      if (buttonIndex === 0) {
        removeContact(address);
        ReactNativeHapticFeedback.trigger('notificationSuccess');
        onDelete();
      }
    }
  );

export default showDeleteContactActionSheet;
