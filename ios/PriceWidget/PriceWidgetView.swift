//
//  PriceWidgetView.swift
//  Rainbow
//
//  Created by Ben Goldberg on 10/27/21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Foundation
import SwiftUI
import UIKit

@available(iOS 14.0, *)
struct PriceWidgetView: View {

  let tokenData: TokenData
  let date: Date
  
  private func toString(double: Double) -> String {
    return String(format: "%f", double)
  }
  
  private func getIcon(icon: UIImage) -> UIImage {
    return tokenData.icon!.resizeImageTo(size: CGSize(width: 20, height: 20))
  }
  
  private func convertToCurrency(double: Double) -> String {
    let nf = NumberFormatter()
    nf.locale = Locale(identifier: "en_US")
    nf.usesGroupingSeparator = true
    nf.numberStyle = .currency
    nf.currencySymbol = "$"
    return nf.string(for: double)!
  }
  
  private func hexStringToColor (hex:String) -> Color {
      var cString:String = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()

      if (cString.hasPrefix("#")) {
          cString.remove(at: cString.startIndex)
      }

      if ((cString.count) != 6) {
          return Color(UIColor.gray)
      }

      var rgbValue:UInt64 = 0
      Scanner(string: cString).scanHexInt64(&rgbValue)

      return Color(UIColor(
          red: CGFloat((rgbValue & 0xFF0000) >> 16) / 255.0,
          green: CGFloat((rgbValue & 0x00FF00) >> 8) / 255.0,
          blue: CGFloat(rgbValue & 0x0000FF) / 255.0,
          alpha: CGFloat(1.0))
      )
  }
  
  var body: some View {
    GeometryReader { geometry in
      ZStack {
          Rectangle()
            .fill(tokenData.tokenDetails != nil && tokenData.tokenDetails!.color != nil ? hexStringToColor(hex: tokenData.tokenDetails!.color!) : Color(red:0.15, green:0.16, blue:0.18))
            .offset(x: 0, y: 0)
        
          Rectangle()
            .fill(
              RadialGradient(gradient: Gradient(colors: [.black.opacity(0), .black]), center: .topLeading, startRadius: 0, endRadius: geometry.size.width * sqrt(2))
            )
            .opacity(0.08)

          Rectangle()
            .fill(
              RadialGradient(gradient: Gradient(colors: [.white.opacity(0), .black]), center: .bottomLeading, startRadius: 0, endRadius: geometry.size.width * sqrt(2) * 0.8323)
            )
            .blendMode(.overlay)
            .opacity(0.12)

          VStack(alignment: .leading) {
            HStack {
              Text(tokenData.tokenDetails != nil && tokenData.price != nil ? tokenData.tokenDetails!.symbol!.uppercased() : "")
                .font(.custom("SF Pro Rounded", size: 18))
                .fontWeight(.heavy)
                .foregroundColor(Color.white)
                .mask(
                  LinearGradient(gradient: Gradient(colors: [Color.white.opacity(0.9), Color.white.opacity(0.8)]), startPoint: .leading, endPoint: .trailing)
                )
                .offset(y: -0.5)

              Spacer()

              if (tokenData.icon != nil && tokenData.price != nil) {
                Image(uiImage: tokenData.icon!.resizeImageTo(size: CGSize(width: 20, height: 20))).frame(width: 20, height: 20)
              }
            }
            Spacer()
            
            HStack {
              VStack(alignment: .leading, spacing: 7) {
                if (tokenData.priceChange != nil && tokenData.price != nil) {
                  HStack(spacing: 4) {
                    if (tokenData.priceChange! >= 0) {
                      Image(systemName: "arrow.up")
                        .font(.system(size: 18, weight: .heavy, design: .rounded))
                        .foregroundColor(Color.white)
                    } else {
                      Image(systemName: "arrow.down")
                        .font(.system(size: 18, weight: .heavy, design: .rounded))
                        .foregroundColor(Color.white)
                    }
                    Text(tokenData.priceChange != nil ? String(format: "%.2f", abs(tokenData.priceChange!)) + "%" : "")
                      .font(.custom("SF Pro Rounded", size: 18))
                      .fontWeight(.heavy)
                      .foregroundColor(Color.white)
                  }
                    Text(tokenData.price != nil ? convertToCurrency(double: tokenData.price!) : "")
                      .font(.custom("SF Pro Rounded", size: 28))
                      .fontWeight(.heavy)
                      .foregroundColor(Color.white)
                      .minimumScaleFactor(0.01)
                      .lineLimit(1)
                } else {
                  Text("Couldn't retrieve token data")
                    .font(.custom("SF Pro Rounded", size: 28))
                    .fontWeight(.heavy)
                    .foregroundColor(Color.white)
                    .minimumScaleFactor(0.01)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
                }
              }.mask(
                LinearGradient(gradient: Gradient(colors: [Color.white.opacity(0.9), Color.white.opacity(0.7)]), startPoint: .leading, endPoint: .trailing)
              )
            }.padding(.bottom, 8)
            
            Spacer()
            
            if (tokenData.priceChange != nil && tokenData.price != nil) {
              if (tokenData.priceChange == 9.99 && tokenData.price == 9999.99) {
                Text("This is fake data")
                  .font(.custom("SF Pro Rounded", size: 10))
                  .fontWeight(.bold)
                  .foregroundColor(Color.white.opacity(0.4))
              } else {
                (Text("Updated at ") + Text(date, style: .time))
                  .font(.custom("SF Pro Rounded", size: 10))
                  .fontWeight(.bold)
                  .foregroundColor(Color.white.opacity(0.4))
              }
            }
          }
            .padding(16)
      }
    }
  }
}
