//
//  TokenProvider.swift
//  Rainbow
//
//  Created by Ben Goldberg on 10/28/21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Foundation
import SwiftUI
import UIKit

@available(iOS 14.0, *)
final class TokenProvider {
  
  static let shared = TokenProvider()
  
  private init() {}
  
  public func getAddressTokenMap() -> [String: TokenDetails] {
    var addressTokenMap = [String: TokenDetails]()
    let coinGeckoTokenList = getCoinGeckoTokenList()
    let rainbowTokenList = getRainbowTokenList()
    
    if (coinGeckoTokenList != nil && rainbowTokenList != nil) {
      rainbowTokenList!.tokens.forEach {
        let address = $0.address
        addressTokenMap[address.lowercased()] = TokenDetails(name: $0.name, identifier: nil, symbol: $0.symbol, color: "#282C2C", address: address)
      }
      coinGeckoTokenList!.forEach {
        let address = $0.platforms.ethereum.lowercased()
        let incompleteToken = addressTokenMap[address]
        if (incompleteToken != nil) {
          addressTokenMap[address] = TokenDetails(name: incompleteToken!.name, identifier: $0.id, symbol: incompleteToken!.symbol, color: incompleteToken!.color, address: incompleteToken!.address)
        }
      }
    }
    addressTokenMap["eth"] = TokenDetails(name: "Ethereum", identifier: "ethereum", symbol: "ETH", color: "#282C2C", address: "NA")
    return addressTokenMap
  }
  
  private func getCoinGeckoTokenList() -> [CoinGeckoToken]? {
    let url = URL(string: "https://api.coingecko.com/api/v3/coins/list?include_platform=true&asset_platform_id=ethereum")!
    
    let semaphore = DispatchSemaphore(value: 0)
    
    var tokenList: [CoinGeckoToken]?
    
    let task = URLSession.shared.dataTask(with: url, completionHandler: {(data, response, error) -> Void in
      if let data = data {
        if let response = try? JSONDecoder().decode([CoinGeckoToken].self, from: data) {
          tokenList = response
        }
      }
      semaphore.signal()
    })
    task.resume()
    semaphore.wait(wallTimeout: .distantFuture)
    return tokenList
  }
  
  private func getRainbowTokenList() -> RainbowTokenList? {
    
//      let urlString = ProcessInfo.processInfo.environment["RAINBOW_TOKEN_LIST_URL"] ?? ""
    let url = URL(string: "https://metadata.p.rainbow.me/token-list/rainbow-token-list.json")!
    
    let semaphore = DispatchSemaphore(value: 0)
    
    var tokenList: RainbowTokenList?
    
    let task = URLSession.shared.dataTask(with: url, completionHandler: {(data, response, error) -> Void in
      if let data = data {
        if let response = try? JSONDecoder().decode(RainbowTokenList.self, from: data) {
          tokenList = response
        }
      }
      semaphore.signal()
    })
    task.resume()
    semaphore.wait(wallTimeout: .distantFuture)
    return tokenList
  }
}
