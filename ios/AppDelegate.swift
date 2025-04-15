import UIKit
import Firebase
import Expo
import RNBranch
import React
import ReactAppDependencyProvider
import React_RCTAppDelegate
import Sentry
import ReactNativePerformance
import UserNotifications

@main
class AppDelegate: ExpoAppDelegate, UNUserNotificationCenterDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  var isRapRunning = false

  override func application(_ application: UIApplication,
                   didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

    ReactNativePerformance.onAppStarted()

#if RAINBOW_INTERNALS_ENABLED
    let internalsStatus = "enabled"
#else
    let internalsStatus = "disabled"
#endif
    NSLog("Rainbow internals are \(internalsStatus).")

    FirebaseApp.configure()
    RNBranch.initSession(launchOptions: launchOptions, isReferrable: true)

    UNUserNotificationCenter.current().delegate = self

    NotificationCenter.default.addObserver(self, selector: #selector(handleRapInProgress), name: NSNotification.Name("rapInProgress"), object: nil)
    NotificationCenter.default.addObserver(self, selector: #selector(handleRapComplete), name: NSNotification.Name("rapCompleted"), object: nil)
    NotificationCenter.default.addObserver(self, selector: #selector(handleRsEscape), name: NSNotification.Name("rsEscape"), object: nil)

    RCTSetDefaultColorSpace(RCTColorSpace.displayP3)

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "Rainbow",
      in: window,
      launchOptions: launchOptions
    )


    let success = super.application(application, didFinishLaunchingWithOptions: launchOptions)
    let isE2E = ProcessInfo.processInfo.arguments.contains("isE2ETest")

    if isE2E { return success }

    if success, let rootView = window?.rootViewController?.view {
      RNSplashScreen.showSplash("LaunchScreen", inRootView: rootView)
    }

    return success
  }

  func hideSplashScreenAnimated() {
    guard let rootVC = window?.rootViewController,
          let subview = rootVC.view.subviews.last,
          let rainbowIcon = subview.subviews.first as? UIImageView else {
      return
    }

    UIView.animate(withDuration: 0.1, delay: 0.0, options: .curveEaseIn, animations: {
      rainbowIcon.transform = CGAffineTransform(scaleX: 0.0000000001, y: 0.0000000001)
      subview.alpha = 0.0
    }) { _ in
      rainbowIcon.isHidden = true
      RNSplashScreen.hide()
    }
  }

  @objc func handleRsEscape(notification: Notification) {
    guard let url = notification.userInfo?["url"] as? String else { return }
    let msg = "Escape via \(url)"
    let breadcrumb = Breadcrumb()
    breadcrumb.message = msg
    SentrySDK.addBreadcrumb(breadcrumb)
    SentrySDK.capture(message: msg)
  }

  @objc func handleRapInProgress(notification: Notification) {
    isRapRunning = true
  }

  @objc func handleRapComplete(notification: Notification) {
    isRapRunning = false
  }

  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                              withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    completionHandler([.sound, .badge, .list, .banner])
  }

  override func application(_ app: UIApplication, open url: URL,
                   options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    if RNBranch.application(app, open: url, options: options) {
      return true
    }
    return RCTLinkingManager.application(app, open: url, options: options)
  }

  override func application(_ application: UIApplication, continue userActivity: NSUserActivity,
                   restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    RNBranch.continue(userActivity)
    return true
  }

  override func applicationWillTerminate(_ application: UIApplication) {
    if isRapRunning {
      let msg = SentryMessage(formatted: "applicationWillTerminate was called")
      let event = Event()
      event.message = msg
      SentrySDK.capture(event: event)
    }
  }

  override func applicationDidBecomeActive(_ application: UIApplication) {
    UIApplication.shared.applicationIconBadgeNumber = 0

    UNUserNotificationCenter.current().getDeliveredNotifications { notifications in
      let identifiers = notifications.compactMap { notification -> String? in
        let userInfo = notification.request.content.userInfo
        return (userInfo["type"] as? String) == "wc" ? notification.request.identifier : nil
      }
      UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: identifiers)
    }
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")!
#endif
  }
}
