//
//  TokenDetails.swift
//  Rainbow
//
//  Created by Ben Goldberg on 11/2/21.
//

import Foundation

@available(iOS 14.0, *)
struct TokenDetails: Codable {
  let name: String?
  let coinGeckoId: String?
  let symbol: String?
  let color: String?
  let address: String?

  init(name: String?, coinGeckoId: String?, symbol: String?, color: String?, address: String?) {
    self.name = name
    self.coinGeckoId = coinGeckoId
    self.symbol = symbol
    self.color = color
    self.address = address
  }
}
