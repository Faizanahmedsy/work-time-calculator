/**
 * RMS calls run inside server actions, so they never appear in the browser's
 * network tab. services/rms.js attaches a `__rmsDebug` block to each response
 * (dev only) and this prints it in the browser console.
 *
 * The bearer token is masked as `Bearer $RMS_TOKEN` unless RMS_LOG_TOKEN=1.
 */
export function logRms(res) {
  const d = res?.__rmsDebug;
  if (!d || typeof window === "undefined") return res;

  const ok = res?.success !== false;
  const colour = ok ? "#3ecf8e" : "#ef5b5b";

  console.groupCollapsed(
    `%c[RMS] ${d.method} ${d.label} → ${d.status} (${d.ms}ms)`,
    `color:${colour};font-weight:600`,
  );
  console.log("%ccurl", "font-weight:600", `\n${d.curl}`);
  if (d.requestBody) console.log("%crequest", "font-weight:600", d.requestBody);
  console.log("%cresponse", "font-weight:600", d.responseBody);
  console.groupEnd();

  return res;
}
