/* eslint-disable no-await-in-loop */
import { exec } from 'child_process';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { expect, device, element, by, waitFor } from 'detox';
import { parseEther } from '@ethersproject/units';

const TESTING_WALLET = '0x3Cb462CDC5F809aeD0558FBEe151eD5dC3D3f608';

const DEFAULT_TIMEOUT = 20_000;
const android = device.getPlatform() === 'android';

type Direction = 'up' | 'down' | 'left' | 'right' | 'top' | 'bottom';
type Speed = 'fast' | 'slow';

interface ProviderFunction {
  (): JsonRpcProvider;
  _instance?: JsonRpcProvider;
}

export async function startHardhat() {
  await delayTime('short');
  exec('yarn hardhat');
}

export async function killHardhat() {
  await delayTime('short');
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

export async function cleanApp() {
  jest.resetAllMocks();
}

export async function tap(elementId: string | RegExp) {
  await delayTime('medium');
  return await element(by.id(elementId)).tap();
}

export async function waitAndTap(elementId: string | RegExp, timeout = DEFAULT_TIMEOUT) {
  await delayTime('medium');
  try {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .withTimeout(timeout);

    return await tap(elementId);
  } catch (error) {
    throw new Error(`Error tapping element by id "${elementId}": ${error}`);
  }
}

export async function tapByText(text: string | RegExp, index = 0, timeout = DEFAULT_TIMEOUT) {
  await delayTime('medium');
  try {
    await waitFor(element(by.text(text)))
      .toBeVisible()
      .withTimeout(timeout);

    await element(by.text(text)).atIndex(index).tap();
  } catch (error) {
    throw new Error(`Error tapping element by text "${text}" at index ${index}: ${error}`);
  }
}

export async function tapAtPoint(elementId: string | RegExp, point: Detox.Point2D | undefined) {
  await delayTime('medium');
  return await element(by.id(elementId)).tap(point);
}

export async function tapItemAtIndex(elementID: string | RegExp, index: number) {
  await delayTime('medium');
  return await element(by.id(elementID))
    .atIndex(index || 0)
    .tap();
}

export async function startIosSimulator() {
  await delayTime('short');
  if (device.getPlatform() === 'ios') {
    exec('open /Applications/Xcode.app/Contents/Developer/Applications/Simulator.app/');
  }
}

export async function typeText(elementId: string | RegExp, text: string | undefined, focus = true, syncOnAndroid = false) {
  if (text === undefined) {
    throw new Error(`Cannot type 'undefined' into element with id ${elementId}`);
  }
  await delayTime('medium');
  try {
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
  } catch (error) {
    throw new Error(`Error typing "${text}" at element with id ${elementId}}: ${error}`);
  }
}

export async function typeNumbers(elementId: string | RegExp, text: string, submitLabel: string | RegExp) {
  await element(by.id(elementId)).replaceText(text.replace('\n', ''));
  return await element(by.label(submitLabel)).atIndex(0).tap();
}

export async function typeTextAndHideKeyboard(elementId: string, text: string) {
  if (device.getPlatform() === 'android') {
    await clearField(elementId);
  }
  await typeText(elementId, text + '\n');
}

export async function hideKeyboard(elementId: string, text: string) {
  await typeText(elementId, text + '\n');
}

export async function clearField(elementId: string | RegExp) {
  return await element(by.id(elementId)).replaceText('');
}

export async function tapAndLongPress(elementId: string | RegExp) {
  return await element(by.id(elementId)).longPress();
}

export async function tapAndLongPressByText(text: string | RegExp) {
  return await element(by.text(text)).longPress();
}

export async function replaceTextInField(elementId: string | RegExp, text: string) {
  return await element(by.id(elementId)).replaceText(text);
}

export async function tapAlertWithButton(text: string | RegExp, index = 0) {
  if (device.getPlatform() === 'android') {
    return await element(by.text(text)).atIndex(index).tap();
  }

  return await element(by.label(text)).atIndex(0).tap();
}

export async function waitAndSwipe(
  elementId: string | RegExp,
  direction: Direction,
  timeout: undefined,
  speed: Speed | undefined = 'fast',
  percentage = 0.75
) {
  await waitFor(element(by.id(elementId)))
    .toBeVisible()
    .withTimeout(timeout || DEFAULT_TIMEOUT);

  await element(by.id(elementId))?.swipe(direction, speed, percentage);
}

export async function swipe(
  elementId: string | RegExp,
  direction: Direction,
  speed: Speed = 'fast',
  percentage = 0.75,
  normalizedStartingPointY = NaN
) {
  await element(by.id(elementId))?.swipe(direction, speed, percentage, NaN, normalizedStartingPointY);
}

export async function scrollTo(scrollviewId: string | RegExp, edge: Direction) {
  await element(by.id(scrollviewId)).scrollTo(edge);
}

export async function swipeUntilVisible(elementId: string | RegExp, scrollViewId: string, direction: Direction, pctVisible = 75) {
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

export async function scrollUpTo(elementId: string | RegExp, distance: number, direction: Direction) {
  await element(by.id(elementId)).scroll(distance, direction);
}

export async function goToURL(inputURL: string) {
  await device.openURL({ sourceApp: 'me.rainbow', url: inputURL });
}

export async function checkIfVisible(elementId: string | RegExp, timeout = DEFAULT_TIMEOUT) {
  return await waitFor(element(by.id(elementId)))
    .toBeVisible()
    .withTimeout(timeout);
}

export async function checkIfNotVisible(elementId: string | RegExp, timeout = DEFAULT_TIMEOUT) {
  return await waitFor(element(by.id(elementId)))
    .not.toBeVisible()
    .withTimeout(timeout);
}

export async function checkIfExists(elementId: string | RegExp) {
  return await expect(element(by.id(elementId))).toExist();
}

export async function checkIfExistsByText(text: string | RegExp) {
  return await expect(element(by.text(text)).atIndex(0)).toExist();
}

export async function checkIfElementByTextIsVisible(text: string | RegExp, timeout = DEFAULT_TIMEOUT) {
  return await waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout);
}
export async function checkIfElementByTextToExist(text: string | RegExp, timeout = DEFAULT_TIMEOUT) {
  return await waitFor(element(by.text(text)))
    .toExist()
    .withTimeout(timeout);
}

export async function checkForElementByLabel(text: string | RegExp) {
  return await expect(element(by.label(text))).toExist();
}

export async function checkIfElementHasString(elementID: string | RegExp, text: string | RegExp) {
  return await expect(element(by.id(elementID).and(by.text(text)))).toExist();
}

export async function relaunchApp() {
  await device.terminateApp('me.rainbow');
  return await device.launchApp({ newInstance: true });
}

export async function checkIfDisabled(elementId: string | RegExp) {
  // When disabled, attempting to tap on a button
  // throws an exception. Not ideal but that's the
  // only way for now...
  // https://github.com/wix/Detox/issues/246
  try {
    await element(by.id(elementId)).tap();
    return await Promise.reject();
  } catch (e) {
    console.log(e);
    return await Promise.resolve();
  }
}

export async function authenticatePin(pin: string) {
  const digits = pin.split('');
  await device.disableSynchronization();
  for (let i = 0; i < digits.length; i++) {
    await tap(`numpad-button-${digits[i]}`);
  }
  await device.enableSynchronization();
  return await Promise.resolve();
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

export async function delay(ms: number) {
  return await new Promise<void>(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

export async function delayTime(time: string) {
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

export const getProvider: ProviderFunction = () => {
  if (!getProvider._instance) {
    getProvider._instance = new JsonRpcProvider('http://127.0.0.1:8545', 'any');
  }
  return getProvider._instance;
};

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

export async function openDeeplinkColdStart(url: string) {
  await device.terminateApp();
  await device.launchApp({
    launchArgs: { detoxEnableSynchronization: 0 },
    newInstance: true,
    url,
  });
}

export async function openDeeplinkFromBackground(url: string) {
  await device.disableSynchronization();
  await device.sendToHome();
  await device.enableSynchronization();
  await device.launchApp({
    newInstance: false,
    url,
  });
}
