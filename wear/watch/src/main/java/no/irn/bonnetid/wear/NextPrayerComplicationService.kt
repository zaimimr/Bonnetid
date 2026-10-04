package no.irn.bonnetid.wear

import android.app.PendingIntent
import android.content.Intent
import androidx.wear.protolayout.expression.DynamicBuilders.DynamicFloat
import androidx.wear.protolayout.expression.DynamicBuilders.DynamicInstant
import androidx.wear.watchface.complications.data.ComplicationData
import androidx.wear.watchface.complications.data.ComplicationType
import androidx.wear.watchface.complications.data.CountDownTimeReference
import androidx.wear.watchface.complications.data.NoDataComplicationData
import androidx.wear.watchface.complications.data.PlainComplicationText
import androidx.wear.watchface.complications.data.RangedValueComplicationData
import androidx.wear.watchface.complications.data.ShortTextComplicationData
import androidx.wear.watchface.complications.data.TimeDifferenceComplicationText
import androidx.wear.watchface.complications.data.TimeDifferenceStyle
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceService
import androidx.wear.watchface.complications.datasource.ComplicationDataTimeline
import androidx.wear.watchface.complications.datasource.ComplicationRequest
import androidx.wear.watchface.complications.datasource.TimeInterval
import androidx.wear.watchface.complications.datasource.TimelineEntry
import java.time.Duration
import java.time.Instant
import java.util.concurrent.TimeUnit
import no.irn.bonnetid.widget.PrayerEntry
import no.irn.bonnetid.widget.PrayerFormat
import no.irn.bonnetid.widget.PrayerSnapshot

class NextPrayerComplicationService : ComplicationDataSourceService() {
  override fun onComplicationRequest(
    request: ComplicationRequest,
    listener: ComplicationRequestListener,
  ) {
    val now = System.currentTimeMillis()
    val windows = PrayerSnapshot.load(this)
      ?.let { WatchSnapshot.windows(it, now, WINDOW_LIMIT) }
      .orEmpty()
      .mapNotNull { window -> build(request.complicationType, window)?.let { window to it } }

    if (windows.isEmpty()) {
      listener.onComplicationData(NoDataComplicationData())
      return
    }

    val entries = windows.map { (window, data) ->
      TimelineEntry(
        TimeInterval(Instant.ofEpochMilli(window.start), Instant.ofEpochMilli(window.end)),
        data,
      )
    }
    val runsOut = Instant.ofEpochMilli(windows.last().first.end)
    val expired = TimelineEntry(TimeInterval(runsOut, runsOut.plus(Duration.ofDays(365))), NoDataComplicationData())
    listener.onComplicationDataTimeline(ComplicationDataTimeline(windows.first().second, entries + expired))
  }

  override fun getPreviewData(type: ComplicationType): ComplicationData? {
    val now = System.currentTimeMillis()
    val preview = PrayerEntry(
      kind = "asr",
      label = "Asr",
      displayLabel = "Asr",
      at = now + 83 * 60 * 1000L,
      isPrayer = true,
      jamat = null,
      isJummah = false,
    )
    return build(type, PrayerWindow(now - 120 * 60 * 1000L, preview.at, preview, emptyList()))
  }

  private fun build(type: ComplicationType, window: PrayerWindow): ComplicationData? {
    val next = window.next
    val description = PlainComplicationText.Builder(
      "Neste bønn: ${next.displayLabel} ${PrayerFormat.time(next.at)}",
    ).build()
    val title = PlainComplicationText.Builder(next.displayLabel).build()
    val countdown = TimeDifferenceComplicationText.Builder(
      TimeDifferenceStyle.SHORT_DUAL_UNIT,
      CountDownTimeReference(Instant.ofEpochMilli(next.at)),
    )
      .setMinimumTimeUnit(TimeUnit.MINUTES)
      .build()

    return when (type) {
      ComplicationType.SHORT_TEXT -> ShortTextComplicationData.Builder(countdown, description)
        .setTitle(title)
        .setTapAction(openApp())
        .build()
      ComplicationType.RANGED_VALUE -> {
        val span = ((window.end - window.start) / 1000L).coerceAtLeast(1L).toFloat()
        val remaining = ((window.end - System.currentTimeMillis()) / 1000L).coerceIn(0L, span.toLong()).toFloat()
        val elapsed = DynamicFloat.constant(span).minus(
          DynamicInstant.platformTimeWithSecondsPrecision()
            .durationUntil(DynamicInstant.withSecondsPrecision(Instant.ofEpochMilli(window.end)))
            .toIntSeconds()
            .asFloat(),
        )
        RangedValueComplicationData.Builder(elapsed, span - remaining, 0f, span, description)
          .setTitle(title)
          .setText(countdown)
          .setTapAction(openApp())
          .build()
      }
      else -> null
    }
  }

  private fun openApp(): PendingIntent {
    return PendingIntent.getActivity(
      this,
      0,
      Intent(this, MainActivity::class.java),
      PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private companion object {
    const val WINDOW_LIMIT = 160
  }
}
