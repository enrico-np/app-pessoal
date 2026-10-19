// Internal path ("/x", but not protocol-relative "//x") or an absolute http(s) URL. Same rule as spec 001.
export function isValidHref(href: string): boolean {
  if (href.startsWith("/")) return !href.startsWith("//") && !/\s/.test(href);
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    const url = new URL(href);
    return url.hostname.length > 0;
  } catch {
    return false;
  }
}

export function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}
