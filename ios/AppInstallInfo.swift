import Foundation

/// Determines whether the app was installed from the App Store or from an internal source
/// (TestFlight, ad-hoc, local Xcode build).
///
/// Uses two signals:
/// 1. Provisioning profile: Apple strips `embedded.mobileprovision` from App Store and
///    TestFlight builds. Local/ad-hoc builds always have it. If present -> not a store install.
/// 2. Receipt URL: Both App Store and TestFlight lack a provisioning profile, but TestFlight
///    receipts live at `.../sandboxReceipt` while App Store receipts use a production path.
///    sandboxReceipt -> TestFlight (not store). Production receipt -> App Store (store).
@objc(AppInstallInfo)
class AppInstallInfo: NSObject {

  @objc
  func isStoreInstall() -> NSNumber {
    // The App Store only ever distributes device builds; a simulator install is
    // never a store install. Simulators also have no embedded.mobileprovision, so
    // without this they fall through to the receipt heuristic and get misclassified.
    #if targetEnvironment(simulator)
      return false
    #endif

    // Local/ad-hoc builds have a provisioning profile.
    // App Store and TestFlight do not; Apple strips it.
    let hasProfile =
      Bundle.main.path(
        forResource: "embedded", ofType: "mobileprovision"
      ) != nil
    if hasProfile { return false }

    // No profile = went through Apple's pipeline.
    // TestFlight has sandboxReceipt, App Store has production receipt.
    guard let receiptURL = Bundle.main.appStoreReceiptURL else { return true }
    return NSNumber(value: receiptURL.lastPathComponent != "sandboxReceipt")
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
