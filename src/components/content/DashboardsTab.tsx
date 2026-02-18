'use client';

import React, { useState, useEffect } from 'react';
import { Plus, BarChart3, Clock, Pencil, Trash2, Copy, Layout } from 'lucide-react';
import { CreationChatModal } from './CreationChatModal';

interface DashboardsTabProps { colors: Record<string, string>; isDark: boolean; }
interface Dashboard { id: string; title: string; description: string; createdAt: string; }

const STORAGE_KEY = 'content_dashboards';
function load(): Dashboard[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
function save(items: Dashboard[]) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {} }

export function DashboardsTab({ colors, isDark }: DashboardsTabProps) {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { const d = load(); setDashboards(d); if (d.length > 0) setSelectedId(d[0].id); }, []);

  const selected = dashboards.find(d => d.id === selectedId) || null;

  const handleDelete = (id: string) => { const u = dashboards.filter(d => d.id !== id); setDashboards(u); save(u); if (selectedId === id) setSelectedId(u[0]?.id || null); };
  const handleDuplicate = (d: Dashboard) => { const c = { ...d, id: `dash-${Date.now()}`, title: `${d.title} (Copy)`, createdAt: new Date().toISOString() }; const u = [...dashboards, c]; setDashboards(u); save(u); setSelectedId(c.id); };
  const handleCreated = (item: any) => {
    const nd: Dashboard = { id: `dash-${Date.now()}`, title: item.title || 'New Dashboard', description: item.content || '', createdAt: new Date().toISOString() };
    const u = [...dashboards, nd]; setDashboards(u); save(u); setSelectedId(nd.id); setShowCreate(false);
  };

  const border = `1px solid ${colors.border}`;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '280px', borderRight: border, display: 'flex', flexDirection: 'column', backgroundColor: colors.surface, flexShrink: 0 }}>
        <div style={{ padding: '12px', borderBottom: border }}>
          <button onClick={() => setShowCreate(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', backgroundColor: colors.primaryYellow, color: colors.darkGray, border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '13px', letterSpacing: '0.5px' }}><Plus size={16} /> NEW DASHBOARD</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {dashboards.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center' }}>
              <BarChart3 size={32} color={colors.textSecondary} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p style={{ fontSize: '12px', color: colors.textMuted }}>No dashboards yet</p>
            </div>
          ) : dashboards.map(d => {
            const isActive = selectedId === d.id;
            return (
              <button key={d.id} onClick={() => setSelectedId(d.id)} style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px', backgroundColor: isActive ? (isDark ? '#2A2A2A' : '#eee') : 'transparent', border: isActive ? `1px solid ${colors.primaryYellow}40` : '1px solid transparent', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', marginBottom: '4px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: isDark ? '#333' : '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Layout size={17} color={colors.primaryYellow} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: colors.text, fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontSize: '10px', color: colors.textSecondary }}><Clock size={9} />{new Date(d.createdAt).toLocaleDateString()}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: colors.background, overflow: 'hidden' }}>
        {selected ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: border, flexShrink: 0 }}>
              <div>
                <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '18px', color: colors.text, letterSpacing: '0.5px', textTransform: 'uppercase', margin: 0 }}>{selected.title}</h2>
                <p style={{ fontSize: '11px', color: colors.textMuted, margin: '2px 0 0' }}>Created {new Date(selected.createdAt).toLocaleString()}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { icon: Copy, label: 'Duplicate', action: () => handleDuplicate(selected) },
                  { icon: Trash2, label: 'Delete', action: () => handleDelete(selected.id) },
                ].map(({ icon: Icon, label, action }) => (
                  <button key={label} onClick={action} style={{ padding: '7px', backgroundColor: 'transparent', border, borderRadius: '8px', color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={label}><Icon size={14} /></button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {selected.description ? (
                <pre style={{ fontSize: '13px', color: colors.text, lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: "'Quicksand', sans-serif" }}>{selected.description}</pre>
              ) : (
                <p style={{ color: colors.textMuted, fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>Dashboard content will appear here after creation.</p>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <BarChart3 size={48} color={colors.textSecondary} style={{ marginBottom: '16px', opacity: 0.4 }} />
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '16px', color: colors.textMuted, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Select or create a dashboard</p>
            </div>
          </div>
        )}
      </div>
      {showCreate && <CreationChatModal colors={colors} isDark={isDark} contentType="dashboards" onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
}
