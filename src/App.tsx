import { useState, useCallback, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Node,
  Edge,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import data from './data.json'
import { CenterNode } from './nodes/CenterNode'
import { CategoryNode } from './nodes/CategoryNode'
import { FlowNode } from './nodes/FlowNode'
import { ScreenNode } from './nodes/ScreenNode'
import { ScreenPanel } from './components/ScreenPanel'
import { layoutNodes } from './layout'

const nodeTypes = {
  center: CenterNode,
  category: CategoryNode,
  flow: FlowNode,
  screen: ScreenNode,
}

interface ScreenData {
  id: string
  flow: string
  flow_number: number
  screen_number: number
  screen_name: string
  file: string
  filename: string
}

interface FlowData {
  name: string
  flowNumber: number
  screens: ScreenData[]
}

const CATEGORY_COLORS: Record<string, string> = {
  'Onboarding & Auth': '#4ade80',
  'Home & Discovery': '#60a5fa',
  'Search & Filter': '#a78bfa',
  'Product & Listing': '#f472b6',
  'Buying': '#34d399',
  'Selling & Listing': '#fb923c',
  'Likes & Collections': '#f87171',
  'User & Social': '#c084fc',
  'Messaging': '#22d3ee',
  'Reviews & Ratings': '#facc15',
  'Reports': '#f43f5e',
  'Account Settings': '#64748b',
  'Payments & Promotions': '#fbbf24',
  'Other': '#94a3b8',
}

// Use import.meta.env.BASE_URL so paths work on both localhost and GitHub Pages
const BASE = import.meta.env.BASE_URL

function getScreenshotPath(file: string): string {
  const relative = file.replace('screens_extracted/', '')
  return `${BASE}screens/${relative}`
}

function buildInitialGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  nodes.push({
    id: 'center',
    type: 'center',
    position: { x: 0, y: 0 },
    data: { label: 'Mercari iOS App' },
  })

  const categories = Object.entries(data.categories) as [string, FlowData[]][]

  categories.forEach(([catName, flows]) => {
    const catId = `cat-${catName}`
    nodes.push({
      id: catId,
      type: 'category',
      position: { x: 0, y: 0 },
      data: {
        label: catName,
        flowCount: flows.length,
        screenCount: flows.reduce((sum: number, f: FlowData) => sum + f.screens.length, 0),
        color: CATEGORY_COLORS[catName] || '#94a3b8',
      },
    })
    edges.push({
      id: `e-center-${catId}`,
      source: 'center',
      target: catId,
      style: { stroke: CATEGORY_COLORS[catName] || '#94a3b8', strokeWidth: 2, opacity: 0.4 },
    })
  })

  const laid = layoutNodes(nodes, edges, 'LR')
  return { nodes: laid, edges }
}

