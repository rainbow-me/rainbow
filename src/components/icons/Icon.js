import React from 'react';

import { Flex } from '../layout';
import { Asterisk } from './svg/Asterisk';
import BackspaceIcon from './svg/BackspaceIcon';
import BTCIcon from './svg/BTCIcon';
import CameraIcon from './svg/CameraIcon';
import CaretDownIcon from './svg/CaretDownIcon';
import CaretIcon from './svg/CaretIcon';
import CheckmarkCircledIcon from './svg/CheckmarkCircledIcon';
import CheckmarkIcon from './svg/CheckmarkIcon';
import CompassIcon from './svg/CompassIcon';
import CopyIcon from './svg/CopyIcon';
import DiscordIcon from './svg/DiscordIcon';
import DOGEIcon from './svg/DOGEIcon';
import DotIcon from './svg/DotIcon';
import { DragHandlerIcon } from './svg/DragHandlerIcon';
import EmojiActivitiesIcon from './svg/EmojiActivitiesIcon';
import EmojiAnimalsIcon from './svg/EmojiAnimalsIcon';
import EmojiFlagsIcon from './svg/EmojiFlagsIcon';
import EmojiFoodIcon from './svg/EmojiFoodIcon';
import EmojiObjectsIcon from './svg/EmojiObjectsIcon';
import EmojiSmileysIcon from './svg/EmojiSmileysIcon';
import EmojiSymbolsIcon from './svg/EmojiSymbolsIcon';
import EmojiTravelIcon from './svg/EmojiTravelIcon';
import { FarcasterIcon } from './svg/FarcasterIcon';
import GitHubIcon from './svg/GitHubIcon';
import HiddenIcon from './svg/HiddenIcon';
import InstagramIcon from './svg/InstagramIcon';
import LTCIcon from './svg/LTCIcon';
import OfflineIcon from './svg/OfflineIcon';
import PinIcon from './svg/PinIcon';
import ProgressIcon from './svg/ProgressIcon';
import RedditIcon from './svg/RedditIcon';
import SendIcon from './svg/SendIcon';
import SnapchatIcon from './svg/SnapchatIcon';
import { TabActivity } from './svg/TabActivity';
import { TabActivityInner } from './svg/TabActivityInner';
import { TabActivityInnerFill } from './svg/TabActivityInnerFill';
import { TabDappBrowser } from './svg/TabDappBrowser';
import { TabDappBrowserInner } from './svg/TabDappBrowserInner';
import { TabDappBrowserInnerFill } from './svg/TabDappBrowserInnerFill';
import { TabDiscover } from './svg/TabDiscover';
import { TabDiscoverInner } from './svg/TabDiscoverInner';
import { TabDiscoverInnerFill } from './svg/TabDiscoverInnerFill';
import { TabHome } from './svg/TabHome';
import { TabHomeInner } from './svg/TabHomeInner';
import { TabHomeInnerFill } from './svg/TabHomeInnerFill';
import { TabKingOfTheHill } from './svg/TabKingOfTheHill';
import { TabMembership } from './svg/TabMembership';
import { TabPoints } from './svg/TabPoints';
import { TabPointsInner } from './svg/TabPointsInner';
import { TabPointsInnerFill } from './svg/TabPointsInnerFill';
import TelegramIcon from './svg/TelegramIcon';
import ThreeDotsIcon from './svg/ThreeDotsIcon';
import WalletSwitcherCaret from './svg/WalletSwitcherCaret';
import WarningCircledIcon from './svg/WarningCircledIcon';
import WarningIcon from './svg/WarningIcon';
import { XIcon } from './svg/XIcon';

const IconTypes = {
  asterisk: Asterisk,
  backspace: BackspaceIcon,
  btcCoin: BTCIcon,
  camera: CameraIcon,
  caret: CaretIcon,
  caretDownIcon: CaretDownIcon,
  checkmark: CheckmarkIcon,
  checkmarkCircled: CheckmarkCircledIcon,
  compass: CompassIcon,
  copy: CopyIcon,
  discord: DiscordIcon,
  dogeCoin: DOGEIcon,
  dot: DotIcon,
  dragHandler: DragHandlerIcon,
  emojiActivities: EmojiActivitiesIcon,
  emojiAnimals: EmojiAnimalsIcon,
  emojiFlags: EmojiFlagsIcon,
  emojiFood: EmojiFoodIcon,
  emojiObjects: EmojiObjectsIcon,
  emojiSmileys: EmojiSmileysIcon,
  emojiSymbols: EmojiSymbolsIcon,
  emojiTravel: EmojiTravelIcon,
  farcaster: FarcasterIcon,
  github: GitHubIcon,
  hidden: HiddenIcon,
  instagram: InstagramIcon,
  ltcCoin: LTCIcon,
  offline: OfflineIcon,
  pin: PinIcon,
  progress: ProgressIcon,
  reddit: RedditIcon,
  send: SendIcon,
  snapchat: SnapchatIcon,
  tabActivity: TabActivity,
  tabActivityInner: TabActivityInner,
  tabActivityInnerFill: TabActivityInnerFill,
  tabDiscover: TabDiscover,
  tabDiscoverInner: TabDiscoverInner,
  tabDiscoverInnerFill: TabDiscoverInnerFill,
  tabHome: TabHome,
  tabHomeInner: TabHomeInner,
  tabHomeInnerFill: TabHomeInnerFill,
  tabPoints: TabPoints,
  tabPointsInner: TabPointsInner,
  tabPointsInnerFill: TabPointsInnerFill,
  tabMembership: TabMembership,
  tabDappBrowser: TabDappBrowser,
  tabDappBrowserInner: TabDappBrowserInner,
  tabDappBrowserInnerFill: TabDappBrowserInnerFill,
  tabKingOfTheHill: TabKingOfTheHill,
  telegram: TelegramIcon,
  threeDots: ThreeDotsIcon,
  walletSwitcherCaret: WalletSwitcherCaret,
  warning: WarningIcon,
  warningCircled: WarningCircledIcon,
  x: XIcon,
};

const Icon = ({ name, testID, ...props }, ref) => {
  const IconElement = IconTypes[name] || Flex;
  // TODO: This should either be removed or add the useTheme hook import it currently does nothing
  const { colors } = useTheme();
  return <IconElement {...props} colors={colors} name={name} ref={ref} testID={testID} />;
};

export default React.forwardRef(Icon);
