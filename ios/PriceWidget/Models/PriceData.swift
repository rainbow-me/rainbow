//
//  PriceData.swift
//  Rainbow
//
//  Created by Ben Goldberg on 10/25/21.
//

import Foundation

@available(iOS 14.0, *)
struct PriceData: Codable {
  struct MarketData: Codable {
    struct CurrentPrice: Codable {
      let aed: Double
      let ars: Double
      let aud: Double
      let bch: Double
      let bdt: Double
      let bhd: Double
      let bmd: Double
      let bnb: Double
      let brl: Double
      let btc: Double
      let cad: Double
      let chf: Double
      let clp: Double
      let cny: Double
      let czk: Double
      let dkk: Double
      let dot: Double
      let eos: Double
      let eth: Double
      let eur: Double
      let gbp: Double
      let hkd: Double
      let huf: Double
      let idr: Double
      let ils: Double
      let inr: Double
      let jpy: Double
      let krw: Double
      let kwd: Double
      let lkr: Double
      let ltc: Double
      let mmk: Double
      let mxn: Double
      let myr: Double
      let ngn: Double
      let nok: Double
      let nzd: Double
      let php: Double
      let pkr: Double
      let pln: Double
      let rub: Double
      let sar: Double
      let sek: Double
      let sgd: Double
      let thb: Double
      let twd: Double
      let uah: Double
      let usd: Double
      let vef: Double
      let vnd: Double
      let xag: Double
      let xau: Double
      let xdr: Double
      let xlm: Double
      let xrp: Double
      let yfi: Double
      let zar: Double
      let bits: Double
      let link: Double
      let sats: Double
      let `try`: Double
      
      private enum CodingKeys: String, CodingKey {
        case aed = "aed"
        case ars = "ars"
        case aud = "aud"
        case bch = "bch"
        case bdt = "bdt"
        case bhd = "bhd"
        case bmd = "bmd"
        case bnb = "bnb"
        case brl = "brl"
        case btc = "btc"
        case cad = "cad"
        case chf = "chf"
        case clp = "clp"
        case cny = "cny"
        case czk = "czk"
        case dkk = "dkk"
        case dot = "dot"
        case eos = "eos"
        case eth = "eth"
        case eur = "eur"
        case gbp = "gbp"
        case hkd = "hkd"
        case huf = "huf"
        case idr = "idr"
        case ils = "ils"
        case inr = "inr"
        case jpy = "jpy"
        case krw = "krw"
        case kwd = "kwd"
        case lkr = "lkr"
        case ltc = "ltc"
        case mmk = "mmk"
        case mxn = "mxn"
        case myr = "myr"
        case ngn = "ngn"
        case nok = "nok"
        case nzd = "nzd"
        case php = "php"
        case pkr = "pkr"
        case pln = "pln"
        case rub = "rub"
        case sar = "sar"
        case sek = "sek"
        case sgd = "sgd"
        case thb = "thb"
        case twd = "twd"
        case uah = "uah"
        case usd = "usd"
        case vef = "vef"
        case vnd = "vnd"
        case xag = "xag"
        case xau = "xau"
        case xdr = "xdr"
        case xlm = "xlm"
        case xrp = "xrp"
        case yfi = "yfi"
        case zar = "zar"
        case bits = "bits"
        case link = "link"
        case sats = "sats"
        case `try` = "try"
      }
    }
    
    struct PriceChangePercentage24hInCurrency: Codable {
      let aed: Double
      let ars: Double
      let aud: Double
      let bch: Double
      let bdt: Double
      let bhd: Double
      let bmd: Double
      let bnb: Double
      let brl: Double
      let btc: Double
      let cad: Double
      let chf: Double
      let clp: Double
      let cny: Double
      let czk: Double
      let dkk: Double
      let dot: Double
      let eos: Double
      let eth: Double
      let eur: Double
      let gbp: Double
      let hkd: Double
      let huf: Double
      let idr: Double
      let ils: Double
      let inr: Double
      let jpy: Double
      let krw: Double
      let kwd: Double
      let lkr: Double
      let ltc: Double
      let mmk: Double
      let mxn: Double
      let myr: Double
      let ngn: Double
      let nok: Double
      let nzd: Double
      let php: Double
      let pkr: Double
      let pln: Double
      let rub: Double
      let sar: Double
      let sek: Double
      let sgd: Double
      let thb: Double
      let twd: Double
      let uah: Double
      let usd: Double
      let vef: Double
      let vnd: Double
      let xag: Double
      let xau: Double
      let xdr: Double
      let xlm: Double
      let xrp: Double
      let yfi: Double
      let zar: Double
      let bits: Double
      let link: Double
      let sats: Double
      let `try`: Double
      
      private enum CodingKeys: String, CodingKey {
        case aed = "aed"
        case ars = "ars"
        case aud = "aud"
        case bch = "bch"
        case bdt = "bdt"
        case bhd = "bhd"
        case bmd = "bmd"
        case bnb = "bnb"
        case brl = "brl"
        case btc = "btc"
        case cad = "cad"
        case chf = "chf"
        case clp = "clp"
        case cny = "cny"
        case czk = "czk"
        case dkk = "dkk"
        case dot = "dot"
        case eos = "eos"
        case eth = "eth"
        case eur = "eur"
        case gbp = "gbp"
        case hkd = "hkd"
        case huf = "huf"
        case idr = "idr"
        case ils = "ils"
        case inr = "inr"
        case jpy = "jpy"
        case krw = "krw"
        case kwd = "kwd"
        case lkr = "lkr"
        case ltc = "ltc"
        case mmk = "mmk"
        case mxn = "mxn"
        case myr = "myr"
        case ngn = "ngn"
        case nok = "nok"
        case nzd = "nzd"
        case php = "php"
        case pkr = "pkr"
        case pln = "pln"
        case rub = "rub"
        case sar = "sar"
        case sek = "sek"
        case sgd = "sgd"
        case thb = "thb"
        case twd = "twd"
        case uah = "uah"
        case usd = "usd"
        case vef = "vef"
        case vnd = "vnd"
        case xag = "xag"
        case xau = "xau"
        case xdr = "xdr"
        case xlm = "xlm"
        case xrp = "xrp"
        case yfi = "yfi"
        case zar = "zar"
        case bits = "bits"
        case link = "link"
        case sats = "sats"
        case `try` = "try"
      }
    }
    
    let currentPrice: CurrentPrice
    let priceChangePercentage24hInCurrency: PriceChangePercentage24hInCurrency
    
    private enum CodingKeys: String, CodingKey {
      case currentPrice = "current_price"
      case priceChangePercentage24hInCurrency = "price_change_percentage_24h_in_currency"
    }
  }

  let marketData: MarketData

  private enum CodingKeys: String, CodingKey {
    case marketData = "market_data"
  }
}
