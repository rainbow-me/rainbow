import UIKit
import Social

class ShareViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUserInterface()
    }

    private func setupUserInterface() {
        // Create and setup the button
        let button = UIButton(type: .system)
        button.setTitle("Open in Rainbow", for: .normal)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.addTarget(self, action: #selector(openInRainbow), for: .touchUpInside)

        // Add the button to the view
        self.view.addSubview(button)

        // Center the button in the view
        NSLayoutConstraint.activate([
            button.centerXAnchor.constraint(equalTo: self.view.centerXAnchor),
            button.centerYAnchor.constraint(equalTo: self.view.centerYAnchor)
        ])

        // Optional: Customize the view's background color
        self.view.backgroundColor = .white
    }

  @objc private func openInRainbow() {
    print("!1111 1")
    if let item = extensionContext?.inputItems.first as? NSExtensionItem {
        if let itemProvider = item.attachments?.first {
                print("!1111 3")
            itemProvider.loadItem(forTypeIdentifier: "public.url", options: nil) { [weak self] (url, error) in
                guard let strongSelf = self, let shareURL = url as? URL else {
                    self?.completeRequest()
                    return
                }
                
                    print("!1111 4")
                DispatchQueue.main.async {
                        print("!111777")
                    let urlString = "rainbow://test"
                    let encodedURLString = urlString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)
                    if let urlToOpen = URL(string: encodedURLString!) {
                        print("Trying to open URL: \(urlToOpen)") // Debugging output
                        strongSelf.extensionContext?.open(urlToOpen, completionHandler: { (success) in
                            print("Open URL success: \(success)") // Debugging output
                            strongSelf.completeRequest()
                        })
                    } else {
                        print("Failed to create URL") // Debugging output
                        strongSelf.completeRequest()
                    }
                }
            }
        }
    }
}

    private func completeRequest() {
        // Complete the request, returning to the host app
        self.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
    }
}
