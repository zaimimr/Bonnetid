import SwiftUI
import WidgetKit

struct HijriEntry: TimelineEntry {
  let date: Date
  let hijriText: String
}

struct HijriProvider: TimelineProvider {
  func placeholder(in context: Context) -> HijriEntry {
    HijriEntry(date: Date(), hijriText: "")
  }

  func getSnapshot(in context: Context, completion: @escaping (HijriEntry) -> Void) {
    let now = Date()
    completion(HijriEntry(date: now, hijriText: PrayerSnapshot.load()?.hijriText(for: now) ?? ""))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<HijriEntry>) -> Void) {
    let now = Date()
    let snapshot = PrayerSnapshot.load()
    let calendar = Calendar.current
    let today = calendar.startOfDay(for: now)
    let dates = [now] + (1...7).compactMap { calendar.date(byAdding: .day, value: $0, to: today) }
    let entries = dates.map { HijriEntry(date: $0, hijriText: snapshot?.hijriText(for: $0) ?? "") }
    completion(Timeline(entries: entries, policy: .atEnd))
  }
}

struct HijriParts {
  let day: String
  let month: String
  let year: String

  init?(_ text: String) {
    let tokens = text.split(separator: " ").map(String.init)
    guard tokens.count >= 3 else { return nil }
    day = tokens[0].trimmingCharacters(in: CharacterSet(charactersIn: "."))
    month = tokens[1..<(tokens.count - 1)].joined(separator: " ")
    year = tokens[tokens.count - 1]
  }
}

struct HijriWidgetView: View {
  let entry: HijriEntry

  var body: some View {
    let parts = HijriParts(entry.hijriText)

    VStack(alignment: .leading, spacing: 0) {
      Text(entry.date, format: .dateTime.weekday(.abbreviated).day().month(.abbreviated))
        .font(.caption)
        .foregroundStyle(PrayerColor.inkMuted)
        .lineLimit(1)
        .minimumScaleFactor(0.8)

      Spacer(minLength: 0)

      Text(parts?.day ?? "–")
        .font(.system(size: 44, weight: .bold))
        .monospacedDigit()
        .foregroundStyle(PrayerColor.brand)
        .lineLimit(1)

      Text(parts?.month ?? entry.hijriText)
        .font(.headline)
        .foregroundStyle(PrayerColor.ink)
        .lineLimit(2)
        .minimumScaleFactor(0.7)

      if let year = parts?.year {
        Text(year)
          .font(.caption)
          .foregroundStyle(PrayerColor.inkMuted)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .containerBackground(PrayerColor.surface, for: .widget)
    .widgetURL(URL(string: "bonnetid://"))
    .widgetLanguage(WidgetStrings.current)
  }
}

struct HijriWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "BonnetidHijriWidget", provider: HijriProvider()) { entry in
      HijriWidgetView(entry: entry)
    }
    .configurationDisplayName(WidgetStrings.current.hijriWidgetName)
    .description(WidgetStrings.current.hijriWidgetDescription)
    .supportedFamilies([.systemSmall])
  }
}
