import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { expect } from 'detox';
import { ethers } from 'ethers';

const TESTING_WALLET = '0x3Cb462CDC5F809aeD0558FBEe151eD5dC3D3f608';

const DEFAULT_TIMEOUT = 8000;
// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-undef */
export async function waitAndTap(elementId, timeout) {
  await waitFor(element(by.id(elementId)))
    .toBeVisible()
    .withTimeout(timeout || DEFAULT_TIMEOUT);

  return element(by.id(elementId)).tap();
}

export function tap(elementId) {
  return element(by.id(elementId)).tap();
}

export function tapByText(text, index) {
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

export async function typeText(elementId, text, focus = true) {
  if (focus) {
    await tap(elementId);
  }
  return element(by.id(elementId)).typeText(text);
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

export async function waitAndSwipe(
  elementId,
  direction,
  speed = 'fast',
  percentage = 0.75,
  timeout
) {
  await waitFor(element(by.id(elementId)))
    .toBeVisible()
    .withTimeout(timeout || DEFAULT_TIMEOUT);
  await element(by.id(elementId))?.swipe(direction, speed, percentage);
}

export async function swipe(
  elementId,
  direction,
  speed = 'fast',
  percentage = 0.75
) {
  await element(by.id(elementId))?.swipe(direction, speed, percentage);
}

export async function scrollTo(scrollviewId, edge) {
  await element(by.id(scrollviewId)).scrollTo(edge);
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
  return expect(element(by.text(text))).toExist();
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
  for (let i = 0; i < digits.length; i++) {
    await tap(`numpad-button-${digits[i]}`);
  }
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

export function getProvider() {
  if (!getProvider._instance) {
    getProvider._instance = new JsonRpcProvider(
      device.getPlatform() === 'ios'
        ? process.env.HARDHAT_URL_IOS
        : process.env.HARDHAT_URL_ANDROID,
      'any'
    );
  }
  return getProvider._instance;
}

export async function sendETHtoTestWallet() {
  const provider = getProvider();
  // Hardhat account 0 that has 10000 ETH
  const wallet = new Wallet(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    provider
  );
  // Sending 20 ETH so we have enough to pay the tx fees even when the gas is too high
  await wallet.sendTransaction({
    to: TESTING_WALLET,
    value: ethers.utils.parseEther('20'),
  });
  return true;
}
