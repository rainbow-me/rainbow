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

export async function importWalletFlow(customSeed?: string) {
  await checkIfVisible('welcome-screen');
  await waitAndTap('already-have-wallet-button');
  await checkIfExists('add-wallet-sheet');
  await waitAndTap('restore-with-key-button');
  await checkIfExists('import-sheet');
  await clearField('import-sheet-input');
  await device.disableSynchronization();
  await typeText('import-sheet-input', customSeed ? customSeed : process.env.TEST_SEEDS, false);
  await checkIfElementHasString('import-sheet-button-label', 'Continue');
  await waitAndTap('import-sheet-button');
  await checkIfVisible('wallet-info-modal');
  await waitAndTap('wallet-info-submit-button');
  if (android) {
    await checkIfVisible('pin-authentication-screen');
    await authenticatePin('1234');
    await authenticatePin('1234');
  }
  await device.enableSynchronization();
  await delayTime('very-long');
  await checkIfVisible('wallet-screen');
}

export async function beforeAllcleanApp({ hardhat }: { hardhat?: boolean }) {
  jest.resetAllMocks();
  hardhat && (await startHardhat());
}

export async function afterAllcleanApp({ hardhat }: { hardhat?: boolean }) {
  await device.clearKeychain();
  hardhat && (await killHardhat());
}

export async function tap(elementId: string | RegExp) {
  try {
    await delayTime('medium');
    return await element(by.id(elementId)).tap();
  } catch (error) {
    throw new Error(`Error tapping element by id "${elementId}": ${error}`);
  }
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
  try {
    await delayTime('medium');
    return await element(by.id(elementId)).tap(point);
  } catch (error) {
    throw new Error(`Error tapping element by id "${elementId}" at point ${JSON.stringify(point)}: ${error}`);
  }
}

export async function tapItemAtIndex(elementID: string | RegExp, index = 0) {
  try {
    await delayTime('medium');
    return await element(by.id(elementID)).atIndex(index).tap();
  } catch (error) {
    throw new Error(`Error tapping element by id "${elementID}" at index ${index}: ${error}`);
  }
}

export async function startIosSimulator() {
  try {
    await delayTime('short');
    if (device.getPlatform() === 'ios') {
      exec('open /Applications/Xcode.app/Contents/Developer/Applications/Simulator.app/');
    }
  } catch (error) {
    throw new Error(`Error starting iOS Simulator: ${error}`);
  }
}

export async function typeText(
  elementId: string | RegExp,
  text: string | undefined,
  focus = true,
  syncOnAndroid = false,
  hitEnterAfterText = false
) {
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
    hitEnterAfterText && (await typeText(elementId, '\n'));
    if (device.getPlatform() === 'android' && !syncOnAndroid) {
      await device.enableSynchronization();
    }
  } catch (error) {
    throw new Error(`Error typing "${text}" at element with id ${elementId}}: ${error}`);
  }
}

export async function typeNumbers(elementId: string | RegExp, text: string, submitLabel: string | RegExp) {
  try {
    await element(by.id(elementId)).replaceText(text.replace('\n', ''));
    return await element(by.label(submitLabel)).atIndex(0).tap();
  } catch (error) {
    throw new Error(`Error typing numbers in element by id "${elementId}" and tapping submit label "${submitLabel}": ${error}`);
  }
}

export async function typeTextAndHideKeyboard(elementId: string, text: string) {
  try {
    if (device.getPlatform() === 'android') {
      await clearField(elementId);
    }
    await typeText(elementId, text + '\n');
  } catch (error) {
    throw new Error(`Error typing text and hiding keyboard for element by id "${elementId}": ${error}`);
  }
}

export async function hideKeyboard(elementId: string, text: string) {
  try {
    await typeText(elementId, text + '\n');
  } catch (error) {
    throw new Error(`Error hiding keyboard for element by id "${elementId}": ${error}`);
  }
}

export async function clearField(elementId: string | RegExp) {
  try {
    return await element(by.id(elementId)).replaceText('');
  } catch (error) {
    throw new Error(`Error clearing field for element by id "${elementId}": ${error}`);
  }
}

export async function tapAndLongPress(elementId: string | RegExp) {
  try {
    return await element(by.id(elementId)).longPress();
  } catch (error) {
    throw new Error(`Error long-pressing element by id "${elementId}": ${error}`);
  }
}

export async function tapAndLongPressByText(text: string | RegExp) {
  try {
    return await element(by.text(text)).longPress();
  } catch (error) {
    throw new Error(`Error long-pressing element by text "${text}": ${error}`);
  }
}

export async function replaceTextInField(elementId: string | RegExp, text: string) {
  try {
    return await element(by.id(elementId)).replaceText(text);
  } catch (error) {
    throw new Error(`Error replacing text in field by id "${elementId}": ${error}`);
  }
}

export async function tapAlertWithButton(text: string | RegExp, index = 0) {
  try {
    if (device.getPlatform() === 'android') {
      return await element(by.text(text)).atIndex(index).tap();
    }
    return await element(by.label(text)).atIndex(0).tap();
  } catch (error) {
    throw new Error(`Error tapping alert button with text "${text}": ${error}`);
  }
}

