//
//  TokenData.swift
//  Rainbow
//
//  Created by Ben Goldberg on 10/28/21.
//

import Foundation
import UIKit

@available(iOS 14.0, *)
public struct TokenData {
  public let tokenDetails: TokenDetails?
  public let priceChange: Double?
  public let price: Double?
  public let icon: UIImage?

  init(tokenDetails: TokenDetails?, priceChange: Double?, price: Double?, icon: UIImage?) {
    self.tokenDetails = tokenDetails
    self.priceChange = priceChange
    self.price = price
    self.icon = icon
  }
  
  init() {
    self.tokenDetails = nil
    self.priceChange = nil
    self.price = nil
    self.icon = nil
  }
}
