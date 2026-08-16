import { checkNotifications, RESULTS, type PermissionStatus } from 'react-native-permissions';

export async function getNotificationPermissionStatus(): Promise<PermissionStatus> {
  const { status } = await checkNotifications();
  return status;
}

export function isNotificationPermissionGranted(status: PermissionStatus): boolean {
  return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
}
