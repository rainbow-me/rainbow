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
    var top100 = Constants.topTokens
    
    var topTokenItems = [Token]()
    var otherTokenItems = [Token]()
    let tokenProvider = TokenProvider.shared
    var tokens = Array(tokenProvider.getTokens().values)
    
    if (searchTerm != nil) {
      tokens = tokens.filter {
        let displayName = $0.name! + " (" + $0.symbol! + ")"
        return displayName.lowercased().contains(searchTerm!.lowercased())
      }
    }
    
    top100.keys.forEach {
      top100[$0?.lowercased()] = top100[$0]
    }

    let partition = tokens.partition(by: { top100.keys.contains($0.address!.lowercased()) })
    let otherTokens = tokens[..<partition]
    let topTokens = tokens[partition...]
    
    topTokenItems = topTokens.map { token in
      Token(identifier: token.address!.lowercased(), display: token.name! + " (" + token.symbol! + ")")
    }
    
    topTokenItems.sort(by: {
      top100[$0.identifier!]! < top100[$1.identifier!]!
    })
    
    if (searchTerm == nil) {
      completion(INObjectCollection(sections: [
        INObjectSection(title: "Top Tokens", items: topTokenItems)
      ]), nil)
      return
    }

    otherTokenItems = otherTokens.map { token in
      Token(identifier: token.address!.lowercased(), display: token.name! + " (" + token.symbol! + ")")
    }

    otherTokenItems.sort(by: {
      $0.displayString < $1.displayString
    })
    
    completion(INObjectCollection(sections: [
      INObjectSection(title: "Top Tokens", items: topTokenItems),
      INObjectSection(title: "More Tokens", items: otherTokenItems)
    ]), nil)
  }
}
