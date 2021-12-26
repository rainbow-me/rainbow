//
//  PriceDataProvider.swift
//  Rainbow
//
//  Created by Ben Goldberg on 10/25/21.
//

import Foundation

@available(iOS 14.0, *)
final class PriceDataProvider {
  static let shared = PriceDataProvider()
  
  private init() {}
  
  public func getPriceData(token: String) -> PriceData? {
    let url = URL(string: "https://api.coingecko.com/api/v3/coins/\(token)?tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false")!
    
    let semaphore = DispatchSemaphore(value: 0)
    
    var priceData: PriceData?
    
    let task = URLSession.shared.dataTask(with: url) { (data, response, error) in
      if let data = data {
        if let response = try? JSONDecoder().decode(PriceData.self, from: data) {
          priceData = response
        }
      }
      semaphore.signal()
    }
    task.resume()
    semaphore.wait(wallTimeout: .distantFuture)
    return priceData
  }
}
