import AppIntents
import Foundation
import WidgetKit

@available(iOS 17.0, *)
struct ReachOutIntent: AppIntent {
    static var title: LocalizedStringResource = "Reach Out"
    static var description = IntentDescription("Send reach out to your community")
    
    // This makes the intent show up in Shortcuts and Siri
    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult {
        NSLog("🔥🔥🔥 ReachOutIntent.perform() CALLED at \(Date())")
        print("🔥🔥🔥 ReachOutIntent.perform() CALLED at \(Date())")
        
        let defaults = UserDefaults(suiteName: "group.com.jrmoynihan99.anchor")
        NSLog("🔥 UserDefaults loaded: \(defaults != nil)")
        
        // Show "Sent" immediately
        let timestamp = Date().timeIntervalSince1970
        defaults?.set(timestamp, forKey: "widget_lastPleaSent")
        defaults?.synchronize()
        
        NSLog("🔥 Set widget_lastPleaSent to: \(timestamp)")
        
        // Reload widget to show "Sent" state
        WidgetCenter.shared.reloadTimelines(ofKind: "ReachOutWidget")
        NSLog("🔥 Called reloadTimelines")
        
        // Wait 3 seconds
        try await Task.sleep(nanoseconds: 3_000_000_000)
        
        // Clear and return to default
        defaults?.removeObject(forKey: "widget_lastPleaSent")
        defaults?.synchronize()
        WidgetCenter.shared.reloadTimelines(ofKind: "ReachOutWidget")
        NSLog("🔥 Cleared sent state and reloaded")
        
        return .result()
        
        /* PRODUCTION CODE - Uncomment this when ready to use real API
        let data = WidgetData.load()

        guard let userId = data.userId,
              let orgId = data.orgId,
              let widgetToken = data.widgetToken else {
            defaults?.removeObject(forKey: "widget_loadingStarted")
            return .result()
        }

        let url = URL(
            string: "https://us-central1-accountability-app-a7767.cloudfunctions.net/createPleaFromWidget"
        )!

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 10

        let body: [String: String] = [
            "widgetToken": widgetToken,
            "userId": userId,
            "orgId": orgId,
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (_, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            defaults?.removeObject(forKey: "widget_loadingStarted")
            return .result()
        }

        if httpResponse.statusCode == 429 {
            defaults?.set(Date().timeIntervalSince1970, forKey: "widget_lastRateLimited")
        } else if httpResponse.statusCode == 200 {
            defaults?.set(Date().timeIntervalSince1970, forKey: "widget_lastPleaSent")
        }
        
        defaults?.removeObject(forKey: "widget_loadingStarted")
        
        // Request widget refresh
        WidgetCenter.shared.reloadTimelines(ofKind: "ReachOutWidget")
        
        return .result()
        */
    }
}

enum WidgetError: Error, LocalizedError {
    case networkError
    case rateLimited
    case serverError

    var errorDescription: String? {
        switch self {
        case .networkError: return "Network error"
        case .rateLimited: return "Please wait a few minutes"
        case .serverError: return "Server error"
        }
    }
}
