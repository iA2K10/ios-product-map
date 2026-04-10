import { useState, useCallback, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import data from './data.json'
import { navSections, sharedFlows, crossFlowLinks } from './roadmapData'
import { CenterNode } from './nodes/CenterNode'
import { CategoryNode } from './nodes/CategoryNode'
import { FlowNode } from './nodes/FlowNode'
import { ScreenNode } from './nodes/ScreenNode'
import { TabNode } from './nodes/TabNode'
import { ScreenPanel } from './components/ScreenPanel'
import { ViewToggle } from './components/ViewToggle'
import { layoutNodes } from './layout'

const nodeTypes = {
  center: CenterNode,
  category: CategoryNode,
  flow: FlowNode,
  screen: ScreenNode,
  tab: TabNode,
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

const BASE = import.meta.env.BASE_URL
const EDGE_OPACITY = 0.18

function getScreenshotPath(file: string): string {
  const relative = file.replace('screens_extracted/', '')
  return `${BASE}screens/${relative}`
}

// ─── FEATURE VIEW ───

function buildFeatureGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  nodes.push({ id: 'center', type: 'center', position: { x: 0, y: 0 }, data: { label: 'Mercari iOS App' } })

  const categories = Object.entries(data.categories) as [string, FlowData[]][]
  categories.forEach(([catName, flows]) => {
    const catId = `cat-${catName}`
    const color = CATEGORY_COLORS[catName] || '#94a3b8'
    nodes.push({
      id: catId, type: 'category', position: { x: 0, y: 0 },
      data: { label: catName, flowCount: flows.length, screenCount: flows.reduce((s: number, f: FlowData) => s + f.screens.length, 0), color },
    })
    edges.push({ id: `e-center-${catId}`, source: 'center', sourceHandle: 'right', target: catId, style: { stroke: color, strokeWidth: 2, opacity: EDGE_OPACITY } })
  })

  return { nodes: layoutNodes(nodes, edges, 'LR'), edges }
}

// ─── PRODUCT MAP VIEW ───

function buildProductMapGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const allFlowsData = data.flows as Record<string, FlowData>
  const allSections = [...navSections, ...sharedFlows]

  // Center node
  nodes.push({ id: 'center', type: 'center', position: { x: 0, y: 0 }, data: { label: 'Mercari iOS App' } })

  // Tab nodes for each section
  allSections.forEach((section) => {
    const tabId = `tab-${section.name}`
    let totalScreens = 0
    section.flows.forEach(fn => { const f = allFlowsData[fn]; if (f) totalScreens += f.screens.length })

    nodes.push({
      id: tabId, type: 'tab', position: { x: 0, y: 0 },
      data: { label: section.name, icon: section.icon, groupCount: section.flows.length, screenCount: totalScreens, color: section.color },
    })
    edges.push({ id: `e-center-${tabId}`, source: 'center', sourceHandle: 'right', target: tabId, style: { stroke: section.color, strokeWidth: 2, opacity: EDGE_OPACITY } })
  })

  return { nodes: layoutNodes(nodes, edges, 'LR'), edges }
}

function getFlowColor(flowName: string): string {
  const allSections = [...navSections, ...sharedFlows]
  const section = allSections.find(s => s.flows.includes(flowName))
  return section?.color || '#4a5068'
}

// ─── helpers for adding screens to a flow ───

function buildScreenNodes(flowName: string, color: string, sourceNodeId: string, allFlows: Record<string, FlowData>) {
  const flow = allFlows[flowName]
  if (!flow) return { nodes: [], edges: [] }
  const newNodes: Node[] = []
  const newEdges: Edge[] = []

  flow.screens.forEach((screen, i) => {
    const screenId = `screen-${screen.id}`
    newNodes.push({
      id: screenId, type: 'screen', position: { x: 0, y: 0 },
      data: { ...screen, screenshotPath: getScreenshotPath(screen.file) },
    })
    const source = i === 0 ? sourceNodeId : `screen-${flow.screens[i - 1].id}`
    newEdges.push({
      id: `e-${source}-${screenId}`, source, target: screenId,
      style: { stroke: color, strokeWidth: 1.5, opacity: EDGE_OPACITY }, animated: true,
    })
  })

  return { nodes: newNodes, edges: newEdges }
}

