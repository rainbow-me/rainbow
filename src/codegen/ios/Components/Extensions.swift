//
//  Extensions.swift
//  Rainbow
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
}
