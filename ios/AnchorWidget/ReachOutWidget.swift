import WidgetKit
import SwiftUI

struct ReachOutEntry: TimelineEntry {
    let date: Date
    let isConfigured: Bool
    let lastPleaSentAt: Date?
    let isRateLimited: Bool
}

struct ReachOutProvider: TimelineProvider {
    func placeholder(in context: Context) -> ReachOutEntry {
        ReachOutEntry(date: Date(), isConfigured: true, lastPleaSentAt: nil, isRateLimited: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (ReachOutEntry) -> Void) {
        completion(buildEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ReachOutEntry>) -> Void) {
        let entry = buildEntry()

        // Schedule next refresh based on current state
        let nextUpdate: Date
        if let sent = entry.lastPleaSentAt, Date().timeIntervalSince(sent) < 8 {
            // Refresh after confirmation state expires
            nextUpdate = sent.addingTimeInterval(8)
        } else if entry.isRateLimited {
            // Check again in 1 minute
            nextUpdate = Date().addingTimeInterval(60)
        } else {
            nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        }

        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func buildEntry() -> ReachOutEntry {
        let data = WidgetData.load()
        let defaults = UserDefaults(suiteName: "group.com.jrmoynihan99.anchor")

        // Check if a plea was sent recently (show confirmation for 8 seconds)
        let lastSentTimestamp = defaults?.double(forKey: "widget_lastPleaSent") ?? 0
        let lastSent: Date? = {
            guard lastSentTimestamp > 0 else { return nil }
            let sent = Date(timeIntervalSince1970: lastSentTimestamp)
            return Date().timeIntervalSince(sent) < 8 ? sent : nil
        }()

        // Check rate limit (5 minute window)
        let lastRateLimitedTimestamp = defaults?.double(forKey: "widget_lastRateLimited") ?? 0
        let isRateLimited = (Date().timeIntervalSince1970 - lastRateLimitedTimestamp) < 300

        return ReachOutEntry(
            date: Date(),
            isConfigured: data.isConfigured,
            lastPleaSentAt: lastSent,
            isRateLimited: isRateLimited
        )
    }
}

struct ReachOutWidget: Widget {
    let kind: String = "ReachOutWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ReachOutProvider()) { entry in
            ReachOutWidgetView(entry: entry)
        }
        .configurationDisplayName("Reach Out")
        .description("Quickly reach out to your community for support.")
        .supportedFamilies([.systemSmall])
    }
}
