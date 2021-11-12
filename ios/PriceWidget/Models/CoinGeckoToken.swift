//
//  CoinGeckoToken.swift
//  Rainbow
//
//  Created by Ben Goldberg on 11/2/21.
//

import Foundation

@available(iOS 14.0, *)
struct CoinGeckoToken: Codable {
  struct Platform: Codable {
    let ethereum: String?
  }
  
  let id: String
  let symbol: String
  let name: String
  let platforms: Platform
}
