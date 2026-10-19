//
//  Extensions.swift
//  Rainbow
//
//  Created by Alexey Kureev on 13/01/2020.
//

extension UIScreen {
    private static let cornerRadiusKey: String = {
        let components = ["Radius", "Corner", "display", "_"]
        return components.reversed().joined()
    }()

    public var displayCornerRadius: CGFloat {
        guard let cornerRadius = self.value(forKey: Self.cornerRadiusKey) as? CGFloat else {
            return 0
        }
        
        return cornerRadius
    }
}

extension UIView {
  
  static func fromNib<T: UIView>() -> T {
    return Bundle(for: T.self).loadNibNamed(String(describing: T.self), owner: nil, options: nil)![0] as! T
  }
  
  func roundLeftCorners(cornerRadius: CGFloat = 100) {
      let maskPath = UIBezierPath(roundedRect: bounds,
                                   byRoundingCorners: [.topLeft , .bottomLeft],
                                   cornerRadii: CGSize(width: cornerRadius, height: cornerRadius))
      let maskLayer = CAShapeLayer()
      maskLayer.frame = bounds
      maskLayer.path = maskPath.cgPath
      layer.mask = maskLayer
  }
}

extension UIImageView {
  
  private static let kRotationAnimationKey = "rotationanimationkey"
  
  func rotate(duration: Double = 2) {
      if layer.animation(forKey: UIImageView.kRotationAnimationKey) == nil {
          let rotationAnimation = CABasicAnimation(keyPath: "transform.rotation")

          rotationAnimation.fromValue = 0.0
          rotationAnimation.toValue = Float.pi * 2.0
          rotationAnimation.duration = duration
          rotationAnimation.repeatCount = Float.infinity

          layer.add(rotationAnimation, forKey: UIImageView.kRotationAnimationKey)
      }
  }

  func stopRotating() {
      if layer.animation(forKey: UIImageView.kRotationAnimationKey) != nil {
          layer.removeAnimation(forKey: UIImageView.kRotationAnimationKey)
      }
  }
}

extension UILabel {
  func addCharacterSpacing(kernValue: Double = 0.6) {
    if let labelText = text, labelText.count > 0 {
      let attributedString = NSMutableAttributedString(string: labelText)
      attributedString.addAttribute(NSAttributedString.Key.kern, value: kernValue, range: NSRange(location: 0, length: attributedString.length - 1))
      attributedText = attributedString
    }
  }
  
  func setLineSpacing(lineSpacing: CGFloat = 0.0, lineHeightMultiple: CGFloat = 0.0) {
      guard let labelText = self.text else { return }

      let paragraphStyle = NSMutableParagraphStyle()
      paragraphStyle.alignment = self.textAlignment
      paragraphStyle.lineSpacing = lineSpacing
      paragraphStyle.lineHeightMultiple = lineHeightMultiple

      let attributedString:NSMutableAttributedString
      if let labelattributedText = self.attributedText {
          attributedString = NSMutableAttributedString(attributedString: labelattributedText)
      } else {
          attributedString = NSMutableAttributedString(string: labelText)
      }

      attributedString.addAttribute(NSAttributedString.Key.paragraphStyle, value:paragraphStyle, range:NSMakeRange(0, attributedString.length))

      self.attributedText = attributedString
  }
}

extension Date {
  func days(from date: Date) -> Int {
    return Calendar.current.dateComponents([.day], from: date, to: self).day ?? 0
  }
  
  func hours(from date: Date) -> Int {
    return Calendar.current.dateComponents([.hour], from: date, to: self).hour ?? 0
  }
  
  func minutes(from date: Date) -> Int {
    return Calendar.current.dateComponents([.minute], from: date, to: self).minute ?? 0
  }
  
  func seconds(from date: Date) -> Int {
    return Calendar.current.dateComponents([.second], from: date, to: self).second ?? 0
  }
}


extension CALayer {
    func pause() {
        if self.isPaused() == false {
            let pausedTime: CFTimeInterval = self.convertTime(CACurrentMediaTime(), from: nil)
            self.speed = 0.0
            self.timeOffset = pausedTime
        }
    }

    func isPaused() -> Bool {
        return self.speed == 0.0
    }

    func resume() {
        let pausedTime: CFTimeInterval = self.timeOffset
        self.speed = 1.0
        self.timeOffset = 0.0
        self.beginTime = 0.0
        let timeSincePause: CFTimeInterval = self.convertTime(CACurrentMediaTime(), from: nil) - pausedTime
        self.beginTime = timeSincePause
    }
}

