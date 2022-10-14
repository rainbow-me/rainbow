export const TransactionActions = {
  addToContacts: 'Add to Contacts',
  cancel: '☠️ Cancel',
  close: 'Close',
  speedUp: '🚀 Speed Up',
  viewContact: 'View Contact',
};

export function getShortTransactionActionId(name: string): string {
  switch (name) {
    case TransactionActions.addToContacts:
      return 'add to contacts';
    case TransactionActions.cancel:
      return 'cancel';
    case TransactionActions.close:
      return 'close';
    case TransactionActions.speedUp:
      return 'speed up';
    case TransactionActions.viewContact:
      return 'view contact';
    default:
      return 'block explorer';
  }
}
