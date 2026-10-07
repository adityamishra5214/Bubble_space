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
import { EmployeeBubbleNode } from './EmployeeBubbleNode';
import { EmployeeWithStats, Department } from '@/types';
import { Button } from '@/ui/Button';
import {
  RotateCcw,
  Plus,
  Users,
  Search,
  Maximize2,
  MapPin,
  Edit3,
  SlidersHorizontal,
} from 'lucide-react';

interface OrganizationGraphProps {
  onSelectEmployee: (employeeId: string) => void;
  onOpenAddPerson: () => void;
  dataVersion: number;
}

const nodeTypes = {
  employeeBubble: EmployeeBubbleNode,
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 160;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 90, ranksep: 120 });

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

export function OrganizationGraph({
  onSelectEmployee,
  onOpenAddPerson,
  dataVersion,
}: OrganizationGraphProps) {
  const [employees, setEmployees] = useState<EmployeeWithStats[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const fetchOrganization = async () => {
    try {
      setIsLoading(true);
      const [orgRes, deptRes] = await Promise.all([
        fetch('/api/organization'),
        fetch('/api/departments'),
      ]);

      if (orgRes.ok && deptRes.ok) {
        const orgData = await orgRes.json();
        const deptData = await deptRes.json();
        setEmployees(orgData.employees || []);
        setDepartments(deptData.departments || []);
      }
    } catch (err) {
      console.error('Error fetching organization:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [dataVersion]);

  // Build Graph Nodes & Edges from reporting hierarchy
  useEffect(() => {
    if (employees.length === 0) return;

    const filteredEmployees = employees.filter((emp) => {
      const matchDept = !selectedDeptId || emp.departmentId === selectedDeptId;
      const matchSearch =
        !searchQuery ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.designation && emp.designation.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchDept && matchSearch;
    });

    const initialNodes: Node[] = filteredEmployees.map((emp) => ({
      id: emp.id,
      type: 'employeeBubble',
      position: { x: 0, y: 0 },
      data: { employee: emp, onSelect: () => onSelectEmployee(emp.id) },
    }));

    const initialEdges: Edge[] = [];
    filteredEmployees.forEach((emp) => {
      if (emp.managerId && filteredEmployees.some((m) => m.id === emp.managerId)) {
        const hasOverdue = emp.stats.overdueCount > 0;
        initialEdges.push({
          id: `edge-${emp.managerId}-${emp.id}`,
          source: emp.managerId,
          target: emp.id,
          type: 'smoothstep',
          style: {
            stroke: hasOverdue ? '#EF4444' : '#1C1A17',
            strokeWidth: 2,
            strokeDasharray: '4,4',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 12,
            height: 12,
            color: hasOverdue ? '#EF4444' : '#1C1A17',
          },
        });
      }
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [employees, selectedDeptId, searchQuery, setNodes, setEdges, onSelectEmployee]);

  const onConnect = useCallback(
    async (params: Connection) => {
      if (!params.source || !params.target) return;
      try {
        await fetch('/api/organization', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: params.target, managerId: params.source }),
        });
        setEdges((eds) => addEdge(params, eds));
        fetchOrganization();
      } catch (err) {
        console.error('Failed to link manager:', err);
      }
    },
    [setEdges]
  );

  const handleAutoAlign = () => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  };

  const totalPeople = employees.length;
  const totalActiveTasks = employees.reduce((acc, e) => acc + (e.stats?.activeCount || 0), 0);
  const totalOverdue = employees.reduce((acc, e) => acc + (e.stats?.overdueCount || 0), 0);

  return (
    <div
      style={{ width: '100%', height: 'calc(100vh - 100px)', minHeight: '680px' }}
      className="relative w-full bg-[#F7F5F0] rounded-2xl border border-[#DCD7CE] overflow-hidden flex flex-col shadow-sm"
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 space-y-2 pointer-events-none">
        {/* Row 1: Department Filter Pills & Search */}
        <div className="flex items-center justify-between gap-3 pointer-events-auto flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5]/95 backdrop-blur-md border border-[#DCD7CE] rounded-full shadow-xs flex-wrap">
            <button
              onClick={() => setSelectedDeptId(null)}
              className={`px-3 py-1 text-xs rounded-full font-bold font-mono transition-all cursor-pointer ${
                selectedDeptId === null
                  ? 'bg-[#FEF08A] text-[#1C1A17] border border-[#EAB308]'
                  : 'text-[#736D64] hover:text-[#1C1A17] hover:bg-[#EFECE6]'
              }`}
            >
              ● All ({totalPeople})
            </button>
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDeptId(dept.id)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-all cursor-pointer ${
                  selectedDeptId === dept.id
                    ? 'bg-[#1C1A17] text-[#FAF8F5]'
                    : 'text-[#736D64] hover:text-[#1C1A17] hover:bg-[#EFECE6]'
                }`}
              >
                {dept.name} ({dept._count?.users ?? 0})
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9B9489] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find teammate note..."
              className="pl-8 pr-3 py-1.5 bg-[#FFFFFF] border border-[#DCD7CE] rounded-full text-xs text-[#1C1A17] placeholder-[#9B9489] w-48 focus:w-60 focus:border-[#1C1A17] focus:outline-hidden transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Row 2: Stats Box & Graph Alignment Controls */}
        <div className="flex items-center justify-between gap-3 pointer-events-auto flex-wrap">
          {/* Stats Box */}
          <div className="flex items-center gap-3 px-3.5 py-1.5 bg-[#FFFFFF]/90 backdrop-blur-md border border-[#DCD7CE] rounded-xl text-xs font-mono shadow-xs">
            <span className="flex items-center gap-1.5 font-bold text-[#1C1A17]">
              <Users className="w-3.5 h-3.5 text-[#736D64]" />
              {totalPeople} Members
            </span>
            <span className="text-[#DCD7CE]">•</span>
            <span className="font-semibold text-[#1C1A17]">{totalActiveTasks} Active Tasks</span>
            {totalOverdue > 0 && (
              <>
                <span className="text-[#DCD7CE]">•</span>
                <span className="text-[#DC2626] font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                  {totalOverdue} Overdue
                </span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 bg-[#FFFFFF]/90 backdrop-blur-md border border-[#DCD7CE] p-1 rounded-xl shadow-xs">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAutoAlign}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Align Chart
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenAddPerson}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Person
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 w-full h-full">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#736D64] text-sm font-mono">
            <div className="w-6 h-6 border-2 border-[#1C1A17] border-t-transparent rounded-full animate-spin mb-3" />
            Loading organization hierarchy...
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#DCD7CE" gap={24} size={1.2} variant={BackgroundVariant.Dots} />
            <Controls position="top-right" showInteractive={false} className="!top-24" />
          </ReactFlow>
        )}
      </div>

      {/* Floating MAP SKETCH Box (Bottom Left) */}
      <div className="absolute bottom-12 left-4 z-10 bg-[#FFFFFF] border-2 border-[#1C1A17] p-2.5 rounded-2xl shadow-lg pointer-events-auto hidden sm:block w-48">
        <div className="flex items-center justify-between text-[10px] font-bold font-mono uppercase tracking-wider text-[#1C1A17] mb-2">
          <span>Map Sketch</span>
          <Edit3 className="w-3 h-3 text-[#736D64]" />
        </div>
        <div className="h-16 bg-[#FAF8F5] border border-[#DCD7CE] rounded-xl flex items-center justify-center p-2 relative">
          <div className="w-3 h-3 rounded-full bg-[#FEF08A] border border-[#EAB308] absolute top-2 left-8" />
          <div className="w-2 h-2 rounded-full bg-[#1C1A17] absolute bottom-3 left-6" />
          <div className="w-2 h-2 rounded-full bg-[#EF4444] absolute bottom-2 left-14" />
          <div className="w-2 h-2 rounded-full bg-[#1C1A17] absolute bottom-4 right-10" />
          <div className="w-2 h-2 rounded-full bg-[#1C1A17] absolute bottom-2 right-4" />
        </div>
      </div>

      {/* Bottom Legend Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-[#FFFFFF] border-2 border-[#1C1A17] px-4 py-1.5 rounded-full shadow-md text-xs font-bold font-mono text-[#1C1A17] flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEF08A] border border-[#1C1A17]" />
          Circles = Teammates
        </span>
        <span className="text-[#DCD7CE]">|</span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-xs bg-[#FFFFFF] border border-[#1C1A17]" />
          Cards = Active Roles
        </span>
        <span className="text-[#DCD7CE]">|</span>
        <span className="flex items-center gap-1.5 text-[#DC2626]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
          Coral = Blocker
        </span>
      </div>
    </div>
  );
}
