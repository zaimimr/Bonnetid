package no.irn.bonnetid.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.SizeF
import android.view.View
import android.widget.RemoteViews

enum class TrackerStyle { DOTS, LIST, BUTTON }

enum class TrackerState { PRAYED, SKIPPED, DUE, FUTURE }

open class TrackerProvider(private val style: TrackerStyle) : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    PrayerTrackerWidget.render(context, appWidgetManager, appWidgetIds, style)
    PrayerTrackerWidget.scheduleNextUpdate(context)
  }

  override fun onAppWidgetOptionsChanged(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
    newOptions: Bundle,
  ) {
    PrayerTrackerWidget.render(context, appWidgetManager, intArrayOf(appWidgetId), style)
  }
}

class PrayerTrackerListWidget : TrackerProvider(TrackerStyle.LIST)

class MarkPrayerWidget : TrackerProvider(TrackerStyle.BUTTON)

class PrayerTrackerWidget : TrackerProvider(TrackerStyle.DOTS) {
  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    when (intent.action) {
      ACTION_TOGGLE -> toggle(context, intent)
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
    const val ACTION_REFRESH = "no.irn.bonnetid.widget.REFRESH_TRACKER"
    const val ACTION_TOGGLE = "no.irn.bonnetid.widget.TOGGLE_PRAYER"
    private const val EXTRA_DATE = "date"
    private const val EXTRA_PRAYER = "prayer"
    private const val FUTURE_ALPHA = 0.45f
    private const val SKIPPED_ALPHA = 0.5f

    private val slotIds = intArrayOf(R.id.column_0, R.id.column_1, R.id.column_2, R.id.column_3, R.id.column_4)
    private val labelIds = intArrayOf(R.id.label_0, R.id.label_1, R.id.label_2, R.id.label_3, R.id.label_4)

    private val breakpoints = listOf(
      SizeF(110f, 110f) to WidgetSize.COMPACT,
      SizeF(245f, 110f) to WidgetSize.MEDIUM,
    )

    private val providers = listOf(
      PrayerTrackerWidget::class.java to TrackerStyle.DOTS,
      PrayerTrackerListWidget::class.java to TrackerStyle.LIST,
      MarkPrayerWidget::class.java to TrackerStyle.BUTTON,
    )

    fun updateAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context) ?: return
      var any = false
      for ((provider, style) in providers) {
        val ids = manager.getAppWidgetIds(ComponentName(context, provider))
        if (ids.isEmpty()) continue
        any = true
        render(context, manager, ids, style)
      }
      if (any) scheduleNextUpdate(context)
    }

    private fun toggle(context: Context, intent: Intent) {
      val date = intent.getStringExtra(EXTRA_DATE) ?: return
      val prayer = intent.getStringExtra(EXTRA_PRAYER) ?: return
      val prayed = PrayerLogStore.statusOf(context, date, prayer) == PrayerLogStore.STATUS_PRAYED
      PrayerLogStore.mark(context, date, prayer, if (prayed) null else PrayerLogStore.STATUS_PRAYED)
      updateAll(context)
      PrayerAppWidget.updateAll(context)
      PrayerDayWidget.updateAll(context)
      PrayerTimelineWidget.updateAll(context)
      PrayerStatusNotifier.refreshPosted(context)
    }

    fun render(context: Context, manager: AppWidgetManager, ids: IntArray, style: TrackerStyle) {
      val snapshot = PrayerSnapshot.load(context)
      val now = System.currentTimeMillis()
      val day = snapshot?.dayFor(now)
      val prayers = day?.prayers?.filter { it.isPrayer }?.map { it.resolveJummah(now) } ?: emptyList()

      for (id in ids) {
        val views = if (snapshot == null || day == null || prayers.isEmpty()) {
          RemoteViews(context.packageName, R.layout.prayer_widget_empty)
        } else {
          WidgetChrome.responsive(manager, id, breakpoints) { size ->
            val log = PrayerLogStore.read(context)
            val tracker = Tracker(day.date, prayers, prayers.map { PrayerLogStore.statusOf(log, day.date, it.kind) }, now)
            build(context, layoutFor(style, size), WidgetStrings.of(snapshot), tracker)
          }
        }
        views.setOnClickPendingIntent(R.id.root, WidgetChrome.openApp(context, 40, "tracker"))
        manager.updateAppWidget(id, views)
      }
    }

    private fun layoutFor(style: TrackerStyle, size: WidgetSize): Int = when (style) {
      TrackerStyle.DOTS -> if (size == WidgetSize.COMPACT) R.layout.prayer_tracker_dots else R.layout.prayer_tracker_capsule
      TrackerStyle.LIST -> if (size == WidgetSize.COMPACT) R.layout.prayer_tracker_rows else R.layout.prayer_tracker_split
      TrackerStyle.BUTTON -> if (size == WidgetSize.COMPACT) R.layout.prayer_tracker_button else R.layout.prayer_tracker_icons
    }

    private class Tracker(
      val date: String,
      val prayers: List<PrayerEntry>,
      val statuses: List<String?>,
      val now: Long,
    ) {
      val prayedCount = statuses.count { it == PrayerLogStore.STATUS_PRAYED }
      val focusIndex = prayers.indexOfLast { it.at <= now }.coerceAtLeast(0)
      val focus = prayers[focusIndex]

      fun state(index: Int): TrackerState = when (statuses[index]) {
        PrayerLogStore.STATUS_PRAYED -> TrackerState.PRAYED
        PrayerLogStore.STATUS_SKIPPED -> TrackerState.SKIPPED
        else -> if (prayers[index].at > now) TrackerState.FUTURE else TrackerState.DUE
      }

      fun statusLine(strings: WidgetStrings, index: Int): String = when (state(index)) {
        TrackerState.PRAYED -> strings.prayed
        TrackerState.SKIPPED -> strings.skipped
        else -> strings.notPrayedYet
      }

      fun headline(strings: WidgetStrings): String =
        if (state(focusIndex) == TrackerState.DUE) strings.waiting(focus.displayLabel) else focus.displayLabel
    }

    private fun build(context: Context, layout: Int, strings: WidgetStrings, tracker: Tracker): RemoteViews {
      val views = RemoteViews(context.packageName, layout)
      views.setInt(R.id.root, "setLayoutDirection", strings.layoutDirection)
      when (layout) {
        R.layout.prayer_tracker_dots -> {
          focusHeadline(views, strings, tracker)
          fillSlots(context, views, tracker, R.layout.prayer_tracker_dot)
        }
        R.layout.prayer_tracker_capsule -> {
          views.setTextViewText(R.id.title, tracker.headline(strings))
          views.setTextViewText(R.id.subtitle, strings.prayedCount(tracker.prayedCount, tracker.prayers.size))
          fillSlots(context, views, tracker, R.layout.prayer_tracker_segment, strings)
          for (index in labelIds.indices) {
            val prayer = tracker.prayers.getOrNull(index)
            views.setViewVisibility(labelIds[index], if (prayer == null) View.GONE else View.VISIBLE)
            if (prayer == null) continue
            val due = tracker.state(index) == TrackerState.DUE
            views.setTextViewText(labelIds[index], prayer.displayLabel)
            views.setTextColor(
              labelIds[index],
              context.getColor(if (due) R.color.prayer_widget_brand else R.color.prayer_widget_ink_secondary),
            )
          }
        }
        R.layout.prayer_tracker_icons -> {
          views.setTextViewText(R.id.title, tracker.headline(strings))
          views.setTextViewText(R.id.subtitle, strings.prayedCount(tracker.prayedCount, tracker.prayers.size))
          fillSlots(context, views, tracker, R.layout.prayer_tracker_icon)
        }
        R.layout.prayer_tracker_rows -> {
          views.setTextViewText(R.id.title, tracker.headline(strings))
          views.setTextViewText(R.id.subtitle, strings.prayedCount(tracker.prayedCount, tracker.prayers.size))
          fillSlots(context, views, tracker, R.layout.prayer_tracker_check_row)
        }
        R.layout.prayer_tracker_split -> {
          focusHeadline(views, strings, tracker)
          views.setTextViewText(R.id.subtitle, strings.prayedToday(tracker.prayedCount, tracker.prayers.size))
          fillSlots(context, views, tracker, R.layout.prayer_tracker_row)
        }
        else -> {
          val index = tracker.focusIndex
          val state = tracker.state(index)
          views.setTextViewText(R.id.focus_label, tracker.focus.displayLabel)
          views.setTextViewText(
            R.id.focus_status,
            if (state == TrackerState.DUE || state == TrackerState.FUTURE) strings.markPrayed else tracker.statusLine(strings, index),
          )
          views.setTextViewText(R.id.subtitle, strings.prayedToday(tracker.prayedCount, tracker.prayers.size))
          mark(context, views, state, large = true)
          clickable(context, views, tracker, index, dimsFuture = true)
        }
      }
      return views
    }

    private fun focusHeadline(views: RemoteViews, strings: WidgetStrings, tracker: Tracker) {
      views.setTextViewText(R.id.focus_caption, strings.now)
      views.setTextViewText(R.id.focus_label, tracker.focus.displayLabel)
      views.setTextViewText(R.id.focus_status, tracker.statusLine(strings, tracker.focusIndex))
    }

    private fun fillSlots(
      context: Context,
      views: RemoteViews,
      tracker: Tracker,
      itemLayout: Int,
      strings: WidgetStrings? = null,
    ) {
      for (index in slotIds.indices) {
        views.removeAllViews(slotIds[index])
        val prayer = tracker.prayers.getOrNull(index)
        views.setViewVisibility(slotIds[index], if (prayer == null) View.GONE else View.VISIBLE)
        if (prayer == null) continue
        val state = tracker.state(index)
        val item = RemoteViews(context.packageName, itemLayout)
        when (itemLayout) {
          R.layout.prayer_tracker_segment -> segment(context, item, state, strings)
          R.layout.prayer_tracker_check_row -> {
            item.setTextViewText(R.id.column_label, prayer.displayLabel)
            item.setTextViewText(R.id.column_time, PrayerFormat.time(prayer.at))
            item.setTextColor(
              R.id.column_time,
              context.getColor(if (state == TrackerState.DUE) R.color.prayer_widget_brand else R.color.prayer_widget_ink_muted),
            )
            mark(context, item, state)
          }
          R.layout.prayer_tracker_icon -> iconMark(context, item, prayer, state)
          R.layout.prayer_tracker_row -> {
            item.setTextViewText(R.id.column_label, prayer.displayLabel)
            mark(context, item, state)
          }
          else -> mark(context, item, state)
        }
        clickable(context, item, tracker, index, dimsFuture = itemLayout != R.layout.prayer_tracker_segment)
        views.addView(slotIds[index], item)
      }
    }

    private fun mark(context: Context, views: RemoteViews, state: TrackerState, large: Boolean = false) {
      views.setInt(
        R.id.tracker_mark,
        "setBackgroundResource",
        when (state) {
          TrackerState.PRAYED -> R.drawable.prayer_tracker_done
          TrackerState.DUE -> if (large) R.drawable.prayer_tracker_due_large else R.drawable.prayer_tracker_due
          else -> R.drawable.prayer_tracker_ring
        },
      )
      views.setFloat(R.id.tracker_mark, "setAlpha", if (state == TrackerState.SKIPPED) SKIPPED_ALPHA else 1f)
      val showsCheck = state == TrackerState.PRAYED || (large && state == TrackerState.DUE)
      views.setViewVisibility(R.id.tracker_check, if (showsCheck) View.VISIBLE else View.GONE)
      views.setInt(
        R.id.tracker_check,
        "setColorFilter",
        context.getColor(if (state == TrackerState.PRAYED) R.color.prayer_widget_surface else R.color.prayer_widget_brand),
      )
    }

    private fun iconMark(context: Context, views: RemoteViews, prayer: PrayerEntry, state: TrackerState) {
      views.setTextViewText(R.id.column_label, prayer.displayLabel)
      val due = state == TrackerState.DUE
      views.setTextColor(
        R.id.column_label,
        context.getColor(if (due) R.color.prayer_widget_brand else R.color.prayer_widget_ink),
      )
      views.setInt(
        R.id.tracker_mark,
        "setBackgroundResource",
        when (state) {
          TrackerState.PRAYED -> R.drawable.prayer_tracker_done
          TrackerState.DUE -> R.drawable.prayer_tracker_icon_due
          else -> R.drawable.prayer_tracker_icon_ring
        },
      )
      val prayed = state == TrackerState.PRAYED
      views.setViewVisibility(R.id.tracker_check, if (prayed) View.VISIBLE else View.GONE)
      views.setViewVisibility(R.id.tracker_icon, if (prayed) View.GONE else View.VISIBLE)
      views.setImageViewResource(R.id.tracker_icon, PrayerIcons.drawable(prayer.kind))
      views.setInt(
        R.id.tracker_icon,
        "setColorFilter",
        context.getColor(if (due) R.color.prayer_widget_brand else R.color.prayer_widget_ink_muted),
      )
      views.setFloat(R.id.tracker_icon, "setAlpha", if (state == TrackerState.SKIPPED) SKIPPED_ALPHA else 1f)
    }

    private fun segment(context: Context, views: RemoteViews, state: TrackerState, strings: WidgetStrings?) {
      val background = when (state) {
        TrackerState.PRAYED -> R.color.prayer_widget_brand
        TrackerState.DUE -> R.color.prayer_widget_brand_plate
        else -> R.color.prayer_widget_track
      }
      views.setInt(R.id.tracker_item, "setBackgroundColor", context.getColor(background))
      views.setFloat(R.id.tracker_item, "setAlpha", if (state == TrackerState.SKIPPED) SKIPPED_ALPHA else 1f)
      views.setViewVisibility(R.id.tracker_check, if (state == TrackerState.PRAYED) View.VISIBLE else View.GONE)
      views.setViewVisibility(R.id.segment_tap, if (state == TrackerState.DUE) View.VISIBLE else View.GONE)
      strings?.let { views.setTextViewText(R.id.segment_tap, it.tap) }
    }

    private fun clickable(context: Context, views: RemoteViews, tracker: Tracker, index: Int, dimsFuture: Boolean) {
      val prayer = tracker.prayers[index]
      if (prayer.at > tracker.now) {
        if (dimsFuture) views.setFloat(R.id.tracker_item, "setAlpha", FUTURE_ALPHA)
      } else {
        views.setOnClickPendingIntent(R.id.tracker_item, toggleIntent(context, tracker.date, prayer.kind, index))
      }
    }

    private fun toggleIntent(context: Context, date: String, prayer: String, index: Int): PendingIntent {
      val intent = Intent(context, PrayerTrackerWidget::class.java)
        .setAction(ACTION_TOGGLE)
        .setData(Uri.parse("bonnetid-tracker://$date/$prayer"))
        .putExtra(EXTRA_DATE, date)
        .putExtra(EXTRA_PRAYER, prayer)
      val flags = PendingIntent.FLAG_UPDATE_CURRENT or
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
      return PendingIntent.getBroadcast(context, 41 + index, intent, flags)
    }

    private fun refreshIntent(context: Context) =
      WidgetChrome.refresh(context, PrayerTrackerWidget::class.java, ACTION_REFRESH, 46)

    fun scheduleNextUpdate(context: Context) {
      val now = System.currentTimeMillis()
      WidgetChrome.schedule(context, refreshIntent(context), WidgetChrome.nextBoundary(context, now))
    }
  }
}
