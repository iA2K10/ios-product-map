import Dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@xyflow/react'

const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  center: { width: 220, height: 70 },
  category: { width: 240, height: 65 },
  flow: { width: 220, height: 55 },
  screen: { width: 170, height: 280 },
}

export function layoutNodes(
  nodes: Node[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'LR'
): Node[] {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))

  g.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 150,
    edgesep: 40,
    marginx: 50,
    marginy: 50,
  })

  nodes.forEach((node) => {
    const dims = NODE_DIMENSIONS[node.type || 'flow'] || { width: 200, height: 60 }
    g.setNode(node.id, { width: dims.width, height: dims.height })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  Dagre.layout(g)

  return nodes.map((node) => {
    const pos = g.node(node.id)
    const dims = NODE_DIMENSIONS[node.type || 'flow'] || { width: 200, height: 60 }
    return {
      ...node,
      position: {
        x: pos.x - dims.width / 2,
        y: pos.y - dims.height / 2,
      },
    }
  })
}
