//
//  CoinIconWithProgressBar.swift
//  Rainbow
//
//  Created by Alexey Kureev on 06/02/2020.
//  Copyright © 2020 Rainbow. All rights reserved.
//

import Foundation

class CoinIconWithProgressBar : UIView {
  private let shape = CAShapeLayer()

  override init(frame: CGRect) {
    super.init(frame: frame)
    setup();
  }
  
  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setup();
  }
  
  func changeProgress(_ progress: CGFloat) -> Void {
    UIView.animate(withDuration: 200, animations: {
      self.shape.strokeEnd = progress
    })
  }
  
  private func setup() {
    let shapeView = UIView()
    let lineWidth: CGFloat = 2.0
    let rect = CGRect(x: -3, y: -3, width: 46, height: 46)
    let roundedRect = UIBezierPath(roundedRect: rect, cornerRadius: 15)
    shape.path = roundedRect.cgPath
    shape.strokeColor = UIColor.RainbowTheme.Transactions.appleBlue.cgColor
    shape.lineWidth = lineWidth
    shape.lineCap = .round
    shape.fillColor = .none
    shape.strokeStart = 0.0
    shapeView.layer.insertSublayer(shape, at: 0)
    clipsToBounds = false
    insertSubview(shapeView, at: 0)
  }
}