// ─── MAIN COMPONENT ───

function ProductMap() {
  const { setCenter, getZoom, fitView } = useReactFlow()
  const [activeView, setActiveView] = useState<'feature' | 'roadmap'>('feature')
  const initial = buildFeatureGraph()
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)

  // Feature view refs
  const expandedCatsRef = useRef<Set<string>>(new Set())
  const expandedFlowsRef = useRef<Set<string>>(new Set())

  // Product map view refs
  const expandedTabsRef = useRef<Set<string>>(new Set())
  const expandedMapFlowsRef = useRef<Set<string>>(new Set())

  const [selectedScreen, setSelectedScreen] = useState<ScreenData | null>(null)
  const [selectedFlow, setSelectedFlow] = useState<FlowData | null>(null)

  const allFlows = data.flows as Record<string, FlowData>

  // ─── generic layout helper ───
  const relayoutAfterChange = useCallback((nextNodes: Node[], nextEdges: Edge[]) => {
    const laid = layoutNodes(nextNodes, nextEdges, 'LR')
    setTimeout(() => { setNodes(laid) }, 10)
  }, [setNodes])

  // ─── FEATURE VIEW: toggle category ───
  const toggleCategory = useCallback((catName: string) => {
    const categories = data.categories as Record<string, FlowData[]>
    const flows = categories[catName] || []
    const color = CATEGORY_COLORS[catName] || '#94a3b8'

    if (expandedCatsRef.current.has(catName)) {
      expandedCatsRef.current.delete(catName)
      const flowIds = new Set(flows.map(f => `flow-${f.name}`))
      const screenIds = new Set<string>()
      flows.forEach(f => { expandedFlowsRef.current.delete(f.name); f.screens.forEach(s => screenIds.add(`screen-${s.id}`)) })

      setNodes(curr => {
        const next = curr.filter(n => !flowIds.has(n.id) && !screenIds.has(n.id))
        setEdges(ce => { const ne = ce.filter(e => !flowIds.has(e.source) && !flowIds.has(e.target) && !screenIds.has(e.source) && !screenIds.has(e.target)); relayoutAfterChange(next, ne); return ne })
        return next
      })
    } else {
      expandedCatsRef.current.add(catName)
      setNodes(curr => {
        const ids = new Set(curr.map(n => n.id)); const nn: Node[] = []; const ne: Edge[] = []
        flows.forEach(f => { const fid = `flow-${f.name}`; if (ids.has(fid)) return; nn.push({ id: fid, type: 'flow', position: { x: 0, y: 0 }, data: { label: f.name, screenCount: f.screens.length, flowNumber: f.flowNumber, color } }); ne.push({ id: `e-cat-${catName}-${fid}`, source: `cat-${catName}`, target: fid, style: { stroke: color, strokeWidth: 1.5, opacity: EDGE_OPACITY } }) })
        const all = [...curr, ...nn]
        setEdges(ce => { const eids = new Set(ce.map(e => e.id)); const ae = [...ce, ...ne.filter(e => !eids.has(e.id))]; relayoutAfterChange(all, ae); return ae })
        return all
      })
    }
  }, [setNodes, setEdges, relayoutAfterChange])

  // ─── FEATURE VIEW: toggle flow ───
  const toggleFlow = useCallback((flowName: string) => {
    const flow = allFlows[flowName]; if (!flow) return

    if (expandedFlowsRef.current.has(flowName)) {
      expandedFlowsRef.current.delete(flowName)
      const sids = new Set(flow.screens.map(s => `screen-${s.id}`))
      setNodes(curr => { const next = curr.filter(n => !sids.has(n.id)); setEdges(ce => { const ne = ce.filter(e => !sids.has(e.source) && !sids.has(e.target)); relayoutAfterChange(next, ne); return ne }); return next })
    } else {
      expandedFlowsRef.current.add(flowName)
      setNodes(curr => {
        const fn = curr.find(n => n.id === `flow-${flowName}`); const color = (fn?.data?.color as string) || '#4a5068'
        const { nodes: sn, edges: se } = buildScreenNodes(flowName, color, `flow-${flowName}`, allFlows)
        const ids = new Set(curr.map(n => n.id)); const nn = sn.filter(n => !ids.has(n.id)); const all = [...curr, ...nn]
        setEdges(ce => { const eids = new Set(ce.map(e => e.id)); const ae = [...ce, ...se.filter(e => !eids.has(e.id))]; relayoutAfterChange(all, ae); return ae })
        return all
      })
    }
  }, [setNodes, setEdges, allFlows, relayoutAfterChange])

  // ─── PRODUCT MAP: toggle tab (shows flows directly) ───
  const toggleTab = useCallback((tabName: string) => {
    const allSections = [...navSections, ...sharedFlows]
    const section = allSections.find(s => s.name === tabName); if (!section || section.flows.length === 0) return

    if (expandedTabsRef.current.has(tabName)) {
      expandedTabsRef.current.delete(tabName)
      const flowIds = new Set(section.flows.map(fn => `mflow-${fn}`))
      const screenIds = new Set<string>()
      section.flows.forEach(fn => { expandedMapFlowsRef.current.delete(fn); const f = allFlows[fn]; if (f) f.screens.forEach(s => screenIds.add(`screen-${s.id}`)) })

      setNodes(curr => {
        const next = curr.filter(n => !flowIds.has(n.id) && !screenIds.has(n.id))
          .map(n => n.id === `tab-${tabName}` ? { ...n, data: { ...n.data, expanded: false } } : n)
        setEdges(ce => {
          const ne = ce.filter(e => !flowIds.has(e.source) && !flowIds.has(e.target) && !screenIds.has(e.source) && !screenIds.has(e.target))
            .map(e => e.id === `e-center-tab-${tabName}` ? { ...e, style: { ...e.style, opacity: EDGE_OPACITY } } : e)
          relayoutAfterChange(next, ne); return ne
        })
        return next
      })
    } else {
      expandedTabsRef.current.add(tabName)
      setNodes(curr => {
        const ids = new Set(curr.map(n => n.id)); const nn: Node[] = []; const ne: Edge[] = []
        section.flows.forEach(fn => {
          const fid = `mflow-${fn}`; if (ids.has(fid)) return
          const f = allFlows[fn]; if (!f) return
          nn.push({ id: fid, type: 'flow', position: { x: 0, y: 0 }, data: { label: fn, screenCount: f.screens.length, flowNumber: f.flowNumber, color: section.color } })
          ne.push({ id: `e-tab-${tabName}-${fid}`, source: `tab-${tabName}`, target: fid, style: { stroke: section.color, strokeWidth: 1.5, opacity: 0.5 } })
        })
        // Mark tab as expanded and boost center→tab edge
        const updated = curr.map(n => n.id === `tab-${tabName}` ? { ...n, data: { ...n.data, expanded: true } } : n)

        // Add cross-flow links between visible flow nodes
        const allVisible = new Set([...ids, ...nn.map(n => n.id)])
        crossFlowLinks.forEach(link => {
          const fromId = `mflow-${link.from}`; const toId = `mflow-${link.to}`
          if (allVisible.has(fromId) && allVisible.has(toId)) {
            const eid = `e-xlink-${link.from}-${link.to}`
            ne.push({ id: eid, source: fromId, target: toId, style: { stroke: '#6b7280', strokeWidth: 1, opacity: 0.3 }, animated: true, label: link.label })
          }
        })

        const all = [...updated, ...nn]
        setEdges(ce => {
          const boosted = ce.map(e => e.id === `e-center-tab-${tabName}` ? { ...e, style: { ...e.style, opacity: 0.5 } } : e)
          const eids = new Set(boosted.map(e => e.id))
          const ae = [...boosted, ...ne.filter(e => !eids.has(e.id))]
          relayoutAfterChange(all, ae); return ae
        })
        return all
      })
    }
  }, [setNodes, setEdges, allFlows, relayoutAfterChange])

  // ─── PRODUCT MAP: toggle flow (shows screens) ───
  const toggleMapFlow = useCallback((flowName: string) => {
    const flow = allFlows[flowName]; if (!flow) return
    const color = getFlowColor(flowName)

    if (expandedMapFlowsRef.current.has(flowName)) {
      expandedMapFlowsRef.current.delete(flowName)
      const sids = new Set(flow.screens.map(s => `screen-${s.id}`))
      setNodes(curr => { const next = curr.filter(n => !sids.has(n.id)); setEdges(ce => { const ne = ce.filter(e => !sids.has(e.source) && !sids.has(e.target)); relayoutAfterChange(next, ne); return ne }); return next })
    } else {
      expandedMapFlowsRef.current.add(flowName)
      setNodes(curr => {
        const { nodes: sn, edges: se } = buildScreenNodes(flowName, color, `mflow-${flowName}`, allFlows)
        const ids = new Set(curr.map(n => n.id)); const nn = sn.filter(n => !ids.has(n.id)); const all = [...curr, ...nn]
        setEdges(ce => { const eids = new Set(ce.map(e => e.id)); const ae = [...ce, ...se.filter(e => !eids.has(e.id))]; relayoutAfterChange(all, ae); return ae })
        return all
      })
    }
  }, [setNodes, setEdges, allFlows, relayoutAfterChange])

  // ─── center on node ───
  const centerOnNode = useCallback((node: Node) => {
    const zoom = getZoom(); setCenter(node.position.x + 120, node.position.y + 30, { zoom, duration: 300 })
  }, [getZoom, setCenter])

  // ─── expand all ───
  const expandAll = useCallback(() => {
    if (activeView === 'feature') {
      const allNodes: Node[] = []; const allEdges: Edge[] = []
      const categories = data.categories as Record<string, FlowData[]>
      allNodes.push({ id: 'center', type: 'center', position: { x: 0, y: 0 }, data: { label: 'Mercari iOS App' } })
      Object.entries(categories).forEach(([catName, flows]) => {
        const color = CATEGORY_COLORS[catName] || '#94a3b8'; const catId = `cat-${catName}`
        allNodes.push({ id: catId, type: 'category', position: { x: 0, y: 0 }, data: { label: catName, flowCount: flows.length, screenCount: flows.reduce((s: number, f: FlowData) => s + f.screens.length, 0), color } })
        allEdges.push({ id: `e-center-${catId}`, source: 'center', sourceHandle: 'right', target: catId, style: { stroke: color, strokeWidth: 2, opacity: EDGE_OPACITY } })
        flows.forEach(flow => {
          const fid = `flow-${flow.name}`
          allNodes.push({ id: fid, type: 'flow', position: { x: 0, y: 0 }, data: { label: flow.name, screenCount: flow.screens.length, flowNumber: flow.flowNumber, color } })
          allEdges.push({ id: `e-${catId}-${fid}`, source: catId, target: fid, style: { stroke: color, strokeWidth: 1.5, opacity: EDGE_OPACITY } })
          const ff = allFlows[flow.name]; if (!ff) return
          ff.screens.forEach((s, i) => {
            const sid = `screen-${s.id}`; const src = i === 0 ? fid : `screen-${ff.screens[i - 1].id}`
            allNodes.push({ id: sid, type: 'screen', position: { x: 0, y: 0 }, data: { ...s, screenshotPath: getScreenshotPath(s.file) } })
            allEdges.push({ id: `e-${src}-${sid}`, source: src, target: sid, style: { stroke: color, strokeWidth: 1.5, opacity: EDGE_OPACITY }, animated: true })
          })
        })
      })
      Object.keys(categories).forEach(c => expandedCatsRef.current.add(c))
      Object.keys(allFlows).forEach(f => expandedFlowsRef.current.add(f))
      setNodes(() => layoutNodes(allNodes, allEdges, 'LR')); setEdges(() => allEdges)
    } else {
      // Product map expand all
      const allNodes: Node[] = []; const allEdges: Edge[] = []
      const allSections = [...navSections, ...sharedFlows]
      allNodes.push({ id: 'center', type: 'center', position: { x: 0, y: 0 }, data: { label: 'Mercari iOS App' } })
      allSections.forEach(section => {
        const tabId = `tab-${section.name}`; let ts = 0
        section.flows.forEach(fn => { const f = allFlows[fn]; if (f) ts += f.screens.length })
        allNodes.push({ id: tabId, type: 'tab', position: { x: 0, y: 0 }, data: { label: section.name, icon: section.icon, groupCount: section.flows.length, screenCount: ts, color: section.color } })
        allEdges.push({ id: `e-center-${tabId}`, source: 'center', sourceHandle: 'right', target: tabId, style: { stroke: section.color, strokeWidth: 2, opacity: EDGE_OPACITY } })
        expandedTabsRef.current.add(section.name)
        section.flows.forEach(fn => {
          const f = allFlows[fn]; if (!f) return; const fid = `mflow-${fn}`
          allNodes.push({ id: fid, type: 'flow', position: { x: 0, y: 0 }, data: { label: fn, screenCount: f.screens.length, flowNumber: f.flowNumber, color: section.color } })
          allEdges.push({ id: `e-${tabId}-${fid}`, source: tabId, target: fid, style: { stroke: section.color, strokeWidth: 1.5, opacity: EDGE_OPACITY } })
          expandedMapFlowsRef.current.add(fn)
          f.screens.forEach((s, i) => {
            const sid = `screen-${s.id}`; const src = i === 0 ? fid : `screen-${f.screens[i - 1].id}`
            allNodes.push({ id: sid, type: 'screen', position: { x: 0, y: 0 }, data: { ...s, screenshotPath: getScreenshotPath(s.file) } })
            allEdges.push({ id: `e-${src}-${sid}`, source: src, target: sid, style: { stroke: section.color, strokeWidth: 1.5, opacity: EDGE_OPACITY }, animated: true })
          })
        })
      })
      // Cross-flow links
      const nodeIds = new Set(allNodes.map(n => n.id))
      crossFlowLinks.forEach(link => {
        const fid = `mflow-${link.from}`; const tid = `mflow-${link.to}`
        if (nodeIds.has(fid) && nodeIds.has(tid)) {
          const eid = `e-xlink-${link.from}-${link.to}`
          allEdges.push({ id: eid, source: fid, target: tid, style: { stroke: '#6b7280', strokeWidth: 1, opacity: 0.3 }, animated: true })
        }
      })
      setNodes(() => layoutNodes(allNodes, allEdges, 'LR')); setEdges(() => allEdges)
    }
  }, [activeView, setNodes, setEdges, allFlows])

  // ─── collapse all ───
  const collapseAll = useCallback(() => {
    expandedCatsRef.current.clear(); expandedFlowsRef.current.clear()
    expandedTabsRef.current.clear(); expandedMapFlowsRef.current.clear()
    setSelectedScreen(null); setSelectedFlow(null)
    clearHighlight()
    const g = activeView === 'feature' ? buildFeatureGraph() : buildProductMapGraph()
    setNodes(() => g.nodes); setEdges(() => g.edges)
    setTimeout(() => fitView({ padding: 0.3, duration: 400 }), 50)
  }, [activeView, setNodes, setEdges, fitView, clearHighlight])

  // ─── switch view ───
  const switchView = useCallback((view: 'feature' | 'roadmap') => {
    setActiveView(view); setSelectedScreen(null); setSelectedFlow(null); clearHighlight()
    expandedCatsRef.current.clear(); expandedFlowsRef.current.clear()
    expandedTabsRef.current.clear(); expandedMapFlowsRef.current.clear()
    const g = view === 'feature' ? buildFeatureGraph() : buildProductMapGraph()
    setNodes(() => g.nodes); setEdges(() => g.edges)
    setTimeout(() => fitView({ padding: 0.3, duration: 400 }), 50)
  }, [setNodes, setEdges])

  // ─── highlight path to selected screen ───
  const highlightedEdgesRef = useRef<Set<string>>(new Set())

  const highlightPathTo = useCallback((screenNodeId: string) => {
    setEdges(currEdges => {
      // Build reverse map: target → edge
      const targetToEdge = new Map<string, Edge[]>()
      currEdges.forEach(e => {
        const list = targetToEdge.get(e.target) || []
        list.push(e)
        targetToEdge.set(e.target, list)
      })

      // Walk backwards from screen to center
      const pathEdgeIds = new Set<string>()
      const queue = [screenNodeId]
      const visited = new Set<string>()
      while (queue.length > 0) {
        const nodeId = queue.shift()!
        if (visited.has(nodeId)) continue
        visited.add(nodeId)
        const incomingEdges = targetToEdge.get(nodeId) || []
        incomingEdges.forEach(e => {
          pathEdgeIds.add(e.id)
          queue.push(e.source)
        })
      }

      highlightedEdgesRef.current = pathEdgeIds
      return currEdges.map(e => pathEdgeIds.has(e.id)
        ? { ...e, style: { ...e.style, opacity: 0.8, strokeWidth: 2.5 } }
        : e
      )
    })
  }, [setEdges])

  const clearHighlight = useCallback(() => {
    const prev = highlightedEdgesRef.current
    if (prev.size === 0) return
    setEdges(currEdges => currEdges.map(e => prev.has(e.id)
      ? { ...e, style: { ...e.style, opacity: EDGE_OPACITY, strokeWidth: e.style?.strokeWidth === 2.5 ? 2 : 1.5 } }
      : e
    ))
    highlightedEdgesRef.current = new Set()
  }, [setEdges])

  // ─── click handler ───
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (activeView === 'feature') {
      if (node.type === 'category') { clearHighlight(); toggleCategory(node.data.label as string); setTimeout(() => centerOnNode(node), 60) }
      else if (node.type === 'flow') { clearHighlight(); toggleFlow(node.data.label as string); setTimeout(() => centerOnNode(node), 60) }
      else if (node.type === 'screen') {
        const fn = (node.data as ScreenData).flow; setSelectedScreen(node.data as ScreenData); setSelectedFlow(allFlows[fn] || null)
        clearHighlight()
        setTimeout(() => highlightPathTo(node.id), 20)
      }
    } else {
      if (node.type === 'tab') { clearHighlight(); toggleTab(node.data.label as string); setTimeout(() => centerOnNode(node), 60) }
      else if (node.type === 'flow') {
        clearHighlight(); toggleMapFlow(node.data.label as string); setTimeout(() => centerOnNode(node), 60)
      }
      else if (node.type === 'screen') {
        const fn = (node.data as ScreenData).flow; setSelectedScreen(node.data as ScreenData); setSelectedFlow(allFlows[fn] || null)
        clearHighlight()
        setTimeout(() => highlightPathTo(node.id), 20)
      }
    }
  }, [activeView, toggleCategory, toggleFlow, toggleTab, toggleMapFlow, centerOnNode, allFlows, highlightPathTo, clearHighlight])

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
        <Controls>
          <button className="react-flow__controls-button" onClick={expandAll} title="Expand All">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
          <button className="react-flow__controls-button" onClick={collapseAll} title="Collapse All">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
        </Controls>
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'center') return '#60a5fa'
            if (node.type === 'category' || node.type === 'tab') return (node.data?.color as string) || '#94a3b8'
            if (node.type === 'flow' || node.type === 'group') return (node.data?.color as string) || '#94a3b8'
            return '#4a5068'
          }}
          maskColor="rgba(15, 17, 23, 0.8)"
        />
      </ReactFlow>

      {/* Title */}
      <div style={{
        position: 'absolute', top: 16, left: 16,
        padding: '12px 20px',
        background: 'rgba(26, 29, 39, 0.9)', borderRadius: 12, border: '1px solid #2a2d3a', backdropFilter: 'blur(10px)',
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#e1e4ea' }}>Mercari iOS Product Map</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
          {Object.keys(data.flows).length} flows &middot; 245 screens
        </div>
      </div>

      {/* View Toggle */}
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <ViewToggle activeView={activeView} onToggle={switchView} />
      </div>

      {selectedScreen && selectedFlow && (
        <ScreenPanel
          screen={selectedScreen} flow={selectedFlow}
          onClose={() => { setSelectedScreen(null); setSelectedFlow(null); clearHighlight() }}
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
