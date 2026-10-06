import { useCallback, useEffect, useState } from 'react';
import Icon from './Icon';
import { nexusApi } from '../services/nexusApi';

const SIDEBAR_LINKS = [
  { icon: 'dashboard', label: 'Overview', active: true, filled: true },
  { icon: 'memory', label: 'Infrastructure' },
  { icon: 'dns', label: 'Compute' },
  { icon: 'verified_user', label: 'Security' },
];

const BAR_HEIGHTS = [40, 60, 30, 80, 50, 70, 90, 40, 60, 30, 80, 50];

function StatusDot({ health = 'healthy' }) {
  const color = health === 'healthy' ? 'bg-emerald-500' : health === 'degraded' ? 'bg-amber-400' : 'bg-error';
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  );
}

export default function DashboardPreview() {
  const [status, setStatus] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [notice, setNotice] = useState('Connecting to Nexus…');
  const [busy, setBusy] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [rebuildResult, setRebuildResult] = useState(null);
  const [forceSandboxFail, setForceSandboxFail] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const [nextStatus, nextTimeline] = await Promise.all([nexusApi.getStatus(), nexusApi.getTimeline()]);
      setStatus(nextStatus);
      setTimeline(nextTimeline);
      setNotice(`System ${nextStatus.overallStatus}`);
    } catch (error) {
      setNotice(error.message);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 5000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const runAction = async (action, successMessage, isRebuild = false) => {
    setBusy(true);
    setRebuildResult(null);
    try {
      const res = await action();
      setNotice(successMessage);
      if (isRebuild) {
        setRebuildResult(res);
      }
      await refreshStatus();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };

  const triggerAiAnalysis = async () => {
    setAnalyzing(true);
    setAiAnalysis(null);
    try {
      const response = await nexusApi.analyze();
      if (response.success && response.analysis) {
        setAiAnalysis(response.analysis);
        setNotice('AI Diagnosis completed.');
      } else {
        setNotice('Failed to obtain AI diagnosis.');
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleForceFailToggle = async (e) => {
    const val = e.target.checked;
    setForceSandboxFail(val);
    try {
      await nexusApi.toggleForceFail(val);
      setNotice(`Forced sandbox failure: ${val ? 'ON' : 'OFF'}`);
    } catch (err) {
      setNotice(`Failed to toggle sandbox fail: ${err.message}`);
    }
  };

  const services = status?.services || {};
  const statusItems = [
    ['Frontend', services.frontend],
    ['Backend', services.backend],
    ['Database', services.database],
  ];

  const metricsDisplay = [
    { label: 'Overall Status', value: status?.overallStatus ? status.overallStatus.toUpperCase() : 'LOADING', trend: status?.timestamp ? 'live' : '—', trendIcon: 'monitor_heart', trendColor: status?.overallStatus === 'healthy' ? 'text-emerald-400' : 'text-error' },
    { label: 'Backend Latency', value: services.backend?.responseTimeMs != null ? `${services.backend.responseTimeMs}ms` : '—', trend: services.backend?.health || 'unknown', trendIcon: 'speed', trendColor: services.backend?.health === 'healthy' ? 'text-primary' : 'text-error' },
    { label: 'DB Latency', value: services.database?.responseTimeMs != null ? `${services.database.responseTimeMs}ms` : '—', trend: services.database?.health || 'unknown', trendIcon: 'storage', trendColor: services.database?.health === 'healthy' ? 'text-secondary' : 'text-error' },
    { label: 'Backend Uptime', value: services.backend?.uptime || '—', trend: services.backend?.status || 'unknown', trendIcon: 'schedule', trendColor: 'text-tertiary' },
  ];

  return (
    <section className="glass-card rounded-2xl overflow-hidden shadow-2xl relative z-20 border border-white/10 mt-8 md:mt-16 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row min-h-0 md:min-h-[750px]">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-surface-container-low/80 backdrop-blur-md border-b md:border-b-0 md:border-r border-white/5 flex flex-col py-4 md:py-gutter hidden md:flex">
          <div className="px-6 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center text-on-primary-container">
              <Icon name="dashboard" />
            </div>
            <div>
              <div className="font-label-md text-label-md font-bold text-on-surface">Admin Console</div>
              <div className="font-label-sm text-label-sm text-on-surface-variant">Project Nova-X</div>
            </div>
          </div>

          <div className="font-label-sm text-label-sm text-on-surface-variant px-6 mb-2 uppercase tracking-wider">
            Analytics
          </div>
          <nav className="flex-1 space-y-1 px-4">
            {SIDEBAR_LINKS.map((link) => (
              <a
                key={link.label}
                href="#"
                className={
                  link.active
                    ? 'bg-primary-container text-on-primary-container rounded-lg mx-2 flex items-center gap-3 px-3 py-2 font-label-md text-label-md'
                    : 'text-on-surface-variant hover:text-on-surface px-4 py-2 hover:bg-white/5 transition-all duration-300 ease-in-out rounded-lg flex items-center gap-3 font-label-md text-label-md'
                }
              >
                <Icon name={link.icon} filled={link.filled} />
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mt-auto px-4 hidden md:block">
            <a
              href="#"
              className="text-on-surface-variant hover:text-on-surface px-4 py-2 hover:bg-white/5 transition-all duration-300 ease-in-out rounded-lg flex items-center gap-3 font-label-md text-label-md"
            >
              <Icon name="settings" />
              Settings
            </a>
          </div>
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden flex overflow-x-auto border-b border-white/5 bg-surface-container-low/80">
          {SIDEBAR_LINKS.map((link) => (
            <button
              key={link.label}
              type="button"
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 font-label-sm text-label-sm whitespace-nowrap ${
                link.active ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant'
              }`}
            >
              <Icon name={link.icon} size={18} filled={link.filled} />
              {link.label}
            </button>
          ))}
        </div>

        {/* Main dashboard area */}
        <div className="flex-1 bg-surface-dim/90 flex flex-col overflow-hidden">
          <header className="h-auto md:h-16 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 md:py-0 bg-surface-container-low/50">
            <h2 className="font-headline-lg text-headline-lg text-on-surface text-xl">Overview</h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Icon
                  name="search"
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  className="bg-surface-container/50 border border-white/10 rounded-full py-1.5 pl-10 pr-4 font-label-sm text-label-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 w-full sm:w-64"
                  placeholder="Search deployments..."
                  type="text"
                />
              </div>
              <div className="w-8 h-8 flex-shrink-0 rounded-full bg-surface-container-highest flex items-center justify-center font-label-sm text-label-sm font-bold border border-white/10">
                JD
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
            {/* Active Incident Warning Alert */}
            {status?.overallStatus && status.overallStatus !== 'healthy' && (
              <div className="bg-error/15 border border-error/30 rounded-xl p-4 flex gap-3 items-start animate-pulse">
                <Icon name="error" className="text-error mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-on-surface text-sm">Active Incident Detected</div>
                  <p className="text-on-surface-variant text-xs mt-1">
                    System is currently <strong className="text-error font-extrabold">{status.overallStatus.toUpperCase()}</strong>.
                    Run <strong className="text-primary font-bold">AI Diagnose</strong> to analyze root cause, or click <strong className="text-emerald-400 font-bold">Rebuild</strong> to trigger sandbox recovery.
                  </p>
                </div>
              </div>
            )}

            {/* Metrics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {metricsDisplay.map((metric) => (
                <div key={metric.label} className="glass-panel p-3 sm:p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{metric.label}</span>
                    <Icon name="more_horiz" size={16} className="text-on-surface-variant" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <span className="font-headline-lg text-headline-lg text-on-surface text-xl sm:text-2xl">
                      {metric.value}
                    </span>
                    <span className={`font-label-sm text-label-sm ${metric.trendColor} flex items-center`}>
                      <Icon name={metric.trendIcon} size={14} />
                      {metric.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Area: System Chart + Traffic Donut & Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* System Health & Load Chart */}
              <div className="lg:col-span-2 glass-panel p-4 sm:p-6 rounded-xl border border-white/5 relative">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h3 className="font-body-lg text-body-lg text-on-surface">System Health & Load</h3>
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border border-white/10 hover:bg-white/10 cursor-pointer">
                    <Icon name="download" size={18} className="text-on-surface-variant" />
                  </div>
                </div>
                <div className="h-48 sm:h-64 w-full relative mt-4">
                  <svg height="100%" preserveAspectRatio="none" viewBox="0 0 800 250" width="100%">
                    <defs>
                      <linearGradient id="blue-gradient" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#b4c5ff" />
                      </linearGradient>
                      <linearGradient id="area-gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#050816" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[50, 100, 150, 200].map((y) => (
                      <line key={y} className="chart-grid" x1="0" x2="800" y1={y} y2={y} />
                    ))}
                    <path
                      className="chart-area"
                      d="M0,250 L0,150 C100,100 200,200 300,120 C400,40 500,160 600,100 C700,40 800,120 800,120 L800,250 Z"
                    />
                    <path
                      className="chart-line"
                      d="M0,150 C100,100 200,200 300,120 C400,40 500,160 600,100 C700,40 800,120 800,120"
                    />
                    <circle cx="300" cy="120" fill="#ffffff" filter="drop-shadow(0 0 4px #b4c5ff)" r="4" />
                    <circle cx="600" cy="100" fill="#ffffff" filter="drop-shadow(0 0 4px #b4c5ff)" r="4" />
                    {[
                      [45, '24k'],
                      [95, '20k'],
                      [145, '16k'],
                      [195, '12k'],
                    ].map(([y, label]) => (
                      <text key={label} fill="#8d90a0" fontFamily="Geist" fontSize="10" x="0" y={y}>
                        {label}
                      </text>
                    ))}
                  </svg>
                  <div className="absolute bottom-0 w-full flex justify-between px-4 sm:px-8 text-[#8d90a0] font-label-sm text-[10px] translate-y-6">
                    {['1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM'].map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <div className="absolute bottom-6 w-full flex justify-between px-4 sm:px-8 items-end opacity-30 h-16 sm:h-24">
                    {BAR_HEIGHTS.map((h, i) => (
                      <div key={i} className="w-1 sm:w-2 bg-primary/40 rounded-t" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Traffic Routing & Control Actions */}
              <div className="space-y-4 sm:space-y-6">
                <div className="glass-panel p-4 sm:p-6 rounded-xl border border-white/5 min-h-[200px] flex flex-col relative">
                  <h3 className="font-body-lg text-body-lg text-on-surface mb-3">Traffic Routing</h3>
                  <div className="flex-1 flex items-center justify-center relative">
                    <svg className="rotate-[-90deg]" height="100" viewBox="0 0 120 120" width="100">
                      <circle cx="60" cy="60" fill="none" r="50" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                      <circle
                        cx="60"
                        cy="60"
                        fill="none"
                        r="50"
                        stroke="#2563eb"
                        strokeDasharray="314"
                        strokeDashoffset="100"
                        strokeWidth="12"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        fill="none"
                        r="50"
                        stroke="#adc6ff"
                        strokeDasharray="314"
                        strokeDashoffset="220"
                        strokeWidth="12"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        fill="none"
                        r="50"
                        stroke="#0053db"
                        strokeDasharray="314"
                        strokeDashoffset="280"
                        strokeWidth="12"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="font-headline-lg text-headline-lg text-on-surface text-lg">65%</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant text-[10px]">US East</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2 sm:flex-col gap-2 mt-2 sm:mt-0">
                    {[
                      ['bg-primary-container', 'US East'],
                      ['bg-secondary', 'EU West'],
                      ['bg-inverse-primary', 'AP South'],
                    ].map(([color, label]) => (
                      <div
                        key={label}
                        className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant text-[10px]"
                      >
                        <span className={`w-2 h-2 rounded-full ${color}`} />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Control Action Buttons */}
                <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-3">
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Chaos Controls
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => runAction(nexusApi.breakBackend, 'Backend container stopped.')}
                      disabled={busy || analyzing}
                      className="bg-error/10 border border-error/30 text-error hover:bg-error/20 active:scale-95 disabled:opacity-50 rounded-lg p-2.5 flex flex-col items-center justify-center text-center transition-all font-label-sm text-[11px]"
                    >
                      <Icon name="warning" className="mb-1" size={18} />
                      Stop Backend
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(nexusApi.breakDatabase, 'Database container stopped.')}
                      disabled={busy || analyzing}
                      className="bg-error/10 border border-error/30 text-error hover:bg-error/20 active:scale-95 disabled:opacity-50 rounded-lg p-2.5 flex flex-col items-center justify-center text-center transition-all font-label-sm text-[11px]"
                    >
                      <Icon name="dns" className="mb-1" size={18} />
                      Stop DB
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(() => nexusApi.enableLatency(3000), 'Latency mode injected (3s delay).')}
                      disabled={busy || analyzing}
                      className="bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 active:scale-95 disabled:opacity-50 rounded-lg p-2.5 flex flex-col items-center justify-center text-center transition-all font-label-sm text-[11px]"
                    >
                      <Icon name="speed" className="mb-1" size={18} />
                      Inject Latency
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => runAction(nexusApi.rebuild, 'Deterministic repair workflow completed.', true)}
                      disabled={busy || analyzing}
                      className="btn-primary font-label-md text-xs font-semibold px-4 py-3 rounded-lg text-white flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
                    >
                      <Icon name="sync" size={18} />
                      {busy ? 'Working…' : 'Rebuild'}
                    </button>
                    <button
                      type="button"
                      onClick={triggerAiAnalysis}
                      disabled={busy || analyzing}
                      className="btn-secondary font-label-md text-xs font-semibold px-4 py-3 rounded-lg text-on-surface flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
                    >
                      <Icon name="psychology" size={18} />
                      {analyzing ? 'Analyzing…' : 'AI Diagnose'}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={forceSandboxFail}
                        onChange={handleForceFailToggle}
                        className="w-3.5 h-3.5 rounded border-white/10 bg-surface-container text-primary focus:ring-primary"
                      />
                      <span className="text-[11px] text-on-surface-variant font-label-sm">Force Sandbox Failure (Test Mode)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Sandbox Validation Report Panel */}
            {rebuildResult && (
              <div className={`glass-panel p-4 rounded-xl border ${rebuildResult.success ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-error/20 bg-error/5'} transition-all duration-300`}>
                <div className="flex items-center gap-2 font-label-md text-label-md font-bold text-on-surface mb-2">
                  <Icon name={rebuildResult.success ? 'check_circle' : 'cancel'} className={rebuildResult.success ? 'text-emerald-400' : 'text-error'} />
                  Sandbox Validation & Recovery Report
                </div>
                <div className="space-y-2 text-xs font-label-sm">
                  <div className="flex justify-between">
                    <span>Target Incident:</span>
                    <span className="text-on-surface font-semibold">{rebuildResult.diagnosis?.probableCause || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sandbox State:</span>
                    <span className={rebuildResult.validation?.result === 'PASS' ? 'text-emerald-400 font-bold' : 'text-error font-bold'}>
                      Validation {rebuildResult.validation?.result || 'FAIL'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Production Restored:</span>
                    <span className={rebuildResult.productionRestored ? 'text-emerald-400 font-bold' : 'text-error font-bold'}>
                      {rebuildResult.productionRestored ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>

                  {rebuildResult.validation?.checks && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <span className="font-bold text-on-surface">Validation Checks:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                        {rebuildResult.validation.checks.map((check, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 bg-surface-container-highest/20 p-1.5 rounded">
                            <Icon
                              name={check.status === 'PASS' ? 'check' : 'close'}
                              size={14}
                              className={check.status === 'PASS' ? 'text-emerald-400' : 'text-error'}
                            />
                            <span className="text-[10px] text-on-surface-variant font-semibold">{check.name}: {check.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Diagnosis Report Panel */}
            {aiAnalysis && (
              <div className="glass-panel p-4 rounded-xl border border-primary/20 bg-primary/5 transition-all duration-300">
                <div className="flex items-center gap-2 font-label-md text-label-md font-bold text-primary mb-2">
                  <Icon name="psychology" size={20} />
                  AI SRE Diagnosis Report
                </div>
                <div className="space-y-2 text-xs font-label-sm leading-normal">
                  <div>
                    <span className="font-bold text-on-surface">Diagnosis: </span>
                    <span className="text-on-surface-variant">{aiAnalysis.diagnosis}</span>
                  </div>
                  <div>
                    <span className="font-bold text-on-surface">Root Cause: </span>
                    <span className="text-on-surface-variant">{aiAnalysis.rootCause}</span>
                  </div>
                  <div>
                    <span className="font-bold text-on-surface">Recommended Actions:</span>
                    <ol className="list-decimal list-inside mt-1 space-y-1 text-on-surface-variant">
                      {aiAnalysis.repairPlan?.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* System Status Row */}
            <div className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="font-label-md text-label-md font-bold text-on-surface">System Status</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">{notice}</div>
              </div>
              <div className="flex flex-wrap gap-4 sm:gap-6">
                {statusItems.map(([label, service]) => (
                  <div key={label} className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
                    <StatusDot health={service?.health} />
                    {label}: {service?.health || 'checking'}
                  </div>
                ))}
              </div>
            </div>

            {/* Recovery Timeline Box */}
            <div className="glass-panel p-4 rounded-xl border border-white/5">
              <div className="font-label-md text-label-md font-bold text-on-surface mb-3 flex items-center gap-2">
                <Icon name="history" className="text-secondary" size={18} />
                Recovery Timeline
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {timeline.length ? (
                  timeline.map((item) => (
                    <div key={item.id} className="flex justify-between gap-4 font-label-sm text-xs text-on-surface-variant border-b border-white/5 pb-1">
                      <span>{item.event}</span>
                      <span className="whitespace-nowrap text-on-surface-variant/70">{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="font-label-sm text-xs text-on-surface-variant">No recovery events recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
