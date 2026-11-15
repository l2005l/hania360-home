package com.hania360.app;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.Intent;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.TextView;

/** Asks which town the widget should use for Shabbat times and weather, when it is added (and from its settings). */
public class ConfigActivity extends Activity {
  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    setResult(RESULT_CANCELED);
    final int id = getIntent().getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
    if (id == AppWidgetManager.INVALID_APPWIDGET_ID) { finish(); return; }
    LinearLayout box = new LinearLayout(this); box.setOrientation(LinearLayout.VERTICAL); box.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
    TextView t = new TextView(this); t.setText("🕯️ באיזו עיר לחשב את זמני השבת ומזג האוויר?"); t.setTextSize(19); t.setPadding(40, 60, 40, 30); t.setGravity(Gravity.START);
    ListView list = new ListView(this);
    list.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_list_item_1, Cities.N));
    list.setOnItemClickListener((a, v, pos, l) -> {
      Widget.prefs(this).edit().putInt("c" + id, pos).apply();
      Widget.run(this, new int[] { id }, null);
      setResult(RESULT_OK, new Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id));
      finish();
    });
    box.addView(t); box.addView(list);
    setContentView(box);
  }
}
