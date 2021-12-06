import Alert from './Alert';

export default function DelayedAlert(options: any, delayMs = 500) {
  setTimeout(() => Alert(options), delayMs);
}
