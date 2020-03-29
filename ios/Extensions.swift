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
  static func fromNib<T: UIView>() -> T {
    return Bundle(for: T.self).loadNibNamed(String(describing: T.self), owner: nil, options: nil)![0] as! T
  }
  
  func animateTapStart(
    duration: TimeInterval = 0.1,
    scale: CGFloat = 0.97,
    transformOrigin: CGPoint = .init(x: 0.5, y: 0.5),
    useHaptic: String? = nil
  ) {
    if useHaptic != nil {
      generateHapticFeedback(useHaptic!)
    }
    let timingFunction = CAMediaTimingFunction(controlPoints: 0.25, 0.46, 0.45, 0.94)
    
    CATransaction.begin()
    CATransaction.setAnimationTimingFunction(timingFunction)
    
    self.setAnchorPoint(CGPoint(x: transformOrigin.x, y: transformOrigin.y))
    
    UIView.animate(withDuration: duration) {
      self.transform = CGAffineTransform(scaleX: scale, y: scale)
    }
    
    CATransaction.commit()
  }
  
  func animateTapEnd(
    duration: TimeInterval = 0.1,
    pressOutDuration: TimeInterval = -1,
    useHaptic: String? = nil
  ) {
    if useHaptic != nil {
      generateHapticFeedback(useHaptic!)
    }
    let timingFunction = CAMediaTimingFunction(controlPoints: 0.25, 0.46, 0.45, 0.94)
    
    CATransaction.begin()
    CATransaction.setAnimationTimingFunction(timingFunction)
    
    UIView.animate(withDuration: pressOutDuration == -1 ? duration : pressOutDuration) {
      self.transform = .identity
    }
    
    CATransaction.commit()
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

extension UIView {
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
