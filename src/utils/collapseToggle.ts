export function toggleCollapse(
  expanded: Set<string>,
  name: string,
  accordion: boolean,
): Set<string> {
  if (accordion) {
    if (expanded.has(name)) return new Set()
    return new Set([name])
  }
  const next = new Set(expanded)
  if (next.has(name)) {
    next.delete(name)
  } else {
    next.add(name)
  }
  return next
}
