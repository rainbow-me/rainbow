import i18n from '@/languages';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import { showActionSheetWithOptions } from '@/utils';

const showDeleteContactActionSheet = ({ address, nickname, onDelete = () => undefined, removeContact }) =>
  showActionSheetWithOptions(
    {
      cancelButtonIndex: 1,
      destructiveButtonIndex: 0,
      message: `Are you sure you want to delete "${removeFirstEmojiFromString(nickname) || address}" from your contacts?`,
      options: [i18n.contacts.options.delete(), i18n.contacts.options.cancel()],
    },
    async buttonIndex => {
      if (buttonIndex === 0) {
        removeContact(address);
        ReactNativeHapticFeedback.trigger('notificationSuccess');
        onDelete?.();
      }
    }
  );

export default showDeleteContactActionSheet;
