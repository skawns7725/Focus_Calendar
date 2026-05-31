export async function enableBrowserNotifications(publicKey: string) {
  if (!("Notification" in globalThis) || !("serviceWorker" in navigator)) throw new Error("Browser notifications are not supported");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Browser notification permission was not granted");
  const registration = await navigator.serviceWorker.register("/sw.js");
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeBase64Url(publicKey)
  });
  const serialized = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    p256dh: serialized.keys?.p256dh ?? "",
    auth: serialized.keys?.auth ?? ""
  };
}

export async function currentPushEndpoint() {
  if (!("serviceWorker" in navigator)) return undefined;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  return (await registration?.pushManager.getSubscription())?.endpoint;
}

function decodeBase64Url(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob((value + padding).replace(/-/g, "+").replace(/_/g, "/")), (character) => character.charCodeAt(0));
}
