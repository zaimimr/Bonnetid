import AppIntents
import SwiftUI
import WidgetKit

struct TrackerEntry: TimelineEntry {
  let date: Date
  let prayers: [PrayerEntry]
  let statuses: [String: String]

  var prayedCount: Int { prayers.filter { $0.status(in: statuses) == "prayed" }.count }

  var focus: PrayerEntry? { prayers.last { $0.at <= date } ?? prayers.first }

  func state(of prayer: PrayerEntry) -> TrackerState {
    switch prayer.status(in: statuses) {
    case "prayed": return .prayed
    case "skipped": return .skipped
    default: return prayer.at > date ? .future : .due
    }
  }
}

enum TrackerState {
  case prayed, skipped, due, future
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

enum TrackerStyle {
  case dots, list, button
}

struct PrayerTrackerWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: TrackerEntry
  let style: TrackerStyle
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
      } else if let focus = entry.focus {
        switch (style, family) {
        case (.dots, .systemSmall): TrackerDotsSmall(entry: entry, focus: focus)
        case (.dots, _): TrackerCapsuleMedium(entry: entry, focus: focus)
        case (.list, .systemSmall): TrackerChecklistSmall(entry: entry, focus: focus)
        case (.list, _): TrackerRowsMedium(entry: entry, focus: focus)
        case (.button, .systemSmall): TrackerButtonSmall(entry: entry, focus: focus)
        case (.button, _): TrackerIconsMedium(entry: entry, focus: focus)
        }
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .containerBackground(PrayerColor.surface, for: .widget)
    .widgetURL(URL(string: "bonnetid://tracker"))
    .widgetLanguage(strings)
  }
}

private extension TrackerEntry {
  func statusLine(for prayer: PrayerEntry) -> String {
    let strings = WidgetStrings.current
    switch state(of: prayer) {
    case .prayed: return strings.prayed
    case .skipped: return strings.skipped
    case .due, .future: return strings.notPrayedYet
    }
  }

  func headline(for prayer: PrayerEntry) -> String {
    state(of: prayer) == .due ? WidgetStrings.current.waiting(prayer.printedLabel) : prayer.printedLabel
  }
}

private struct FocusHeadline: View {
  let entry: TrackerEntry
  let focus: PrayerEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(WidgetStrings.current.now)
        .font(.caption)
        .foregroundStyle(PrayerColor.inkMuted)
      Text(focus.printedLabel)
        .font(.system(size: 28, weight: .bold))
        .foregroundStyle(PrayerColor.brand)
        .lineLimit(1)
        .minimumScaleFactor(0.6)
      Text(entry.statusLine(for: focus))
        .font(.system(size: 13, weight: .semibold))
        .foregroundStyle(PrayerColor.ink)
        .lineLimit(1)
        .minimumScaleFactor(0.8)
    }
  }
}

private struct TrackerDotsSmall: View {
  let entry: TrackerEntry
  let focus: PrayerEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      FocusHeadline(entry: entry, focus: focus)
      Spacer(minLength: 6)
      HStack(spacing: 0) {
        ForEach(entry.prayers, id: \.at) { prayer in
          TrackerButton(prayer: prayer, now: entry.date) {
            TrackerMark(state: entry.state(of: prayer), size: 24)
              .frame(maxWidth: .infinity)
              .contentShape(Rectangle())
          }
        }
      }
    }
  }
}

private struct TrackerButtonSmall: View {
  let entry: TrackerEntry
  let focus: PrayerEntry

  var body: some View {
    let state = entry.state(of: focus)
    let strings = WidgetStrings.current
    TrackerButton(prayer: focus, now: entry.date) {
      VStack(spacing: 4) {
        Text(focus.printedLabel)
          .font(.system(size: 20, weight: .bold))
          .foregroundStyle(PrayerColor.brand)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
        TrackerMark(state: state, size: 58, showsCheck: true)
        Text(state == .due || state == .future ? strings.markPrayed : entry.statusLine(for: focus))
          .font(.system(size: 13, weight: .semibold))
          .foregroundStyle(PrayerColor.ink)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
        Text(strings.prayedToday(entry.prayedCount, of: entry.prayers.count))
          .prayerTime(.caption)
          .foregroundStyle(PrayerColor.inkMuted)
          .lineLimit(1)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .contentShape(Rectangle())
    }
  }
}

private struct TrackerChecklistSmall: View {
  let entry: TrackerEntry
  let focus: PrayerEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(alignment: .firstTextBaseline, spacing: 4) {
        Text(entry.headline(for: focus))
          .font(.system(size: 15, weight: .bold))
          .foregroundStyle(PrayerColor.brand)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
        Spacer(minLength: 4)
        Text(WidgetStrings.current.prayedCount(entry.prayedCount, of: entry.prayers.count))
          .prayerTime(.caption.weight(.semibold))
          .foregroundStyle(PrayerColor.inkMuted)
          .lineLimit(1)
      }
      Spacer(minLength: 4)
      VStack(spacing: 3) {
        ForEach(entry.prayers, id: \.at) { prayer in
          let state = entry.state(of: prayer)
          TrackerButton(prayer: prayer, now: entry.date) {
            HStack(spacing: 6) {
              TrackerMark(state: state, size: 18)
              Text(prayer.printedLabel)
                .font(.caption)
                .foregroundStyle(PrayerColor.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
              Spacer(minLength: 4)
              Text(PrayerFormat.time(prayer.at))
                .prayerTime(.caption.weight(state == .due ? .semibold : .regular))
                .foregroundStyle(state == .due ? PrayerColor.brand : PrayerColor.inkMuted)
                .lineLimit(1)
            }
            .frame(maxWidth: .infinity)
            .contentShape(Rectangle())
          }
        }
      }
    }
  }
}

