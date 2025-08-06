import Foundation
import React
import UIKit

private enum SplashScreenViewTags: Int {
  case container = 1001
  case icon = 1002
}

@objc(RainbowSplashScreen)
class RainbowSplashScreen: NSObject {

  @objc func hideAnimated() {
    DispatchQueue.main.async {
      guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
            let window = windowScene.windows.first(where: { $0.isKeyWindow }),
            let rootVC = window.rootViewController else {
        RNSplashScreen.hide()
        return
      }

      guard let subview = rootVC.view.viewWithTag(SplashScreenViewTags.container.rawValue),
            let rainbowIcon = subview.viewWithTag(SplashScreenViewTags.icon.rawValue) as? UIImageView else {
        RNSplashScreen.hide()
        return
      }

      UIView.animate(withDuration: 0.1, delay: 0.0, options: .curveEaseIn, animations: {
        rainbowIcon.transform = CGAffineTransform(scaleX: 0.0000000001, y: 0.0000000001)
        subview.alpha = 0.0
      }) { _ in
        subview.isHidden = true
        RNSplashScreen.hide()
      }
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
