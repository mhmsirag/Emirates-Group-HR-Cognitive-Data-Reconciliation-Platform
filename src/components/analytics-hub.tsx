import React, { useState } from 'react';
import { Discrepancy, TrustScorecard } from '../../lib/types';
import {
  LineChart,
  PieChart,
  BarChart2,
  TrendingUp,
  Activity,
  Layers,
  ShieldCheck,
  Coins,
  Clock,
  Plane,
  AlertTriangle,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface AnalyticsHubProps {
  discrepancies: Discrepancy[];
  scorecard: TrustScorecard | null;
  onSelectDiscrepancy: (id: string) => void;
  onNavigateToTab: (tab: 'triage' | 'impact') => void;
}

export const AnalyticsHub: React.FC<AnalyticsHubProps> = ({
  discrepancies,
  scorecard,
  onSelectDiscrepancy,
  onNavigateToTab,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | 'qtd'>('30d');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState<number | null>(null);

  // Filter discrepancies by unit if selected
  const filteredDiscrepancies = discrepancies.filter((d) => {
    if (selectedUnit === 'all') return true;
    if (selectedUnit === 'airline') return d.category.includes('Flight') || d.title.includes('Boeing') || d.title.includes('Airbus');
    if (selectedUnit === 'dnata') return d.employeeName.includes('Rajesh') || d.employeeName.includes('Ahmed') || d.category.includes('Cost Center');
    if (selectedUnit === 'corporate') return d.category.includes('Payroll') || d.category.includes('Security') || d.category.includes('Ghost');
    return true;
  });

  // Category breakdown for Donut Chart
  const categoryCounts: Record<string, { count: number; exposure: number; color: string }> = {
    'Flight Operations & Safety': { count: 0, exposure: 0, color: '#f59e0b' },
    'Airside Security & Cyber Privilege': { count: 0, exposure: 0, color: '#ef4444' },
    'Payroll & Financial Integrity': { count: 0, exposure: 0, color: '#10b981' },
    'Cost Center Misalignment': { count: 0, exposure: 0, color: '#0ea5e9' },
    'Ghost Employee / Unmatched Record': { count: 0, exposure: 0, color: '#a855f7' },
    'Identity & Transliteration Drift': { count: 0, exposure: 0, color: '#64748b' },
  };

  filteredDiscrepancies.forEach((d) => {
    if (categoryCounts[d.category]) {
      categoryCounts[d.category].count += 1;
      categoryCounts[d.category].exposure += d.downstreamImpact.financialExposureAED;
    }
  });

  const totalDiscs = filteredDiscrepancies.length || 1;
  const totalExposure = filteredDiscrepancies.reduce(
    (acc, d) => acc + d.downstreamImpact.financialExposureAED,
    0
  );

  // System financial exposure breakdown
  const systemExposures = [
    {
      name: 'SAP S/4HANA & UAE WPS',
      category: 'Payroll & Treasury',
      exposure: filteredDiscrepancies
        .filter((d) => d.category.includes('Payroll') || d.category.includes('Ghost'))
        .reduce((acc, d) => acc + d.downstreamImpact.financialExposureAED, 0),
      color: 'bg-emerald-500',
      icon: <Coins className="w-3.5 h-3.5 text-emerald-400" />,
      violations: 'WPS Cutoff & SOX 404 Defect',
    },
    {
      name: 'GCAA Flight Operations Ledger',
      category: 'Flight Deck CAR-OPS',
      exposure: filteredDiscrepancies
        .filter((d) => d.category.includes('Flight'))
        .reduce((acc, d) => acc + d.downstreamImpact.financialExposureAED, 0),
      color: 'bg-amber-500',
      icon: <Plane className="w-3.5 h-3.5 text-amber-400" />,
      violations: 'CAR-OPS 1.965 Safety Defect',
    },
    {
      name: 'Dubai Airports Pass Office (DASS)',
      category: 'Airside Security Access',
      exposure: filteredDiscrepancies
        .filter((d) => d.category.includes('Security'))
        .reduce((acc, d) => acc + d.downstreamImpact.financialExposureAED, 0),
      color: 'bg-red-500',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
      violations: 'ICAO Annex 17 Badge Infraction',
    },
    {
      name: 'Intercompany Ledger (CO-CCA)',
      category: 'Airline / dnata Allocations',
      exposure: filteredDiscrepancies
        .filter((d) => d.category.includes('Cost Center'))
        .reduce((acc, d) => acc + d.downstreamImpact.financialExposureAED, 0),
      color: 'bg-sky-500',
      icon: <Layers className="w-3.5 h-3.5 text-sky-400" />,
      violations: 'Inter-entity Cost Drift',
    },
  ];

  const maxExposure = Math.max(...systemExposures.map((s) => s.exposure), 1);

  // Time-series trend data for 30-day velocity chart
  const trendData = [
    { day: 'Oct 01', detected: 14, resolved: 12, backlog: 2 },
    { day: 'Oct 05', detected: 18, resolved: 16, backlog: 4 },
    { day: 'Oct 09', detected: 11, resolved: 12, backlog: 3 },
    { day: 'Oct 13', detected: 22, resolved: 17, backlog: 8 },
    { day: 'Oct 17', detected: 19, resolved: 18, backlog: 9 },
    { day: 'Oct 21', detected: 15, resolved: 16, backlog: 8 },
    { day: 'Oct 23', detected: filteredDiscrepancies.length, resolved: 14, backlog: filteredDiscrepancies.filter(d => d.status !== 'approved').length },
  ];

  // Radar / Spider chart axes (6 dimensions)
  const radarAxes = [
    { label: 'GCAA CAR-OPS', value: scorecard?.gcaaAviationReadiness || 86, fullMark: 100 },
    { label: 'Airside Security', value: scorecard?.airsideCyberSecurityScore || 85, fullMark: 100 },
    { label: 'SOX Financials', value: scorecard?.soxFinancialControlScore || 93, fullMark: 100 },
    { label: 'Cost Allocation', value: 82, fullMark: 100 },
    { label: 'Identity Tolerance', value: 91, fullMark: 100 },
    { label: 'Sync Health', value: 88, fullMark: 100 },
  ];

  // Calculate radar polygon points
  const radarCenter = { x: 120, y: 120 };
  const radarRadius = 90;
  const angleStep = (Math.PI * 2) / radarAxes.length;

  const radarPoints = radarAxes
    .map((axis, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (axis.value / axis.fullMark) * radarRadius;
      const x = radarCenter.x + r * Math.cos(angle);
      const y = radarCenter.y + r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(' ');

  const radarBaseWebs = [0.25, 0.5, 0.75, 1.0].map((level) => {
    return radarAxes
      .map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = level * radarRadius;
        const x = radarCenter.x + r * Math.cos(angle);
        const y = radarCenter.y + r * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');
  });

  return (
    <div className="space-y-6">
      {/* Header and Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 tracking-tight flex items-center gap-2">
            <LineChart className="w-5 h-5 text-sky-400" />
            Executive Data Governance & Risk Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-dimensional analytics, downstream financial exposure distribution, and compliance velocity radar
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Unit Filter */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none pr-2 cursor-pointer font-medium"
            >
              <option value="all" className="bg-slate-900">All Business Units</option>
              <option value="airline" className="bg-slate-900">Emirates Airline</option>
              <option value="dnata" className="bg-slate-900">dnata Operations</option>
              <option value="corporate" className="bg-slate-900">Group Corporate</option>
            </select>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {(['7d', '30d', 'qtd'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  selectedTimeframe === tf
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : 'Q4 QTD'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Downstream Financial Blast</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-amber-300 tabular-nums">
            AED {totalExposure.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
            <span className="text-red-400">↑ 18.4%</span>
            <span>vs previous reconciliation cycle</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Mean Time to Remediate (MTTR)</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-100 tabular-nums">
            2.8 Hours
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
            <span>↓ 42% faster</span>
            <span className="text-slate-400">with cognitive staging</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Critical Aviation Invariants</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-100 tabular-nums">
            {scorecard?.gcaaAviationReadiness || 86}%
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            GCAA CAR-OPS 1 & AOC active threshold
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Autonomous Entity Resolution</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-purple-300 tabular-nums">
            96.8%
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Arabic transliteration tolerance match
          </div>
        </div>
      </div>

      {/* Row 1: Donut Breakdown + Horizontal Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Discrepancy Donut Chart (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              Anomaly Distribution by Category
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {filteredDiscrepancies.length} Total
            </span>
          </div>

          {/* SVG Donut */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <div className="relative w-44 h-44 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let accumulatedPercent = 0;
                  return Object.entries(categoryCounts).map(([cat, data]) => {
                    const percent = (data.count / totalDiscs) * 100;
                    if (percent === 0) return null;
                    const strokeDasharray = `${percent} ${100 - percent}`;
                    const strokeDashoffset = -accumulatedPercent;
                    accumulatedPercent += percent;
                    const isHovered = hoveredCategory === cat;

                    return (
                      <circle
                        key={cat}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={data.color}
                        strokeWidth={isHovered ? '14' : '10'}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredCategory(cat)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      />
                    );
                  });
                })()}
              </svg>
              {/* Inner Circle Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xl font-mono font-bold text-slate-100 tabular-nums">
                  {hoveredCategory
                    ? categoryCounts[hoveredCategory]?.count || 0
                    : filteredDiscrepancies.length}
                </span>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  {hoveredCategory ? 'Selected' : 'Anomalies'}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 text-xs flex-1">
              {Object.entries(categoryCounts).map(([cat, data]) => {
                const percent = Math.round((data.count / totalDiscs) * 100);
                const isHovered = hoveredCategory === cat;
                return (
                  <div
                    key={cat}
                    onMouseEnter={() => setHoveredCategory(cat)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`flex items-center justify-between p-1.5 rounded transition-colors cursor-pointer ${
                      isHovered ? 'bg-slate-800' : 'hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: data.color }}
                      />
                      <span className="truncate text-slate-300 font-medium text-[11px]">
                        {cat}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                      <span className="text-slate-400 tabular-nums">{data.count}</span>
                      <span className="text-slate-500">({percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Financial Exposure by Downstream Consumer (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              Financial & Regulatory Exposure by Downstream Consumer
            </h3>
            <span className="text-xs font-mono text-amber-300 font-medium">
              AED {totalExposure.toLocaleString()} at Risk
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {systemExposures.map((sys) => {
              const widthPct = Math.round((sys.exposure / maxExposure) * 100) || 4;
              return (
                <div key={sys.name} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {sys.icon}
                      <span className="font-medium text-slate-200">{sys.name}</span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline font-mono">
                        · {sys.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-400 text-[10px] hidden md:inline">
                        {sys.violations}
                      </span>
                      <span className="font-bold text-amber-300 tabular-nums">
                        AED {sys.exposure.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden flex items-center">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${sys.color}`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Includes direct salary overpayments, GCAA regulatory grounding, and DASS pass fines.</span>
            <button
              onClick={() => onNavigateToTab('impact')}
              className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium whitespace-nowrap ml-2"
            >
              <span>Blast Radius Map</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: 30-Day Velocity Trend Chart + Radar Spider Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reconciliation Velocity Trend (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                30-Day Incident Discovery vs Remediation Velocity
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tracking throughput and backlog resolution prior to monthly payroll & flight roster cutoffs
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-slate-300">Detected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">Remediated</span>
              </div>
            </div>
          </div>

          {/* SVG Area & Line Chart */}
          <div className="relative pt-4 pb-2">
            <svg viewBox="0 0 500 180" className="w-full h-44 overflow-visible">
              <defs>
                <linearGradient id="detectedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[40, 80, 120, 160].map((y, idx) => (
                <line
                  key={idx}
                  x1="30"
                  y1={y}
                  x2="480"
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
              ))}

              {/* Area & Line for Detected */}
              {(() => {
                const maxVal = 25;
                const points = trendData.map((d, i) => {
                  const x = 40 + i * (430 / (trendData.length - 1));
                  const y = 160 - (d.detected / maxVal) * 120;
                  return { x, y, data: d };
                });

                const areaPath = `M ${points[0].x} 160 ` + points.map((p) => `L ${p.x} ${p.y}`).join(' ') + ` L ${points[points.length - 1].x} 160 Z`;
                const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                return (
                  <>
                    <path d={areaPath} fill="url(#detectedGrad)" />
                    <path d={linePath} fill="none" stroke="#ef4444" strokeWidth="2.5" />
                    {points.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={hoveredTrendPoint === i ? '5' : '3.5'}
                        fill="#ef4444"
                        stroke="#0f172a"
                        strokeWidth="2"
                        className="cursor-pointer transition-all"
                        onMouseEnter={() => setHoveredTrendPoint(i)}
                        onMouseLeave={() => setHoveredTrendPoint(null)}
                      />
                    ))}
                  </>
                );
              })()}

              {/* Area & Line for Remediated */}
              {(() => {
                const maxVal = 25;
                const points = trendData.map((d, i) => {
                  const x = 40 + i * (430 / (trendData.length - 1));
                  const y = 160 - (d.resolved / maxVal) * 120;
                  return { x, y, data: d };
                });

                const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                return (
                  <>
                    <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />
                    {points.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="3"
                        fill="#10b981"
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                    ))}
                  </>
                );
              })()}

              {/* X Axis Labels */}
              {trendData.map((d, i) => {
                const x = 40 + i * (430 / (trendData.length - 1));
                return (
                  <text
                    key={i}
                    x={x}
                    y="178"
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {d.day}
                  </text>
                );
              })}
            </svg>

            {/* Hover Tooltip Box */}
            {hoveredTrendPoint !== null && (
              <div className="absolute top-2 right-4 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs shadow-xl font-mono space-y-1">
                <div className="text-slate-300 font-semibold">{trendData[hoveredTrendPoint].day} Audit Cycle</div>
                <div className="text-red-400">Detected: {trendData[hoveredTrendPoint].detected}</div>
                <div className="text-emerald-400">Resolved: {trendData[hoveredTrendPoint].resolved}</div>
                <div className="text-slate-400">Backlog: {trendData[hoveredTrendPoint].backlog}</div>
              </div>
            )}
          </div>
        </div>

        {/* Regulatory & Invariant Compliance Radar (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              6-Axis Governance Radar
            </h3>
            <span className="text-xs font-mono text-purple-300">
              Avg {Math.round(radarAxes.reduce((a, b) => a + b.value, 0) / radarAxes.length)}%
            </span>
          </div>

          {/* SVG Radar Chart */}
          <div className="flex items-center justify-center py-1">
            <svg viewBox="0 0 240 240" className="w-56 h-56">
              {/* Background Concentric Webs */}
              {radarBaseWebs.map((points, idx) => (
                <polygon
                  key={idx}
                  points={points}
                  fill="transparent"
                  stroke="#1e293b"
                  strokeWidth="1"
                />
              ))}

              {/* Axis Spoke Lines */}
              {radarAxes.map((_, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const x = radarCenter.x + radarRadius * Math.cos(angle);
                const y = radarCenter.y + radarRadius * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={radarCenter.x}
                    y1={radarCenter.y}
                    x2={x}
                    y2={y}
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Data Polygon */}
              <polygon
                points={radarPoints}
                fill="rgba(168, 85, 247, 0.25)"
                stroke="#a855f7"
                strokeWidth="2"
              />

              {/* Axis Corner Points & Labels */}
              {radarAxes.map((axis, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const r = (axis.value / axis.fullMark) * radarRadius;
                const x = radarCenter.x + r * Math.cos(angle);
                const y = radarCenter.y + r * Math.sin(angle);

                // Label positions slightly further out
                const lx = radarCenter.x + (radarRadius + 18) * Math.cos(angle);
                const ly = radarCenter.y + (radarRadius + 14) * Math.sin(angle);

                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="3" fill="#a855f7" stroke="#0f172a" strokeWidth="1.5" />
                    <text
                      x={lx}
                      y={ly}
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="sans-serif"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {axis.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-center">
            <span className="text-[11px] text-slate-400 font-mono">
              Evaluates structural boundary invariants between Oracle HCM, SAP, DASS, and LMS.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
