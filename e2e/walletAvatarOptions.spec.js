/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

const WALLET_AVATAR_COORDS = { x: 210, y: 125 };
const DISMISS_AVATAR_BUILDER_COORDS = { x: 20, y: 90 };
const RAINBOW_TEST_WALLET = 'rainbowtestwallet.eth';
const RAINBOW_WALLET = 'rainbowwallet.eth';
const EMPTY_WALLET = '0x6791da9CCd95405e73d6a1117d02Dc81c4E58775';

describe('Wallet avatar options', () => {
  it('watched wallet without ens', async () => {
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.waitAndTap('watch-address-button');
    await Helpers.typeText('import-sheet-input', EMPTY_WALLET, false);
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.waitAndTap('wallet-info-submit-button');
    await Helpers.waitAndSwipe('wallet-screen', 'right');
    await Helpers.tapAtPoint('profile-screen', WALLET_AVATAR_COORDS);
    await Helpers.checkIfExistsByText('Choose from Library');
    await Helpers.checkIfExistsByText('Pick an Emoji');
    await Helpers.tapByText('Pick an Emoji');
    await Helpers.checkIfVisible('avatar-builder');
  });

  it('imported wallet without ens', async () => {
    await Helpers.waitAndTap('new-wallet-button');
    await Helpers.waitAndSwipe('wallet-screen', 'right');
    await Helpers.tapAtPoint('profile-screen', WALLET_AVATAR_COORDS);
    await Helpers.checkIfExistsByText('Choose from Library');
    await Helpers.checkIfExistsByText('Pick an Emoji');
    await Helpers.checkIfExistsByText('Create your Profile');
    await Helpers.tapByText('Pick an Emoji');
    await Helpers.tapAtPoint('avatar-builder', DISMISS_AVATAR_BUILDER_COORDS);
    await Helpers.tapAtPoint('profile-screen', WALLET_AVATAR_COORDS);
    await Helpers.tapByText('Create your Profile');
    await Helpers.checkIfVisible('ens-intro-sheet');
  });

  it('watched wallet with ens but without ens avatar', async () => {
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.waitAndTap('watch-address-button');
    await Helpers.typeText('import-sheet-input', RAINBOW_TEST_WALLET, false);
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.waitAndTap('wallet-info-submit-button');
    await Helpers.waitAndSwipe('wallet-screen', 'right');
    await Helpers.tapAtPoint('profile-screen', WALLET_AVATAR_COORDS);
    await Helpers.checkIfExistsByText('Choose from Library');
    await Helpers.checkIfExistsByText('Pick an Emoji');
    await Helpers.checkIfExistsByText('View Profile');
    await Helpers.tapByText('Pick an Emoji');
    await Helpers.checkIfVisible('avatar-builder');
    await Helpers.tapAtPoint('avatar-builder', DISMISS_AVATAR_BUILDER_COORDS);
    await Helpers.tapAtPoint('profile-screen', WALLET_AVATAR_COORDS);
    await Helpers.tapByText('View Profile');
    await Helpers.checkIfVisible('profile-sheet');
  });

  it('imported wallet with ens but without ens avatar', async () => {
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.waitAndTap('restore-with-key-button');
    await Helpers.typeText('import-sheet-input', process.env.TEST_SEEDS, false);
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.waitAndTap('wallet-info-submit-button');
    await Helpers.waitAndSwipe('wallet-screen', 'right');
    await Helpers.tapAtPoint('profile-screen', WALLET_AVATAR_COORDS);
    await Helpers.checkIfExistsByText('Choose from Library');
    await Helpers.checkIfExistsByText('Pick an Emoji');
    await Helpers.checkIfExistsByText('View Profile');
    await Helpers.checkIfExistsByText('Edit Profile');
    await Helpers.tapByText('Pick an Emoji');
    await Helpers.checkIfVisible('avatar-builder');
    await Helpers.tapAtPoint('avatar-builder', DISMISS_AVATAR_BUILDER_COORDS);
    await Helpers.tapAtPoint('profile-screen', WALLET_AVATAR_COORDS);
    await Helpers.tapByText('View Profile');
    await Helpers.checkIfVisible('profile-sheet');
    await Helpers.waitAndSwipe('profile-sheet', 'down');
    await Helpers.tapAtPoint('profile-screen', WALLET_AVATAR_COORDS);
    await Helpers.tapByText('Edit Profile');
    await Helpers.checkIfExists('ens-edit-records-sheet');
  });

  it('watched wallet with ens avatar', async () => {
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.waitAndTap('watch-address-button');
    await Helpers.typeText('import-sheet-input', RAINBOW_WALLET, false);
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.waitAndTap('wallet-info-submit-button');
    await Helpers.waitAndSwipe('wallet-screen', 'right');
    await Helpers.tapAtPoint('profile-screen', WALLET_AVATAR_COORDS);
    await Helpers.checkIfExistsByText('View Profile');
    await Helpers.tapByText('View Profile');
    await Helpers.checkIfVisible('profile-sheet');
  });

  // missing case: imported wallet with ens avatar

  afterEach(async () => {
    // Reset the app state
    await device.clearKeychain();
    await Helpers.relaunchApp();
  });
});