extension UITableView {
    func showEmptyState(_ message: String) {
        let messageLabel = UILabel(frame: CGRect(x: 0, y: 0, width: self.bounds.size.width, height: self.bounds.size.height))
        let emoji = "🏝️"
        let paragraphStyle = NSMutableParagraphStyle()
        messageLabel.text = "\n\n\n\n\n\n\n" + emoji + "\n" + message
        messageLabel.numberOfLines = 0
        messageLabel.textAlignment = .center
        messageLabel.textColor = UIColor.RainbowTheme.Transactions.blueGreyDark35
        messageLabel.sizeToFit()
        messageLabel.isAccessibilityElement = true
        messageLabel.accessibilityLabel="no-transactions-yet-label"
        paragraphStyle.alignment = .center
        paragraphStyle.lineHeightMultiple = 1.25
        
        let emojiRange = (messageLabel.text! as NSString).range(of: emoji)
        let attributedString = NSMutableAttributedString(string: messageLabel.text!, attributes: [NSAttributedString.Key.font : UIFont(name: "SFRounded-Semibold", size: 16) ?? UIFont.systemFont(ofSize: 16, weight: .semibold), NSAttributedString.Key.kern : 0.5, NSAttributedString.Key.paragraphStyle : paragraphStyle])
        attributedString.setAttributes([NSAttributedString.Key.font : UIFont.systemFont(ofSize: 32)], range: emojiRange)
        messageLabel.attributedText = attributedString
        
        self.backgroundView = messageLabel
    }
    
    func restore() {
        self.backgroundView = nil
    }
}

@IBDesignable class AddCashButton: UIView {
    @IBInspectable var innerColor: UIColor = UIColor.red
    @IBInspectable var middleColor: UIColor = UIColor.green
    @IBInspectable var outerColor: UIColor = UIColor.blue
    @IBInspectable var enableShadows: Bool = false

    override func layoutSubviews() {
        let gradientContainer = CALayer()
        gradientContainer.frame = bounds
        gradientContainer.cornerRadius = bounds.size.height / 2
        gradientContainer.masksToBounds = true
        gradientContainer.zPosition = -1
        
        let gradient = CAGradientLayer()
        let yPosition = (bounds.size.width - bounds.size.height) / -2
        let yRadius = 0.5 + 123 / 156
        gradient.type = .radial
        gradient.frame = CGRect(x: 0, y: yPosition, width: bounds.size.width, height: bounds.size.width)
        gradient.colors = [innerColor.cgColor, middleColor.cgColor, outerColor.cgColor]
        gradient.locations = [0, 0.544872, 1]
        gradient.startPoint = CGPoint(x: 1, y: 0.5)
        gradient.endPoint = CGPoint(x: 2, y: yRadius)
        gradientContainer.addSublayer(gradient)
        self.layer.sublayers?.forEach { $0.removeFromSuperlayer() }
        self.layer.addSublayer(gradientContainer)
        
        if enableShadows {
            let gradientShadowMask = CAShapeLayer()
            let gradientShadowFrame = CGRect(x: bounds.size.width / 2, y: bounds.size.width - bounds.size.height / 2, width: bounds.size.width, height: bounds.size.height)
            let gradientShadowRect = UIBezierPath(roundedRect: gradientShadowFrame, cornerRadius: bounds.size.height / 2)
            gradientShadowMask.shadowOffset = CGSize(width: 0, height: 5)
            gradientShadowMask.shadowOpacity = UIColor.RainbowTheme.isDarkMode ? 0.0 : 0.4
            gradientShadowMask.shadowPath = gradientShadowRect.cgPath
            gradientShadowMask.shadowRadius = 7.5
            
            let gradientShadow = CAGradientLayer()
            let yPosition = -(bounds.size.width - bounds.size.height / 2)
            let yRadius = 0.5 + (123 / 156 / 2)
            gradientShadow.type = .radial
            gradientShadow.frame = CGRect(x: -bounds.size.width / 2, y: yPosition, width: bounds.size.width * 2, height: bounds.size.width * 2)
            gradientShadow.colors = [innerColor.cgColor, middleColor.cgColor, outerColor.cgColor]
            gradientShadow.locations = [0, 0.544872, 1]
            gradientShadow.startPoint = CGPoint(x: 0.75, y: 0.5)
            gradientShadow.endPoint = CGPoint(x: 1.25, y: yRadius)
            gradientShadow.zPosition = -2
            gradientShadow.mask = gradientShadowMask
            
            let shadow = CAShapeLayer()
            let shadowRect = UIBezierPath(roundedRect: bounds, cornerRadius: bounds.size.height / 2)
            shadow.shadowColor = UIColor.RainbowTheme.Transactions.shadow.cgColor
            shadow.shadowOffset = CGSize(width: 0, height: 10)
            shadow.shadowOpacity = 0.2
            shadow.shadowPath = shadowRect.cgPath
            shadow.shadowRadius = 15
            shadow.zPosition = -3
            
            self.layer.addSublayer(gradientShadow)
            self.layer.addSublayer(shadow)
        }
    }
}
