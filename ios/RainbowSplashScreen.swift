import Foundation
import React

@objc(RainbowSplashScreen)
class RainbowSplashScreen: NSObject {

  @objc
  func hideAnimated() {
    DispatchQueue.main.async {
      if let appDelegate = UIApplication.shared.delegate as? AppDelegate {
        appDelegate.hideSplashScreenAnimated()
      }
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
