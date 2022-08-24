export interface Campaign {
  action: Function; // Function to call on activating the campaign
  campaignKey: string; // MMKV key to track if the campaign should be run
  check(): Promise<boolean>; // Function that checks if the campaign should be shown
}
