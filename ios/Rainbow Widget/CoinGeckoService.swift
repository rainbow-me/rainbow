//
//  CoinGeckoService.swift
//  Rainbow
//
//  Created by Ben Goldberg on 10/25/21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Foundation

@available(iOS 14.0, *)
final class CoinGeckoService {
  static let shared = CoinGeckoService()
  
  private init() {}
  
  public func getPriceData(token: String) -> PriceData? {
    let url = URL(string: "https://api.coingecko.com/api/v3/coins/\(token)?tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false")!
    
    print("hi666")
    var priceData: PriceData?
    
//    let task = URLSession.shared.dataTask(with: url) { data, response, error in
//      if let data = data {
//        if let response = try? JSONDecoder().decode(PriceData.self, from: data) {
//          print(response)
//          print("hi123")
//          priceData = response
//        } else {
//          print("Invalid Response")
//          print("hi321")
//        }
//      } else if let error = error {
//          print("HTTP Request Failed \(error)")
//          print("hi421")
//      }
//    }
    let task = URLSession.shared.dataTask(with: url) { (data, response, error) in
      guard error == nil, let jsonData = data else {
        DispatchQueue.main.async {
          return
        }
        return
      }
      do {
        let response = try JSONDecoder().decode(PriceData.self, from: jsonData)
        priceData = response
      } catch {
        DispatchQueue.main.async {
          return
        }
      }
      
    }
    task.resume()
    
    return priceData
  }
}