export async function waitAndSwipe(
  elementId: string | RegExp,
  direction: Direction,
  timeout: number = DEFAULT_TIMEOUT,
  speed: Speed = 'fast',
  percentage = 0.75
) {
  try {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .withTimeout(timeout);

    await element(by.id(elementId)).swipe(direction, speed, percentage);
  } catch (error) {
    throw new Error(`Error waiting for and swiping element by id "${elementId}" ${direction}ly: ${error}`);
  }
}

export async function swipe(
  elementId: string | RegExp,
  direction: Direction,
  speed: Speed = 'fast',
  percentage = 0.75,
  normalizedStartingPointY = NaN
) {
  try {
    await element(by.id(elementId)).swipe(direction, speed, percentage, NaN, normalizedStartingPointY);
  } catch (error) {
    throw new Error(`Error swiping element by id "${elementId}" ${direction}ly with speed "${speed}": ${error}`);
  }
}

export async function scrollTo(scrollviewId: string | RegExp, edge: Direction) {
  try {
    await element(by.id(scrollviewId)).scrollTo(edge);
  } catch (error) {
    throw new Error(`Error scrolling to ${edge} of element by id "${scrollviewId}": ${error}`);
  }
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

export async function scrollUpTo(elementId: string | RegExp, distance: number, direction: 'left' | 'right' | 'up' | 'down') {
  try {
    await element(by.id(elementId)).scroll(distance, direction);
  } catch (error) {
    throw new Error(`Error scrolling to element by id "${elementId}" with distance ${distance} and direction ${direction}: ${error}`);
  }
}

export async function goToURL(inputURL: string) {
  try {
    await device.openURL({ sourceApp: 'me.rainbow', url: inputURL });
  } catch (error) {
    throw new Error(`Error going to URL: ${inputURL}, ${error}`);
  }
}

export async function checkIfVisible(elementId: string | RegExp, timeout = DEFAULT_TIMEOUT) {
  try {
    return await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .withTimeout(timeout);
  } catch (error) {
    throw new Error(`Error checking visibility of element by id "${elementId}" within timeout ${timeout}: ${error}`);
  }
}

// adding a custom timeout for this one otherwise it waits the
// whole 20_000 (DEFAULT_TIMEOUT) to make sure it's not visible
export async function checkIfNotVisible(elementId: string | RegExp, timeout = 5_000) {
  return await waitFor(element(by.id(elementId)))
    .not.toBeVisible(1)
    .withTimeout(timeout);
}

export async function checkIfDoesntExist(elementId: string | RegExp, timeout = 5_000) {
  return await waitFor(element(by.text(elementId)))
    .not.toExist()
    .withTimeout(timeout);
}
export async function checkIfExists(elementId: string | RegExp) {
  try {
    return await expect(element(by.id(elementId))).toExist();
  } catch (error) {
    throw new Error(`Error checking existence of element by id "${elementId}": ${error}`);
  }
}

export async function checkIfExistsByText(text: string | RegExp) {
  try {
    return await expect(element(by.text(text)).atIndex(0)).toExist();
  } catch (error) {
    throw new Error(`Error checking existence of element by text "${text}": ${error}`);
  }
}

export async function checkIfElementByTextIsVisible(text: string | RegExp, timeout = DEFAULT_TIMEOUT) {
  try {
    return await waitFor(element(by.text(text)))
      .toBeVisible()
      .withTimeout(timeout);
  } catch (error) {
    throw new Error(`Error checking visibility of element by text "${text}" within timeout ${timeout}: ${error}`);
  }
}

export async function checkIfElementByTextToExist(text: string | RegExp, timeout = DEFAULT_TIMEOUT) {
  try {
    return await waitFor(element(by.text(text)))
      .toExist()
      .withTimeout(timeout);
  } catch (error) {
    throw new Error(`Error checking existence of element by text "${text}" within timeout ${timeout}: ${error}`);
  }
}

export async function checkForElementByLabel(text: string | RegExp) {
  try {
    return await expect(element(by.label(text))).toExist();
  } catch (error) {
    throw new Error(`Error checking for element by label "${text}": ${error}`);
  }
}

export async function checkIfElementHasString(elementID: string | RegExp, text: string | RegExp) {
  try {
    return await expect(element(by.id(elementID).and(by.text(text)))).toExist();
  } catch (error) {
    throw new Error(`Error checking if element by id "${elementID}" has string "${text}": ${error}`);
  }
}

export async function relaunchApp() {
  try {
    await device.terminateApp('me.rainbow');
    return await device.launchApp({ newInstance: true });
  } catch (error) {
    throw new Error(`Error relaunching app: ${error}`);
  }
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
  try {
    const digits = pin.split('');
    await device.disableSynchronization();
    for (let i = 0; i < digits.length; i++) {
      await tap(`numpad-button-${digits[i]}`);
    }
    await device.enableSynchronization();
  } catch (error) {
    throw new Error(`Error authenticating PIN: ${pin}, ${error}`);
  }
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
      return await delay(15_000);
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
