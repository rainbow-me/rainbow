//
//  TokenData.swift
//  Rainbow
//
//  Created by Ben Goldberg on 10/28/21.
//

import Foundation
import UIKit

@available(iOS 14.0, *)
struct TokenData {
  let tokenDetails: TokenDetails?
  let priceChange: Double?
  let price: Double?
  let icon: UIImage?
  let currency: CurrencyDetails

  init(tokenDetails: TokenDetails?, priceChange: Double?, price: Double?, icon: UIImage?, currency: CurrencyDetails) {
    self.tokenDetails = tokenDetails
    self.priceChange = priceChange
    self.price = price
    self.icon = icon
    self.currency = currency
  }
  
  init() {
    self.tokenDetails = nil
    self.priceChange = nil
    self.price = nil
    self.icon = nil
    self.currency = Constants.Currencies.usd
  }
}
