package no.irn.bonnetid.widget

import android.content.Context
import android.util.TypedValue
import android.view.View
import android.widget.RemoteViews

/**
 * "Tidslinje": the shape of the day. The bar is rasterised because RemoteViews cannot compose it,
 * so it is redrawn on every update, including on a configuration change.
 */
object TimelineViews {
  private const val CARD_PADDING_DP = 28f
  private const val FALLBACK_WIDTH_DP = 300

  fun build(
    context: Context,
    size: WidgetSize,
    barWidthDp: Int,
    snapshot: PrayerSnapshot,
    moment: PrayerMoment,
    timeline: DayTimeline,
    now: Long,
  ): RemoteViews {
    val compact = size == WidgetSize.COMPACT
    val layout = if (compact) {
      R.layout.prayer_timeline_compact
    } else {
      R.layout.prayer_timeline_medium
    }
    val views = RemoteViews(context.packageName, layout)
    val strings = WidgetStrings.of(snapshot)
    views.setInt(R.id.root, "setLayoutDirection", strings.layoutDirection)
    val showJamat = snapshot.showJamat && snapshot.hasJamatTimes

    if (compact) {
      views.setImageViewResource(R.id.headline_icon, PrayerIcons.drawable(moment.headline.kind))
      views.setTextViewText(
        R.id.headline_label,
        "${strings.stateLabel(moment)} · ${moment.headline.displayLabel}",
      )
      WidgetChrome.countdown(views, R.id.countdown, moment.next.at, now, "%s")
    } else {
      views.setTextViewText(R.id.location, snapshot.locationName)
      views.setTextViewText(R.id.headline_label, moment.headline.displayLabel)
      views.setTextViewText(
        R.id.headline_time,
        PrayerFormat.time(moment.headline.printedAt(showJamat)),
      )
      if (moment.isNow) {
        views.setTextViewText(R.id.countdown_label, moment.next.displayLabel)
        views.setViewVisibility(R.id.countdown_label, View.VISIBLE)
      } else {
        views.setViewVisibility(R.id.countdown_label, View.GONE)
      }
      WidgetChrome.countdown(views, R.id.countdown, moment.next.at, now, strings.countdownFormat)
    }

    val bitmap = TimelineBarRenderer.render(
      context = context,
      timeline = timeline,
      now = now,
      markerAt = timeline.mark(moment.next.at)?.at,
      widthPx = barWidthPx(context, barWidthDp),
      heightPx = TimelineBarRenderer.heightPx(context, compact),
      compact = compact,
      rtl = strings.isRtl,
    )
    if (bitmap != null) {
      views.setImageViewBitmap(R.id.timeline_bar, bitmap)
    }
    return views
  }

  private fun barWidthPx(context: Context, widthDp: Int): Int {
    val usable = (widthDp.toFloat() - CARD_PADDING_DP).coerceAtLeast(120f)
    return TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_DIP,
      usable,
      context.resources.displayMetrics,
    ).toInt()
  }

  fun fallbackWidthDp(): Int = FALLBACK_WIDTH_DP
}
