import AppIntents
import Foundation

@available(iOS 17.0, *)
struct ReachOutIntent: AppIntent {
    static var title: LocalizedStringResource = "Reach Out"
    static var description = IntentDescription("Send an anonymous reach out to your community")

    func perform() async throws -> some IntentResult {
        let data = WidgetData.load()

        guard let userId = data.userId,
              let orgId = data.orgId,
              let widgetToken = data.widgetToken else {
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

        let defaults = UserDefaults(suiteName: "group.com.jrmoynihan99.anchor")

        guard let httpResponse = response as? HTTPURLResponse else {
            return .result()
        }

        if httpResponse.statusCode == 429 {
            defaults?.set(Date().timeIntervalSince1970, forKey: "widget_lastRateLimited")
        } else if httpResponse.statusCode == 200 {
            defaults?.set(Date().timeIntervalSince1970, forKey: "widget_lastPleaSent")
        }

        return .result()
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
