/**
 * Tracker scripts (Meta Pixel, GTM, GA) are downloaded only after the page has
 * loaded and the browser is idle, so they don't compete with the page itself on
 * slow phones. Their queues (fbq, dataLayer, gtag) are still created right away,
 * so events fired before the download — PageView, ViewContent on mount — are
 * queued and sent when the script arrives, not lost.
 */

/** Inline JS that injects `src` as an async script after load + idle. */
export function loadLaterJs(src: string): string {
  return `(function(){var go=function(){var s=document.createElement('script');s.async=true;s.src=${JSON.stringify(
    src,
  )};document.head.appendChild(s)};var idle=function(){if('requestIdleCallback' in window){requestIdleCallback(go,{timeout:4000})}else{setTimeout(go,1500)}};if(document.readyState==='complete'){idle()}else{window.addEventListener('load',idle,{once:true})}})();`;
}

/** Meta Pixel: the standard queue stub, init + PageView, script loaded later. */
export function metaPixelJs(pixelId: string): string {
  return `!function(f){if(f.fbq)return;var n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];${loadLaterJs(
    "https://connect.facebook.net/en_US/fbevents.js",
  )}}(window);fbq('init',${JSON.stringify(pixelId)});fbq('track','PageView');`;
}

/** GA4 gtag queue + config, gtag.js loaded later. */
export function googleAnalyticsJs(gaId: string): string {
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(
    gaId,
  )});${loadLaterJs(`https://www.googletagmanager.com/gtag/js?id=${gaId}`)}`;
}

/** GTM start event, gtm.js loaded later. */
export function googleTagManagerJs(gtmId: string): string {
  return `window.dataLayer=window.dataLayer||[];window.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});${loadLaterJs(
    `https://www.googletagmanager.com/gtm.js?id=${gtmId}`,
  )}`;
}
