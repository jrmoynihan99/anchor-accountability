import WidgetKit
import SwiftUI
import AppIntents

struct ReachOutEntry: TimelineEntry {
    let date: Date
    let isConfigured: Bool
    let showSent: Bool
}

@available(iOS 17.0, *)
struct ReachOutProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> ReachOutEntry {
        ReachOutEntry(date: Date(), isConfigured: true, showSent: false)
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> ReachOutEntry {
        return buildEntry()
    }

    func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<ReachOutEntry> {
        let entry = buildEntry()
        
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        return Timeline(entries: [entry], policy: .after(nextUpdate))
    }
    
    private func buildEntry() -> ReachOutEntry {
        let data = WidgetData.load()
        let defaults = UserDefaults(suiteName: "group.com.jrmoynihan99.anchor")
        
        // Check if we should show "Sent" (within 3 seconds of being set)
        let lastSentTimestamp = defaults?.double(forKey: "widget_lastPleaSent") ?? 0
        let showSent = lastSentTimestamp > 0 && (Date().timeIntervalSince1970 - lastSentTimestamp) < 3
        
        return ReachOutEntry(
            date: Date(),
            isConfigured: data.isConfigured,
            showSent: showSent
        )
    }
}

@available(iOS 17.0, *)
struct ConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Configuration"
    static var description = IntentDescription("Widget configuration")
}

@available(iOS 17.0, *)
struct ReachOutWidget: Widget {
    let kind: String = "ReachOutWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: ReachOutProvider()) { entry in
            ReachOutWidgetView(entry: entry)
        }
        .configurationDisplayName("Reach Out")
        .description("Quickly reach out to your community for support.")
        .supportedFamilies([.systemSmall])
    }
}
