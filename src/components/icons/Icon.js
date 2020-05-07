import PropTypes from 'prop-types';
import { createElement } from 'react';
import Emoji from 'react-native-emoji';
import Flex from '../layout/Flex';

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
import SearchIcon from './svg/SearchIcon';
import SendIcon from './svg/SendIcon';
import SendSmallIcon from './svg/SendSmallIcon';
import ShareIcon from './svg/ShareIcon';
import SignatureIcon from './svg/SignatureIcon';
import SpinnerIcon from './svg/SpinnerIcon';
import StarIcon from './svg/StarIcon';
import SwapIcon from './svg/SwapIcon';
import ThreeDotsIcon from './svg/ThreeDotsIcon';
import TouchIdIcon from './svg/TouchIdIcon';
import WalletConnectIcon from './svg/WalletConnectIcon';
import WarningIcon from './svg/WarningIcon';

const Icon = ({ name, ...props }) =>
  createElement(Icon.IconTypes[name] || Flex, { name, ...props });

Icon.IconTypes = {
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
  emojiActivities: EmojiActivitiesIcon,
  emojiAnimals: EmojiAnimalsIcon,
  emojiFlags: EmojiFlagsIcon,
  emojiFood: EmojiFoodIcon,
  emojiObjects: EmojiObjectsIcon,
  emojiRecent: EmojiRecentIcon,
  emojiSmileys: EmojiSmileysIcon,
  emojiSymbols: EmojiSymbolsIcon,
  emojiTravel: EmojiTravelIcon,
  faceid: FaceIdIcon,
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
  search: SearchIcon,
  send: SendIcon,
  sendSmall: SendSmallIcon,
  share: ShareIcon,
  signature: SignatureIcon,
  spinner: SpinnerIcon,
  star: StarIcon,
  sunflower: Emoji,
  swap: SwapIcon,
  threeDots: ThreeDotsIcon,
  touchid: TouchIdIcon,
  walletConnect: WalletConnectIcon,
  warning: WarningIcon,
};

Icon.propTypes = {
  name: PropTypes.oneOf(Object.keys(Icon.IconTypes)),
};

export default Icon;
