//
//  PriceWidget.swift
//  Rainbow
//
//  Created by Ben Goldberg on 10/27/21.
//

import SwiftUI
import WidgetKit

@available(iOS 14.0, *)
struct PriceWidgetProvider: IntentTimelineProvider {
  
  typealias Entry = CustomTokenEntry
  typealias Intent = SelectTokenIntent
  
  let tokenProvider = TokenProvider.shared
  let priceDataProvider = PriceDataProvider.shared
  let iconProvider = IconProvider.shared
  
  let defaultToken = Constants.eth
  
  func placeholder(in context: Context) -> CustomTokenEntry {
    let currency = getCurrency()
     
    let priceData = priceDataProvider.getPriceData(token: defaultToken.coinGeckoId!)
    let priceChange = priceData?.marketData.priceChangePercentage24h
    let price = getPrice(data: priceData, currency: currency)
    
    let icon = priceData != nil ? iconProvider.getTokenIcon(token: defaultToken.symbol!, address: defaultToken.address!) : nil
    
    let tokenData = TokenData(tokenDetails: priceData != nil ? defaultToken : nil, priceChange: priceChange, price: price, icon: icon, currency: currency)
    
    return CustomTokenEntry(date: Date(), tokenData: tokenData)
  }
  
  func getSnapshot(for configuration: SelectTokenIntent, in context: Context, completion: @escaping (CustomTokenEntry) -> Void) {
    let tokenDetails = lookupTokenDetails(for: configuration)
    let currency = lookupCurrency(for: configuration)
    
    let priceData = priceDataProvider.getPriceData(token: tokenDetails.coinGeckoId!)
    let priceChange = priceData?.marketData.priceChangePercentage24h
    let price = getPrice(data: priceData, currency: currency)
    
    let icon = iconProvider.getTokenIcon(token: defaultToken.symbol!, address: defaultToken.address!)
    
    let tokenData = TokenData(tokenDetails: priceData != nil ? tokenDetails : nil, priceChange: priceChange, price: price, icon: icon, currency: currency)
    let entry = CustomTokenEntry(date: Date(), tokenData: tokenData)
    
    completion(entry)
  }
  
  func getTimeline(for configuration: SelectTokenIntent, in context: Context, completion: @escaping (Timeline<CustomTokenEntry>) -> Void) {
    var entries = [CustomTokenEntry]()
    let tokenDetails = lookupTokenDetails(for: configuration)
    let currency = lookupCurrency(for: configuration)
    
    let priceData = priceDataProvider.getPriceData(token: tokenDetails.coinGeckoId!)
    let priceChange = priceData?.marketData.priceChangePercentage24h
    let price = getPrice(data: priceData, currency: currency)
    
    let icon = priceData != nil ? iconProvider.getTokenIcon(token: tokenDetails.symbol!, address: tokenDetails.address!) : nil
    
    let tokenData = TokenData(tokenDetails: priceData != nil ? tokenDetails : nil, priceChange: priceChange, price: price, icon: icon, currency: currency)
    let date = Date()
    let entry = CustomTokenEntry(date: date, tokenData: tokenData)
    
    entries.append(entry)
    let reloadDate = Calendar.current.date(byAdding: .minute, value: 10, to: date)!
    
    let timeline = Timeline(entries: entries, policy: .after(reloadDate))
    completion(timeline)
  }
  
  private func lookupTokenDetails(for configuration: SelectTokenIntent) -> TokenDetails {
    if let token = configuration.token {
      let tokenDetails = tokenProvider.getTokens().allTokens[token.identifier?.lowercased() ?? ""]
      return tokenDetails ?? defaultToken
    }
    return defaultToken
  }
  
  private func lookupCurrency(for configuration: SelectTokenIntent) -> CurrencyDetails {
    if let currency = configuration.currency {
      return Constants.currencyDict[currency.identifier!] ?? getCurrency()
    }
    return getCurrency()
  }
  
  private func getCurrency() -> CurrencyDetails {
    let query = [kSecClass: kSecClassInternetPassword,
            kSecAttrServer: "nativeCurrency",
      kSecReturnAttributes: kCFBooleanTrue!,
            kSecReturnData: kCFBooleanTrue!,
            kSecMatchLimit: kSecMatchLimitOne] as [String: Any]
    var item: CFTypeRef?
    
    let fallbackCurrency = Constants.currencyDict[Constants.Currencies.usd.identifier]!
    
    let readStatus = SecItemCopyMatching(query as CFDictionary, &item)
    if readStatus != 0 {
      return fallbackCurrency
    }
    let found = item as? NSDictionary
    if found == nil {
      return fallbackCurrency
    }
    let currency = String(data: (found!.value(forKey: kSecValueData as String)) as! Data, encoding: .utf8)

    if !(currency?.isEmpty ?? true) {
      return Constants.currencyDict[currency!.lowercased()] ?? fallbackCurrency
    }
    return fallbackCurrency
  }
  
  func getPrice(data: PriceData?, currency: CurrencyDetails) -> Double? {
    let currentPrices = data?.marketData.currentPrice
    
    switch currency {
    case Constants.Currencies.eth:
      return currentPrices?.eth
    case Constants.Currencies.usd:
      return currentPrices?.usd
    case Constants.Currencies.eur:
      return currentPrices?.eur
    case Constants.Currencies.gbp:
      return currentPrices?.gbp
    case Constants.Currencies.aud:
      return currentPrices?.aud
    case Constants.Currencies.cny:
      return currentPrices?.cny
    case Constants.Currencies.krw:
      return currentPrices?.krw
    case Constants.Currencies.rub:
      return currentPrices?.rub
    case Constants.Currencies.inr:
      return currentPrices?.inr
    case Constants.Currencies.jpy:
      return currentPrices?.jpy
    case Constants.Currencies.try:
      return currentPrices?.try
    case Constants.Currencies.cad:
      return currentPrices?.cad
    case Constants.Currencies.nzd:
      return currentPrices?.nzd
    case Constants.Currencies.zar:
      return currentPrices?.zar
    default:
      return currentPrices?.usd
    }
  }
}

@available(iOS 14.0, *)
struct CustomTokenEntry: TimelineEntry {
  public let date: Date
  public let tokenData: TokenData
}

@available(iOS 14.0, *)
struct PriceWidgetEntryView : View {
  var entry: PriceWidgetProvider.Entry
  
  var body: some View {
    PriceWidgetView(tokenData: entry.tokenData, date: entry.date)
      .widgetURL(URL.init(string:
                            "https://rnbwapp.com/token?addr=" + (entry.tokenData.tokenDetails?.address)!
                         ))
  }
}

@available(iOS 14.0, *)
@main
struct PriceWidget: Widget {
  private let kind: String = "PriceWidget"
  
  public var body: some WidgetConfiguration {
    IntentConfiguration(
      kind: kind,
      intent: SelectTokenIntent.self,
      provider: PriceWidgetProvider()
    ) { entry in
      PriceWidgetEntryView(entry: entry)
    }
    .configurationDisplayName("Token Price Widget")
    .description("Keep an eye on the price of your favorite assets.")
    .supportedFamilies([.systemSmall])
  }
}