function ProductMap() {
  const initial = buildInitialGraph()
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)
  const expandedCatsRef = useRef<Set<string>>(new Set())
  const expandedFlowsRef = useRef<Set<string>>(new Set())
  const [selectedScreen, setSelectedScreen] = useState<ScreenData | null>(null)
  const [selectedFlow, setSelectedFlow] = useState<FlowData | null>(null)

  const toggleCategory = useCallback((catName: string) => {
    const categories = data.categories as Record<string, FlowData[]>
    const flows = categories[catName] || []
    const color = CATEGORY_COLORS[catName] || '#94a3b8'

    if (expandedCatsRef.current.has(catName)) {
      expandedCatsRef.current.delete(catName)
      const flowIds = new Set(flows.map(f => `flow-${f.name}`))
      const screenIds = new Set<string>()
      flows.forEach(f => {
        expandedFlowsRef.current.delete(f.name)
        f.screens.forEach(s => screenIds.add(`screen-${s.id}`))
      })

      setNodes(curr => {
        const nextNodes = curr.filter(n => !flowIds.has(n.id) && !screenIds.has(n.id))
        setEdges(currEdges => {
          const nextEdges = currEdges.filter(e =>
            !flowIds.has(e.source) && !flowIds.has(e.target) &&
            !screenIds.has(e.source) && !screenIds.has(e.target)
          )
          const laid = layoutNodes(nextNodes, nextEdges, 'LR')
          setTimeout(() => { setNodes(laid) }, 10)
          return nextEdges
        })
        return nextNodes
      })
    } else {
      expandedCatsRef.current.add(catName)

      setNodes(curr => {
        const existingIds = new Set(curr.map(n => n.id))
        const newNodes: Node[] = []
        const newEdges: Edge[] = []

        flows.forEach((flow) => {
          const flowId = `flow-${flow.name}`
          if (existingIds.has(flowId)) return
          newNodes.push({
            id: flowId,
            type: 'flow',
            position: { x: 0, y: 0 },
            data: {
              label: flow.name,
              screenCount: flow.screens.length,
              flowNumber: flow.flowNumber,
              color,
            },
          })
          newEdges.push({
            id: `e-cat-${catName}-${flowId}`,
            source: `cat-${catName}`,
            target: flowId,
            style: { stroke: color, strokeWidth: 1.5, opacity: 0.3 },
          })
        })

        const allNodes = [...curr, ...newNodes]
        setEdges(currEdges => {
          const existingEdgeIds = new Set(currEdges.map(e => e.id))
          const dedupedEdges = newEdges.filter(e => !existingEdgeIds.has(e.id))
          const allEdges = [...currEdges, ...dedupedEdges]
          const laid = layoutNodes(allNodes, allEdges, 'LR')
          setTimeout(() => { setNodes(laid) }, 10)
          return allEdges
        })
        return allNodes
      })
    }
  }, [setNodes, setEdges])

  const toggleFlow = useCallback((flowName: string) => {
    const flow = (data.flows as Record<string, FlowData>)[flowName]
    if (!flow) return

    if (expandedFlowsRef.current.has(flowName)) {
      expandedFlowsRef.current.delete(flowName)
      const screenIds = new Set(flow.screens.map(s => `screen-${s.id}`))

      setNodes(curr => {
        const nextNodes = curr.filter(n => !screenIds.has(n.id))
        setEdges(currEdges => {
          const nextEdges = currEdges.filter(e => !screenIds.has(e.source) && !screenIds.has(e.target))
          const laid = layoutNodes(nextNodes, nextEdges, 'LR')
          setTimeout(() => { setNodes(laid) }, 10)
          return nextEdges
        })
        return nextNodes
      })
    } else {
      expandedFlowsRef.current.add(flowName)

      setNodes(curr => {
        const existingIds = new Set(curr.map(n => n.id))
        const newNodes: Node[] = []
        const newEdges: Edge[] = []

        flow.screens.forEach((screen, i) => {
          const screenId = `screen-${screen.id}`
          if (existingIds.has(screenId)) return
          newNodes.push({
            id: screenId,
            type: 'screen',
            position: { x: 0, y: 0 },
            data: {
              ...screen,
              screenshotPath: getScreenshotPath(screen.file),
            },
          })

          if (i === 0) {
            newEdges.push({
              id: `e-flow-${flowName}-${screenId}`,
              source: `flow-${flowName}`,
              target: screenId,
              style: { stroke: '#4a5068', strokeWidth: 1.5 },
              animated: true,
            })
          } else {
            const prevId = `screen-${flow.screens[i - 1].id}`
            newEdges.push({
              id: `e-${prevId}-${screenId}`,
              source: prevId,
              target: screenId,
              style: { stroke: '#4a5068', strokeWidth: 1.5 },
              animated: true,
            })
          }
        })

        const allNodes = [...curr, ...newNodes]
        setEdges(currEdges => {
          const existingEdgeIds = new Set(currEdges.map(e => e.id))
          const dedupedEdges = newEdges.filter(e => !existingEdgeIds.has(e.id))
          const allEdges = [...currEdges, ...dedupedEdges]
          const laid = layoutNodes(allNodes, allEdges, 'LR')
          setTimeout(() => { setNodes(laid) }, 10)
          return allEdges
        })
        return allNodes
      })
    }
  }, [setNodes, setEdges])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'category') {
      toggleCategory(node.data.label as string)
    } else if (node.type === 'flow') {
      toggleFlow(node.data.label as string)
    } else if (node.type === 'screen') {
      const flowName = (node.data as ScreenData).flow
      const flowData = (data.flows as Record<string, FlowData>)[flowName]
      setSelectedScreen(node.data as ScreenData)
      setSelectedFlow(flowData || null)
    }
  }, [toggleCategory, toggleFlow])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        minZoom={0.02}
        maxZoom={2}
        defaultEdgeOptions={{ type: 'default' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e2030" />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'center') return '#60a5fa'
            if (node.type === 'category') return (node.data?.color as string) || '#94a3b8'
            if (node.type === 'flow') return (node.data?.color as string) || '#94a3b8'
            return '#4a5068'
          }}
          maskColor="rgba(15, 17, 23, 0.8)"
        />
      </ReactFlow>

      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        padding: '12px 20px',
        background: 'rgba(26, 29, 39, 0.9)',
        borderRadius: 12,
        border: '1px solid #2a2d3a',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#e1e4ea' }}>
          Mercari iOS Product Map
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
          {Object.keys(data.flows).length} flows &middot; 245 screens &middot; Click to expand
        </div>
      </div>

      {/* Screen detail panel */}
      {selectedScreen && selectedFlow && (
        <ScreenPanel
          screen={selectedScreen}
          flow={selectedFlow}
          onClose={() => { setSelectedScreen(null); setSelectedFlow(null) }}
          onNavigate={(screen) => setSelectedScreen(screen)}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <ProductMap />
    </ReactFlowProvider>
  )
}
