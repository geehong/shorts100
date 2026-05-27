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
 * 전면 광고 로드 및 노출 함수
 * @param adUnitId AdMob 콘솔에서 발급받은 실제 전면 광고 단위 ID (기본값은 Android 테스트 전면 광고 ID)
 */
export async function showInterstitialAd(adUnitId: string = 'ca-pub-3940256099942544/1033173712') {
  if (!isNative()) return;
  try {
    await AdMob.prepareInterstitial({
      adId: adUnitId,
      isTesting: adUnitId === 'ca-pub-3940256099942544/1033173712',
    });
    await AdMob.showInterstitial();
    console.log('전면 광고 노출 성공');
  } catch (error) {
    console.error('전면 광고 노출 실패:', error);
  }
}
