//
//  TokenProvider.swift
//  Rainbow
//
//  Created by Ben Goldberg on 10/26/21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Foundation

@available(iOS 14.0, *)
public struct TokenProvider {

  /// Creates a list of emoji details that includes an emoji along with its name and description.
  /// - Returns: The list of `EmojiDetail`s
  /// - Note: Emoji descriptions obtained from [Empojipedia](https://emojipedia.org/).
  static func all() -> [TokenDetails] {
    return [
      TokenDetails(name: "ethereum", identifier: "ethereum")
    ]
  }
}
