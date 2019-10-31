import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { deleteLocalContact } from '../../handlers/localstorage/contacts';
import { showActionSheetWithOptions } from '../../utils/actionsheet';

const showDeleteContactActionSheet = ({ address, nickname, onDelete }) =>
  showActionSheetWithOptions(
    {
      cancelButtonIndex: 1,
      destructiveButtonIndex: 0,
      message: `Are you sure that you want to delete "${nickname ||
        address}" from your contacts?`,
      options: ['Delete Contact', 'Cancel'],
    },
    async buttonIndex => {
      if (buttonIndex === 0) {
        await deleteLocalContact(address);
        ReactNativeHapticFeedback.trigger('notificationSuccess');
        onDelete();
      }
    }
  );

export default showDeleteContactActionSheet;
