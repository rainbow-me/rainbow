//
//  SettingsBundleHelper.swift
//  Rainbow
//
//  Created by Bruno Andres Barbieri on 7/21/20.
//  Copyright © 2020 Rainbow. All rights reserved.
//

import Foundation

@objc class SettingsBundleHelper: NSObject {
    struct SettingsBundleKeys {
        static let Reset = "RESET_APP_DATA"
    }
  @objc class func checkAndExecuteSettings() -> Bool {
        if UserDefaults.standard.bool(forKey: SettingsBundleKeys.Reset) {
          UserDefaults.standard.set(false, forKey: SettingsBundleKeys.Reset)
          let appDomain: String? = Bundle.main.bundleIdentifier
          UserDefaults.standard.removePersistentDomain(forName: appDomain!)
          // Wipe the keychain
          let secItemClasses = [kSecClassGenericPassword, kSecClassInternetPassword, kSecClassCertificate, kSecClassKey, kSecClassIdentity]
          for itemClass in secItemClasses {
              let spec: NSDictionary = [kSecClass: itemClass]
              SecItemDelete(spec)
          }
          print("Keychain wiped!");
          return true;
        }
        return false;
    }
}

