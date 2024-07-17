import UIKit
import MobileCoreServices

class ActionViewController: UIViewController {

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)

        print("in viewWillAppear")
        for item in extensionContext?.inputItems as? [NSExtensionItem] ?? [] {
            for provider in item.attachments ?? [] {

                if provider.hasItemConformingToTypeIdentifier(kUTTypeText as String) {
                    provider.loadItem(forTypeIdentifier: kUTTypeText as String, options: nil) { text, _ in
                        guard let text = text as? String else { return }
                        guard let url = URL(string: text) else {
                            return
                        }
                        self.launchBrowser(withUrl: url)
                        self.done()
                    }
                    break
                }

                if provider.hasItemConformingToTypeIdentifier(kUTTypeURL as String) {
                    provider.loadItem(forTypeIdentifier: kUTTypeURL as String, options: nil) { url, _ in
                        guard let url = url as? URL else { return }
                        self.launchBrowser(withUrl: url)
                        self.done()
                    }
                    break
                }

            }
        }
    }

    func launchBrowser(withUrl url: URL) {
        // Open the main app using a custom URL scheme
        let urlScheme = "rainbow://open?url=\(url.absoluteString)"
      
        print("URL: \(urlScheme)")

        if let appURL = URL(string: urlScheme) {
            print("Opening URL scheme: \(urlScheme)")
            self.extensionContext?.open(appURL, completionHandler: nil)
        } else {
            print("Failed to create URL from scheme: \(urlScheme)")
        }
    }

    func done() {
        self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
    
}
