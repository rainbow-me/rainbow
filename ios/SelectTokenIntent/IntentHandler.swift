//
//  IntentHandler.swift
//  SelectTokenIntent
//
//  Created by Ben Goldberg on 10/28/21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Intents

@available(iOS 14.0, *)
class IntentHandler: INExtension {
    
    override func handler(for intent: INIntent) -> Any {
        // This is the default implementation.  If you want different objects to handle different intents,
        // you can override this and return the handler you want for that particular intent.
        
        return self
    }
    
}

@available(iOS 14.0, *)
extension IntentHandler: SelectTokenIntentHandling {
  func provideTokenOptionsCollection(
    for intent: SelectTokenIntent,
    with completion: @escaping (INObjectCollection<Token>?, Error?) -> Void
  ) {
    var tokenItems = [Token]()
    let tokenProvider = TokenProvider.shared
    let addressTokenMap = tokenProvider.getAddressTokenMap()
    
    addressTokenMap.values.forEach { token in
      if (token.identifier != nil && token.name != nil && token.symbol != nil) {
        let tokenIntentObject = Token(identifier: token.identifier!, display: token.name! + " (" + token.symbol! + ")")
        tokenItems.append(tokenIntentObject)
      }
    }
    
    completion(INObjectCollection(items: tokenItems), nil)
  }
}
