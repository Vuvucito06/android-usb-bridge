package com.example.cafe;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;

/**
 * A full-screen WebView showing the website served by the computer the phone
 * is plugged into. `npm run phone` forwards the phone's localhost port to the
 * computer over USB (adb reverse) and starts this activity with the page to
 * open in the "url" extra.
 */
public class MainActivity extends Activity {
    private static final String DEFAULT_URL = "http://localhost:3000/";
    private static final long RETRY_DELAY_MS = 2000;

    private WebView webView;
    private TextView waitingView;
    private boolean loadFailed;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable retry = () -> {
        loadFailed = false;
        webView.reload();
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        webView.setWebViewClient(new CafeWebViewClient());

        // Covers WebView's error page while the computer can't be reached.
        waitingView = new TextView(this);
        waitingView.setText(R.string.waiting);
        waitingView.setGravity(Gravity.CENTER);
        waitingView.setTextSize(18);
        waitingView.setPadding(48, 48, 48, 48);
        waitingView.setTextColor(getColor(R.color.espresso));
        waitingView.setBackgroundColor(getColor(R.color.cream));
        waitingView.setVisibility(View.GONE);

        FrameLayout root = new FrameLayout(this);
        root.addView(webView);
        root.addView(waitingView);
        setContentView(root);

        load(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        load(intent);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(retry);
        webView.destroy();
        super.onDestroy();
    }

    /** Opens the URL passed by `npm run phone`, or the last one used. */
    private void load(Intent intent) {
        SharedPreferences prefs = getPreferences(MODE_PRIVATE);
        String url = intent.getStringExtra("url");
        if (url == null) {
            url = prefs.getString("url", DEFAULT_URL);
        }
        prefs.edit().putString("url", url).apply();

        handler.removeCallbacks(retry);
        loadFailed = false;
        webView.loadUrl(url);
    }

    private class CafeWebViewClient extends WebViewClient {
        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) {
                loadFailed = true;
            }
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            waitingView.setVisibility(loadFailed ? View.VISIBLE : View.GONE);
            // Keep trying until the USB tunnel and the website are back.
            if (loadFailed) {
                handler.postDelayed(retry, RETRY_DELAY_MS);
            }
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            // Pages from the computer stay in the app; other links open in the browser.
            Uri uri = request.getUrl();
            String host = uri.getHost();
            if ("localhost".equals(host) || "127.0.0.1".equals(host)) {
                return false;
            }
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
            return true;
        }
    }
}
