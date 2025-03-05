import * as Helpers from '../helpers';
import { device, element, by } from 'detox';

const WALLET_AVATAR_COORDS = { x: 210, y: 125 };
const WALLET_ADDRESS_COORDS = { x: 210, y: 185 };
const PROFILE_AVATAR_COORDS = { x: 210, y: 125 };
const PROFILE_ADDRESS_COORDS = { x: 210, y: 185 };
const DISMISS_AVATAR_BUILDER_COORDS = { x: 20, y: 90 };
const RAINBOW_TEST_WALLET = 'rainbowtestwallet.eth';
const RAINBOW_WALLET = 'rainbowwallet.eth';
const EMPTY_WALLET = '0x6791da9CCd95405e73d6a1117d02Dc81c4E58775';

const android = device.getPlatform() === 'android';

describe('Wallet avatar options', () => {
  it('watch wallet without ENS', async () => {
    await Helpers.checkIfVisible('welcome-screen');
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.waitAndTap('watch-address-button');
    await Helpers.typeText('import-sheet-input', EMPTY_WALLET, false);
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.waitAndTap('wallet-info-submit-button');
    await Helpers.checkIfVisible('wallet-screen', 40000);
    await Helpers.swipe('wallet-screen', 'left', 'slow');
    await Helpers.swipe('discover-home', 'left', 'slow');
    await Helpers.checkIfVisible('profile-screen', 40000);
  });

  it('test watched wallet without ENS', async () => {
    // TODO: verify that wallet address matches the EMPTY_WALLET.

    await Helpers.tapAtPoint('profile-screen', WALLET_AVATAR_COORDS);
    await Helpers.checkIfExistsByText('Choose from Library');

    if (android) {
      await Helpers.checkIfExistsByText('Shuffle Emoji');
      await element(by.text('Shuffle Emoji')).tap();
    } else {
      await Helpers.checkIfExistsByText('Pick an Emoji');
      await Helpers.tapByText('Pick an Emoji');
      await Helpers.checkIfVisible('avatar-builder');
      await Helpers.tapAtPoint('avatar-builder', DISMISS_AVATAR_BUILDER_COORDS);
    }
  });

  it('import wallet without ENS', async () => {
    await Helpers.tapAtPoint('profile-screen', WALLET_ADDRESS_COORDS);
    await Helpers.waitAndTap('add-another-wallet-button');
    await Helpers.waitAndTap('create-new-button');
    await Helpers.waitAndTap('wallet-info-submit-button');
    if (android) {
      await Helpers.checkIfVisible('pin-authentication-screen');
      await Helpers.authenticatePin('1234');
      await Helpers.authenticatePin('1234');
    }
    // Remove this once https://github.com/rainbow-me/rainbow/pull/4115 is merged.
    await Helpers.relaunchApp();
    await Helpers.swipe('wallet-screen', 'left', 'slow');
    await Helpers.swipe('discover-home', 'left', 'slow');
    await Helpers.checkIfVisible('profile-screen', 40000);

    // TODO: check that wallet has different address (otherwise it means that creating wallet failed!).
  });

  it('test imported wallet without ENS', async () => {
    await Helpers.tapAtPoint('profile-screen', WALLET_AVATAR_COORDS);
    await Helpers.checkIfExistsByText('Choose from Library');
    if (android) {
      await Helpers.checkIfExistsByText('Shuffle Emoji');
      await element(by.text('Shuffle Emoji')).tap();
    } else {
      await Helpers.checkIfExistsByText('Pick an Emoji');
      await Helpers.tapByText('Pick an Emoji');
      await Helpers.tapAtPoint('avatar-builder', DISMISS_AVATAR_BUILDER_COORDS);
    }
  });

  it('watch wallet with ENS but without ENS avatar', async () => {
    await Helpers.tapAtPoint('profile-screen', WALLET_ADDRESS_COORDS);
    await Helpers.waitAndTap('add-another-wallet-button');
    await Helpers.waitAndTap('watch-address-button');
    await Helpers.typeText('import-sheet-input', RAINBOW_TEST_WALLET, false);
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.waitAndTap('wallet-info-submit-button');
    await Helpers.relaunchApp();
  });

  it('test watched wallet with ens but without ens avatar', async () => {
    await Helpers.tapAtPoint('wallet-screen', PROFILE_AVATAR_COORDS);
    await Helpers.checkIfExistsByText('Choose from Library');
    if (android) {
      await Helpers.checkIfExistsByText('Shuffle Emoji');
    } else {
      await Helpers.checkIfExistsByText('Pick an Emoji');
    }
    await Helpers.checkIfExistsByText('View Profile');
    if (!android) {
      await Helpers.tapByText('Pick an Emoji');
      await Helpers.checkIfVisible('avatar-builder');
      await Helpers.tapAtPoint('avatar-builder', DISMISS_AVATAR_BUILDER_COORDS);
      await Helpers.tapAtPoint('wallet-screen', PROFILE_AVATAR_COORDS);
    }
    await Helpers.tapByText('View Profile');
    await Helpers.checkIfVisible('profile-sheet');
    await Helpers.swipe('profile-sheet', 'down', 'slow');
  });

  it('import wallet with ens but without ens avatar', async () => {
    await Helpers.tapAtPoint('wallet-screen', PROFILE_ADDRESS_COORDS);
    await Helpers.waitAndTap('add-another-wallet-button');
    await Helpers.waitAndTap('restore-with-key-button');
    await Helpers.typeText('import-sheet-input', process.env.TEST_SEEDS, false);
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.waitAndTap('wallet-info-submit-button');
    await Helpers.relaunchApp();
  });

  it('test imported wallet with ens but without ens avatar', async () => {
    await Helpers.tapAtPoint('wallet-screen', PROFILE_AVATAR_COORDS);
    await Helpers.checkIfExistsByText('Choose from Library');
    if (android) {
      await Helpers.checkIfExistsByText('Shuffle Emoji');
    } else {
      await Helpers.checkIfExistsByText('Pick an Emoji');
    }
    await Helpers.checkIfExistsByText('View Profile');
    await Helpers.checkIfExistsByText('Edit Profile');
    if (!android) {
      await Helpers.tapByText('Pick an Emoji');
      await Helpers.checkIfVisible('avatar-builder');
      await Helpers.tapAtPoint('avatar-builder', DISMISS_AVATAR_BUILDER_COORDS);
      await Helpers.tapAtPoint('wallet-screen', PROFILE_AVATAR_COORDS);
    }
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
    await Helpers.waitAndTap('add-another-wallet-button');
    await Helpers.waitAndTap('watch-address-button');
    await Helpers.typeText('import-sheet-input', RAINBOW_WALLET, false);
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.waitAndTap('wallet-info-submit-button');
    await Helpers.relaunchApp();
  });

  it('test watched wallet with ens avatar', async () => {
    await Helpers.tapAtPoint('wallet-screen', PROFILE_AVATAR_COORDS);
    await Helpers.checkIfVisible('profile-sheet');
  });

  // missing case: imported wallet with ENS avatar

  afterAll(async () => {
    await device.clearKeychain();
  });
});
