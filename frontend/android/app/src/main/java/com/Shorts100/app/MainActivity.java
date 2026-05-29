package com.Shorts100.app;

import android.app.DownloadManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.webkit.WebSettings;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(GoogleAuth.class);
        super.onCreate(savedInstanceState);
        
        // User-agent modification to bypass Google OAuth WebView security block
        WebSettings settings = this.bridge.getWebView().getSettings();
        String originalUA = settings.getUserAgentString();
        String chromeUA = originalUA.replace("; wv", "").replaceAll("Version/[\\d.]+", "");
        settings.setUserAgentString(chromeUA);

        // Native DownloadManager integration to download files in the background without opening browser
        this.bridge.getWebView().setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                try {
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                    request.setMimeType(mimetype);
                    
                    String filename = URLUtil.guessFileName(url, contentDisposition, mimetype);
                    request.setTitle(filename);
                    request.setDescription("Downloading video...");
                    
                    request.allowScanningByMediaScanner();
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
                    
                    DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                    dm.enqueue(request);
                    
                    Toast.makeText(getApplicationContext(), "다운로드를 시작합니다...", Toast.LENGTH_SHORT).show();
                } catch (Exception e) {
                    Toast.makeText(getApplicationContext(), "다운로드 실패: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            }
        });
    }
}
