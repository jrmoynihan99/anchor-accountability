import Foundation

struct WidgetData {
    let orgId: String?
    let orgName: String?
    let deepLink: String?
    let userId: String?
    let widgetToken: String?

    var isConfigured: Bool {
        orgId != nil && userId != nil
    }

    static func load() -> WidgetData {
        let defaults = UserDefaults(suiteName: "group.com.jrmoynihan99.anchor")
        return WidgetData(
            orgId: defaults?.string(forKey: "widget_orgId"),
            orgName: defaults?.string(forKey: "widget_orgName"),
            deepLink: defaults?.string(forKey: "widget_deepLink"),
            userId: defaults?.string(forKey: "widget_userId"),
            widgetToken: defaults?.string(forKey: "widget_token")
        )
    }
}
