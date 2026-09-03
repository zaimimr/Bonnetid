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
import android.view.View
import android.widget.RemoteViews

class PrayerAppWidget : AppWidgetProvider() {
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
      -> updateAll(context)
    }
  }

  override fun onDisabled(context: Context) {
    alarmManager(context)?.cancel(refreshIntent(context))
  }

  companion object {
    const val ACTION_REFRESH = "no.irn.bonnetid.widget.REFRESH"

    private const val MEDIUM_MIN_WIDTH_DP = 250
    private const val NOW_WINDOW_MS = 20 * 60 * 1000L
    private const val ALARM_WINDOW_MS = 60 * 1000L
    private const val FALLBACK_UPDATE_MS = 30 * 60 * 1000L

    private val columnIds = intArrayOf(
      R.id.column_0,
      R.id.column_1,
      R.id.column_2,
      R.id.column_3,
      R.id.column_4,
    )
    private val columnLabelIds = intArrayOf(
      R.id.column_label_0,
      R.id.column_label_1,
      R.id.column_label_2,
      R.id.column_label_3,
      R.id.column_label_4,
    )
    private val columnTimeIds = intArrayOf(
      R.id.column_time_0,
      R.id.column_time_1,
      R.id.column_time_2,
      R.id.column_time_3,
      R.id.column_time_4,
    )
    private val columnJamatIds = intArrayOf(
      R.id.column_jamat_0,
      R.id.column_jamat_1,
      R.id.column_jamat_2,
      R.id.column_jamat_3,
      R.id.column_jamat_4,
    )

    fun updateAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context) ?: return
      val ids = manager.getAppWidgetIds(ComponentName(context, PrayerAppWidget::class.java))
      if (ids.isEmpty()) return
      render(context, manager, ids)
      scheduleNextUpdate(context)
    }

    private fun render(context: Context, manager: AppWidgetManager, ids: IntArray) {
      val snapshot = PrayerSnapshot.load(context)
      val now = System.currentTimeMillis()
      val moment = snapshot?.let { PrayerMoment.resolve(it, now) }

      for (id in ids) {
        val views = if (snapshot == null || moment == null) {
          RemoteViews(context.packageName, R.layout.prayer_widget_empty)
        } else if (isWide(manager, id)) {
          mediumViews(context, snapshot, moment, now)
        } else {
          smallViews(context, moment, now, snapshot.showJamat && snapshot.hasJamatTimes)
        }
        views.setOnClickPendingIntent(R.id.root, openAppIntent(context))
        manager.updateAppWidget(id, views)
      }
    }

    private fun isWide(manager: AppWidgetManager, id: Int): Boolean {
      val options = manager.getAppWidgetOptions(id) ?: return false
      val width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0)
      return width >= MEDIUM_MIN_WIDTH_DP
    }

    private fun smallViews(
      context: Context,
      moment: PrayerMoment,
      now: Long,
      showJamat: Boolean,
    ): RemoteViews {
      val views = RemoteViews(context.packageName, R.layout.prayer_widget_small)
      views.setTextViewText(R.id.state, moment.stateLabel)
      views.setTextViewText(R.id.headline_label, moment.headline.displayLabel)
      views.setTextViewText(
        R.id.headline_time,
        PrayerFormat.time(moment.headline.printedAt(showJamat)),
      )

      if (moment.isNow) {
        views.setTextViewText(R.id.countdown_label, moment.next.label)
        views.setViewVisibility(R.id.countdown_label, View.VISIBLE)
      } else {
        views.setViewVisibility(R.id.countdown_label, View.GONE)
      }
      setCountdown(views, R.id.countdown, moment.next.at, now)
      return views
    }

    private fun mediumViews(
      context: Context,
      snapshot: PrayerSnapshot,
      moment: PrayerMoment,
      now: Long,
    ): RemoteViews {
      val views = RemoteViews(context.packageName, R.layout.prayer_widget_medium)
      views.setTextViewText(R.id.location, moment.locationName)
      views.setTextViewText(R.id.hijri, moment.hijriText)

      val showJamat = snapshot.showJamat && snapshot.hasJamatTimes
      val prayers = snapshot.dailyPrayers(moment.headline.at)
      val currentAt = snapshot.currentPrayer(now)?.at

      for (index in columnIds.indices) {
        val prayer = prayers.getOrNull(index)
        if (prayer == null) {
          views.setViewVisibility(columnIds[index], View.GONE)
          continue
        }

        val isCurrent = prayer.at == currentAt
        views.setViewVisibility(columnIds[index], View.VISIBLE)
        views.setInt(
          columnIds[index],
          "setBackgroundResource",
          if (isCurrent) R.drawable.prayer_widget_plate else 0,
        )
        views.setTextViewText(columnLabelIds[index], prayer.displayLabel)
        views.setTextViewText(
          columnTimeIds[index],
          PrayerFormat.time(prayer.printedAt(showJamat)),
        )

        val jamat = prayer.jamat
        if (showJamat && jamat != null) {
          views.setTextViewText(columnJamatIds[index], PrayerFormat.time(jamat))
          views.setViewVisibility(columnJamatIds[index], View.VISIBLE)
        } else {
          views.setViewVisibility(columnJamatIds[index], View.GONE)
        }
      }

      views.setTextViewText(
        R.id.footer_label,
        if (moment.isNow) "${moment.headline.label} nå · ${moment.next.label}" else moment.next.label,
      )
      setCountdown(views, R.id.countdown, moment.next.at, now)
      views.setViewVisibility(R.id.footer_jamat, if (showJamat) View.VISIBLE else View.GONE)
      return views
    }

    private fun setCountdown(views: RemoteViews, viewId: Int, target: Long, now: Long) {
      val base = SystemClock.elapsedRealtime() + (target - now)
      views.setChronometer(viewId, base, "om %s", true)
      views.setChronometerCountDown(viewId, true)
    }

    private fun openAppIntent(context: Context): PendingIntent {
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse("bonnetid://"))
        .setPackage(context.packageName)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      return PendingIntent.getActivity(context, 0, intent, immutableFlags())
    }

    private fun refreshIntent(context: Context): PendingIntent {
      val intent = Intent(context, PrayerAppWidget::class.java).setAction(ACTION_REFRESH)
      return PendingIntent.getBroadcast(context, 1, intent, immutableFlags())
    }

    private fun immutableFlags(): Int {
      return PendingIntent.FLAG_UPDATE_CURRENT or
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
    }

    private fun alarmManager(context: Context): AlarmManager? {
      return context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
    }

    private fun scheduleNextUpdate(context: Context) {
      val alarms = alarmManager(context) ?: return
      val now = System.currentTimeMillis()
      val target = nextBoundary(context, now)
      alarms.setWindow(
        AlarmManager.RTC,
        target,
        ALARM_WINDOW_MS,
        refreshIntent(context),
      )
    }

    private fun nextBoundary(context: Context, now: Long): Long {
      val snapshot = PrayerSnapshot.load(context) ?: return now + FALLBACK_UPDATE_MS
      val candidates = mutableListOf<Long>()
      snapshot.allPrayers.forEach { prayer ->
        candidates.add(prayer.at)
        candidates.add(prayer.at + NOW_WINDOW_MS)
      }
      val next = candidates.filter { it > now + 1000 }.minOrNull()
      return next ?: (now + FALLBACK_UPDATE_MS)
    }
  }
}
