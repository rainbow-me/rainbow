import * as i18n from '@/languages';

export const TransactionActions = {
  addToContacts: i18n.t(i18n.l.transactions.actions.addToContacts),
  cancel: i18n.t(i18n.l.transactions.actions.cancel),
  close: i18n.t(i18n.l.transactions.actions.close),
  speedUp: i18n.t(i18n.l.transactions.actions.speedUp),
  trySwapAgain: i18n.t(i18n.l.transactions.actions.trySwapAgain),
  viewContact: i18n.t(i18n.l.transactions.actions.viewContact),
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