private struct TrackerRowsMedium: View {
  let entry: TrackerEntry
  let focus: PrayerEntry

  var body: some View {
    HStack(spacing: 16) {
      VStack(alignment: .leading, spacing: 0) {
        FocusHeadline(entry: entry, focus: focus)
        Spacer(minLength: 4)
        Text(WidgetStrings.current.prayedToday(entry.prayedCount, of: entry.prayers.count))
          .prayerTime(.caption)
          .foregroundStyle(PrayerColor.inkMuted)
          .lineLimit(1)
      }
      .frame(maxWidth: .infinity, alignment: .leading)

      VStack(spacing: 3) {
        ForEach(entry.prayers, id: \.at) { prayer in
          TrackerButton(prayer: prayer, now: entry.date) {
            HStack(spacing: 6) {
              Text(prayer.printedLabel)
                .font(.caption)
                .foregroundStyle(PrayerColor.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
              Spacer(minLength: 4)
              TrackerMark(state: entry.state(of: prayer), size: 18)
            }
            .frame(maxWidth: .infinity)
            .contentShape(Rectangle())
          }
        }
      }
      .frame(maxWidth: .infinity)
    }
  }
}

private struct TrackerCapsuleMedium: View {
  let entry: TrackerEntry
  let focus: PrayerEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(alignment: .firstTextBaseline, spacing: 6) {
        Text(entry.headline(for: focus))
          .font(.system(size: 20, weight: .bold))
          .foregroundStyle(PrayerColor.brand)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
        Spacer(minLength: 6)
        Text(WidgetStrings.current.prayedCount(entry.prayedCount, of: entry.prayers.count))
          .prayerTime(.caption.weight(.semibold))
          .foregroundStyle(PrayerColor.inkMuted)
          .lineLimit(1)
      }
      Spacer(minLength: 6)
      HStack(spacing: 2) {
        ForEach(entry.prayers, id: \.at) { prayer in
          TrackerButton(prayer: prayer, now: entry.date, dimsFuture: false) {
            CapsuleSegment(state: entry.state(of: prayer))
          }
        }
      }
      .frame(height: 44)
      .clipShape(Capsule())
      Spacer(minLength: 4)
      HStack(spacing: 2) {
        ForEach(entry.prayers, id: \.at) { prayer in
          Text(prayer.printedLabel)
            .font(.caption2)
            .foregroundStyle(entry.state(of: prayer) == .due ? PrayerColor.brand : PrayerColor.inkSecondary)
            .fontWeight(entry.state(of: prayer) == .due ? .semibold : .regular)
            .lineLimit(1)
            .minimumScaleFactor(0.7)
            .frame(maxWidth: .infinity)
        }
      }
      Spacer(minLength: 0)
    }
  }
}

private struct TrackerIconsMedium: View {
  let entry: TrackerEntry
  let focus: PrayerEntry

  var body: some View {
    VStack(spacing: 0) {
      HStack(alignment: .firstTextBaseline, spacing: 6) {
        Text(entry.headline(for: focus))
          .font(.system(size: 17, weight: .bold))
          .foregroundStyle(PrayerColor.brand)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
        Spacer(minLength: 6)
        Text(WidgetStrings.current.prayedCount(entry.prayedCount, of: entry.prayers.count))
          .prayerTime(.caption.weight(.semibold))
          .foregroundStyle(PrayerColor.inkMuted)
          .lineLimit(1)
      }
      Spacer(minLength: 6)
      HStack(spacing: 0) {
        ForEach(entry.prayers, id: \.at) { prayer in
          let state = entry.state(of: prayer)
          TrackerButton(prayer: prayer, now: entry.date) {
            VStack(spacing: 6) {
              TrackerIconMark(kind: prayer.kind, state: state)
              Text(prayer.printedLabel)
                .font(.caption.weight(state == .due ? .semibold : .regular))
                .foregroundStyle(state == .due ? PrayerColor.brand : PrayerColor.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            }
            .frame(maxWidth: .infinity)
            .contentShape(Rectangle())
          }
        }
      }
      Spacer(minLength: 0)
    }
  }
}

private struct TrackerIconMark: View {
  let kind: String
  let state: TrackerState

