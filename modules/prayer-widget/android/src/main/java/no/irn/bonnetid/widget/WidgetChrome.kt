package no.irn.bonnetid.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import android.util.SizeF
import android.widget.RemoteViews

enum class WidgetSize { COMPACT, MEDIUM, TALL }

/**
 * Shared plumbing for the three widget providers: the breakpoint map, the ticking countdown,
 * the launch intent and the boundary alarm. Nothing here resolves a colour, because a colour
 * resolved in a provider is frozen into the RemoteViews and survives a theme switch.
 */
object WidgetChrome {
  private const val FALLBACK_UPDATE_MS = 30 * 60 * 1000L
  private const val ALARM_WINDOW_MS = 60 * 1000L

  fun <T> responsive(
    manager: AppWidgetManager,
    id: Int,
    breakpoints: List<Pair<SizeF, T>>,
    build: (T) -> RemoteViews,
  ): RemoteViews {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      return RemoteViews(breakpoints.associate { (size, kind) -> size to build(kind) })
    }
    return build(measured(manager, id, breakpoints))
  }

  /**
   * Widest the launcher will ever render this widget, so a rasterised graphic is scaled down
   * rather than stretched up.
   */
  fun barWidthDp(manager: AppWidgetManager, id: Int, fallback: Int): Int {
    val options = manager.getAppWidgetOptions(id)
    val min = options?.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0) ?: 0
    val max = options?.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 0) ?: 0
    return maxOf(min, max).takeIf { it > 0 }?.coerceAtMost(600) ?: fallback
  }

  private fun <T> measured(
    manager: AppWidgetManager,
    id: Int,
    breakpoints: List<Pair<SizeF, T>>,
  ): T {
    val options = manager.getAppWidgetOptions(id)
    val width = options?.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0)?.toFloat() ?: 0f
    val height = options?.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0)?.toFloat() ?: 0f
    val fitting = breakpoints.filter { (size, _) -> size.width <= width && size.height <= height }
    return fitting.maxByOrNull { (size, _) -> size.width * size.height }?.second
      ?: breakpoints.first().second
  }

  /** The Android countdown ticks by itself, so it never needs an entry timeline the way iOS does. */
  fun countdown(views: RemoteViews, viewId: Int, target: Long, now: Long, format: String) {
    val base = SystemClock.elapsedRealtime() + (target - now)
    views.setChronometer(viewId, base, format, true)
    views.setChronometerCountDown(viewId, true)
  }

  fun progress(views: RemoteViews, viewId: Int, moment: PrayerMoment, now: Long) {
    val span = moment.windowEnd - moment.windowStart
    val elapsed = (now - moment.windowStart).coerceAtLeast(0L)
    val value = if (span <= 0L) 0 else ((elapsed * 1000L) / span).toInt().coerceIn(0, 1000)
    views.setProgressBar(viewId, 1000, value, false)
  }

  fun openApp(context: Context, requestCode: Int): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("bonnetid://"))
      .setPackage(context.packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return PendingIntent.getActivity(context, requestCode, intent, flags())
  }

  fun refresh(context: Context, target: Class<out AppWidgetProvider>, action: String, requestCode: Int): PendingIntent {
    val intent = Intent(context, target).setAction(action)
    return PendingIntent.getBroadcast(context, requestCode, intent, flags())
  }

  private fun flags(): Int {
    return PendingIntent.FLAG_UPDATE_CURRENT or
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
  }

  fun alarms(context: Context): AlarmManager? {
    return context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
  }

  fun schedule(context: Context, pending: PendingIntent, target: Long) {
    val manager = alarms(context) ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      manager.setAndAllowWhileIdle(AlarmManager.RTC, target, pending)
    } else {
      manager.setWindow(AlarmManager.RTC, target, ALARM_WINDOW_MS, pending)
    }
  }

  /** Next prayer start, window end or midnight, whichever comes first. */
  fun nextBoundary(context: Context, now: Long, extra: List<Long> = emptyList()): Long {
    val snapshot = PrayerSnapshot.load(context) ?: return now + FALLBACK_UPDATE_MS
    val candidates = mutableListOf<Long>()
    candidates.addAll(extra)
    snapshot.allPrayers.forEach { prayer ->
      candidates.add(prayer.at)
      prayer.end?.let { candidates.add(it) }
      prayer.jummahEnd?.let { candidates.add(it) }
    }
    candidates.add(PrayerSnapshot.startOfNextDay(now))
    return candidates.filter { it > now + 1000 }.minOrNull() ?: (now + FALLBACK_UPDATE_MS)
  }

}
