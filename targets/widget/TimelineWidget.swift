import SwiftUI
import WidgetKit

struct TimelineWidgetEntry: TimelineEntry {
  let date: Date
  let moment: PrayerMoment?
  let timeline: DayTimeline?
}

struct DayTimelineProvider: TimelineProvider {
  private let knobStepMinutes = 15
  private let horizonMinutes = 12 * 60

  func placeholder(in context: Context) -> TimelineWidgetEntry {
    TimelineWidgetEntry(date: Date(), moment: nil, timeline: nil)
  }

  func getSnapshot(in context: Context, completion: @escaping (TimelineWidgetEntry) -> Void) {
    completion(entry(at: Date(), snapshot: PrayerSnapshot.load()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<TimelineWidgetEntry>) -> Void) {
    let now = Date()
    let snapshot = PrayerSnapshot.load()

    var dates: Set<Date> = [now]
    for minute in stride(from: knobStepMinutes, through: horizonMinutes, by: knobStepMinutes) {
      dates.insert(now.addingTimeInterval(Double(minute) * 60))
    }
    if let snapshot {
      let horizonEnd = now.addingTimeInterval(Double(horizonMinutes) * 60)
      for prayer in snapshot.allPrayers {
        for boundary in [prayer.at, prayer.end, prayer.jummahEnd].compactMap({ $0 })
        where boundary > now && boundary <= horizonEnd {
          dates.insert(boundary)
        }
      }
    }

    let entries = dates.sorted().map { entry(at: $0, snapshot: snapshot) }
    completion(Timeline(entries: entries, policy: .atEnd))
  }

  private func entry(at date: Date, snapshot: PrayerSnapshot?) -> TimelineWidgetEntry {
    guard let snapshot else {
      return TimelineWidgetEntry(date: date, moment: nil, timeline: nil)
    }
    return TimelineWidgetEntry(
      date: date,
      moment: PrayerMoment.resolve(from: snapshot, at: date),
      timeline: DayTimeline.build(snapshot: snapshot, at: date)
    )
  }
}

struct TimelineWidgetView: View {
  let entry: TimelineWidgetEntry

  var body: some View {
    Group {
      if let moment = entry.moment, let timeline = entry.timeline {
        DayTimelineCard(moment: moment, timeline: timeline, now: entry.date)
      } else {
        TimelineMissingView()
      }
    }
    .widgetURL(URL(string: "bonnetid://"))
    .widgetLanguage(WidgetStrings.current)
  }
}

private struct DayTimelineCard: View {
  let moment: PrayerMoment
  let timeline: DayTimeline
  let now: Date

  private var marker: TimelineMark? { timeline.mark(at: moment.next.at) }
  private var strings: WidgetStrings { WidgetStrings.current }

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      HStack(alignment: .top, spacing: 8) {
        Text(moment.isNow ? strings.currentPrayer : strings.nextPrayer)
          .font(.caption)
          .foregroundStyle(PrayerColor.inkMuted)
          .lineLimit(1)
          .minimumScaleFactor(0.8)

        Spacer(minLength: 4)

        Text(strings.timeUntilNext)
          .font(.caption)
          .foregroundStyle(PrayerColor.inkMuted)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
      }

      HStack(alignment: .firstTextBaseline, spacing: 8) {
        VStack(alignment: .leading, spacing: 1) {
          Text(moment.headline.printedLabel)
            .font(.system(.title2, design: .default).weight(.bold))
            .foregroundStyle(PrayerColor.brand)
            .lineLimit(1)
            .minimumScaleFactor(0.7)
          Text(PrayerFormat.time(moment.headline.printedAt(showJamat: false)))
            .prayerTime(.subheadline)
            .foregroundStyle(PrayerColor.inkSecondary)
            .lineLimit(1)
        }

        Spacer(minLength: 4)

        VStack(alignment: .trailing, spacing: 1) {
          Text(
            timerInterval: PrayerFormat.countdownRange(to: moment.next.at, from: now),
            countsDown: true
          )
          .prayerTime(.system(.title2, design: .default).weight(.bold))
          .foregroundStyle(PrayerColor.ink)
          .multilineTextAlignment(.trailing)
          .lineLimit(1)
          .minimumScaleFactor(0.6)

          if moment.isNow {
            Text("\(moment.next.printedLabel) \(PrayerFormat.time(moment.next.at))")
              .prayerTime(.subheadline)
              .foregroundStyle(PrayerColor.inkSecondary)
              .lineLimit(1)
              .minimumScaleFactor(0.7)
          }
        }
      }

      TimelineBar(timeline: timeline, now: now, marker: marker)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    .containerBackground(PrayerColor.surface, for: .widget)
  }
}

private struct TimelineBar: View {
  let timeline: DayTimeline
  let now: Date
  let marker: TimelineMark?