  var body: some View {
    ZStack {
      switch state {
      case .prayed:
        Circle().fill(PrayerColor.brand)
        Image("bt.check")
          .font(.system(size: 22, weight: .bold))
          .foregroundStyle(PrayerColor.surface)
      case .due:
        Circle().fill(PrayerColor.brandPlate)
        Circle().strokeBorder(PrayerColor.brand, lineWidth: 3)
        icon(PrayerColor.brand)
      case .skipped:
        Circle().strokeBorder(PrayerColor.trackMarker, lineWidth: 2.5)
        icon(PrayerColor.inkMuted)
          .opacity(0.5)
      case .future:
        Circle().strokeBorder(PrayerColor.trackMarker, lineWidth: 2.5)
        icon(PrayerColor.inkMuted)
      }
    }
    .frame(width: 48, height: 48)
  }

  private func icon(_ color: Color) -> some View {
    Image(PrayerFormat.symbol(for: kind))
      .font(.system(size: 20, weight: .medium))
      .foregroundStyle(color)
  }
}

private struct CapsuleSegment: View {
  let state: TrackerState

  var body: some View {
    ZStack {
      switch state {
      case .prayed:
        PrayerColor.brand
        Image("bt.check")
          .font(.system(size: 15, weight: .bold))
          .foregroundStyle(PrayerColor.surface)
      case .due:
        PrayerColor.brandPlate
        Text(WidgetStrings.current.tap)
          .font(.caption.weight(.semibold))
          .foregroundStyle(PrayerColor.onBrandPlate)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
      case .skipped:
        PrayerColor.track.opacity(0.5)
      case .future:
        PrayerColor.track
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .contentShape(Rectangle())
  }
}

private struct TrackerMark: View {
  let state: TrackerState
  let size: CGFloat
  var showsCheck = false

  var body: some View {
    ZStack {
      switch state {
      case .prayed:
        Circle().fill(PrayerColor.brand)
        Image("bt.check")
          .font(.system(size: size * 0.45, weight: .bold))
          .foregroundStyle(PrayerColor.surface)
      case .due:
        Circle().strokeBorder(PrayerColor.brand, lineWidth: size > 40 ? 3 : 2)
        if showsCheck {
          Image("bt.check")
            .font(.system(size: size * 0.4, weight: .bold))
            .foregroundStyle(PrayerColor.brand)
        }
      case .skipped:
        Circle().strokeBorder(PrayerColor.trackMarker, lineWidth: 2)
          .opacity(0.5)
      case .future:
        Circle().strokeBorder(PrayerColor.trackMarker, lineWidth: 2)
      }
    }
    .frame(width: size, height: size)
  }
}

private struct TrackerButton<Label: View>: View {
  let prayer: PrayerEntry
  let now: Date
  var dimsFuture = true
  @ViewBuilder let label: () -> Label

  var body: some View {
    let intent = TogglePrayerIntent(isoDate: PrayerSnapshot.dayKey(for: prayer.at), prayer: prayer.kind)
    Button(intent: intent, label: label)
      .buttonStyle(.plain)
      .disabled(prayer.at > now)
      .opacity(dimsFuture && prayer.at > now ? 0.45 : 1)
  }
}

struct PrayerTrackerWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "BonnetidTrackerWidget", provider: TrackerTimelineProvider()) { entry in
      PrayerTrackerWidgetView(entry: entry, style: .dots)
    }
    .configurationDisplayName(WidgetStrings.current.trackerWidgetName)
    .description(WidgetStrings.current.trackerWidgetDescription)
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

struct PrayerTrackerListWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "BonnetidTrackerListWidget", provider: TrackerTimelineProvider()) { entry in
      PrayerTrackerWidgetView(entry: entry, style: .list)
    }
    .configurationDisplayName(WidgetStrings.current.trackerListWidgetName)
    .description(WidgetStrings.current.trackerListWidgetDescription)
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

struct MarkPrayerWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "BonnetidMarkPrayerWidget", provider: TrackerTimelineProvider()) { entry in
      PrayerTrackerWidgetView(entry: entry, style: .button)
    }
    .configurationDisplayName(WidgetStrings.current.markPrayerWidgetName)
    .description(WidgetStrings.current.markPrayerWidgetDescription)
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
