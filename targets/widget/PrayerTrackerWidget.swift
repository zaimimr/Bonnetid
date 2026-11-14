import AppIntents
import SwiftUI
import WidgetKit

struct TrackerEntry: TimelineEntry {
  let date: Date
  let prayers: [PrayerEntry]
  let statuses: [String: String]

  var prayedCount: Int { prayers.filter { $0.status(in: statuses) == "prayed" }.count }
}

struct TrackerTimelineProvider: TimelineProvider {
  func placeholder(in context: Context) -> TrackerEntry {
    TrackerEntry(date: Date(), prayers: [], statuses: [:])
  }

  func getSnapshot(in context: Context, completion: @escaping (TrackerEntry) -> Void) {
    completion(Self.entry(at: Date(), snapshot: PrayerSnapshot.load(), statuses: PrayerLogStore.statuses()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<TrackerEntry>) -> Void) {
    let now = Date()
    let snapshot = PrayerSnapshot.load()
    let statuses = PrayerLogStore.statuses()
    var dates: Set<Date> = [now]
    for prayer in snapshot?.allPrayers ?? [] where prayer.isPrayer && prayer.at > now {
      dates.insert(prayer.at)
      if dates.count > 12 { break }
    }
    let entries = dates.sorted().map { Self.entry(at: $0, snapshot: snapshot, statuses: statuses) }
    completion(Timeline(entries: entries, policy: .atEnd))
  }

  private static func entry(at date: Date, snapshot: PrayerSnapshot?, statuses: [String: String]) -> TrackerEntry {
    TrackerEntry(
      date: date,
      prayers: snapshot?.dailyPrayers(for: date, now: date) ?? [],
      statuses: statuses
    )
  }
}

struct PrayerTrackerWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: TrackerEntry
  private var strings: WidgetStrings { WidgetStrings.current }

  var body: some View {
    Group {
      if entry.prayers.isEmpty {
        VStack(alignment: .leading, spacing: 6) {
          Text(strings.openApp)
            .font(.headline)
            .foregroundStyle(PrayerColor.ink)
          Text(strings.timesAppearHere)
            .font(.caption)
            .foregroundStyle(PrayerColor.inkSecondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      } else if family == .systemSmall {
        VStack(alignment: .leading, spacing: 0) {
          header
          Spacer(minLength: 4)
          VStack(spacing: 2) {
            ForEach(entry.prayers, id: \.at) { prayer in
              TrackerRow(prayer: prayer, status: prayer.status(in: entry.statuses), now: entry.date)
            }
          }
        }
      } else {
        VStack(alignment: .leading, spacing: 0) {
          header
          Spacer(minLength: 6)
          HStack(spacing: 4) {
            ForEach(entry.prayers, id: \.at) { prayer in
              TrackerColumn(prayer: prayer, status: prayer.status(in: entry.statuses), now: entry.date)
            }
          }
          Spacer(minLength: 0)
        }
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .containerBackground(PrayerColor.surface, for: .widget)
    .widgetURL(URL(string: "bonnetid://tracker"))
    .widgetLanguage(strings)
  }

  private var header: some View {
    HStack(alignment: .firstTextBaseline) {
      Text(strings.today)
        .font(.subheadline.weight(.bold))
        .foregroundStyle(PrayerColor.brand)
      Spacer(minLength: 6)
      Text(strings.prayedCount(entry.prayedCount, of: entry.prayers.count))
        .prayerTime(.caption.weight(.semibold))
        .foregroundStyle(PrayerColor.inkMuted)
    }
  }
}

private struct TrackerMark: View {
  let status: String?
  let size: CGFloat

  var body: some View {
    ZStack {
      if status == "prayed" {
        Circle().fill(PrayerColor.brand)
        Image("bt.check")
          .font(.system(size: size * 0.45, weight: .bold))
          .foregroundStyle(PrayerColor.surface)
      } else {
        Circle().strokeBorder(PrayerColor.trackMarker, lineWidth: 2)
      }
    }
    .frame(width: size, height: size)
    .opacity(status == "skipped" ? 0.5 : 1)
  }
}

private struct TrackerButton<Label: View>: View {
  let prayer: PrayerEntry
  let now: Date
  @ViewBuilder let label: () -> Label

  var body: some View {
    let intent = TogglePrayerIntent(isoDate: PrayerSnapshot.dayKey(for: prayer.at), prayer: prayer.kind)
    Button(intent: intent, label: label)
      .buttonStyle(.plain)
      .disabled(prayer.at > now)
      .opacity(prayer.at > now ? 0.45 : 1)
  }
}

private struct TrackerRow: View {
  let prayer: PrayerEntry
  let status: String?
  let now: Date

  var body: some View {
    TrackerButton(prayer: prayer, now: now) {
      HStack(spacing: 6) {
        Text(prayer.printedLabel)
          .font(.caption)
          .foregroundStyle(PrayerColor.ink)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
        Spacer(minLength: 4)
        TrackerMark(status: status, size: 18)
      }
      .frame(maxWidth: .infinity)
      .contentShape(Rectangle())
    }
  }
}

private struct TrackerColumn: View {
  let prayer: PrayerEntry
  let status: String?
  let now: Date

  var body: some View {
    TrackerButton(prayer: prayer, now: now) {
      VStack(spacing: 5) {
        Text(prayer.printedLabel)
          .font(.caption2)
          .foregroundStyle(PrayerColor.inkSecondary)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
        TrackerMark(status: status, size: 34)
        Text(PrayerFormat.time(prayer.at))
          .prayerTime(.caption2)
          .foregroundStyle(PrayerColor.inkMuted)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
      }
      .frame(maxWidth: .infinity)
      .contentShape(Rectangle())
    }
  }
}

struct PrayerTrackerWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "BonnetidTrackerWidget", provider: TrackerTimelineProvider()) { entry in
      PrayerTrackerWidgetView(entry: entry)
    }
    .configurationDisplayName(WidgetStrings.current.trackerWidgetName)
    .description(WidgetStrings.current.trackerWidgetDescription)
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