  private let glyphSlot: CGFloat = 19
  private let glyphSize: CGFloat = 11
  private let glyphBand: CGFloat = 16
  private let barHeight: CGFloat = 9
  private let markerOverhang: CGFloat = 3
  private let axisBand: CGFloat = 13

  private var totalHeight: CGFloat { glyphBand + barHeight + axisBand + 6 }
  private var barTop: CGFloat { glyphBand + 2 }
  private var barCentre: CGFloat { barTop + barHeight / 2 }
  private var axisCentre: CGFloat { barTop + barHeight + 4 + axisBand / 2 }

  var body: some View {
    GeometryReader { geometry in
      let width = geometry.size.width
      let progress = timeline.fraction(of: now)
      let glyphs = DayTimeline.placeable(
        timeline.marks,
        minGap: width > 0 ? Double(glyphSlot / width) : 1,
        highlighting: marker?.at
      )

      ZStack(alignment: .topLeading) {
        Color.clear

        Capsule()
          .fill(PrayerColor.track)
          .frame(width: width, height: barHeight)
          .position(x: width / 2, y: barCentre)

        Capsule()
          .fill(PrayerColor.brand)
          .frame(width: max(width * CGFloat(progress), barHeight), height: barHeight)
          .position(x: max(width * CGFloat(progress), barHeight) / 2, y: barCentre)

        ForEach(timeline.marks, id: \.at) { mark in
          Rectangle()
            .fill(tickColour(for: mark, progress: progress))
            .frame(width: 1, height: barHeight)
            .position(x: clamped(width * CGFloat(mark.fraction), width: width, slot: 1), y: barCentre)
        }

        if let marker {
          RoundedRectangle(cornerRadius: 1, style: .continuous)
            .fill(PrayerColor.trackMarker)
            .frame(width: 2, height: barHeight + markerOverhang * 2)
            .position(
              x: clamped(width * CGFloat(marker.fraction), width: width, slot: 2),
              y: barCentre
            )
        }

        Circle()
          .fill(PrayerColor.brand)
          .frame(width: barHeight + 4, height: barHeight + 4)
          .overlay(Circle().stroke(PrayerColor.surface, lineWidth: 2))
          .position(
            x: clamped(width * CGFloat(progress), width: width, slot: barHeight + 4),
            y: barCentre
          )

        ForEach(glyphs, id: \.at) { mark in
          Image(systemName: mark.symbol)
            .font(.system(size: glyphSize))
            .foregroundStyle(mark.at == marker?.at ? PrayerColor.brand : PrayerColor.inkMuted)
            .frame(width: glyphSlot, height: glyphBand)
            .position(
              x: clamped(width * CGFloat(mark.fraction), width: width, slot: glyphSlot),
              y: glyphBand / 2
            )
        }

        ForEach(TimelineAxisLabel.all) { label in
          Text(label.text)
            .prayerTime(.system(size: 9))
            .foregroundStyle(PrayerColor.inkMuted)
            .fixedSize()
            .position(
              x: clamped(width * CGFloat(label.fraction), width: width, slot: 30),
              y: axisCentre
            )
        }
      }
    }
    .frame(height: totalHeight)
  }

  private func tickColour(for mark: TimelineMark, progress: Double) -> Color {
    mark.fraction <= progress ? PrayerColor.surface : PrayerColor.trackMarker
  }

  private func clamped(_ x: CGFloat, width: CGFloat, slot: CGFloat) -> CGFloat {
    guard width > slot else { return width / 2 }
    return min(max(x, slot / 2), width - slot / 2)
  }
}

private struct TimelineAxisLabel: Identifiable {
  let fraction: Double
  let text: String

  var id: Double { fraction }

  static let all: [TimelineAxisLabel] = [
    TimelineAxisLabel(fraction: 0, text: "00:00"),
    TimelineAxisLabel(fraction: 0.25, text: "06:00"),
    TimelineAxisLabel(fraction: 0.5, text: "12:00"),
    TimelineAxisLabel(fraction: 0.75, text: "18:00"),
    TimelineAxisLabel(fraction: 1, text: "24:00"),
  ]
}

private struct TimelineMissingView: View {
  private var strings: WidgetStrings { WidgetStrings.current }

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Image(systemName: "clock")
        .font(.title3)
        .foregroundStyle(PrayerColor.brand)
      Text(strings.openApp)
        .font(.headline)
        .foregroundStyle(PrayerColor.ink)
      Text(strings.timelineAppearsHere)
        .font(.caption)
        .foregroundStyle(PrayerColor.inkSecondary)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .containerBackground(PrayerColor.surface, for: .widget)
  }
}

struct PrayerTimelineWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "BonnetidTimelineWidget", provider: DayTimelineProvider()) { entry in
      TimelineWidgetView(entry: entry)
    }
    .configurationDisplayName(WidgetStrings.current.timelineWidgetName)
    .description(WidgetStrings.current.timelineWidgetDescription)
    .supportedFamilies([.systemMedium])
  }
}
