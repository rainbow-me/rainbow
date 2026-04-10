import { triggerHaptics } from 'react-native-turbo-haptics';

import { showActionSheetWithOptions } from '@/framework/ui/utils/actionsheet';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import * as i18n from '@/languages';

const showDeleteContactActionSheet = ({ address, nickname, onDelete = () => undefined, removeContact }) =>
  showActionSheetWithOptions(
    {
      cancelButtonIndex: 1,
      destructiveButtonIndex: 0,
      message: `Are you sure you want to delete "${removeFirstEmojiFromString(nickname) || address}" from your contacts?`,
      options: [i18n.t(i18n.l.contacts.options.delete), i18n.t(i18n.l.contacts.options.cancel)],
    },
    async buttonIndex => {
      if (buttonIndex === 0) {
        removeContact(address);
        triggerHaptics('notificationSuccess');
        onDelete?.();
      }
    }
  );

export default showDeleteContactActionSheet;
