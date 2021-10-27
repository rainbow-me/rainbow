//
//  TokenDetails.swift
//  Rainbow
//
//  Created by Ben Goldberg on 10/26/21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Foundation

@available(iOS 14.0, *)
public struct TokenDetails {
  public let name: String
  public let identifier: String
}

@available(iOS 14.0, *)
extension TokenDetails: Identifiable {
  public var id: String {
    identifier
  }
}
