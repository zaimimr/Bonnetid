package no.irn.bonnetid.wear

import androidx.concurrent.futures.ResolvableFuture
import androidx.wear.protolayout.ActionBuilders
import androidx.wear.protolayout.ColorBuilders.argb
import androidx.wear.protolayout.DimensionBuilders.dp
import androidx.wear.protolayout.DimensionBuilders.expand
import androidx.wear.protolayout.DimensionBuilders.sp
import androidx.wear.protolayout.LayoutElementBuilders
import androidx.wear.protolayout.ModifiersBuilders
import androidx.wear.protolayout.ResourceBuilders
import androidx.wear.protolayout.TimelineBuilders
import androidx.wear.tiles.RequestBuilders
import androidx.wear.tiles.TileBuilders
import androidx.wear.tiles.TileService
import com.google.common.util.concurrent.ListenableFuture
import no.irn.bonnetid.widget.PrayerFormat
import no.irn.bonnetid.widget.PrayerSnapshot

class PrayerTileService : TileService() {
  override fun onTileRequest(
    requestParams: RequestBuilders.TileRequest,
  ): ListenableFuture<TileBuilders.Tile> {
    val snapshot = PrayerSnapshot.load(this)
    val now = System.currentTimeMillis()
    val windows = snapshot?.let { WatchSnapshot.windows(it, now, WINDOW_LIMIT) }.orEmpty()
    val timeline = TimelineBuilders.Timeline.Builder()

    if (snapshot == null || windows.isEmpty()) {
      timeline.addTimelineEntry(entry(message("Åpne Bønnetid på telefonen")).build())
    } else {
      windows.forEach { window ->
        timeline.addTimelineEntry(
          entry(layout(snapshot, window)).setValidity(validity(window.start, window.end)).build(),
        )
      }
    }

    val tile = TileBuilders.Tile.Builder()
      .setResourcesVersion(RESOURCES_VERSION)
      .setFreshnessIntervalMillis(FRESHNESS_MS)
      .setTileTimeline(timeline.build())
      .build()
    return ResolvableFuture.create<TileBuilders.Tile>().also { it.set(tile) }
  }

  override fun onTileResourcesRequest(
    requestParams: RequestBuilders.ResourcesRequest,
  ): ListenableFuture<ResourceBuilders.Resources> {
    val resources = ResourceBuilders.Resources.Builder().setVersion(RESOURCES_VERSION).build()
    return ResolvableFuture.create<ResourceBuilders.Resources>().also { it.set(resources) }
  }

  private fun entry(root: LayoutElementBuilders.LayoutElement): TimelineBuilders.TimelineEntry.Builder {
    return TimelineBuilders.TimelineEntry.Builder()
      .setLayout(LayoutElementBuilders.Layout.Builder().setRoot(root).build())
  }

  private fun validity(start: Long, end: Long): TimelineBuilders.TimeInterval {
    return TimelineBuilders.TimeInterval.Builder().setStartMillis(start).setEndMillis(end).build()
  }

  private fun layout(snapshot: PrayerSnapshot, window: PrayerWindow): LayoutElementBuilders.LayoutElement {
    val column = LayoutElementBuilders.Column.Builder()
      .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
      .addContent(text(snapshot.mosqueName ?: snapshot.locationName, 13f, INK_MUTED, false))
      .addContent(spacer(4f))
      .addContent(text(window.next.displayLabel, 18f, BRAND, true))
      .addContent(text(PrayerFormat.time(window.next.printedAt(snapshot.showJamat)), 36f, INK, true))
      .addContent(spacer(6f))

    window.upcoming.forEach { prayer ->
      column.addContent(
        text("${prayer.displayLabel}  ${PrayerFormat.time(prayer.printedAt(snapshot.showJamat))}", 14f, INK_SECONDARY, false),
      )
    }

    return frame(column.build())
  }

  private fun message(value: String): LayoutElementBuilders.LayoutElement {
    return frame(text(value, 15f, INK, false))
  }

  private fun frame(content: LayoutElementBuilders.LayoutElement): LayoutElementBuilders.LayoutElement {
    val open = ActionBuilders.LaunchAction.Builder()
      .setAndroidActivity(
        ActionBuilders.AndroidActivity.Builder()
          .setPackageName(packageName)
          .setClassName(MainActivity::class.java.name)
          .build(),
      )
      .build()
    return LayoutElementBuilders.Box.Builder()
      .setWidth(expand())
      .setHeight(expand())
      .setModifiers(
        ModifiersBuilders.Modifiers.Builder()
          .setClickable(ModifiersBuilders.Clickable.Builder().setId("open").setOnClick(open).build())
          .build(),
      )
      .addContent(content)
      .build()
  }

  private fun spacer(height: Float): LayoutElementBuilders.LayoutElement {
    return LayoutElementBuilders.Spacer.Builder().setHeight(dp(height)).build()
  }

  private fun text(value: String, size: Float, color: Int, bold: Boolean): LayoutElementBuilders.LayoutElement {
    val font = LayoutElementBuilders.FontStyle.Builder()
      .setSize(sp(size))
      .setColor(argb(color))
      .setWeight(
        if (bold) LayoutElementBuilders.FONT_WEIGHT_BOLD else LayoutElementBuilders.FONT_WEIGHT_NORMAL,
      )
      .build()
    return LayoutElementBuilders.Text.Builder()
      .setText(value)
      .setFontStyle(font)
      .setMaxLines(2)
      .setMultilineAlignment(LayoutElementBuilders.TEXT_ALIGN_CENTER)
      .build()
  }

  private companion object {
    const val RESOURCES_VERSION = "1"
    const val WINDOW_LIMIT = 30
    const val FRESHNESS_MS = 6 * 60 * 60 * 1000L
    const val BRAND = 0xFF6FBA9D.toInt()
    const val INK = 0xFFF6F8F7.toInt()
    const val INK_SECONDARY = 0xFFC6D0CB.toInt()
    const val INK_MUTED = 0xFF8C9A93.toInt()
  }
}
