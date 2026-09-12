package no.irn.bonnetid.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.util.TypedValue
import android.view.View
import android.widget.RemoteViews

class PrayerTimelineWidget : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    render(context, appWidgetManager, appWidgetIds)
    scheduleNextUpdate(context)
  }

  override fun onAppWidgetOptionsChanged(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
    newOptions: Bundle,
  ) {
    render(context, appWidgetManager, intArrayOf(appWidgetId))
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    when (intent.action) {
      ACTION_REFRESH,
      Intent.ACTION_TIME_CHANGED,
      Intent.ACTION_TIMEZONE_CHANGED,
      Intent.ACTION_DATE_CHANGED,
      Intent.ACTION_CONFIGURATION_CHANGED,
      -> updateAll(context)
    }
  }

  override fun onDisabled(context: Context) {
    alarmManager(context)?.cancel(refreshIntent(context))
  }

  companion object {
    const val ACTION_REFRESH = "no.irn.bonnetid.widget.REFRESH_TIMELINE"

    private const val KNOB_STEP_MINUTES = 15L
    private const val FALLBACK_UPDATE_MS = 30 * 60 * 1000L
    private const val CARD_PADDING_DP = 28f
    private const val DEFAULT_WIDTH_DP = 300

    fun updateAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context) ?: return
      val ids = manager.getAppWidgetIds(ComponentName(context, PrayerTimelineWidget::class.java))
      if (ids.isEmpty()) return
      render(context, manager, ids)
      scheduleNextUpdate(context)
    }

    private fun render(context: Context, manager: AppWidgetManager, ids: IntArray) {
      val snapshot = PrayerSnapshot.load(context)
      val now = System.currentTimeMillis()
      val moment = snapshot?.let { PrayerMoment.resolve(it, now) }
      val timeline = snapshot?.let { DayTimeline.build(it, now) }

      for (id in ids) {
        val views = if (snapshot == null || moment == null || timeline == null) {
          RemoteViews(context.packageName, R.layout.prayer_widget_empty)
        } else {
          timelineViews(context, manager, id, snapshot, moment, timeline, now)
        }
        views.setOnClickPendingIntent(R.id.root, openAppIntent(context))
        manager.updateAppWidget(id, views)
      }
    }

    private fun timelineViews(
      context: Context,
      manager: AppWidgetManager,
      id: Int,
      snapshot: PrayerSnapshot,
      moment: PrayerMoment,
      timeline: DayTimeline,
      now: Long,
    ): RemoteViews {
      val showJamat = snapshot.showJamat && snapshot.hasJamatTimes
      val views = RemoteViews(context.packageName, R.layout.prayer_timeline_widget)

      views.setTextViewText(R.id.state, if (moment.isNow) "Nåværende bønn" else "Neste bønn")
      views.setImageViewResource(R.id.headline_icon, PrayerIcons.drawable(moment.headline.kind))
      views.setTextViewText(R.id.headline_label, moment.headline.displayLabel)
      views.setTextViewText(
        R.id.headline_time,
        PrayerFormat.time(moment.headline.printedAt(showJamat)),
      )

      setCountdown(views, R.id.countdown, moment.next.at, now)

      if (moment.isNow) {
        views.setTextViewText(
          R.id.next_line,
          "${moment.next.displayLabel} ${PrayerFormat.time(moment.next.at)}",
        )
        views.setViewVisibility(R.id.next_line, View.VISIBLE)
      } else {
        views.setViewVisibility(R.id.next_line, View.GONE)
      }

      val widthPx = barWidthPx(context, manager, id)
      val heightPx = TimelineBarRenderer.heightPx(context)
      val bitmap = TimelineBarRenderer.render(
        context = context,
        timeline = timeline,
        now = now,
        markerAt = timeline.mark(moment.next.at)?.at,
        widthPx = widthPx,
        heightPx = heightPx,
      )
      if (bitmap != null) {
        views.setImageViewBitmap(R.id.timeline_bar, bitmap)
      }
      return views
    }

    private fun barWidthPx(context: Context, manager: AppWidgetManager, id: Int): Int {
      val options = manager.getAppWidgetOptions(id)
      val widthDp = options?.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0)
        ?.takeIf { it > 0 } ?: DEFAULT_WIDTH_DP
      val contentDp = (widthDp - CARD_PADDING_DP).coerceAtLeast(120f)
      return TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_DIP,
        contentDp,
        context.resources.displayMetrics,
      ).toInt()
    }

    private fun setCountdown(views: RemoteViews, viewId: Int, target: Long, now: Long) {
      val base = SystemClock.elapsedRealtime() + (target - now)
      views.setChronometer(viewId, base, "%s", true)
      views.setChronometerCountDown(viewId, true)
    }

    private fun openAppIntent(context: Context): PendingIntent {
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse("bonnetid://"))
        .setPackage(context.packageName)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      return PendingIntent.getActivity(context, 2, intent, immutableFlags())
    }

    private fun refreshIntent(context: Context): PendingIntent {
      val intent = Intent(context, PrayerTimelineWidget::class.java).setAction(ACTION_REFRESH)
      return PendingIntent.getBroadcast(context, 3, intent, immutableFlags())
    }

    private fun immutableFlags(): Int {
      return PendingIntent.FLAG_UPDATE_CURRENT or
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
    }

    private fun alarmManager(context: Context): AlarmManager? {
      return context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
    }

    /**
     * The knob has to creep along the bar, so this widget wakes on a fixed cadence as well as on
     * prayer boundaries. Mirrors the 15 minute knob step in the iOS timeline provider.
     */
    private fun scheduleNextUpdate(context: Context) {
      val alarms = alarmManager(context) ?: return
      val now = System.currentTimeMillis()
      val target = nextTick(context, now)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        alarms.setAndAllowWhileIdle(AlarmManager.RTC, target, refreshIntent(context))
      } else {
        alarms.setWindow(AlarmManager.RTC, target, 60 * 1000L, refreshIntent(context))
      }
    }

    private fun nextTick(context: Context, now: Long): Long {
      val step = KNOB_STEP_MINUTES * 60 * 1000L
      val candidates = mutableListOf(now + step)
      val snapshot = PrayerSnapshot.load(context)
      if (snapshot == null) return now + FALLBACK_UPDATE_MS
      snapshot.allPrayers.forEach { prayer ->
        candidates.add(prayer.at)
        prayer.end?.let { candidates.add(it) }
        prayer.jummahEnd?.let { candidates.add(it) }
      }
      candidates.add(PrayerSnapshot.startOfNextDay(now))
      return candidates.filter { it > now + 1000 }.minOrNull() ?: (now + FALLBACK_UPDATE_MS)
    }
  }
}
