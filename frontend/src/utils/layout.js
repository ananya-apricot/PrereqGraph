// Pure layout for the graph view: one column per level (levels come from the backend),
// nodes inside a column ordered by the average row of their prerequisites to reduce crossings.
const COL = 270
const ROW = 84

export function layoutNodes(nodes, edges) {
  const columns = {}
  for (const n of nodes) (columns[n.level] ||= []).push(n)
  const incoming = {}
  for (const e of edges) (incoming[e.target] ||= []).push(e.source)

  const row = {}
  const levels = Object.keys(columns).map(Number).sort((a, b) => a - b)
  for (const lvl of levels) {
    const col = columns[lvl]
    const score = (n) => {
      const ps = (incoming[n.id] || []).filter((p) => row[p] !== undefined)
      return ps.length ? ps.reduce((s, p) => s + row[p], 0) / ps.length : Infinity
    }
    col.sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name))
    col.forEach((n, i) => { row[n.id] = i })
  }
  const tallest = Math.max(...levels.map((l) => columns[l].length), 1)
  const pos = {}
  for (const lvl of levels) {
    const col = columns[lvl]
    const offset = ((tallest - col.length) * ROW) / 2
    col.forEach((n, i) => { pos[n.id] = { x: lvl * COL, y: offset + i * ROW } })
  }
  return pos
}
