//
//  IconProvider.swift
//  Rainbow
//
//  Created by Ben Goldberg on 11/8/21.
//

import Foundation
import UIKit

@available(iOS 14.0, *)
final class IconProvider {
  static let shared = IconProvider()
  
  private init() {}
  
  public func getTokenIcon(token: String, address: String) -> UIImage? {
    var icon: UIImage? = UIImage(named: "coinIcons/" + token.lowercased())
    
    if (icon != nil) {
      return icon
    }
    
    let url = URL(string: "https://raw.githubusercontent.com/rainbow-me/assets/master/blockchains/ethereum/assets/\(address)/logo.png")!
    
    let semaphore = DispatchSemaphore(value: 0)
    
    let task = URLSession.shared.dataTask(with: url) { (data, response, error) in
      if let data = data {
        icon = UIImage(data: data)
      }
      semaphore.signal()
    }
    task.resume()
    semaphore.wait(wallTimeout: .distantFuture)
    return icon
  }
}
