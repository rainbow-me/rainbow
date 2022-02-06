//
//  CurrencyProvider.swift
//  Rainbow
//
//  Created by Ben Goldberg on 1/7/22.
//  Copyright © 2022 Rainbow. All rights reserved.
//

import Foundation

@available(iOS 14.0, *)
struct CurrencyProvider {
  static func getCurrency() -> CurrencyDetails {
    let query = [kSecClass: kSecClassInternetPassword,
            kSecAttrServer: "nativeCurrency",
      kSecReturnAttributes: kCFBooleanTrue!,
            kSecReturnData: kCFBooleanTrue!,
            kSecMatchLimit: kSecMatchLimitOne] as [String: Any]
    var item: CFTypeRef?
    
    let fallbackCurrency = Constants.currencyDict[Constants.Currencies.usd.identifier]!
    
    let readStatus = SecItemCopyMatching(query as CFDictionary, &item)
    if readStatus != 0 {
      return fallbackCurrency
    }
    let found = item as? NSDictionary
    if found == nil {
      return fallbackCurrency
    }
    let currency = String(data: (found!.value(forKey: kSecValueData as String)) as! Data, encoding: .utf8)

    if !(currency?.isEmpty ?? true) {
      return Constants.currencyDict[currency!.lowercased()] ?? fallbackCurrency
    }
    return fallbackCurrency
  }
}
