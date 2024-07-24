import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers

extension NSObject {
    func callSelector(selector: Selector, object: AnyObject?, delay: TimeInterval) {
        let delay = delay * Double(NSEC_PER_SEC)
        let time = DispatchTime(uptimeNanoseconds: UInt64(delay))
        DispatchQueue.main.asyncAfter(deadline: time) {
            Thread.detachNewThreadSelector(selector, toTarget: self, with: object)
        }
    }
}

extension NSURL {
    var encodedUrl: String? { return absoluteString?.addingPercentEncoding(withAllowedCharacters: NSCharacterSet.alphanumerics) }
}

extension NSItemProvider {
  var isText: Bool { return hasItemConformingToTypeIdentifier(UTType.text.identifier) }
  var isUrl: Bool { return hasItemConformingToTypeIdentifier(UTType.url.identifier) }

    func processText(completion: CompletionHandler?) {
      loadItem(forTypeIdentifier: UTType.text.identifier, options: nil, completionHandler: completion)
    }

    func processUrl(completion: CompletionHandler?) {
      loadItem(forTypeIdentifier: UTType.url.identifier, options: nil, completionHandler: completion)
    }
}

class ShareViewController: UIViewController {
    private var urlScheme: String = "rainbow"

    func focusUrl(url: String) -> NSURL? {
        return NSURL(string: "\(self.urlScheme)://dapp?url=\(url)")
    }

    func textUrl(text: String) -> NSURL? {
        guard let query = text.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else { return nil }
        return NSURL(string: "\(self.urlScheme)://dapp?url=\(query)")
    }

    override func viewWillAppear(_ animated: Bool) {
        let inputItems: [NSExtensionItem] = (extensionContext?.inputItems as? [NSExtensionItem]) ?? []
        var urlProvider: NSItemProvider?
        var textProvider: NSItemProvider?

        // Look for the first URL the host application is sharing.
        // If there isn't a URL grab the first text item
        for item: NSExtensionItem in inputItems {
            let attachments: [NSItemProvider] = item.attachments ?? []
            for attachment in attachments {
                if urlProvider == nil && attachment.isUrl {
                    urlProvider = attachment
                } else if textProvider == nil && attachment.isText {
                    textProvider = attachment
                }
            }
        }

        // If a URL is found, process it. Otherwise we will try to convert
        // the text item to a URL falling back to sending just the text.
        if let urlProvider = urlProvider {
            urlProvider.processUrl { [weak self] (urlItem, error) in
                guard let self = self else { return }
                Task { @MainActor in
                    guard let url = (urlItem as? NSURL)?.encodedUrl, let focusUrl = self.focusUrl(url: url) else { self.finish(); return }
                    self.handleUrl(focusUrl)
                }
            }
        } else if let textProvider = textProvider {
            textProvider.processText { [weak self] (textItem, error) in
                guard let self = self else { return }
                Task { @MainActor in
                    guard let text = textItem as? String else { self.finish(); return }
                    guard let focusUrl = self.textUrl(text: text) else { self.finish(); return }
                    self.handleUrl(focusUrl)
                }
            }
        }
      
      self.finish()
    }

    private func handleUrl(_ url: NSURL) {
        // From http://stackoverflow.com/questions/24297273/openurl-not-work-in-action-extension
        var responder = self as UIResponder?
        let selectorOpenURL = sel_registerName("openURL:")
        while responder != nil {
            if responder!.responds(to: selectorOpenURL) {
                responder!.callSelector(selector: selectorOpenURL, object: url, delay: 0)
            }

            responder = responder!.next
        }
        finish()
    }

    override func viewDidAppear(_ animated: Bool) {
        // Stop keyboard from showing
        view.resignFirstResponder()

        super.viewDidAppear(animated)
    }

    override func willMove(toParent parent: UIViewController?) {
        view.alpha = 0
    }
}

extension ShareViewController {
    func finish(afterDelay: TimeInterval = 0) {
        UIView.animate(
            withDuration: 0.2,
            delay: afterDelay,
            options: [],
            animations: {
                self.view.alpha = 0
            },
            completion: { _ in
                self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            }
        )
    }
}
