//
//  IntentHandler.swift
//  SelectTokenIntent
//
//  Created by Ben Goldberg on 10/28/21.
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
  func provideTokenOptionsCollection(for intent: SelectTokenIntent, searchTerm: String?, with completion: @escaping (INObjectCollection<Token>?, Error?) -> Void) {
    var topTokenItems = [Token]()
    var otherTokenItems = [Token]()
    let tokenProvider = TokenProvider.shared
    let tokens = tokenProvider.getTokens()
    let top100 = Constants.topTokenAddresses

    topTokenItems = tokens.topTokens.map { token in
      Token(identifier: token.address!.lowercased(), display: token.name! + " (" + token.symbol! + ")")
    }
    
    if (searchTerm != nil) {
      otherTokenItems = tokens.otherTokens.map { token in
        Token(identifier: token.address!.lowercased(), display: token.name! + " (" + token.symbol! + ")")
      }
      
      topTokenItems = topTokenItems.filter {
        $0.displayString.lowercased().contains(searchTerm!.lowercased())
      }
      
      otherTokenItems = otherTokenItems.filter {
        $0.displayString.lowercased().contains(searchTerm!.lowercased())
      }
    }
  
    topTokenItems.sort(by: {
      top100[$0.identifier!]! < top100[$1.identifier!]!
    })
    
    if (searchTerm != nil) {
      otherTokenItems.sort(by: {
        $0.displayString < $1.displayString
      })
      
      completion(INObjectCollection(sections: [
        INObjectSection(title: "Top Tokens", items: topTokenItems),
        INObjectSection(title: "More Tokens", items: otherTokenItems)
      ]), nil)
    } else {
      completion(INObjectCollection(sections: [
        INObjectSection(title: "Top Tokens", items: topTokenItems)
      ]), nil)
    }
  }
}
