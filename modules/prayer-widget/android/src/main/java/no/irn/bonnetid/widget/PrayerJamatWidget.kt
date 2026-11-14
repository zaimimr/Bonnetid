package no.irn.bonnetid.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.SizeF
import android.view.View
import android.widget.RemoteViews

class PrayerJamatWidget : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
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
    WidgetChrome.alarms(context)?.cancel(refreshIntent(context))
  }

  companion object {
    const val ACTION_REFRESH = "no.irn.bonnetid.widget.REFRESH_JAMAT"

    private val slotIds = intArrayOf(R.id.column_0, R.id.column_1, R.id.column_2, R.id.column_3, R.id.column_4)

    private val breakpoints = listOf(
      SizeF(110f, 110f) to WidgetSize.COMPACT,
      SizeF(245f, 110f) to WidgetSize.MEDIUM,
    )

    fun updateAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context) ?: return
      val ids = manager.getAppWidgetIds(ComponentName(context, PrayerJamatWidget::class.java))
      if (ids.isEmpty()) return
      render(context, manager, ids)
      scheduleNextUpdate(context)
    }

    private fun render(context: Context, manager: AppWidgetManager, ids: IntArray) {
      val snapshot = PrayerSnapshot.load(context)
      val now = System.currentTimeMillis()
      val strings = WidgetStrings.of(snapshot)
      val prayers = snapshot?.dayFor(now)?.prayers?.filter { it.isPrayer }?.map { it.resolveJummah(now) } ?: emptyList()
      val next = prayers.firstOrNull { (it.jamat ?: 0L) > now } ?: prayers.firstOrNull { it.jamat != null }

      for (id in ids) {
        val views = when {
          snapshot == null || prayers.isEmpty() ->
            RemoteViews(context.packageName, R.layout.prayer_widget_empty)
              .also { it.setOnClickPendingIntent(R.id.root, WidgetChrome.openApp(context, 30)) }
          snapshot.mosqueName == null ->
            message(context, strings, strings.chooseMosque, strings.chooseMosqueBody)
              .also { it.setOnClickPendingIntent(R.id.root, WidgetChrome.openApp(context, 31, "mosque-picker")) }
          next == null ->
            message(context, strings, snapshot.mosqueName, strings.noJamatToday)
              .also { it.setOnClickPendingIntent(R.id.root, WidgetChrome.openApp(context, 30)) }
          else -> WidgetChrome.responsive(manager, id, breakpoints) { size ->
            build(context, size, strings, snapshot.mosqueName, prayers, next)
              .also { it.setOnClickPendingIntent(R.id.root, WidgetChrome.openApp(context, 30)) }
          }
        }
        manager.updateAppWidget(id, views)
      }
    }

    private fun message(context: Context, strings: WidgetStrings, title: String, body: String): RemoteViews {
      val views = RemoteViews(context.packageName, R.layout.prayer_widget_empty)
      views.setInt(R.id.root, "setLayoutDirection", strings.layoutDirection)
      views.setTextViewText(R.id.title, title)
      views.setTextViewText(R.id.subtitle, body)
      return views
    }

    private fun build(
      context: Context,
      size: WidgetSize,
      strings: WidgetStrings,
      mosqueName: String,
      prayers: List<PrayerEntry>,
      next: PrayerEntry,
    ): RemoteViews {
      if (size == WidgetSize.COMPACT) {
        val views = RemoteViews(context.packageName, R.layout.prayer_jamat_compact)
        views.setInt(R.id.root, "setLayoutDirection", strings.layoutDirection)
        views.setTextViewText(R.id.title, strings.jamatTitle)
        views.setImageViewResource(R.id.headline_icon, PrayerIcons.drawable(next.kind))
        views.setTextViewText(R.id.headline_label, next.displayLabel)
        views.setTextViewText(R.id.headline_time, next.jamat?.let(PrayerFormat::time) ?: "-")
        views.setTextViewText(R.id.headline_adhan, "${strings.adhan} ${PrayerFormat.time(next.at)}")
        views.setTextViewText(R.id.subtitle, mosqueName)
        return views
      }
      val views = RemoteViews(context.packageName, R.layout.prayer_jamat_medium)
      views.setInt(R.id.root, "setLayoutDirection", strings.layoutDirection)
      views.setTextViewText(R.id.title, strings.jamatTitle)
      views.setTextViewText(R.id.subtitle, mosqueName)
      for (index in slotIds.indices) {
        views.removeAllViews(slotIds[index])
        val prayer = prayers.getOrNull(index)
        views.setViewVisibility(slotIds[index], if (prayer == null) View.GONE else View.VISIBLE)
        if (prayer == null) continue
        val layout = if (prayer.at == next.at) R.layout.prayer_jamat_column_current else R.layout.prayer_jamat_column
        val column = RemoteViews(context.packageName, layout)
        column.setTextViewText(R.id.column_label, prayer.displayLabel)
        column.setTextViewText(R.id.column_jamat, prayer.jamat?.let(PrayerFormat::time) ?: "-")
        column.setTextViewText(R.id.column_time, PrayerFormat.time(prayer.at))
        views.addView(slotIds[index], column)
      }
      return views
    }

    private fun refreshIntent(context: Context) =
      WidgetChrome.refresh(context, PrayerJamatWidget::class.java, ACTION_REFRESH, 32)

    private fun scheduleNextUpdate(context: Context) {
      val now = System.currentTimeMillis()
      val jamats = PrayerSnapshot.load(context)?.allPrayers?.mapNotNull { it.jamat } ?: emptyList()
      WidgetChrome.schedule(context, refreshIntent(context), WidgetChrome.nextBoundary(context, now, jamats))
    }
  }
}
