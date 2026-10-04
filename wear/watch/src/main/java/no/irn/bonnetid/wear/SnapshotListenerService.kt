package no.irn.bonnetid.wear

import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.WearableListenerService
import no.irn.bonnetid.widget.WearSnapshot

class SnapshotListenerService : WearableListenerService() {
  override fun onDataChanged(dataEvents: DataEventBuffer) {
    dataEvents
      .filter { it.type == DataEvent.TYPE_CHANGED && it.dataItem.uri.path == WearSnapshot.PATH }
      .mapNotNull { DataMapItem.fromDataItem(it.dataItem).dataMap.getByteArray(WearSnapshot.KEY) }
      .lastOrNull()
      ?.let { WatchSnapshot.store(this, it) }
  }
}
