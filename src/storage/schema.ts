/**
 * Device data that's specific to the device and does not vary based on network or active wallet
 */
export type Device = {
  id: string;
  doNotTrack: boolean;

  /**
   * Undefined on first load of the app, meaning they're a new user. We set
   * this to `true` immediately, so that on subsequent loads we knew they've
   * already opened the app at least once.
   */
  isReturningUser: boolean;

  /**
   * Undefined when branch referring params have not been attempted to be set in
   * the past. We set this to `true` immediately after checking.
   */
  branchFirstReferringParamsSet: boolean;
};
