import SwiftUI
import WebKit

struct ContentView: View {
    @State private var isLoading = true
    @State private var canGoBack = false
    @State private var webView: WKWebView?
    
    // Live Vernunt production and fallback endpoints
    private let appUrlString = "https://app.vernunt.com"
    
    var body: some View {
        ZStack {
            WebViewContainer(
                urlString: appUrlString,
                isLoading: $isLoading,
                canGoBack: $canGoBack,
                webViewRef: $webView
            )
            .edgesIgnoringSafeArea(.bottom)
            
            if isLoading {
                VStack(spacing: 16) {
                    Image("VernuntLogo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 80, height: 80)
                        .cornerRadius(20)
                        .shadow(radius: 8)
                    
                    ProgressView()
                        .scaleEffect(1.3)
                        .tint(Color.orange)
                    
                    Text("Starting Vernunt...")
                        .font(.headline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color(UIColor.systemBackground))
                .transition(.opacity)
            }
        }
    }
}

struct WebViewContainer: UIViewRepresentable {
    let urlString: String
    @Binding var isLoading: Bool
    @Binding var canGoBack: Bool
    @Binding var webViewRef: WKWebView?
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    func makeUIView(context: Context) -> WKWebView {
        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true
        
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences = preferences
        configuration.allowsInlineMediaPlayback = true
        
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.bounces = true
        
        // Append iOS Native Web wrapper identifier to User-Agent
        let existingUserAgent = webView.customUserAgent ?? ""
        webView.customUserAgent = "\(existingUserAgent) Vernunt-iOS-App/1.0.0 (Apple iPhone)"
        
        if let url = URL(string: urlString) {
            let request = URLRequest(url: url, cachePolicy: .useProtocolCachePolicy, timeoutInterval: 30)
            webView.load(request)
        }
        
        DispatchQueue.main.async {
            self.webViewRef = webView
        }
        
        return webView
    }
    
    func updateUIView(_ uiView: WKWebView, context: Context) {}
    
    class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        var parent: WebViewContainer
        
        init(_ parent: WebViewContainer) {
            self.parent = parent
        }
        
        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = true
            }
        }
        
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = false
                self.parent.canGoBack = webView.canGoBack
            }
        }
        
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.async {
                self.parent.isLoading = false
            }
        }
    }
}
