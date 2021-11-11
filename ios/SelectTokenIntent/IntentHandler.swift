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
  func provideTokenOptionsCollection(
    for intent: SelectTokenIntent,
    with completion: @escaping (INObjectCollection<Token>?, Error?) -> Void
  ) {
    let top100 = ["eth": 1, "bnb": 2, "hex": 5, "link": 6, "wbtc": 7, "uni": 8, "ven": 10, "cro": 12, "okb": 13, "trx": 14, "wfil": 15, "ceth": 16, "theta": 17, "ftm": 18, "steth": 19, "wsteth": 20, "grt": 21, "lrc": 23, "qnt": 25, "leo": 26, "ust": 27, "wmana": 28, "one": 29, "amp": 30, "mkr": 31, "hbtc": 32, "chz": 33, "enj": 34, "mim": 35, "btt": 36, "hot": 37, "omg": 38, "sushi": 39, "psafemoon": 40, "sand": 41, "comp": 42, "wcelo": 43, "cel": 44, "snx": 45, "nexo": 46, "iotx": 47, "lpt": 48, "kcs": 49, "ht": 50, "bat": 51, "acrv": 52, "wqtum": 53, "nxm": 55, "tel": 56, "zil": 57, "yfi": 58, "xdce": 59, "renbtc": 60, "bnt": 61, "zrx": 62, "ens": 64, "dydx": 65, "srm": 66, "uma": 67, "wax": 68, "rpl": 69, "elon": 70, "frax": 71, "iost": 73, "fxs": 74, "trac": 75, "woo": 76, "xyo": 77, "1inch": 78, "celr": 79, "ilv": 80, "gno": 81, "medx": 82, "chr": 83, "chsb": 84, "fet": 85, "dent": 86, "poly": 87, "tribe": 88, "fei": 89, "glm": 90, "inj": 91, "mask": 92, "alpha": 93, "fx": 94, "pundix": 95, "rgt": 96, "sxp": 97, "syn": 98, "dodo": 99, "ogn": 100, "ocean": 102, "oxt": 103, "snt": 104, "band": 105, "keep": 106, "btmx": 107, "ubt": 108, "ice": 109, "orbs": 110, "paxg": 111, "rlc": 112, "prom": 113]
    var topTokenItems = [Token]()
    var otherTokenItems = [Token]()
    let tokenProvider = TokenProvider.shared
    var tokens = tokenProvider.getTokens()

    let partition = tokens.partition(by: { top100.keys.contains($0.symbol!.lowercased()) })
    let otherTokens = tokens[..<partition]
    let topTokens = tokens[partition...]
    
    topTokens.forEach { token in
      if (token.identifier != nil && token.name != nil && token.symbol != nil) {
        let tokenIntentObject = Token(identifier: token.symbol!.lowercased(), display: token.name! + " (" + token.symbol! + ")")
        topTokenItems.append(tokenIntentObject)
      }
    }
    
    otherTokens.forEach { token in
      if (token.identifier != nil && token.name != nil && token.symbol != nil) {
        let tokenIntentObject = Token(identifier: token.symbol!.lowercased(), display: token.name! + " (" + token.symbol! + ")")
        otherTokenItems.append(tokenIntentObject)
      }
    }

    topTokenItems.sort(by: {
      top100[$0.identifier!]! < top100[$1.identifier!]!
    })

    otherTokenItems.sort(by: {
      $0.displayString < $1.displayString
    })
    
    completion(INObjectCollection(sections: [
      INObjectSection(title: "Top Tokens", items: topTokenItems),
      INObjectSection(title: "More Tokens", items: otherTokenItems)
    ]), nil)
  }
}
