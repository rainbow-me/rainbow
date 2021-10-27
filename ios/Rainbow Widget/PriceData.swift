//
//  PriceData.swift
//  Rainbow
//
//  Created by Ben Goldberg on 10/25/21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Foundation

@available(iOS 14.0, *)
struct PriceData: Codable {
  struct MarketData: Codable {
    struct CurrentPrice: Codable {
      let aed: Double
      let ars: Int
      let aud: Double
      let bch: Double
      let bdt: Int
      let bhd: Double
      let bmd: Double
      let bnb: Double
      let brl: Int
      let btc: Double
      let cad: Double
      let chf: Double
      let clp: Int
      let cny: Int
      let czk: Int
      let dkk: Int
      let dot: Double
      let eos: Double
      let eth: Int
      let eur: Double
      let gbp: Double
      let hkd: Int
      let huf: Int
      let idr: Int
      let ils: Double
      let inr: Int
      let jpy: Int
      let krw: Int
      let kwd: Double
      let lkr: Int
      let ltc: Double
      let mmk: Int
      let mxn: Int
      let myr: Double
      let ngn: Int
      let nok: Int
      let nzd: Double
      let php: Int
      let pkr: Int
      let pln: Double
      let rub: Int
      let sar: Double
      let sek: Int
      let sgd: Double
      let thb: Int
      let `try`: Int
      let twd: Int
      let uah: Int
      let usd: Double
      let vef: Double
      let vnd: Int
      let xag: Double
      let xau: Double
      let xdr: Double
      let xlm: Int
      let xrp: Int
      let yfi: Double
      let zar: Int
      let bits: Int
      let link: Double
      let sats: Int
    }

    let currentPrice: CurrentPrice
    let priceChangePercentage24h: Double

    private enum CodingKeys: String, CodingKey {
      case currentPrice = "current_price"
      case priceChangePercentage24h = "price_change_percentage_24h"
    }
  }

  let marketData: MarketData

  private enum CodingKeys: String, CodingKey {
    case marketData = "market_data"
  }
}
