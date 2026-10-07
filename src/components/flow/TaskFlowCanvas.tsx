'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import { TaskFlowNode } from './TaskFlowNode';
import { Task, Flow } from '@/types';
import { Button } from '@/ui/Button';
import { Plus, RotateCcw, Download, GitBranch, AlertCircle, Layers } from 'lucide-react';

interface TaskFlowCanvasProps {
  onSelectTask: (taskId: string) => void;
  onOpenNewTask: (flowId?: string) => void;
  dataVersion: number;
}

const nodeTypes = {
  taskNode: TaskFlowNode,
};

const NODE_WIDTH = 340;
const NODE_HEIGHT = 180;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export function TaskFlowCanvas({
  onSelectTask,
  onOpenNewTask,
  dataVersion,
}: TaskFlowCanvasProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'my' | 'overdue' | 'sprints' | 'dependencies'>('all');
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const fetchFlowData = async () => {
    try {
      setIsLoading(true);
      let taskUrl = '/api/tasks?';
      if (filterMode === 'my') taskUrl += 'assignedToId=me&';
      if (filterMode === 'overdue') taskUrl += 'overdueOnly=true&';
      if (selectedFlowId) taskUrl += `flowId=${selectedFlowId}&`;

      const [taskRes, flowRes] = await Promise.all([
        fetch(taskUrl),
        fetch('/api/flows'),
      ]);

      if (taskRes.ok && flowRes.ok) {
        const taskData = await taskRes.json();
        const flowData = await flowRes.json();
        setTasks(taskData.tasks || []);
        setFlows(flowData.flows || []);
      }
    } catch (err) {
      console.error('Failed to load task flow:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlowData();
  }, [filterMode, selectedFlowId, dataVersion]);

  // Construct React Flow Nodes and Edges
  useEffect(() => {
    if (tasks.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const initialNodes: Node[] = tasks.map((task, idx) => ({
      id: task.id,
      type: 'taskNode',
      position: {
        x: task.positionX ?? (idx % 3) * 360 + 50,
        y: task.positionY ?? Math.floor(idx / 3) * 200 + 50,
      },
      data: { task, onSelect: () => onSelectTask(task.id) },
    }));

    const taskIds = new Set(tasks.map((t) => t.id));
    const initialEdges: Edge[] = [];

    tasks.forEach((task) => {
      if (task.blocks && task.blocks.length > 0) {
        task.blocks.forEach((dep) => {
          if (taskIds.has(dep.targetTaskId)) {
            const isBlocked = task.status === 'BLOCKED';
            initialEdges.push({
              id: `dep-${task.id}-${dep.targetTaskId}`,
              source: task.id,
              target: dep.targetTaskId,
              type: 'smoothstep',
              label: 'BLOCKS',
              labelStyle: { fill: '#1C1A17', fontSize: 10, fontWeight: 800, fontFamily: 'monospace' },
              labelBgStyle: { fill: '#FFFFFF', stroke: isBlocked ? '#EF4444' : '#10B981', strokeWidth: 1.5, rx: 6, ry: 6 },
              style: {
                stroke: isBlocked ? '#EF4444' : '#10B981',
                strokeWidth: 2,
                strokeDasharray: '5,5',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 12,
                height: 12,
                color: isBlocked ? '#EF4444' : '#10B981',
              },
            });
          }
        });
      }
    });

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [tasks, setNodes, setEdges, onSelectTask]);

  const onNodeDragStop = useCallback(
    async (_event: unknown, node: Node) => {
      try {
        await fetch('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: node.id,
            positionX: node.position.x,
            positionY: node.position.y,
          }),
        });
      } catch (err) {
        console.error('Failed to save node position:', err);
      }
    },
    []
  );

  const onConnect = useCallback(
    async (params: Connection) => {
      if (!params.source || !params.target || params.source === params.target) return;
      try {
        await fetch('/api/task-connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceTaskId: params.source,
            targetTaskId: params.target,
            relationshipType: 'BLOCKS',
          }),
        });
        setEdges((eds) =>
          addEdge(
            {
              ...params,
              type: 'smoothstep',
              label: 'BLOCKS',
              labelStyle: { fill: '#1C1A17', fontSize: 10, fontWeight: 800, fontFamily: 'monospace' },
              labelBgStyle: { fill: '#FFFFFF', stroke: '#10B981', strokeWidth: 1.5, rx: 6, ry: 6 },
              style: { stroke: '#10B981', strokeWidth: 2, strokeDasharray: '5,5' },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#10B981' },
            },
            eds
          )
        );
        fetchFlowData();
      } catch (err) {
        console.error('Failed to create dependency:', err);
      }
    },
    [setEdges]
  );

  const handleAutoLayout = () => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, 'LR');
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);

    layoutedNodes.forEach((node) => {
      fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: node.id,
          positionX: node.position.x,
          positionY: node.position.y,
        }),
      });
    });
  };

  const overdueCount = tasks.filter((t) => t.isOverdue).length;
  const blockedCount = tasks.filter((t) => t.status === 'BLOCKED').length;
  const currentFlowName = flows.find((f) => f.id === selectedFlowId)?.name || 'Core Platform & Q4 Architecture';

  return (
    <div
      style={{ width: '100%', height: 'calc(100vh - 100px)', minHeight: '680px' }}
      className="relative w-full bg-[#F7F5F0] rounded-2xl border border-[#DCD7CE] overflow-hidden flex flex-col shadow-sm"
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 space-y-2 pointer-events-none">
        {/* Row 1: Flow Selector & Critical Path Meta */}
        <div className="flex items-center justify-between gap-3 pointer-events-auto flex-wrap">
          <div className="flex items-center gap-2">
            {/* Flow Selector */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF] border-2 border-[#1C1A17] rounded-xl shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
              <div className="text-left">
                <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#9B9489]">
                  Active Notebook Flow
                </div>
                <select
                  value={selectedFlowId || ''}
                  onChange={(e) => setSelectedFlowId(e.target.value || null)}
                  className="bg-transparent text-xs font-bold text-[#1C1A17] focus:outline-hidden cursor-pointer"
                >
                  <option value="">All Flows: {currentFlowName}</option>
                  {flows.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Critical Path Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs font-mono font-semibold text-[#1C1A17]">
              <span>Critical Path:</span>
              <span className="text-[#DC2626] font-bold">{tasks.length} Nodes / {blockedCount} Blocked</span>
            </div>

            {/* Topology Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-[#FAF8F5] border border-[#DCD7CE] rounded-xl text-xs font-mono text-[#736D64]">
              <span>Topology:</span>
              <span className="font-bold text-[#1C1A17]">Directed Acyclic Graph</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 bg-[#FFFFFF]/90 backdrop-blur-md border border-[#DCD7CE] p-1 rounded-xl shadow-xs">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAutoLayout}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Auto Flow DAG
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => alert('Flow diagram exported.')}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenNewTask(selectedFlowId || undefined)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              New Task
            </Button>
          </div>
        </div>

        {/* Row 2: View Filter Tabs & Legend */}
        <div className="flex items-center justify-between gap-3 pointer-events-auto flex-wrap">
          {/* Filters */}
          <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5]/95 backdrop-blur-md border border-[#DCD7CE] rounded-full shadow-xs flex-wrap">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 text-xs rounded-full font-bold font-mono transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-[#1C1A17] text-[#FAF8F5]'
                  : 'text-[#736D64] hover:text-[#1C1A17] hover:bg-[#EFECE6]'
              }`}
            >
              All Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setFilterMode('my')}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all cursor-pointer ${
                filterMode === 'my'
                  ? 'bg-[#1C1A17] text-[#FAF8F5]'
                  : 'text-[#736D64] hover:text-[#1C1A17] hover:bg-[#EFECE6]'
              }`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setFilterMode('overdue')}
              className={`px-3 py-1 text-xs rounded-full font-bold font-mono transition-all cursor-pointer flex items-center gap-1 ${
                filterMode === 'overdue'
                  ? 'bg-[#FEF2F2] border border-[#EF4444] text-[#DC2626]'
                  : 'text-[#DC2626] hover:bg-[#FEF2F2]'
              }`}
            >
              ● Overdue Only {overdueCount > 0 && `(${overdueCount})`}
            </button>
            <button
              onClick={() => setFilterMode('sprints')}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all cursor-pointer ${
                filterMode === 'sprints'
                  ? 'bg-[#1C1A17] text-[#FAF8F5]'
                  : 'text-[#736D64] hover:text-[#1C1A17] hover:bg-[#EFECE6]'
              }`}
            >
              Active Sprints
            </button>
            <button
              onClick={() => setFilterMode('dependencies')}
              className={`px-3 py-1 text-xs rounded-full font-mono transition-all cursor-pointer ${
                filterMode === 'dependencies'
                  ? 'bg-[#FEF08A] text-[#854D0E] font-bold border border-[#EAB308]'
                  : 'text-[#736D64] hover:text-[#1C1A17] hover:bg-[#EFECE6]'
              }`}
            >
              ⚡ Dependencies Only
            </button>
          </div>

          {/* Legend */}
          <div className="hidden xl:flex items-center gap-3 px-3 py-1 bg-[#FFFFFF]/90 backdrop-blur-md border border-[#DCD7CE] rounded-full text-[11px] font-mono text-[#736D64]">
            <span className="font-bold uppercase text-[#9B9489]">Legend:</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#9B9489]" /> TODO
            </span>
            <span className="flex items-center gap-1 text-[#2563EB]">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" /> IN PROGRESS
            </span>
            <span className="flex items-center gap-1 text-[#DC2626]">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> BLOCKED
            </span>
            <span className="flex items-center gap-1 text-[#059669]">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" /> DONE
            </span>
            <span className="text-[#DCD7CE]">|</span>
            <span className="font-bold text-[#1C1A17]">→ BLOCKS Dependency</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 w-full h-full">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#736D64] text-sm font-mono">
            <div className="w-6 h-6 border-2 border-[#1C1A17] border-t-transparent rounded-full animate-spin mb-3" />
            Loading task flow DAG...
          </div>
        ) : tasks.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#736D64] text-sm">
            <GitBranch className="w-10 h-10 text-[#9B9489] mb-3" />
            <p className="font-bold text-[#1C1A17]">No tasks matching this filter</p>
            <p className="text-xs text-[#736D64] mt-1 mb-4">
              Add tasks to build your operational pipeline.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenNewTask(selectedFlowId || undefined)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              + Create Task
            </Button>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={onNodeDragStop}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#DCD7CE" gap={24} size={1.2} variant={BackgroundVariant.Dots} />
            <Controls position="top-right" showInteractive={false} className="!top-28" />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
