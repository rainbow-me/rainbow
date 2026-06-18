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

    // AppsFlyer owns SKAN; opt Branch out before initSession.
    Branch.getInstance().disableAdNetworkCallouts(true)
    RNBranch.initSession(launchOptions: launchOptions, isReferrable: true)

    UNUserNotificationCenter.current().delegate = self

    NotificationCenter.default.addObserver(self, selector: #selector(handleRapInProgress), name: NSNotification.Name("rapInProgress"), object: nil)
    NotificationCenter.default.addObserver(self, selector: #selector(handleRapComplete), name: NSNotification.Name("rapCompleted"), object: nil)
    NotificationCenter.default.addObserver(self, selector: #selector(handleRsEscape), name: NSNotification.Name("rsEscape"), object: nil)

    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
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
      RainbowSplashScreen.showSplash("LaunchScreen", inRootView: rootView)
    }

    return success
  }

  @objc func handleRsEscape(notification: Notification) {
    guard let url = notification.userInfo?["url"] as? String else { return }
    let parsed = URL(string: url)
    let host = parsed?.host
    // Group by host. Hostless URLs (data:, blob:, malformed) have no host, so
    // fall back to the scheme, then "unknown" — keeps the fingerprint bounded
    // instead of spawning a Sentry issue per unique data: payload. The tag
    // below stays a real host only; the full URL is preserved in the extra.
    let groupingKey = host ?? parsed?.scheme ?? "unknown"
    // `source` is set by react-native-sandbox and is one of:
    // "http" | "websocket" | "webview". Defaults to "unknown" if a future
    // sandbox version emits a value we don't yet know about, or omits it.
    let source = notification.userInfo?["source"] as? String ?? "unknown"

    // Per-host fingerprint so each blocked host becomes its own Sentry issue.
    // Without this, every capture call here shares the same stack and Sentry
    // collapses all hosts into one mega-issue, making per-host trends and
    // alerts impossible.
    let event = Event()
    event.message = SentryMessage(formatted: "Escape via \(groupingKey)")
    event.level = .warning
    event.fingerprint = ["rnsandbox-escape", groupingKey]
    var tags: [String: String] = ["sandbox.source": source]
    if let host {
      tags["sandbox.host"] = host
    }
    event.tags = tags
    event.extra = ["sandbox.url": url]
    SentrySDK.capture(event: event)
  }

  @objc func handleRapInProgress(notification: Notification) {
    isRapRunning = true
  }

  @objc func handleRapComplete(notification: Notification) {
    isRapRunning = false
  }

  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                              withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    // Suppress all iOS-side presentation for the FCM remote when foregrounded.
    // Rainbow's foreground notification UI is handled by notifee (see foregroundHandler.ts);
    // letting iOS also present from the FCM payload would duplicate Notification Center entries.
    completionHandler([])
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
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }

  override func defaultColorSpace() -> RCTColorSpace {
    RCTColorSpace.displayP3
  }
}
