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
import { roadmapTabs } from './roadmapData'
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
  group: FlowNode,
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

// ─── ROADMAP VIEW ───

function buildRoadmapGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const allFlows = data.flows as Record<string, FlowData>

  nodes.push({ id: 'center', type: 'center', position: { x: 0, y: 0 }, data: { label: 'Mercari iOS App' } })

  roadmapTabs.forEach((tab) => {
    const tabId = `tab-${tab.name}`
    let totalScreens = 0
    tab.groups.forEach(g => g.flows.forEach(fn => {
      const f = allFlows[fn]
      if (f) totalScreens += f.screens.length
    }))

    nodes.push({
      id: tabId, type: 'tab', position: { x: 0, y: 0 },
      data: { label: tab.name, icon: tab.icon, groupCount: tab.groups.length, screenCount: totalScreens, color: tab.color },
    })
    edges.push({ id: `e-center-${tabId}`, source: 'center', sourceHandle: 'right', target: tabId, style: { stroke: tab.color, strokeWidth: 2, opacity: EDGE_OPACITY } })
  })

  return { nodes: layoutNodes(nodes, edges, 'LR'), edges }
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
  const { setCenter, getZoom } = useReactFlow()
  const [activeView, setActiveView] = useState<'feature' | 'roadmap'>('feature')
  const initial = buildFeatureGraph()
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)

  // Feature view refs
  const expandedCatsRef = useRef<Set<string>>(new Set())
  const expandedFlowsRef = useRef<Set<string>>(new Set())

  // Roadmap view refs
  const expandedTabsRef = useRef<Set<string>>(new Set())
  const expandedGroupsRef = useRef<Set<string>>(new Set())
  const expandedRoadmapFlowsRef = useRef<Set<string>>(new Set())

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

  // ─── ROADMAP VIEW: toggle tab ───
  const toggleTab = useCallback((tabName: string) => {
    const tab = roadmapTabs.find(t => t.name === tabName); if (!tab || tab.groups.length === 0) return

    if (expandedTabsRef.current.has(tabName)) {
      expandedTabsRef.current.delete(tabName)
      const groupIds = new Set(tab.groups.map(g => `group-${tabName}-${g.name}`))
      const flowIds = new Set<string>(); const screenIds = new Set<string>()
      tab.groups.forEach(g => g.flows.forEach(fn => {
        flowIds.add(`rflow-${fn}`); expandedGroupsRef.current.delete(`${tabName}-${g.name}`); expandedRoadmapFlowsRef.current.delete(fn)
        const f = allFlows[fn]; if (f) f.screens.forEach(s => screenIds.add(`screen-${s.id}`))
      }))

      setNodes(curr => {
        const next = curr.filter(n => !groupIds.has(n.id) && !flowIds.has(n.id) && !screenIds.has(n.id))
        setEdges(ce => { const ne = ce.filter(e => !groupIds.has(e.source) && !groupIds.has(e.target) && !flowIds.has(e.source) && !flowIds.has(e.target) && !screenIds.has(e.source) && !screenIds.has(e.target)); relayoutAfterChange(next, ne); return ne })
        return next
      })
    } else {
      expandedTabsRef.current.add(tabName)
      setNodes(curr => {
        const ids = new Set(curr.map(n => n.id)); const nn: Node[] = []; const ne: Edge[] = []
        tab.groups.forEach(g => {
          const gid = `group-${tabName}-${g.name}`
          if (ids.has(gid)) return
          let sc = 0; g.flows.forEach(fn => { const f = allFlows[fn]; if (f) sc += f.screens.length })
          nn.push({ id: gid, type: 'group', position: { x: 0, y: 0 }, data: { label: g.name, screenCount: sc, color: tab.color, subtitle: `${g.flows.length} flow${g.flows.length !== 1 ? 's' : ''} \u00b7 ${sc} screens` } })
          ne.push({ id: `e-tab-${tabName}-${gid}`, source: `tab-${tabName}`, target: gid, style: { stroke: tab.color, strokeWidth: 1.5, opacity: EDGE_OPACITY } })
        })
        const all = [...curr, ...nn]
        setEdges(ce => { const eids = new Set(ce.map(e => e.id)); const ae = [...ce, ...ne.filter(e => !eids.has(e.id))]; relayoutAfterChange(all, ae); return ae })
        return all
      })
    }
  }, [setNodes, setEdges, allFlows, relayoutAfterChange])

  // ─── ROADMAP VIEW: toggle group ───
  const toggleGroup = useCallback((tabName: string, groupName: string) => {
    const tab = roadmapTabs.find(t => t.name === tabName); if (!tab) return
    const group = tab.groups.find(g => g.name === groupName); if (!group) return
    const key = `${tabName}-${groupName}`

    if (expandedGroupsRef.current.has(key)) {
      expandedGroupsRef.current.delete(key)
      const flowIds = new Set(group.flows.map(fn => `rflow-${fn}`))
      const screenIds = new Set<string>()
      group.flows.forEach(fn => { expandedRoadmapFlowsRef.current.delete(fn); const f = allFlows[fn]; if (f) f.screens.forEach(s => screenIds.add(`screen-${s.id}`)) })

      setNodes(curr => {
        const next = curr.filter(n => !flowIds.has(n.id) && !screenIds.has(n.id))
        setEdges(ce => { const ne = ce.filter(e => !flowIds.has(e.source) && !flowIds.has(e.target) && !screenIds.has(e.source) && !screenIds.has(e.target)); relayoutAfterChange(next, ne); return ne })
        return next
      })
    } else {
      expandedGroupsRef.current.add(key)
      setNodes(curr => {
        const ids = new Set(curr.map(n => n.id)); const nn: Node[] = []; const ne: Edge[] = []
        const gid = `group-${tabName}-${groupName}`
        group.flows.forEach(fn => {
          const fid = `rflow-${fn}`; if (ids.has(fid)) return
          const f = allFlows[fn]; if (!f) return
          nn.push({ id: fid, type: 'flow', position: { x: 0, y: 0 }, data: { label: fn, screenCount: f.screens.length, flowNumber: f.flowNumber, color: tab.color } })
          ne.push({ id: `e-${gid}-${fid}`, source: gid, target: fid, style: { stroke: tab.color, strokeWidth: 1.5, opacity: EDGE_OPACITY } })
        })
        const all = [...curr, ...nn]
        setEdges(ce => { const eids = new Set(ce.map(e => e.id)); const ae = [...ce, ...ne.filter(e => !eids.has(e.id))]; relayoutAfterChange(all, ae); return ae })
        return all
      })
    }
  }, [setNodes, setEdges, allFlows, relayoutAfterChange])

  // ─── ROADMAP VIEW: toggle roadmap flow ───
  const toggleRoadmapFlow = useCallback((flowName: string) => {
    const flow = allFlows[flowName]; if (!flow) return
    const tab = roadmapTabs.find(t => t.groups.some(g => g.flows.includes(flowName)))
    const color = tab?.color || '#4a5068'

    if (expandedRoadmapFlowsRef.current.has(flowName)) {
      expandedRoadmapFlowsRef.current.delete(flowName)
      const sids = new Set(flow.screens.map(s => `screen-${s.id}`))
      setNodes(curr => { const next = curr.filter(n => !sids.has(n.id)); setEdges(ce => { const ne = ce.filter(e => !sids.has(e.source) && !sids.has(e.target)); relayoutAfterChange(next, ne); return ne }); return next })
    } else {
      expandedRoadmapFlowsRef.current.add(flowName)
      setNodes(curr => {
        const { nodes: sn, edges: se } = buildScreenNodes(flowName, color, `rflow-${flowName}`, allFlows)
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
      // Roadmap expand all
      const allNodes: Node[] = []; const allEdges: Edge[] = []
      allNodes.push({ id: 'center', type: 'center', position: { x: 0, y: 0 }, data: { label: 'Mercari iOS App' } })
      roadmapTabs.forEach(tab => {
        const tabId = `tab-${tab.name}`; let ts = 0
        tab.groups.forEach(g => g.flows.forEach(fn => { const f = allFlows[fn]; if (f) ts += f.screens.length }))
        allNodes.push({ id: tabId, type: 'tab', position: { x: 0, y: 0 }, data: { label: tab.name, icon: tab.icon, groupCount: tab.groups.length, screenCount: ts, color: tab.color } })
        allEdges.push({ id: `e-center-${tabId}`, source: 'center', sourceHandle: 'right', target: tabId, style: { stroke: tab.color, strokeWidth: 2, opacity: EDGE_OPACITY } })
        expandedTabsRef.current.add(tab.name)
        tab.groups.forEach(g => {
          const gid = `group-${tab.name}-${g.name}`; let sc = 0; g.flows.forEach(fn => { const f = allFlows[fn]; if (f) sc += f.screens.length })
          allNodes.push({ id: gid, type: 'group', position: { x: 0, y: 0 }, data: { label: g.name, screenCount: sc, color: tab.color, subtitle: `${g.flows.length} flow${g.flows.length !== 1 ? 's' : ''} \u00b7 ${sc} screens` } })
          allEdges.push({ id: `e-${tabId}-${gid}`, source: tabId, target: gid, style: { stroke: tab.color, strokeWidth: 1.5, opacity: EDGE_OPACITY } })
          expandedGroupsRef.current.add(`${tab.name}-${g.name}`)
          g.flows.forEach(fn => {
            const f = allFlows[fn]; if (!f) return; const fid = `rflow-${fn}`
            allNodes.push({ id: fid, type: 'flow', position: { x: 0, y: 0 }, data: { label: fn, screenCount: f.screens.length, flowNumber: f.flowNumber, color: tab.color } })
            allEdges.push({ id: `e-${gid}-${fid}`, source: gid, target: fid, style: { stroke: tab.color, strokeWidth: 1.5, opacity: EDGE_OPACITY } })
            expandedRoadmapFlowsRef.current.add(fn)
            f.screens.forEach((s, i) => {
              const sid = `screen-${s.id}`; const src = i === 0 ? fid : `screen-${f.screens[i - 1].id}`
              allNodes.push({ id: sid, type: 'screen', position: { x: 0, y: 0 }, data: { ...s, screenshotPath: getScreenshotPath(s.file) } })
              allEdges.push({ id: `e-${src}-${sid}`, source: src, target: sid, style: { stroke: tab.color, strokeWidth: 1.5, opacity: EDGE_OPACITY }, animated: true })
            })
          })
        })
      })
      setNodes(() => layoutNodes(allNodes, allEdges, 'LR')); setEdges(() => allEdges)
    }
  }, [activeView, setNodes, setEdges, allFlows])

  // ─── collapse all ───
  const collapseAll = useCallback(() => {
    expandedCatsRef.current.clear(); expandedFlowsRef.current.clear()
    expandedTabsRef.current.clear(); expandedGroupsRef.current.clear(); expandedRoadmapFlowsRef.current.clear()
    setSelectedScreen(null); setSelectedFlow(null)
    const g = activeView === 'feature' ? buildFeatureGraph() : buildRoadmapGraph()
    setNodes(() => g.nodes); setEdges(() => g.edges)
  }, [activeView, setNodes, setEdges])

  // ─── switch view ───
  const switchView = useCallback((view: 'feature' | 'roadmap') => {
    setActiveView(view); setSelectedScreen(null); setSelectedFlow(null)
    expandedCatsRef.current.clear(); expandedFlowsRef.current.clear()
    expandedTabsRef.current.clear(); expandedGroupsRef.current.clear(); expandedRoadmapFlowsRef.current.clear()
    const g = view === 'feature' ? buildFeatureGraph() : buildRoadmapGraph()
    setNodes(() => g.nodes); setEdges(() => g.edges)
  }, [setNodes, setEdges])

  // ─── click handler ───
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (activeView === 'feature') {
      if (node.type === 'category') { toggleCategory(node.data.label as string); setTimeout(() => centerOnNode(node), 60) }
      else if (node.type === 'flow') { toggleFlow(node.data.label as string); setTimeout(() => centerOnNode(node), 60) }
      else if (node.type === 'screen') {
        const fn = (node.data as ScreenData).flow; setSelectedScreen(node.data as ScreenData); setSelectedFlow(allFlows[fn] || null)
      }
    } else {
      if (node.type === 'tab') { toggleTab(node.data.label as string); setTimeout(() => centerOnNode(node), 60) }
      else if (node.type === 'group') {
        // extract tab and group name from node id: "group-TabName-GroupName"
        const parts = node.id.replace('group-', '').split('-')
        const tabName = parts[0]
        const groupName = node.data.label as string
        toggleGroup(tabName, groupName); setTimeout(() => centerOnNode(node), 60)
      }
      else if (node.type === 'flow') {
        // rflow- prefixed nodes in roadmap view
        const flowName = node.data.label as string
        toggleRoadmapFlow(flowName); setTimeout(() => centerOnNode(node), 60)
      }
      else if (node.type === 'screen') {
        const fn = (node.data as ScreenData).flow; setSelectedScreen(node.data as ScreenData); setSelectedFlow(allFlows[fn] || null)
      }
    }
  }, [activeView, toggleCategory, toggleFlow, toggleTab, toggleGroup, toggleRoadmapFlow, centerOnNode, allFlows])

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

      {/* Header */}
      <div style={{
        position: 'absolute', top: 16, left: 16,
        padding: '12px 20px',
        background: 'rgba(26, 29, 39, 0.9)', borderRadius: 12, border: '1px solid #2a2d3a', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#e1e4ea' }}>Mercari iOS Product Map</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            {Object.keys(data.flows).length} flows &middot; 245 screens
          </div>
        </div>
        <ViewToggle activeView={activeView} onToggle={switchView} />
      </div>

      {selectedScreen && selectedFlow && (
        <ScreenPanel
          screen={selectedScreen} flow={selectedFlow}
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
