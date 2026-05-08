export function resolveHref(href: string): string {
  if (!href) return '#'
  if (/^[a-z][a-z\d+\-.]*:/i.test(href)) return href
  return `https://${href}`
}
