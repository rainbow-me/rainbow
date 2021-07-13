import Alert from './Alert';

export default function DelayedAlert(options, delayMs = 500) {
  setTimeout(() => Alert(options), delayMs);
}
