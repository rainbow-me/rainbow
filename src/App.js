import FCM from 'react-native-fcm';
import { Navigation } from 'react-native-navigation';
import { registerScreens, registerScreenVisibilityListener } from './screens';
import * as EthWallet from './model/ethWallet';

// screen related book keeping
registerScreens();
registerScreenVisibilityListener();

// Wallet
EthWallet.init();

// Firebase Cloud Messaging
FCM.getFCMToken().then((fcmToken) => {
    console.log(`FCM Token: ${fcmToken}`);
});

Navigation.startTabBasedApp({
    tabs: [
        {
            label: 'POC', // tab label as appears under the icon in iOS (optional)
            screen: 'BalanceWallet.QRScannerScreen', // unique ID registered with Navigation.registerScreen
            // icon: require('../img/one.png'), // local image asset for the tab icon unselected state (optional on iOS)
            // selectedIcon: require('../img/one_selected.png'), // local image asset for the tab icon selected state (optional, iOS only. On Android, Use `tabBarSelectedButtonColor` instead)
            // iconInsets: { // add this to change icon position (optional, iOS only).
            //   top: 6, // optional, default is 0.
            //   left: 0, // optional, default is 0.
            //   bottom: -6, // optional, default is 0.
            //   right: 0 // optional, default is 0.
            // },
            title: 'QR Code Scanner', // title of the screen as appears in the nav bar (optional)
            // titleImage: require('../img/titleImage.png'), // iOS only. navigation bar title image instead of the title text of the pushed screen (optional)
            // navigatorStyle: {}, // override the navigator style for the tab screen, see "Styling the navigator" below (optional),
            // navigatorButtons: {} // override the nav buttons for the tab screen, see "Adding buttons to the navigator" below (optional)
        },
    ],
    tabsStyle: {
        // optional, add this if you want to style the tab bar beyond the defaults
        tabBarButtonColor: '#ffff00', // optional, change the color of the tab icons and text (also unselected). On Android, add this to appStyle
        tabBarSelectedButtonColor: '#ff9900', // optional, change the color of the selected tab icon and text (only selected). On Android, add this to appStyle
        tabBarBackgroundColor: '#551A8B', // optional, change the background color of the tab bar
        initialTabIndex: 1, // optional, the default selected bottom tab. Default: 0. On Android, add this to appStyle
    },
    appStyle: {
        orientation: 'portrait', // Sets a specific orientation to the entire app. Default: 'auto'. Supported values: 'auto', 'landscape', 'portrait'
        bottomTabBadgeTextColor: 'red', // Optional, change badge text color. Android only
        bottomTabBadgeBackgroundColor: 'green', // Optional, change badge background color. Android only
        // backButtonImage: require('./pathToImage.png') // Change the back button default arrow image with provided image. iOS only
        hideBackButtonTitle: false, // Hide back button title. Default is false. If `backButtonTitle` provided so it will take into account and the `backButtonTitle` value will show. iOS only
    },
    // drawer: {
    //     // optional, add this if you want a side menu drawer in your app
    //     left: {
    //         // optional, define if you want a drawer from the left
    //         screen: 'example.FirstSideMenu', // unique ID registered with Navigation.registerScreen
    //         passProps: {}, // simple serializable object that will pass as props to all top screens (optional),
    //         fixedWidth: 500, // a fixed width you want your left drawer to have (optional)
    //     },
    //     right: {
    //         // optional, define if you want a drawer from the right
    //         screen: 'example.SecondSideMenu', // unique ID registered with Navigation.registerScreen
    //         passProps: {}, // simple serializable object that will pass as props to all top screens (optional)
    //         fixedWidth: 500, // a fixed width you want your right drawer to have (optional)
    //     },
    //     style: {
    //         // ( iOS only )
    //         drawerShadow: true, // optional, add this if you want a side menu drawer shadow
    //         contentOverlayColor: 'rgba(0,0,0,0.25)', // optional, add this if you want a overlay color when drawer is open
    //         leftDrawerWidth: 50, // optional, add this if you want a define left drawer width (50=percent)
    //         rightDrawerWidth: 50, // optional, add this if you want a define right drawer width (50=percent)
    //         shouldStretchDrawer: true, // optional, iOS only with 'MMDrawer' type, whether or not the panning gesture will “hard-stop” at the maximum width for a given drawer side, default : true
    //     },
    //     type: 'MMDrawer', // optional, iOS only, types: 'TheSideBar', 'MMDrawer' default: 'MMDrawer'
    //     animationType: 'door', // optional, iOS only, for MMDrawer: 'door', 'parallax', 'slide', 'slide-and-scale'
    //     // for TheSideBar: 'airbnb', 'facebook', 'luvocracy','wunder-list'
    //     disableOpenGesture: false, // optional, can the drawer be opened with a swipe instead of button
    // },
    passProps: {}, // simple serializable object that will pass as props to all top screens (optional)
    animationType: 'slide-down', // optional, add transition animation to root change: 'none', 'slide-down', 'fade'
});
