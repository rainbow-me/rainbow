import React from 'react';
import { Flex } from '../layout';
import { Emoji } from '../text';

import ApplePayIcon from './svg/ApplePayIcon';
import ArrowBackIcon from './svg/ArrowBack';
import ArrowCircledIcon from './svg/ArrowCircledIcon';
import ArrowIcon from './svg/ArrowIcon';
import AvatarIcon from './svg/AvatarIcon';
import BackspaceIcon from './svg/BackspaceIcon';
import CameraIcon from './svg/CameraIcon';
import CaretIcon from './svg/CaretIcon';
import CaretThinIcon from './svg/CaretThinIcon';
import CheckmarkCircledIcon from './svg/CheckmarkCircledIcon';
import CheckmarkIcon from './svg/CheckmarkIcon';
import ClearInputIcon from './svg/ClearInputIcon';
import ClockIcon from './svg/ClockIcon';
import CloseCircledIcon from './svg/CloseCircledIcon';
import CloseIcon from './svg/CloseIcon';
import CompassIcon from './svg/CompassIcon';
import CopyIcon from './svg/CopyIcon';
import CrosshairIcon from './svg/CrosshairIcon';
import DotIcon from './svg/DotIcon';
import DoubleCaretIcon from './svg/DoubleCaretIcon';
import DoubleChevronIcon from './svg/DoubleChevronIcon';
import EmojiActivitiesIcon from './svg/EmojiActivitiesIcon';
import EmojiAnimalsIcon from './svg/EmojiAnimalsIcon';
import EmojiFlagsIcon from './svg/EmojiFlagsIcon';
import EmojiFoodIcon from './svg/EmojiFoodIcon';
import EmojiObjectsIcon from './svg/EmojiObjectsIcon';
import EmojiRecentIcon from './svg/EmojiRecentIcon';
import EmojiSmileysIcon from './svg/EmojiSmileysIcon';
import EmojiSymbolsIcon from './svg/EmojiSymbolsIcon';
import EmojiTravelIcon from './svg/EmojiTravelIcon';
import FaceIdIcon from './svg/FaceIdIcon';
import FacebookIcon from './svg/FacebookIcon';
import FatArrowIcon from './svg/FatArrowIcon';
import GearIcon from './svg/GearIcon';
import HandleIcon from './svg/HandleIcon';
import HiddenIcon from './svg/HiddenIcon';
import InboxIcon from './svg/InboxIcon';
import InfoIcon from './svg/InfoIcon';
import LockIcon from './svg/LockIcon';
import MinusCircledIcon from './svg/MinusCircledIcon';
import OfflineIcon from './svg/OfflineIcon';
import PasscodeIcon from './svg/PasscodeIcon';
import PinIcon from './svg/PinIcon';
import PlusCircledIcon from './svg/PlusCircledIcon';
import PlusIcon from './svg/PlusIcon';
import ProgressIcon from './svg/ProgressIcon';
import QRCodeIcon from './svg/QRCodeIcon';
import RedditIcon from './svg/RedditIcon';
import ScannerIcon from './svg/ScannerIcon';
import SearchIcon from './svg/SearchIcon';
import SendIcon from './svg/SendIcon';
import SendSmallIcon from './svg/SendSmallIcon';
import ShareIcon from './svg/ShareIcon';
import SignatureIcon from './svg/SignatureIcon';
import SpinnerIcon from './svg/SpinnerIcon';
import StarIcon from './svg/StarIcon';
import SwapIcon from './svg/SwapIcon';
import TelegramIcon from './svg/TelegramIcon';
import ThreeDotsIcon from './svg/ThreeDotsIcon';
import TouchIdIcon from './svg/TouchIdIcon';
import TwitterIcon from './svg/TwitterIcon';
import WalletConnectIcon from './svg/WalletConnectIcon';
import WalletSwitcherCaret from './svg/WalletSwitcherCaret';
import WarningCircledIcon from './svg/WarningCircledIcon';
import WarningIcon from './svg/WarningIcon';

const IconTypes = {
  applePay: ApplePayIcon,
  arrow: ArrowIcon,
  arrowBack: ArrowBackIcon,
  arrowCircled: ArrowCircledIcon,
  avatar: AvatarIcon,
  backspace: BackspaceIcon,
  camera: CameraIcon,
  caret: CaretIcon,
  caretThin: CaretThinIcon,
  checkmark: CheckmarkIcon,
  checkmarkCircled: CheckmarkCircledIcon,
  clearInput: ClearInputIcon,
  clock: ClockIcon,
  close: CloseIcon,
  closeCircled: CloseCircledIcon,
  compass: CompassIcon,
  copy: CopyIcon,
  crosshair: CrosshairIcon,
  dot: DotIcon,
  doubleCaret: DoubleCaretIcon,
  doubleChevron: DoubleChevronIcon,
  emojiActivities: EmojiActivitiesIcon,
  emojiAnimals: EmojiAnimalsIcon,
  emojiFlags: EmojiFlagsIcon,
  emojiFood: EmojiFoodIcon,
  emojiObjects: EmojiObjectsIcon,
  emojiRecent: EmojiRecentIcon,
  emojiSmileys: EmojiSmileysIcon,
  emojiSymbols: EmojiSymbolsIcon,
  emojiTravel: EmojiTravelIcon,
  face: FaceIdIcon,
  facebook: FacebookIcon,
  faceid: FaceIdIcon,
  fatArrow: FatArrowIcon,
  fingerprint: TouchIdIcon,
  gear: GearIcon,
  handle: HandleIcon,
  hidden: HiddenIcon,
  inbox: InboxIcon,
  info: InfoIcon,
  lock: LockIcon,
  minusCircled: MinusCircledIcon,
  offline: OfflineIcon,
  passcode: PasscodeIcon,
  pin: PinIcon,
  plus: PlusIcon,
  plusCircled: PlusCircledIcon,
  progress: ProgressIcon,
  qrCode: QRCodeIcon,
  reddit: RedditIcon,
  robot: Emoji,
  scanner: ScannerIcon,
  search: SearchIcon,
  send: SendIcon,
  sendSmall: SendSmallIcon,
  share: ShareIcon,
  signature: SignatureIcon,
  spinner: SpinnerIcon,
  star: StarIcon,
  sunflower: Emoji,
  swap: SwapIcon,
  telegram: TelegramIcon,
  threeDots: ThreeDotsIcon,
  touchid: TouchIdIcon,
  twitter: TwitterIcon,
  walletConnect: WalletConnectIcon,
  walletSwitcherCaret: WalletSwitcherCaret,
  warning: WarningIcon,
  warningCircled: WarningCircledIcon,
};

const Icon = ({ name, testID, ...props }, ref) => {
  const IconElement = IconTypes[name] || Flex;
  const { colors } = useTheme();
  return (
    <IconElement
      {...props}
      colors={colors}
      name={name}
      ref={ref}
      testID={testID}
    />
  );
};

export default React.forwardRef(Icon);
