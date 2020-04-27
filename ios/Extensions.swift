//
//  Extensions.swift
//  Rainbow
//
//  Created by Alexey Kureev on 13/01/2020.
//

fileprivate func generateHapticFeedback(_ hapticEffect: String) {
  switch hapticEffect {
  case "error":
    let generator = UINotificationFeedbackGenerator()
    generator.notificationOccurred(.error)
    
  case "success":
    let generator = UINotificationFeedbackGenerator()
    generator.notificationOccurred(.success)
    
  case "warning":
    let generator = UINotificationFeedbackGenerator()
    generator.notificationOccurred(.warning)
    
  case "light":
    let generator = UIImpactFeedbackGenerator(style: .light)
    generator.impactOccurred()
    
  case "medium":
    let generator = UIImpactFeedbackGenerator(style: .medium)
    generator.impactOccurred()
    
  case "heavy":
    let generator = UIImpactFeedbackGenerator(style: .heavy)
    generator.impactOccurred()
  default:
    let generator = UISelectionFeedbackGenerator()
    generator.selectionChanged()
  }
}

extension UIView {
  
  open override var canBecomeFirstResponder: Bool {
      return true
  }
  
  static func fromNib<T: UIView>() -> T {
    return Bundle(for: T.self).loadNibNamed(String(describing: T.self), owner: nil, options: nil)![0] as! T
  }
  
  @discardableResult
  func animateTapStart(
    duration: TimeInterval = 0.16,
    scale: CGFloat = 0.97,
    useHaptic: String? = nil
  ) -> UIViewPropertyAnimator {
    useHaptic.map(generateHapticFeedback)
    let animator = UIViewPropertyAnimator(duration: duration, controlPoint1: CGPoint(x: 0.25, y: 0.46), controlPoint2: CGPoint(x: 0.45, y: 0.94)) {
      self.transform = CGAffineTransform(scaleX: scale, y: scale)
    }
    animator.startAnimation()
    return animator
  }
  
  @discardableResult
  func animateTapEnd(
    duration: TimeInterval = 0.16,
    pressOutDuration: TimeInterval = -1,
    useHaptic: String? = nil
  ) -> UIViewPropertyAnimator {
    useHaptic.map(generateHapticFeedback)
    let animator = UIViewPropertyAnimator(duration: duration, controlPoint1: CGPoint(x: 0.25, y: 0.46), controlPoint2: CGPoint(x: 0.45, y: 0.94)) {
      self.transform = .identity
    }
    animator.startAnimation()
    return animator
  }
  
  func setAnchorPoint(_ point: CGPoint) {
    var newPoint = CGPoint(x: bounds.size.width * point.x, y: bounds.size.height * point.y)
    var oldPoint = CGPoint(x: bounds.size.width * layer.anchorPoint.x, y: bounds.size.height * layer.anchorPoint.y);
    
    newPoint = newPoint.applying(transform)
    oldPoint = oldPoint.applying(transform)
    
    var position = layer.position
    
    position.x -= oldPoint.x
    position.x += newPoint.x
    
    position.y -= oldPoint.y
    position.y += newPoint.y
    
    layer.position = position
    layer.anchorPoint = point
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

@IBDesignable class AddCashGradient: UIView {
    @IBInspectable var innerColor: UIColor = UIColor.red
    @IBInspectable var middleColor: UIColor = UIColor.green
    @IBInspectable var outerColor: UIColor = UIColor.blue
    @IBInspectable var cornerRadius: CGFloat = 0

    override func draw(_ rect: CGRect) {
        let path = UIBezierPath(roundedRect: rect, cornerRadius: cornerRadius)
        path.addClip()
      
        let colors = [innerColor.cgColor, middleColor.cgColor, outerColor.cgColor] as CFArray
        let endRadius = frame.width
        let center = CGPoint(x: bounds.size.width, y: bounds.size.height / 2)
        let locations = [CGFloat(0), CGFloat(0.635483871), CGFloat(1)]
        let gradient = CGGradient(colorsSpace: nil, colors: colors, locations: locations)
        let context = UIGraphicsGetCurrentContext()
        let options: CGGradientDrawingOptions = [.drawsBeforeStartLocation, .drawsAfterEndLocation]

        context?.drawRadialGradient(gradient!, startCenter: center, startRadius: 0.0, endCenter: center, endRadius: endRadius, options: options)
    }
}
