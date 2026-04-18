import Foundation
import React
import UIKit

private enum SplashScreenViewTags: Int {
  case container = 1001
  case icon = 1002
}

@objc(RainbowSplashScreen)
class RainbowSplashScreen: NSObject {
  
  private static var addedJsLoadErrorObserver = false;
  private static var loadingView: UIView? = nil;

  // needed since RN does not see the static method
  @objc func hideAnimated() {
    RainbowSplashScreen.staticHideAnimated()
  }
  
  static func staticHideAnimated() {
    DispatchQueue.main.async {
      
      if let loadingView = loadingView {
        guard let subview = loadingView.viewWithTag(SplashScreenViewTags.container.rawValue),
              let rainbowIcon = loadingView.viewWithTag(SplashScreenViewTags.icon.rawValue) as? UIImageView else {
          self.hide()
          return
        }

        UIView.animate(withDuration: 0.1, delay: 0.0, options: .curveEaseIn, animations: {
          rainbowIcon.transform = CGAffineTransform(scaleX: 0.0000000001, y: 0.0000000001)
          subview.alpha = 0.0
        }) { _ in
          subview.isHidden = true
          self.hide()
        }
      } else {
        print("WARNING: calling hideAnimated on SplashScreen but loadingView is nil")
      }
    }
  }
  
  static func showSplash(_ splashScreen: String, inRootView rootView: UIView) {
    
    if !addedJsLoadErrorObserver {
        NotificationCenter.default.addObserver(
            forName: NSNotification.Name("RCTJavaScriptDidFailToLoadNotification"),
            object: nil,
            queue: .main
        ) { _ in
          // If there was an error loading JavaScript, hide the splash screen so it can be shown. Otherwise, the splash screen will remain forever, which is a hassle to debug.
          self.hide()
        }
        addedJsLoadErrorObserver = true
    }

    if loadingView == nil {
        guard let view = loadSplashView(named: splashScreen) else {
          print("WARNING: SplashScreen view not found")
          return
        }
        loadingView = view
        loadingView?.frame = rootView.frame
        loadingView?.frame.origin = .zero
    }
    if let loadingView = loadingView {
        rootView.addSubview(loadingView)
    }
  }

  private static func loadSplashView(named splashScreen: String) -> UIView? {
    if Bundle.main.path(forResource: splashScreen, ofType: "nib") != nil,
       let view = Bundle.main.loadNibNamed(splashScreen, owner: self, options: nil)?.first as? UIView {
      return view
    }

    return UIStoryboard(name: splashScreen, bundle: .main).instantiateInitialViewController()?.view
  }
  
  static func hide() {
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
        loadingView?.removeFromSuperview()
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
