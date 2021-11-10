//
//  CoinGeckoToken.swift
//  Rainbow
//
//  Created by Ben Goldberg on 11/2/21.
//

import Foundation

@available(iOS 14.0, *)
struct CoinGeckoToken: Codable {
  let id: String
  let symbol: String
  let name: String
}
