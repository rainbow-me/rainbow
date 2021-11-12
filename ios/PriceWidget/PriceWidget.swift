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
  
  let defaultToken = TokenDetails(name: "Ethereum", identifier: "ethereum", symbol: "ETH", color: "#282C2C", address: "no address")

  func placeholder(in context: Context) -> CustomTokenEntry {
    let eth = defaultToken
    
    let priceData = priceDataProvider.getPriceData(token: eth.identifier!)
    let priceChange = priceData?.marketData.priceChangePercentage24h
    let price = priceData?.marketData.currentPrice.usd
    
    let icon = iconProvider.getIcon(token: eth.symbol!, address: eth.address!)

    let tokenData = TokenData(tokenDetails: eth, priceChange: priceChange, price: price, icon: icon)
    
    return CustomTokenEntry(date: Date(), tokenData: tokenData)
  }

  func getSnapshot(for configuration: SelectTokenIntent, in context: Context, completion: @escaping (CustomTokenEntry) -> Void) {
    
    let eth = defaultToken

    let priceChangePlaceholder = 9.99
    let pricePlaceholder = 9999.99

    let icon = iconProvider.getIcon(token: eth.symbol!, address: eth.address!)

    let tokenData = TokenData(tokenDetails: eth, priceChange: priceChangePlaceholder, price: pricePlaceholder, icon: icon)
    let entry = CustomTokenEntry(date: Date(), tokenData: tokenData)

    completion(entry)
  }

  func getTimeline(for configuration: SelectTokenIntent, in context: Context, completion: @escaping (Timeline<CustomTokenEntry>) -> Void) {
    var entries = [CustomTokenEntry]()
    let tokenDetails = lookupTokenDetails(for: configuration)
    
    let priceData = priceDataProvider.getPriceData(token: tokenDetails.identifier!)
    let priceChange = priceData?.marketData.priceChangePercentage24h
    let price = priceData?.marketData.currentPrice.usd
    
    if (priceData == nil || priceChange == nil || price == nil) {
      return
    }
    
    let icon = iconProvider.getIcon(token: tokenDetails.symbol!, address: tokenDetails.address!)
    
    let tokenData = TokenData(tokenDetails: tokenDetails, priceChange: priceChange, price: price, icon: icon)
    let date = Date()
    let entry = CustomTokenEntry(date: date, tokenData: tokenData)
    
    entries.append(entry)
    let reloadDate = Calendar.current.date(byAdding: .minute, value: 10, to: date)!

    let timeline = Timeline(entries: entries, policy: .after(reloadDate))
    completion(timeline)
  }

  private func lookupTokenDetails(for configuration: SelectTokenIntent) -> TokenDetails {
    let tokenId = configuration.token != nil ? configuration.token!.identifier : ""
    let tokenForConfig = tokenProvider.getTokens().first(where: { token in
      token.address?.lowercased() == tokenId!.lowercased()
    })
    return tokenForConfig != nil ? tokenForConfig! : defaultToken
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
