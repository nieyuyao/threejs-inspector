const isMac = (function() {
  return /macintosh|mac os x/i.test(navigator.userAgent);
})();

const isWindows = (function() {
  return /windows|win32/i.test(navigator.userAgent);
})();

export default function getPlatForm() {
  if (isMac) {
    return "mac";
  }
  if (isWindows) {
    return "windows";
  }
  return "";
}
