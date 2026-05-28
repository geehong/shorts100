package com.shorts100.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Google GSI WebView 차단 우회: Chrome 브라우저로 위장
        WebSettings settings = this.bridge.getWebView().getSettings();
        String originalUA = settings.getUserAgentString();
        String chromeUA = originalUA.replace("; wv", "").replaceAll("Version/[\\d.]+", "");
        settings.setUserAgentString(chromeUA);
    }
}
