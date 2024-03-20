import { exec } from 'child_process';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { expect, device, element, by, waitFor, timeout, testID } from 'detox';
import { parseEther } from '@ethersproject/units';

const TESTING_WALLET = '0x3Cb462CDC5F809aeD0558FBEe151eD5dC3D3f608';

const DEFAULT_TIMEOUT = 20_000;
const android = device.getPlatform() === 'android';

export async function startHardhat() {
  exec('yarn hardhat');
}

export async function killHardhat() {
  exec('kill $(lsof -t -i:8545)');
}

export async function importWalletFlow() {
  await checkIfVisible('welcome-screen');
  await waitAndTap('already-have-wallet-button');
  await checkIfExists('add-wallet-sheet');
  await waitAndTap('restore-with-key-button');
  await checkIfExists('import-sheet');
  await clearField('import-sheet-input');
  await typeText('import-sheet-input', process.env.TEST_SEEDS, false);
  await checkIfElementHasString('import-sheet-button-label', 'Continue');
  await waitAndTap('import-sheet-button');
  await checkIfVisible('wallet-info-modal');
  await disableSynchronization();
  await waitAndTap('wallet-info-submit-button');
  if (android) {
    await checkIfVisible('pin-authentication-screen');
    await authenticatePin('1234');
    await authenticatePin('1234');
  }
  await checkIfVisible('wallet-screen', 40000);
  await enableSynchronization();
}

export function tap(elementId) {
  return element(by.id(elementId)).tap();
}

export async function waitAndTap(elementId, timeout) {
  await waitFor(element(by.id(elementId)))
    .toBeVisible()
    .withTimeout(timeout || DEFAULT_TIMEOUT);
  await waitFor(element(by.id(testID)))
    .toBeEnabled()
    .withTimeout(timeout || DEFAULT_TIMEOUT);

  return tap(elementId);
}

export async function tapByText(text, index) {
  await waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout || DEFAULT_TIMEOUT);
  await waitFor(element(by.text(text)))
    .toBeEnabled()
    .withTimeout(timeout || DEFAULT_TIMEOUT);

  return element(by.text(text))
    .atIndex(index || 0)
    .tap();
}

export function tapAtPoint(elementId, point) {
  return element(by.id(elementId)).tapAtPoint(point);
}

export function tapItemAtIndex(elementID, index) {
  return element(by.id(elementID))
    .atIndex(index || 0)
    .tap();
}

export async function startIosSimulator() {
  if (device.getPlatform() === 'ios') {
    exec('open /Applications/Xcode.app/Contents/Developer/Applications/Simulator.app/');
  }
}

export async function typeText(elementId, text, focus = true, syncOnAndroid = false) {
  if (focus) {
    await tap(elementId);
  }
  if (device.getPlatform() === 'android' && !syncOnAndroid) {
    await device.disableSynchronization();
  }
  await element(by.id(elementId)).typeText(text);
  if (device.getPlatform() === 'android' && !syncOnAndroid) {
    await device.enableSynchronization();
  }
}

export async function typeNumbers(elementId, text, submitLabel) {
  await element(by.id(elementId)).replaceText(text.replace('\n', ''));
  return element(by.label(submitLabel)).atIndex(0).tap();
}

export async function typeTextAndHideKeyboard(elementId, text) {
  if (device.getPlatform() === 'android') {
    await clearField(elementId);
  }
  await typeText(elementId, text + '\n');
}

export async function hideKeyboard(elementId, text) {
  await typeText(elementId, text + '\n');
}

export async function clearField(elementId) {
  return element(by.id(elementId)).replaceText('');
}

export async function tapAndLongPress(elementId) {
  return element(by.id(elementId)).longPress();
}

export async function tapAndLongPressByText(text) {
  return element(by.text(text)).longPress();
}

export async function replaceTextInField(elementId, text) {
  return element(by.id(elementId)).replaceText(text);
}

export function tapAlertWithButton(text, index) {
  if (device.getPlatform() === 'android') {
    return element(by.text(text))
      .atIndex(index || 0)
      .tap();
  }

  return element(by.label(text)).atIndex(0).tap();
}

export async function waitAndSwipe(elementId, direction, speed = 'fast', percentage = 0.75, timeout) {
  await waitFor(element(by.id(elementId)))
    .toBeVisible()
    .withTimeout(timeout || DEFAULT_TIMEOUT);

  await element(by.id(elementId))?.swipe(direction, speed, percentage);
}

