/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

const WALLET_AVATAR_COORDS = { x: 210, y: 125 };
const WALLET_ADDRESS_COORDS = { x: 210, y: 185 };
const PROFILE_AVATAR_COORDS = { x: 210, y: 125 };
const PROFILE_ADDRESS_COORDS = { x: 210, y: 195 };
const DISMISS_AVATAR_BUILDER_COORDS = { x: 20, y: 90 };
const RAINBOW_TEST_WALLET = 'rainbowtestwallet.eth';
const RAINBOW_WALLET = 'rainbowwallet.eth';
const EMPTY_WALLET = '0x6791da9CCd95405e73d6a1117d02Dc81c4E58775';

describe('Wallet avatar options', () => {
  it('watch wallet without ens', async () => {
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.waitAndTap('watch-address-button');
    await Helpers.typeText('import-sheet-input', EMPTY_WALLET, false);
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.waitAndTap('wallet-info-submit-button');
    await Helpers.swipe('wallet-screen', 'right', 'slow');
    await Helpers.checkIfVisible('profile-screen');
  });

  it('test watched wallet without ens', async () => {
    await Helpers.tapAtPoint('profile-screen', WALLET_AVATAR_COORDS);
    await Helpers.checkIfExistsByText('Choose from Library');
    await Helpers.checkIfExistsByText('Pick an Emoji');
    await Helpers.tapByText('Pick an Emoji');
    await Helpers.checkIfVisible('avatar-builder');
    await Helpers.tapAtPoint('avatar-builder', DISMISS_AVATAR_BUILDER_COORDS);
  });

  it('import wallet without ens', async () => {
    await Helpers.tapAtPoint('profile-screen', WALLET_ADDRESS_COORDS);
    await Helpers.tapByText('􀁍 Create a new wallet');
    await Helpers.waitAndTap('wallet-info-submit-button');
    await Helpers.relaunchApp();
    await Helpers.swipe('wallet-screen', 'right', 'slow');
    await Helpers.checkIfVisible('profile-screen');
  });

  it('test imported wallet without ens', async () => {
    await Helpers.tapAtPoint('profile-screen', WALLET_AVATAR_COORDS);
    await Helpers.checkIfExistsByText('Choose from Library');
    await Helpers.checkIfExistsByText('Pick an Emoji');
    await Helpers.checkIfExistsByText('Create your Profile');
    await Helpers.tapByText('Pick an Emoji');
    await Helpers.tapAtPoint('avatar-builder', DISMISS_AVATAR_BUILDER_COORDS);
    await Helpers.tapAtPoint('profile-screen', WALLET_AVATAR_COORDS);
    await Helpers.tapByText('Create your Profile');
    await Helpers.checkIfVisible('ens-intro-sheet');
    await Helpers.swipe('ens-intro-sheet', 'down', 'slow');
  });

  it('watch wallet with ens but without ens avatar', async () => {
    await Helpers.tapAtPoint('profile-screen', WALLET_ADDRESS_COORDS);
    await Helpers.tapByText('􀂍 Add an existing wallet');
    await Helpers.typeText('import-sheet-input', RAINBOW_TEST_WALLET, false);
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.waitAndTap('wallet-info-submit-button');
    await Helpers.relaunchApp();
  });

  it('test watched wallet with ens but without ens avatar', async () => {
    await Helpers.tapAtPoint('wallet-screen', PROFILE_AVATAR_COORDS);
    await Helpers.checkIfExistsByText('Choose from Library');
    await Helpers.checkIfExistsByText('Pick an Emoji');
    await Helpers.checkIfExistsByText('View Profile');
    await Helpers.tapByText('Pick an Emoji');
    await Helpers.checkIfVisible('avatar-builder');
    await Helpers.tapAtPoint('avatar-builder', DISMISS_AVATAR_BUILDER_COORDS);
    await Helpers.tapAtPoint('wallet-screen', PROFILE_AVATAR_COORDS);
    await Helpers.tapByText('View Profile');
    await Helpers.checkIfVisible('profile-sheet');
    await Helpers.swipe('profile-sheet', 'down', 'slow');
  });

  it('import wallet with ens but without ens avatar', async () => {
    await Helpers.tapAtPoint('wallet-screen', PROFILE_ADDRESS_COORDS);
    await Helpers.tapByText('􀂍 Add an existing wallet');
    await Helpers.typeText('import-sheet-input', process.env.TEST_SEEDS, false);
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.waitAndTap('wallet-info-submit-button');
    await Helpers.relaunchApp();
  });

  it('test imported wallet with ens but without ens avatar', async () => {
    await Helpers.tapAtPoint('wallet-screen', PROFILE_AVATAR_COORDS);
    await Helpers.checkIfExistsByText('Choose from Library');
    await Helpers.checkIfExistsByText('Pick an Emoji');
    await Helpers.checkIfExistsByText('View Profile');
    await Helpers.checkIfExistsByText('Edit Profile');
    await Helpers.tapByText('Pick an Emoji');
    await Helpers.checkIfVisible('avatar-builder');
    await Helpers.tapAtPoint('avatar-builder', DISMISS_AVATAR_BUILDER_COORDS);
    await Helpers.tapAtPoint('wallet-screen', PROFILE_AVATAR_COORDS);
    await Helpers.tapByText('View Profile');
    await Helpers.checkIfVisible('profile-sheet');
    await Helpers.waitAndSwipe('profile-sheet', 'down');
    await Helpers.tapAtPoint('wallet-screen', PROFILE_AVATAR_COORDS);
    await Helpers.tapByText('Edit Profile');
    await Helpers.checkIfExists('ens-edit-records-sheet');
    await Helpers.swipe('ens-edit-records-sheet', 'down', 'slow');
  });

  it('import wallet with ens avatar', async () => {
    await Helpers.tapAtPoint('wallet-screen', PROFILE_ADDRESS_COORDS);
    await Helpers.tapByText('􀂍 Add an existing wallet');
    await Helpers.typeText('import-sheet-input', RAINBOW_WALLET, false);
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.waitAndTap('wallet-info-submit-button');
    await Helpers.relaunchApp();
  });

  it('test watched wallet with ens avatar', async () => {
    await Helpers.tapAtPoint('wallet-screen', PROFILE_AVATAR_COORDS);
    await Helpers.checkIfVisible('profile-sheet');
  });

  // missing case: imported wallet with ens avatar

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
  });
});
