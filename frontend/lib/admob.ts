import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

export const isNative = () => Capacitor.isNativePlatform();

/**
 * AdMob SDK 초기화 함수
 */
export async function initializeAdMob() {
  if (!isNative()) return;
  try {
    await AdMob.initialize();
    // iOS의 경우 앱 추적 권한 승인 팝업 요청
    if (Capacitor.getPlatform() === 'ios') {
      await AdMob.requestTrackingAuthorization();
    }
    console.log('AdMob 초기화 성공');
  } catch (error) {
    console.error('AdMob 초기화 실패:', error);
  }
}

/**
 * 하단 배너 광고 출력 함수
 * @param adUnitId AdMob 콘솔에서 발급받은 실제 광고 단위 ID (기본값은 Android 테스트 광고 ID)
 */
export async function showBannerAd(adUnitId: string = 'ca-pub-3940256099942544/6300978111') {
  if (!isNative()) return;
  try {
    await AdMob.showBanner({
      adId: adUnitId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: adUnitId === 'ca-pub-3940256099942544/6300978111', // 테스트 ID인 경우 true
    });
    console.log('배너 광고 출력 성공');
  } catch (error) {
    console.error('배너 광고 출력 실패:', error);
  }
}

/**
 * 배너 광고 숨기기
 */
export async function hideBannerAd() {
  if (!isNative()) return;
  try {
    await AdMob.hideBanner();
  } catch (error) {
    console.error('배너 광고 숨기기 실패:', error);
  }
}

/**
 * 배너 광고 제거
 */
export async function removeBannerAd() {
  if (!isNative()) return;
  try {
    await AdMob.removeBanner();
  } catch (error) {
    console.error('배너 광고 제거 실패:', error);
  }
}

/**
 * 강제 전면 광고 (빈도 제한 없음) — 다운로드 광고 충전 등 명시적 트리거용
 * 광고 노출 성공 시 true 반환
 */
export async function showInterstitialAdForced(adUnitId: string = 'ca-pub-3940256099942544/1033173712'): Promise<boolean> {
  if (!isNative()) return false;
  try {
    await AdMob.prepareInterstitial({
      adId: adUnitId,
      isTesting: adUnitId === 'ca-pub-3940256099942544/1033173712',
    });
    await AdMob.showInterstitial();
    return true;
  } catch (error) {
    console.error('전면 광고 노출 실패:', error);
    return false;
  }
}

const INTERSTITIAL_INTERVAL = 5;       // 몇 번 방문마다 광고 1회
const INTERSTITIAL_MIN_GAP_MS = 3 * 60 * 1000; // 광고 간 최소 간격 (3분)
const AD_COUNT_KEY = 's100_ad_view_count';
const AD_LAST_TS_KEY = 's100_last_interstitial_ts';

/**
 * 전면 광고 로드 및 노출 함수 (빈도 제한 포함)
 * - 5번 방문마다 1회 노출
 * - 직전 광고로부터 최소 3분 경과 시에만 노출
 */
export async function showInterstitialAd(adUnitId: string = 'ca-pub-3940256099942544/1033173712') {
  if (!isNative()) return;

  // 방문 카운트 증가
  const count = (parseInt(sessionStorage.getItem(AD_COUNT_KEY) ?? '0', 10) || 0) + 1;
  sessionStorage.setItem(AD_COUNT_KEY, String(count));

  // 빈도 체크: N번마다 & 최소 간격
  if (count % INTERSTITIAL_INTERVAL !== 0) return;
  const lastTs = parseInt(localStorage.getItem(AD_LAST_TS_KEY) ?? '0', 10) || 0;
  if (Date.now() - lastTs < INTERSTITIAL_MIN_GAP_MS) return;

  try {
    await AdMob.prepareInterstitial({
      adId: adUnitId,
      isTesting: adUnitId === 'ca-pub-3940256099942544/1033173712',
    });
    await AdMob.showInterstitial();
    localStorage.setItem(AD_LAST_TS_KEY, String(Date.now()));
    console.log('전면 광고 노출 성공');
  } catch (error) {
    console.error('전면 광고 노출 실패:', error);
  }
}