export async function swipe(elementId, direction, speed = 'fast', percentage = 0.75, normalizedStartingPointY = NaN) {
  await element(by.id(elementId))?.swipe(direction, speed, percentage, NaN, normalizedStartingPointY);
}

export async function scrollTo(scrollviewId, edge) {
  await element(by.id(scrollviewId)).scrollTo(edge);
}

export async function swipeUntilVisible(elementId, scrollViewId, direction, pctVisible = 75) {
  let stop = false;
  while (!stop) {
    try {
      await waitFor(element(by.id(elementId)))
        .toBeVisible(pctVisible)
        .withTimeout(500);
      stop = true;
    } catch {
      await swipe(scrollViewId, direction, 'slow', 0.2);
    }
  }
}

export async function scrollUpTo(elementId, distance, direction) {
  await element(by.id(elementId)).scroll(distance, direction);
}

export async function goToURL(inputURL) {
  await device.openURL({ sourceApp: 'me.rainbow', url: inputURL });
}

export function checkIfVisible(elementId, timeout) {
  return waitFor(element(by.id(elementId)))
    .toBeVisible()
    .withTimeout(timeout || DEFAULT_TIMEOUT);
}

export function checkIfNotVisible(elementId, timeout) {
  return waitFor(element(by.id(elementId)))
    .toBeNotVisible()
    .withTimeout(timeout || DEFAULT_TIMEOUT);
}

export function checkIfExists(elementId) {
  return expect(element(by.id(elementId))).toExist();
}

export function checkIfExistsByText(text) {
  return expect(element(by.text(text)).atIndex(0)).toExist();
}

export function checkIfElementByTextIsVisible(text, timeout) {
  return waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout || DEFAULT_TIMEOUT);
}
export function checkIfElementByTextToExist(text, timeout) {
  return waitFor(element(by.text(text)))
    .toExist()
    .withTimeout(timeout || DEFAULT_TIMEOUT);
}

export function checkForElementByLabel(text) {
  return expect(element(by.label(text))).toExist();
}

export function checkIfElementHasString(elementID, text) {
  return expect(element(by.id(elementID).and(by.text(text)))).toExist();
}

export async function relaunchApp() {
  await device.terminateApp('me.rainbow');
  return device.launchApp({ newInstance: true });
}

export async function checkIfDisabled(elementId) {
  // When disabled, attempting to tap on a button
  // throws an exception. Not ideal but that's the
  // only way for now...
  // https://github.com/wix/Detox/issues/246
  try {
    await element(by.id(elementId)).tap();
    return Promise.reject();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    return Promise.resolve();
  }
}

export async function authenticatePin(pin) {
  const digits = pin.split('');
  await device.disableSynchronization();
  for (let i = 0; i < digits.length; i++) {
    await tap(`numpad-button-${digits[i]}`);
  }
  await device.enableSynchronization();
  return Promise.resolve();
}

export async function disableSynchronization() {
  if (device.getPlatform() === 'ios') {
    await device.disableSynchronization();
  }
  return true;
}
export async function enableSynchronization() {
  if (device.getPlatform() === 'ios') {
    await device.enableSynchronization();
  }
  return true;
}

export function delay(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

export async function delayTime(time) {
  switch (time) {
    case 'short':
      return await delay(500);
    case 'medium':
      return await delay(1_000);
    case 'long':
      return await delay(5_000);
    case 'very-long':
      return await delay(10_000);
  }
}

export function getProvider() {
  if (!getProvider._instance) {
    getProvider._instance = new JsonRpcProvider('http://127.0.0.1:8545', 'any');
  }
  return getProvider._instance;
}

export async function sendETHtoTestWallet() {
  const provider = getProvider();
  // Hardhat account 0 that has 10000 ETH
  const wallet = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
  // Sending 20 ETH so we have enough to pay the tx fees even when the gas is too high
  await wallet.sendTransaction({
    to: TESTING_WALLET,
    value: parseEther('20'),
  });
  return true;
}

export async function openDeeplinkColdStart(url) {
  await device.terminateApp();
  await device.launchApp({
    launchArgs: { detoxEnableSynchronization: 0 },
    newInstance: true,
    url,
  });
}

export async function openDeeplinkFromBackground(url) {
  await device.disableSynchronization();
  await device.sendToHome();
  await device.enableSynchronization();
  await device.launchApp({
    newInstance: false,
    url,
  });
}
