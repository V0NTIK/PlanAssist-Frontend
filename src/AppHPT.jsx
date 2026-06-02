// PlanAssist — HPT Mode (High Performing Team)
// AppHPT.jsx — Teacher/Staff Interface

import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, LogOut, Home, Users, X, Plus, Trash2, Bell, Share2,
  Info, RefreshCw, Check, ChevronDown, ChevronRight, ChevronUp, Search,
  AlertCircle, Copy, Zap, Target, BarChart3, Activity, Clock,
  TrendingUp, TrendingDown, AlertTriangle, Eye, Monitor, Award,
  Settings, Moon, Sun,
} from 'lucide-react';

const API_URL = 'https://planassist-api.onrender.com/api';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function apiCall(path, method = 'GET', body = null, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  });
}

const STUDIO_COLORS = [
  { label: 'Violet',  value: '#7C3AED' },
  { label: 'Blue',    value: '#2563EB' },
  { label: 'Teal',    value: '#0D9488' },
  { label: 'Green',   value: '#16A34A' },
  { label: 'Amber',   value: '#D97706' },
  { label: 'Rose',    value: '#E11D48' },
  { label: 'Fuchsia', value: '#A21CAF' },
  { label: 'Slate',   value: '#475569' },
];

function gradeColor(score) {
  if (score == null) return 'text-gray-400';
  if (score >= 80) return 'text-green-600';
  if (score >= 65) return 'text-amber-600';
  return 'text-red-600';
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDIO INFO MODAL
// ─────────────────────────────────────────────────────────────────────────────

function StudioInfoModal({ studio, token, onClose, onSave, onDelete, allHptUsers }) {
  const [form, setForm] = useState({
    name: studio.name || '',
    color: studio.color || '#7C3AED',
    zoomNumber: studio.zoom_number || '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareSearch, setShareSearch] = useState('');
  const [shareMsg, setShareMsg] = useState('');
  const [expandMembers, setExpandMembers] = useState(false);

  const isNew = !studio.id; // during setup flow, id is null

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(); } finally { setDeleting(false); }
  };

  const handleShare = async (hptUser) => {
    try {
      await apiCall(`/hpt/studios/${studio.id}/share`, 'POST', { shareWithId: hptUser.id }, token);
      setShareMsg(`Shared with ${hptUser.name}`);
      setTimeout(() => setShareMsg(''), 3000);
    } catch (e) { setShareMsg('Failed: ' + e.message); }
  };

  const alreadyShared = new Set((studio.sharedWith || []).map(u => u.id));
  const filteredHptUsers = (allHptUsers || []).filter(u =>
    !alreadyShared.has(u.id) &&
    u.name.toLowerCase().includes(shareSearch.toLowerCase())
  );

  const members = studio.members || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: form.color }} />
            <h2 className="text-xl font-bold text-gray-900">{isNew ? 'Launch Studio' : 'Studio Info'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Studio ID / Key (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              {studio.setup_type === 'course' ? 'Course ID' : 'Studio Key'}
            </label>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
              <span className="font-mono text-gray-700 font-semibold">
                {studio.setup_type === 'course' ? studio.course_id : studio.studio_key}
              </span>
              {studio.setup_type === 'key' && (
                <button
                  onClick={() => navigator.clipboard.writeText(studio.studio_key)}
                  className="ml-auto text-gray-400 hover:text-purple-600"
                  title="Copy key"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
            {studio.setup_type === 'key' && (
              <p className="text-xs text-gray-400 mt-1">Share this key with students so they can join the Studio.</p>
            )}
          </div>

          {/* Studio Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Studio Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm"
              placeholder="e.g. Period 3 Science"
            />
          </div>

          {/* Zoom Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Zoom Number <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              value={form.zoomNumber}
              onChange={e => setForm(f => ({ ...f, zoomNumber: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm"
              placeholder="e.g. 123 456 7890"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Studio Color</label>
            <div className="flex gap-2 flex-wrap">
              {STUDIO_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setForm(f => ({ ...f, color: c.value }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c.value ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Members */}
          <div>
            <button
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
              onClick={() => setExpandMembers(v => !v)}
            >
              <Users className="w-4 h-4" />
              Students ({members.length})
              {expandMembers ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {expandMembers && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {members.length === 0 ? (
                  <p className="text-sm text-gray-400 px-4 py-3">
                    {studio.setup_type === 'key' ? 'No students have joined yet. Share the Studio Key.' : 'No students found for this course ID.'}
                  </p>
                ) : (
                  <div className="max-h-52 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Name</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Grade</th>
                          {studio.setup_type === 'course' && <>
                            <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Period</th>
                            <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Year</th>
                          </>}
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((m, i) => (
                          <tr key={m.id || i} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium text-gray-800">{m.name}</td>
                            <td className="px-4 py-2 text-gray-500">Gr {m.grade || '—'}</td>
                            {studio.setup_type === 'course' && <>
                              <td className={`px-4 py-2 text-right font-semibold ${gradeColor(m.current_period_score)}`}>
                                {m.current_period_score != null ? `${m.current_period_score}%` : '—'}
                              </td>
                              <td className={`px-4 py-2 text-right font-semibold ${gradeColor(m.current_score)}`}>
                                {m.current_score != null ? `${m.current_score}%` : '—'}
                              </td>
                            </>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Share (only for existing studios) */}
          {!isNew && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Share with HPT User</label>
              {(studio.sharedWith || []).length > 0 && (
                <div className="flex gap-2 flex-wrap mb-2">
                  {studio.sharedWith.map(u => (
                    <span key={u.id} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {u.name}
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={shareSearch}
                  onChange={e => setShareSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
                  placeholder="Search HPT users…"
                />
              </div>
              {shareSearch && filteredHptUsers.length > 0 && (
                <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden">
                  {filteredHptUsers.slice(0, 6).map(u => (
                    <button
                      key={u.id}
                      onClick={() => { handleShare(u); setShareSearch(''); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 border-b border-gray-100 last:border-0"
                    >
                      {u.name}
                    </button>
                  ))}
                </div>
              )}
              {shareMsg && <p className="text-xs text-green-600 mt-1">{shareMsg}</p>}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 px-6 pb-6">
          {!isNew && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
          {confirmDelete && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600 font-medium">Delete this studio?</span>
              <button onClick={handleDelete} disabled={deleting} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">
                {deleting ? '…' : 'Yes, Delete'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm">Cancel</button>
            </div>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium">
            {isNew ? 'Cancel' : 'Close'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : (isNew ? 'Launch Studio' : 'Save Studio')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BANNER MODAL
// ─────────────────────────────────────────────────────────────────────────────

function BannerModal({ studio, token, onClose, onPosted }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError('');
    try {
      await apiCall(`/hpt/studios/${studio.id}/banner`, 'POST', { message }, token);
      onPosted();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally { setSending(false); }
  };

  const handleClear = async () => {
    setSending(true);
    try {
      await apiCall(`/hpt/studios/${studio.id}/banner`, 'DELETE', null, token);
      onPosted();
      onClose();
    } catch (e) { setError(e.message); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: studio.color }} />
            <h3 className="font-bold text-gray-900">Post Studio Banner</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div
            className="rounded-xl border-2 px-4 py-3 text-sm font-medium"
            style={{ borderColor: studio.color, backgroundColor: studio.color + '15', color: studio.color }}
          >
            📢 Preview — {studio.name}
          </div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            placeholder="Type your message for students in this Studio…"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <p className="text-xs text-gray-400">This banner will appear on the Hub page for all students in this Studio. Only one active banner per Studio at a time.</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          {studio.banners?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-700 font-medium mb-1">Current active banner:</p>
              <p className="text-sm text-amber-800">"{studio.banners[0].message}"</p>
              <button onClick={handleClear} className="text-xs text-red-600 mt-2 hover:underline">Clear banner</button>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">Cancel</button>
          <button onClick={handleSend} disabled={sending || !message.trim()} className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
            {sending ? 'Posting…' : 'Post Banner'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP WIZARD — Step 1: Choose method
// ─────────────────────────────────────────────────────────────────────────────

function SetupStep1({ onMethod, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Add New Studio</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">Choose how you'd like to set up your Studio:</p>

          <button
            onClick={() => onMethod('course')}
            className="w-full border-2 border-gray-200 hover:border-purple-400 rounded-2xl p-5 text-left transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">By Course ID</p>
                <p className="text-sm text-gray-500">Enter a Canvas course ID. PlanAssist will automatically find all enrolled students. Membership stays live — no manual student management needed.</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onMethod('key')}
            className="w-full border-2 border-gray-200 hover:border-purple-400 rounded-2xl p-5 text-left transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">By Studio Key</p>
                <p className="text-sm text-gray-500">PlanAssist generates a short unique key. Share it with your students and they enter it in their PlanAssist account to join. Useful for groups that don't share a Canvas course.</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP WIZARD — Step 2a: Course ID input
// ─────────────────────────────────────────────────────────────────────────────

function SetupCourseId({ token, onPreview, onClose }) {
  const [courseId, setCourseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTip, setShowTip] = useState(false);

  const handlePreview = async () => {
    if (!courseId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiCall('/hpt/studios/preview-course', 'POST', { courseId: parseInt(courseId) }, token);
      onPreview(data);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Enter Course ID</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Canvas Course ID</label>
            <input
              type="number"
              value={courseId}
              onChange={e => setCourseId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePreview()}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-mono"
              placeholder="e.g. 7732"
            />
          </div>

          {/* How to find course ID tip */}
          <div className="border border-blue-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowTip(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 text-sm font-medium text-blue-700"
            >
              <span className="flex items-center gap-2"><Info className="w-4 h-4" /> How do I find my course ID?</span>
              {showTip ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {showTip && (
              <div className="px-4 py-3 bg-blue-50 border-t border-blue-200 text-sm text-blue-800 space-y-2">
                <p>Finding a Canvas course ID is easy:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Open Canvas and go to the course.</li>
                  <li>Look at the URL in your browser. It will look something like:<br />
                    <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono">...canvas.instructure.com/courses/<strong>7732</strong></code>
                  </li>
                  <li>The number after <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono">/courses/</code> is your course ID.</li>
                </ol>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium">Back</button>
          <button
            onClick={handlePreview}
            disabled={loading || !courseId.trim()}
            className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Searching…' : 'Preview Studio'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDIOS PAGE
// ─────────────────────────────────────────────────────────────────────────────

function StudiosPage({ token, hptUser, onStudiosChange }) {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allHptUsers, setAllHptUsers] = useState([]);

  // Modal states
  const [setupStep, setSetupStep] = useState(null); // null | 'method' | 'course-id' | 'info'
  const [pendingStudio, setPendingStudio] = useState(null); // data for StudioInfoModal during setup
  const [infoStudio, setInfoStudio] = useState(null);     // existing studio for info modal
  const [bannerStudio, setBannerStudio] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [studiosData, hptData] = await Promise.all([
        apiCall('/hpt/studios', 'GET', null, token),
        apiCall('/hpt/users', 'GET', null, token),
      ]);
      setStudios(studiosData);
      setAllHptUsers(hptData);
      if (onStudiosChange) onStudiosChange(studiosData);
    } catch (e) { console.error('Studios load error:', e.message); }
    finally { setLoading(false); }
  }, [token, onStudiosChange]);

  useEffect(() => { load(); }, [load]);

  // Create studio from info modal form
  const handleLaunchStudio = async (form, studioData) => {
    const created = await apiCall('/hpt/studios', 'POST', {
      setupType: studioData.setup_type,
      courseId: studioData.course_id || null,
      studioKey: studioData.studio_key,
      name: form.name,
      color: form.color,
      zoomNumber: form.zoomNumber,
    }, token);
    setSetupStep(null);
    setPendingStudio(null);
    await load();
    return created;
  };

  // Update existing studio
  const handleSaveStudio = async (form) => {
    await apiCall(`/hpt/studios/${infoStudio.id}`, 'PATCH', form, token);
    setInfoStudio(null);
    await load();
  };

  // Delete studio
  const handleDeleteStudio = async () => {
    await apiCall(`/hpt/studios/${infoStudio.id}`, 'DELETE', null, token);
    setInfoStudio(null);
    await load();
  };

  // Setup flow — choosing method
  const startSetup = () => setSetupStep('method');

  const onMethodChosen = async (method) => {
    if (method === 'course') {
      setSetupStep('course-id');
    } else {
      // Generate a key and go straight to info modal
      const { key } = await apiCall('/hpt/studios/generate-key', 'POST', {}, token);
      setPendingStudio({
        id: null,
        setup_type: 'key',
        studio_key: key,
        course_id: null,
        name: '',
        color: '#7C3AED',
        zoom_number: '',
        members: [],
        sharedWith: [],
        banners: [],
      });
      setSetupStep('info');
    }
  };

  const onCoursePreview = (data) => {
    // Generate a studio_key even for course-type (required field)
    apiCall('/hpt/studios/generate-key', 'POST', {}, token).then(({ key }) => {
      setPendingStudio({
        id: null,
        setup_type: 'course',
        studio_key: key,
        course_id: data.courseId,
        name: data.courseCode || data.courseName || '',
        color: '#7C3AED',
        zoom_number: data.consensusZoom || '',
        members: data.members || [],
        sharedWith: [],
        banners: [],
      });
      setSetupStep('info');
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Studios</h2>
          <p className="text-sm text-gray-500 mt-0.5">Your student groups. Click a Studio to view or edit its details.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={startSetup}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-purple-800 shadow"
          >
            <Plus className="w-4 h-4" /> New Studio
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
            <p className="text-sm text-gray-400">Loading Studios…</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && studios.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-purple-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Studios yet</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">Create your first Studio to start monitoring your students in PlanAssist.</p>
          <button onClick={startSetup} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700">
            + Create Studio
          </button>
        </div>
      )}

      {/* Studio cards grid */}
      {!loading && studios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {studios.map(studio => {
            const memberCount = studio.members?.length || 0;
            const hasActiveBanner = studio.banners?.length > 0;
            return (
              <div
                key={studio.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
              >
                {/* Color bar */}
                <div className="h-1.5" style={{ backgroundColor: studio.color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base truncate">{studio.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${studio.setup_type === 'course' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                          {studio.setup_type === 'course' ? `Course ${studio.course_id}` : `Key: ${studio.studio_key}`}
                        </span>
                      </div>
                    </div>
                    {hasActiveBanner && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-400 mt-1.5" title="Active banner" />
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{memberCount}</p>
                      <p className="text-xs text-gray-500">student{memberCount !== 1 ? 's' : ''}</p>
                    </div>
                    {studio.zoom_number && (
                      <div className="text-center">
                        <p className="text-sm font-mono font-semibold text-gray-700">{studio.zoom_number}</p>
                        <p className="text-xs text-gray-500">Zoom</p>
                      </div>
                    )}
                    {studio.sharedWith?.length > 0 && (
                      <div className="text-center">
                        <p className="text-sm font-semibold text-purple-600">{studio.sharedWith.length}</p>
                        <p className="text-xs text-gray-500">shared</p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setInfoStudio(studio)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                      title="View / Edit info"
                    >
                      <Info className="w-3.5 h-3.5" /> Info
                    </button>
                    <button
                      onClick={() => setBannerStudio(studio)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-purple-50 hover:text-purple-700 rounded-lg"
                      title="Post banner to students"
                    >
                      <Bell className="w-3.5 h-3.5" /> Banner
                    </button>
                    <button
                      onClick={() => { setInfoStudio(studio); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg ml-auto"
                      title="Share with HPT user"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Setup Modals */}
      {setupStep === 'method' && (
        <SetupStep1
          onMethod={onMethodChosen}
          onClose={() => setSetupStep(null)}
        />
      )}
      {setupStep === 'course-id' && (
        <SetupCourseId
          token={token}
          onPreview={onCoursePreview}
          onClose={() => setSetupStep(null)}
        />
      )}
      {setupStep === 'info' && pendingStudio && (
        <StudioInfoModal
          studio={pendingStudio}
          token={token}
          allHptUsers={allHptUsers}
          onClose={() => { setSetupStep(null); setPendingStudio(null); }}
          onSave={async (form) => {
            await handleLaunchStudio(form, pendingStudio);
          }}
          onDelete={() => { setSetupStep(null); setPendingStudio(null); }}
        />
      )}

      {/* Info modal for existing studio */}
      {infoStudio && (
        <StudioInfoModal
          studio={infoStudio}
          token={token}
          allHptUsers={allHptUsers}
          onClose={() => setInfoStudio(null)}
          onSave={handleSaveStudio}
          onDelete={handleDeleteStudio}
        />
      )}

      {/* Banner modal */}
      {bannerStudio && (
        <BannerModal
          studio={bannerStudio}
          token={token}
          onClose={() => setBannerStudio(null)}
          onPosted={load}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HUB PAGE
// ─────────────────────────────────────────────────────────────────────────────

function HubPage({ hptUser, token, studios, onNavigate }) {
  const [hubData, setHubData] = React.useState(null);
  const [insightIndex, setInsightIndex] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setInsightIndex(p => p + 1), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  const [loading, setLoading] = React.useState(true);
  const [statModal, setStatModal] = React.useState(null); // 'today'|'week'|'studytime'|'accuracy'|'streak'

  const load = React.useCallback(async () => {
    try {
      const d = await apiCall('/hpt/hub', 'GET', null, token);
      if (d && d.error) {
        console.error('[HPT HUB] server error:', d.error, d.details || '');
      } else {
        setHubData(d);
      }
    } catch (e) { console.error('[HPT HUB] load error:', e.message); }
    finally { setLoading(false); }
  }, [token]);

  React.useEffect(() => { load(); }, [load]);

  // Auto-refresh feed/stats every 30 seconds
  React.useEffect(() => {
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load]);

  const stats = hubData?.stats || { tasksToday: 0, tasksWeek: 0, totalStudyMins: 0, accuracy: 0, streak: 0 };
  const feed = hubData?.feed || [];
  const leaderboard = hubData?.leaderboard || [];
  const goalSnapshot = hubData?.goalSnapshot || null;
  const inProgress = hubData?.inProgress || 0;
  const studentCount = hubData?.studentCount || 0;

  const formatStudyTime = (mins) => {
    if (!mins) return '0h';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h` : `${m}m`;
  };

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  const medals = ['🥇', '🥈', '🥉'];

  // Stat modal content
  const renderStatModal = () => {
    if (!statModal) return null;
    const configs = {
      today: {
        title: 'Tasks Completed Today',
        value: stats.tasksToday,
        suffix: stats.tasksToday === 1 ? 'task' : 'tasks',
        icon: <Check className="w-8 h-8 text-blue-600" />,
        color: 'blue',
        analysis: stats.tasksToday === 0
          ? `None of your ${studentCount} connected students have completed a task yet today.`
          : stats.tasksToday >= 10
          ? `Great output — ${stats.tasksToday} tasks done today across your ${studentCount} students. Keep the momentum going into tomorrow.`
          : `${stats.tasksToday} task${stats.tasksToday !== 1 ? 's' : ''} completed today across ${studentCount} student${studentCount !== 1 ? 's' : ''}. An average of ${(stats.tasksToday / Math.max(studentCount, 1)).toFixed(1)} tasks per student.`,
      },
      week: {
        title: 'Tasks This Week',
        value: stats.tasksWeek,
        suffix: 'tasks',
        icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
        color: 'purple',
        analysis: stats.tasksWeek === 0
          ? `No completions logged this week yet across your ${studentCount} students.`
          : `${stats.tasksWeek} tasks completed this week by ${studentCount} student${studentCount !== 1 ? 's' : ''}. That's ${(stats.tasksWeek / Math.max(studentCount, 1)).toFixed(1)} tasks per student on average.`,
      },
      studytime: {
        title: 'Total Study Time',
        value: formatStudyTime(stats.totalStudyMins),
        suffix: 'all time',
        icon: <Clock className="w-8 h-8 text-amber-600" />,
        color: 'amber',
        analysis: `${stats.totalStudyMins >= 60 ? `${Math.floor(stats.totalStudyMins / 60)}h ${stats.totalStudyMins % 60}m` : `${stats.totalStudyMins}m`} of total session time logged across all ${studentCount} connected students. This counts completed session and agenda time from PlanAssist tracking.`,
      },
      accuracy: {
        title: 'Time Estimate Accuracy',
        value: `${stats.accuracy}%`,
        suffix: 'avg accuracy',
        icon: <Target className="w-8 h-8 text-green-600" />,
        color: 'green',
        analysis: stats.accuracy === 0
          ? `No sessions with both estimated and actual time logged yet.`
          : stats.accuracy >= 80
          ? `Strong accuracy at ${stats.accuracy}% — your students' time estimates are closely matching actual effort.`
          : stats.accuracy >= 60
          ? `Moderate accuracy at ${stats.accuracy}%. Students are getting better at estimating, but there's room to improve.`
          : `Accuracy is ${stats.accuracy}% — students may be significantly under or over-estimating task time. Encourage more session use to build better self-awareness.`,
      },
      streak: {
        title: 'Group Streak',
        value: stats.streak,
        suffix: stats.streak === 1 ? 'weekday' : 'weekdays',
        icon: <Zap className="w-8 h-8 text-orange-600" />,
        color: 'orange',
        analysis: stats.streak === 0
          ? `No active streak. The streak counts consecutive weekdays (Mon–Fri) where at least one of your connected students completed a task.`
          : `${stats.streak}-day consecutive weekday streak across your ${studentCount} students. This counts each weekday where at least one student completed a task in PlanAssist. Streak shields are not counted.`,
      },
    };
    const cfg = configs[statModal];
    if (!cfg) return null;
    const borderColor = { blue: 'border-blue-200', purple: 'border-purple-200', amber: 'border-amber-200', green: 'border-green-200', orange: 'border-orange-200' }[cfg.color];
    const bgColor = { blue: 'bg-blue-50', purple: 'bg-purple-50', amber: 'bg-amber-50', green: 'bg-green-50', orange: 'bg-orange-50' }[cfg.color];
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={() => setStatModal(null)}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {cfg.icon}
              <h3 className="text-lg font-bold text-gray-900">{cfg.title}</h3>
            </div>
            <button onClick={() => setStatModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className={`${bgColor} ${borderColor} border-2 rounded-xl p-5 text-center mb-4`}>
            <p className="text-5xl font-bold text-gray-900 mb-1">{cfg.value}</p>
            <p className="text-sm text-gray-500">{cfg.suffix}</p>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{cfg.analysis}</p>
          <p className="text-xs text-gray-400 mt-3">Aggregated across all {studentCount} connected student{studentCount !== 1 ? 's' : ''} in all your Studios.</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading Hub…</p>
        </div>
      </div>
    );
  }

  const firstName = hptUser.name?.split(' ')[0] || 'Teacher';

  // Insight for header
  const globalCompletionsToday = hubData?.globalCompletionsToday || 0;
  const globalAvgWeek = hubData?.globalAvgWeek || 0;
  const globalAvgAccuracy = hubData?.globalAvgAccuracy || 0;
  const perStudentWeek = hubData?.perStudentWeek || 0;

  const insights = [];

  // 1. Cohort share of global completions today
  if (stats.tasksToday > 0 && globalCompletionsToday > 0) {
    const pct = Math.round((stats.tasksToday / globalCompletionsToday) * 100);
    if (pct >= 1)
      insights.push(`🌍 Your students contributed ${pct}% of all PlanAssist completions today — ${stats.tasksToday} of ${globalCompletionsToday} global.`);
  }

  // 2. Per-student week vs global average
  if (perStudentWeek > 0 && globalAvgWeek > 0) {
    const ratio = perStudentWeek / globalAvgWeek;
    if (ratio >= 1.3)
      insights.push(`📈 Your students average ${perStudentWeek.toFixed(1)} tasks each this week — ${ratio.toFixed(1)}× the global average of ${globalAvgWeek.toFixed(1)}.`);
    else if (ratio < 0.7)
      insights.push(`📊 Global average is ${globalAvgWeek.toFixed(1)} tasks per student this week — your cohort is at ${perStudentWeek.toFixed(1)}. Consider encouraging more sessions.`);
    else
      insights.push(`📊 Your students are completing ${perStudentWeek.toFixed(1)} tasks each this week, in line with the ${globalAvgWeek.toFixed(1)} global average.`);
  }

  // 3. Cohort accuracy vs global
  if (stats.accuracy > 0 && globalAvgAccuracy > 0) {
    const diff = stats.accuracy - globalAvgAccuracy;
    if (diff >= 5)
      insights.push(`🎯 Your cohort's time accuracy (${stats.accuracy}%) is ${diff}% above the global average — students are estimating their sessions well.`);
    else if (diff <= -5)
      insights.push(`⏱ Cohort accuracy (${stats.accuracy}%) is ${Math.abs(diff)}% below the global average of ${globalAvgAccuracy}% — encourage students to use time estimates more.`);
    else
      insights.push(`🎯 Time accuracy at ${stats.accuracy}% — tracking closely with the global average of ${globalAvgAccuracy}%.`);
  }

  // 4. Group streak
  if (stats.streak >= 5)
    insights.push(`🔥 ${stats.streak}-day consecutive group streak — your cohort hasn't missed a weekday in ${stats.streak} days.`);
  else if (stats.streak >= 2)
    insights.push(`⚡ ${stats.streak}-day group streak! Keep encouraging daily completions to build the chain.`);

  // 5. Total tasks this week with per-student breakdown
  if (stats.tasksWeek > 0 && studentCount > 0) {
    const avg = (stats.tasksWeek / studentCount).toFixed(1);
    insights.push(`📋 ${stats.tasksWeek} tasks completed by your ${studentCount} student${studentCount !== 1 ? 's' : ''} this week — ${avg} per student on average.`);
  }

  // 6. Active session momentum
  if (hubData?.inProgress > 0)
    insights.push(`⚡ ${hubData.inProgress} student${hubData.inProgress !== 1 ? 's' : ''} currently in an active work session right now.`);

  // 7. Study time highlight
  if (stats.totalStudyMins >= 60) {
    const h = Math.floor(stats.totalStudyMins / 60);
    const m = stats.totalStudyMins % 60;
    const perStudent = (stats.totalStudyMins / Math.max(studentCount, 1)).toFixed(0);
    insights.push(`⏱ Your students have logged ${h}h ${m}m of total study time — an average of ${perStudent} min per student.`);
  }

  // 8. No students edge case
  if (studentCount === 0)
    insights.push('💡 No students connected yet — create a Studio and share the key or course ID.');
  else if (insights.length === 0)
    insights.push(`💡 ${studentCount} student${studentCount !== 1 ? 's' : ''} connected across your Studios. Keep an eye on weekly momentum.`);

  const idx = insightIndex % insights.length;
  const insight = insights[idx];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">

      {renderStatModal()}

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-purple-600 text-white rounded-xl p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {firstName}!</h1>
            <p className="text-yellow-100">Here's how your students are doing today</p>
          </div>
          <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-xl px-5 py-4 max-w-xs flex-shrink-0 border border-white border-opacity-20">
            <p className="text-xs text-yellow-200 font-semibold uppercase tracking-wide mb-1.5">Insight</p>
            <p className="text-sm text-white leading-relaxed">{insight}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid — identical layout to student Hub */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-blue-100 cursor-pointer hover:border-blue-300 hover:shadow-lg transition-all" onClick={() => setStatModal('today')}>
          <div className="flex items-center justify-between mb-2">
            <Check className="w-6 h-6 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.tasksToday}</span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Today</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-purple-100 cursor-pointer hover:border-purple-300 hover:shadow-lg transition-all" onClick={() => setStatModal('week')}>
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.tasksWeek}</span>
          </div>
          <p className="text-sm text-gray-600 font-medium">This Week</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-amber-100 cursor-pointer hover:border-amber-300 hover:shadow-lg transition-all" onClick={() => setStatModal('studytime')}>
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-6 h-6 text-amber-600" />
            <span className="text-3xl font-bold text-gray-900">{formatStudyTime(stats.totalStudyMins)}</span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Study Time</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-green-100 cursor-pointer hover:border-green-300 hover:shadow-lg transition-all" onClick={() => setStatModal('accuracy')}>
          <div className="flex items-center justify-between mb-2">
            <Target className="w-6 h-6 text-green-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.accuracy}%</span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Accuracy</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-orange-100 cursor-pointer hover:border-orange-300 hover:shadow-lg transition-all" onClick={() => setStatModal('streak')}>
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-6 h-6 text-orange-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.streak}</span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Day Streak</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Goal Snapshot — ALWAYS shown, never Next Up */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">Goal Snapshot</h2>
              <span className="text-xs text-gray-400 ml-auto">Rotates every 5 min</span>
            </div>
            {goalSnapshot ? (() => {
              const current = parseFloat(goalSnapshot.current_period_score);
              const target = parseFloat(goalSnapshot.target_score);
              const pct = Math.min(100, Math.max(0, (current / target) * 100));
              const gap = (target - current).toFixed(1);
              const isHit = current >= target;
              const color = '#7c3aed'; // courses table has no color column; use PlanAssist purple
              return (
                <div>
                  <p className="text-xs text-gray-400 mb-3">
                    From <span className="font-semibold text-gray-700">{goalSnapshot.user_name}</span>
                    {goalSnapshot.user_grade && <span className="text-gray-400"> · Grade {goalSnapshot.user_grade}</span>}
                  </p>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{goalSnapshot.course_name}</p>
                      {goalSnapshot.grading_period_title && <p className="text-xs text-gray-400 mt-0.5">{goalSnapshot.grading_period_title}</p>}
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full flex-shrink-0 ml-3 ${isHit ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {isHit ? '✓ Goal Hit!' : `${gap}% to go`}
                    </span>
                  </div>
                  <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: isHit
                          ? 'linear-gradient(90deg, #10b981, #059669)'
                          : `linear-gradient(90deg, ${color}, ${color}bb)`,
                        transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Current: <strong className="text-gray-800">{current.toFixed(1)}%</strong></span>
                    <span>Target: <strong className="text-gray-800">{target}%</strong></span>
                  </div>
                  {!isHit && (
                    <p className="text-xs text-gray-400 italic">
                      {parseFloat(gap) < 2 ? '🔥 So close — one strong assessment could do it.' :
                       parseFloat(gap) < 5 ? '📈 Within reach — consistent sessions will close this.' :
                       '💪 A focused stretch of work can close this gap.'}
                    </p>
                  )}
                </div>
              );
            })() : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">No Goal Snapshots yet</p>
                <p className="text-xs text-gray-400 mt-1">Students must set Goals in PlanAssist for snapshots to appear here.</p>
              </div>
            )}
          </div>

          {/* Live Activity Feed */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Live Activity</h2>
              <span className="ml-auto text-xs text-gray-500">Updates every 30s</span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {feed.length > 0 ? feed.map((item, i) => (
                <div key={item.id || i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{item.user_name}</span>
                      {item.user_grade && <span className="text-gray-500"> (Grade {item.user_grade})</span>}
                      {' '}<span className="text-gray-600">completed</span>{' '}
                      <span className="font-medium text-purple-600 break-words">{item.task_title}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.task_class} · {timeAgo(item.completed_at)}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No recent activity</p>
                  <p className="text-xs mt-1 text-gray-400">Student completions will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate('monitor')}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all text-left border-2 border-transparent hover:border-green-200"
            >
              <Monitor className="w-10 h-10 text-green-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">Start Monitoring</h3>
              <p className="text-sm text-gray-600">Live student session view</p>
            </button>
            <button
              onClick={() => onNavigate('marks')}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all text-left border-2 border-transparent hover:border-blue-200"
            >
              <BarChart3 className="w-10 h-10 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">View Marks</h3>
              <p className="text-sm text-gray-600">Grade data from Canvas</p>
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Leaderboard — all connected students, all grades */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-5 h-5 text-yellow-600" />
              <h2 className="text-xl font-bold text-gray-900">Leaders</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">Weekly tasks · All Studios · Resets Monday</p>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {leaderboard.length > 0 ? leaderboard.map((entry, idx) => (
                <div key={entry.user_id} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="w-8 text-center font-bold text-gray-900 flex-shrink-0">
                    {idx < 3 ? medals[idx] : `#${idx + 1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{entry.user_name}</p>
                    {entry.grade && <p className="text-xs text-gray-400">Grade {entry.grade}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-gray-900">{entry.tasks_completed}</p>
                    <p className="text-xs text-gray-500">tasks</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No leaderboard yet</p>
                  <p className="text-xs mt-1 text-gray-400">Students must complete tasks this week</p>
                </div>
              )}
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">In Progress</h2>
            </div>
            <div className="text-center py-6">
              <div className="text-5xl font-bold text-gray-900 mb-2">{inProgress}</div>
              <p className="text-gray-600">tasks with partial time</p>
              {studentCount > 0 && (
                <p className="text-xs text-gray-400 mt-1">across {studentCount} student{studentCount !== 1 ? 's' : ''}</p>
              )}
            </div>
            <button
              onClick={() => onNavigate('monitor')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              View on Monitor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: STUDIO SELECTOR
// Minimalistic pill-style selector used on Monitor and Marks pages
// ─────────────────────────────────────────────────────────────────────────────

function StudioSelector({ studios, selectedId, onSelect }) {
  if (!studios || studios.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Users className="w-4 h-4" />
        No Studios yet — create one on the Studios page.
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Studio:</span>
      {studios.map(s => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
            selectedId === s.id
              ? 'text-white border-transparent shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
          style={selectedId === s.id ? { backgroundColor: s.color || '#7C3AED', borderColor: s.color || '#7C3AED' } : {}}
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedId === s.id ? 'rgba(255,255,255,0.7)' : (s.color || '#7C3AED') }} />
          {s.name}
          <span className={`text-xs ${selectedId === s.id ? 'text-white opacity-70' : 'text-gray-400'}`}>
            ({(s.members || []).length})
          </span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MONITOR PAGE
// ─────────────────────────────────────────────────────────────────────────────

function MonitorPage({ token, studios }) {
  const [selectedStudioId, setSelectedStudioId] = useState(studios[0]?.id || null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = React.useCallback(async (studioId) => {
    if (!studioId) return;
    setLoading(true);
    try {
      const d = await apiCall(`/hpt/studios/${studioId}/monitor`, 'GET', null, token);
      setData(Array.isArray(d) ? d : []);
      setLastRefresh(new Date());
    } catch (e) { console.error('Monitor load error:', e.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    if (selectedStudioId) load(selectedStudioId);
  }, [selectedStudioId, load]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh || !selectedStudioId) return;
    const interval = setInterval(() => load(selectedStudioId), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedStudioId, load]);

  const selectedStudio = studios.find(s => s.id === selectedStudioId);
  const activeCount = data.filter(s => s.isActive).length;
  const studioColor = selectedStudio?.color || '#7C3AED';

  const formatMins = (m) => {
    if (!m) return '0m';
    const h = Math.floor(m / 60), mins = m % 60;
    return h > 0 ? `${h}h ${mins}m` : `${mins}m`;
  };

  const timeSinceHeartbeat = (heartbeat) => {
    if (!heartbeat) return null;
    const secs = Math.floor((Date.now() - new Date(heartbeat).getTime()) / 1000);
    if (secs < 60) return `${secs}s ago`;
    return `${Math.floor(secs / 60)}m ago`;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monitor</h2>
          <p className="text-sm text-gray-500 mt-0.5">Live student activity — updates every 30 seconds</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
              autoRefresh ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
          <button
            onClick={() => selectedStudioId && load(selectedStudioId)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Studio selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 mb-5">
        <StudioSelector studios={studios} selectedId={selectedStudioId} onSelect={id => { setSelectedStudioId(id); setExpandedId(null); }} />
      </div>

      {/* Summary bar */}
      {selectedStudioId && !loading && data.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: studioColor + '20' }}>
              <Activity className="w-5 h-5" style={{ color: studioColor }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-xs text-gray-500">Currently Active</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.reduce((s, d) => s + d.todayCompletions.count, 0)}</p>
              <p className="text-xs text-gray-500">Tasks Done Today</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatMins(data.reduce((s, d) => s + d.todayCompletions.totalMins, 0))}</p>
              <p className="text-xs text-gray-500">Total Study Time</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-[3px] rounded-full animate-spin" style={{ borderColor: studioColor + '40', borderTopColor: studioColor }} />
            <p className="text-sm text-gray-400">Loading student activity…</p>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && selectedStudioId && data.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No students found in this Studio.</p>
        </div>
      )}

      {/* No studio selected */}
      {!selectedStudioId && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Monitor className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Select a Studio above to start monitoring.</p>
        </div>
      )}

      {/* Student rows */}
      {!loading && data.length > 0 && (
        <div className="space-y-2">
          {data
            .sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0) || a.user.name.localeCompare(b.user.name))
            .map(student => {
              const isExpanded = expandedId === student.user.id;
              const est = student.activeTask
                ? (student.activeTask.user_estimated_time || student.activeTask.estimated_time || 0)
                : 0;
              const accum = student.activeTask?.accumulated_time || 0;
              const progress = est > 0 ? Math.min(100, Math.round((accum / est) * 100)) : null;

              return (
                <div
                  key={student.user.id}
                  className={`bg-white rounded-2xl border shadow-sm transition-all ${isExpanded ? 'border-gray-300' : 'border-gray-100'}`}
                >
                  {/* Collapsed row */}
                  <button
                    className="w-full text-left px-5 py-4 flex items-center gap-4"
                    onClick={() => setExpandedId(isExpanded ? null : student.user.id)}
                  >
                    {/* Active indicator */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${student.isActive ? 'bg-green-400 shadow-sm shadow-green-300 animate-pulse' : 'bg-gray-200'}`} />

                    {/* Name + grade */}
                    <div className="w-40 flex-shrink-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{student.user.name}</p>
                      <p className="text-xs text-gray-400">Grade {student.user.grade || '—'}</p>
                    </div>

                    {/* Status pill */}
                    <div className="w-24 flex-shrink-0">
                      {student.isActive ? (
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">
                          <Activity className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-400 text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200">
                          Idle
                        </span>
                      )}
                    </div>

                    {/* Current task */}
                    <div className="flex-1 min-w-0">
                      {student.isActive && student.activeTask ? (
                        <div>
                          <p className="text-sm text-gray-800 font-medium truncate">{student.activeTask.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-400 truncate">{student.activeTask.class}</p>
                            {progress !== null && (
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <div className="w-16 bg-gray-100 rounded-full h-1">
                                  <div className="h-1 rounded-full bg-green-400 transition-all" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="text-xs text-gray-400">{progress}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No active session</p>
                      )}
                    </div>

                    {/* Time logged + urgent */}
                    <div className="flex items-center gap-4 flex-shrink-0 mr-2">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-700">{student.todayCompletions.count} done</p>
                        <p className="text-xs text-gray-400">{formatMins(student.todayCompletions.totalMins)} today</p>
                      </div>
                      {student.urgentTasks.length > 0 && (
                        <span className="flex items-center gap-1 bg-red-50 text-red-600 text-xs font-semibold px-2 py-1 rounded-full border border-red-200">
                          <AlertTriangle className="w-3 h-3" />
                          {student.urgentTasks.length}
                        </span>
                      )}
                    </div>

                    {/* Expand chevron */}
                    <div className="flex-shrink-0 text-gray-300">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                      {/* Active session detail */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Active Session</p>
                        {student.isActive && student.activeTask ? (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                            <p className="font-semibold text-gray-900 text-sm">{student.activeTask.title}</p>
                            <p className="text-xs text-gray-500">{student.activeTask.class}</p>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="bg-white rounded-lg p-2 text-center">
                                <p className="text-base font-bold text-gray-900">{formatMins(accum)}</p>
                                <p className="text-xs text-gray-400">Logged</p>
                              </div>
                              <div className="bg-white rounded-lg p-2 text-center">
                                <p className="text-base font-bold text-gray-900">{formatMins(est)}</p>
                                <p className="text-xs text-gray-400">Estimated</p>
                              </div>
                            </div>
                            {progress !== null && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-500">Progress</span>
                                  <span className="text-xs font-semibold text-green-700">{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className="h-2 rounded-full bg-green-400" style={{ width: `${progress}%` }} />
                                </div>
                              </div>
                            )}
                            <p className="text-xs text-gray-400">
                              Due: {student.activeTask.deadline_date
                                ? new Date(String(student.activeTask.deadline_date).slice(0,10) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : '—'}
                              {student.activeTask.session_heartbeat &&
                                <span className="ml-2 text-green-600">● {timeSinceHeartbeat(student.activeTask.session_heartbeat)}</span>}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                            <p className="text-sm text-gray-400">No active session</p>
                            {student.user.lastSync && (
                              <p className="text-xs text-gray-300 mt-1">
                                Last sync: {new Date(student.user.lastSync).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Today's priorities */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Today's Priorities ({student.priorities.length})
                        </p>
                        {student.priorities.length === 0 ? (
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                            <p className="text-sm text-gray-400">No priorities set today</p>
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {student.priorities.map((t, i) => (
                              <div key={t.id} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-xs ${
                                t.completed ? 'bg-gray-50 opacity-60' : 'bg-white border border-gray-100'
                              }`}>
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                                  t.completed ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                                }`}>{t.completed ? '✓' : i + 1}</span>
                                <div className="min-w-0">
                                  <p className={`font-medium truncate ${t.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.title}</p>
                                  <p className="text-gray-400 truncate">{t.class}</p>
                                </div>
                                <span className="flex-shrink-0 text-gray-400 ml-auto">
                                  {formatMins(t.user_estimated_time || t.estimated_time)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Urgent tasks */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Urgent / Overdue ({student.urgentTasks.length})
                        </p>
                        {student.urgentTasks.length === 0 ? (
                          <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
                            <Check className="w-5 h-5 text-green-500 mx-auto mb-1" />
                            <p className="text-sm text-green-700 font-medium">All caught up!</p>
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {student.urgentTasks.map(t => {
                              const due = new Date(String(t.deadline_date).slice(0,10) + 'T00:00:00');
                              const today = new Date(); today.setHours(0,0,0,0);
                              const overdue = due < today;
                              return (
                                <div key={t.id} className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs border ${
                                  overdue ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                                }`}>
                                  <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${overdue ? 'text-red-500' : 'text-amber-500'}`} />
                                  <div className="min-w-0 flex-1">
                                    <p className={`font-medium truncate ${overdue ? 'text-red-800' : 'text-amber-800'}`}>{t.title}</p>
                                    <p className={`truncate ${overdue ? 'text-red-500' : 'text-amber-500'}`}>
                                      {t.class} · Due {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      {overdue && <span className="font-semibold"> (OVERDUE)</span>}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>{/* end 3-column grid */}

                      {/* Agenda Section — shown when student has an active or recent agenda */}
                      {(student.activeAgenda || (student.agendaHistory && student.agendaHistory.length > 0)) && (() => {
                        const AgendaView = () => {
                          const [showHistory, setShowHistory] = React.useState(false);
                          const [selectedHistory, setSelectedHistory] = React.useState(null);
                          const agenda = showHistory && selectedHistory
                            ? student.agendaHistory.find(a => a.id === selectedHistory)
                            : student.activeAgenda;
                          const rows = agenda?.rows || [];
                          const currentRow = agenda?.currentRow ?? 0;
                          return (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-indigo-600" />
                                  <p className="text-xs font-bold text-indigo-800 uppercase tracking-wide">
                                    {showHistory && selectedHistory ? 'Agenda History' : student.activeAgenda ? `Active Agenda — ${student.activeAgenda.name}` : 'Recent Agenda'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {student.agendaHistory && student.agendaHistory.length > 0 && (
                                    <select
                                      className="text-xs border border-indigo-200 rounded-lg px-2 py-1 bg-white text-indigo-700"
                                      value={selectedHistory || ''}
                                      onChange={e => { const v = e.target.value; setShowHistory(!!v); setSelectedHistory(v ? parseInt(v) : null); }}
                                    >
                                      <option value="">Current</option>
                                      {student.agendaHistory.map(a => (
                                        <option key={a.id} value={a.id}>{a.name} — {new Date(a.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>
                              {rows.length === 0 ? (
                                <p className="text-xs text-indigo-400 italic">No rows in this agenda.</p>
                              ) : (
                                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                  {rows.map((row, idx) => {
                                    const isDone = idx < currentRow;
                                    const isActive = idx === currentRow && !showHistory;
                                    const isFuture = idx > currentRow;
                                    return (
                                      <div key={idx} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${
                                        isActive ? 'bg-indigo-600 text-white' :
                                        isDone ? 'bg-white text-gray-400 opacity-70' :
                                        'bg-white text-gray-700'
                                      }`}>
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px] ${
                                          isActive ? 'bg-white text-indigo-600' :
                                          isDone ? 'bg-green-100 text-green-600' :
                                          'bg-gray-100 text-gray-500'
                                        }`}>
                                          {isDone ? '✓' : idx + 1}
                                        </span>
                                        <span className={`flex-1 truncate font-medium ${isDone ? 'line-through' : ''}`}>{row.task || `Row ${idx + 1}`}</span>
                                        {row.zone && <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>{row.zone}</span>}
                                        <span className={`flex-shrink-0 ${isActive ? 'text-indigo-200' : 'text-gray-400'}`}>{row.timeMins || 25}m</span>
                                        {isActive && agenda?.currentRowCountdown != null && (
                                          <span className="text-white/80 font-mono text-[10px]">
                                            {String(Math.floor(agenda.currentRowCountdown / 60)).padStart(2,'0')}:{String(agenda.currentRowCountdown % 60).padStart(2,'0')} left
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        };
                        return <AgendaView />;
                      })()}
                    </div>
                  )}
                </div>
              );
            })
          }
        </div>
      )}

      {lastRefresh && (
        <p className="text-xs text-gray-400 text-right mt-3">
          Last updated {lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKS PAGE
// ─────────────────────────────────────────────────────────────────────────────

function gradeScoreBg(score) {
  if (score == null) return 'bg-gray-100 text-gray-400';
  if (score >= 80) return 'bg-green-100 text-green-700';
  if (score >= 65) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

function MarksPage({ token, studios }) {
  const [selectedStudioId, setSelectedStudioId] = useState(studios[0]?.id || null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'score_asc' | 'score_desc'

  const load = React.useCallback(async (studioId) => {
    if (!studioId) return;
    setLoading(true);
    try {
      const d = await apiCall(`/hpt/studios/${studioId}/marks`, 'GET', null, token);
      setData(Array.isArray(d) ? d : []);
    } catch (e) { console.error('Marks load error:', e.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    if (selectedStudioId) load(selectedStudioId);
  }, [selectedStudioId, load]);

  const selectedStudio = studios.find(s => s.id === selectedStudioId);
  const studioColor = selectedStudio?.color || '#7C3AED';

  // Per-student average: use current_period_score (active period grade), not final_score
  const avgScore = (courses) => {
    const valid = courses.filter(c => c.current_period_score != null);
    if (valid.length === 0) return null;
    return Math.round(valid.reduce((s, c) => s + parseFloat(c.current_period_score), 0) / valid.length);
  };

  const sorted = [...data].sort((a, b) => {
    if (sortBy === 'name') return a.user.name.localeCompare(b.user.name);
    const aAvg = avgScore(a.courses) ?? -1;
    const bAvg = avgScore(b.courses) ?? -1;
    return sortBy === 'score_desc' ? bAvg - aAvg : aAvg - bAvg;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marks</h2>
          <p className="text-sm text-gray-500 mt-0.5">Student grade data pulled from Canvas</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Sort:</span>
          {[['name','Name'],['score_desc','Best First'],['score_asc','Lowest First']].map(([k,l]) => (
            <button
              key={k}
              onClick={() => setSortBy(k)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                sortBy === k ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              style={sortBy === k ? { backgroundColor: studioColor, borderColor: studioColor } : {}}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Studio selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 mb-5">
        <StudioSelector studios={studios} selectedId={selectedStudioId} onSelect={id => { setSelectedStudioId(id); setExpandedId(null); }} />
      </div>

      {/* Summary bar */}
      {!loading && data.length > 0 && (() => {
        const studentsWithData = data.filter(s => avgScore(s.courses) != null);
        const classAvg = studentsWithData.length > 0
          ? Math.round(studentsWithData.reduce((s, d) => s + avgScore(d.courses), 0) / studentsWithData.length)
          : null;
        const totalMissing = data.reduce((s, d) => s + d.missingCount, 0);
        const totalLate = data.reduce((s, d) => s + d.lateCount, 0);
        return (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: studioColor + '20' }}>
                <Award className="w-5 h-5" style={{ color: studioColor }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{classAvg != null ? `${classAvg}%` : '—'}</p>
                <p className="text-xs text-gray-500">Class Average</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalMissing}</p>
                <p className="text-xs text-gray-500">Missing Across Studio</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalLate}</p>
                <p className="text-xs text-gray-500">Late Across Studio</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-[3px] rounded-full animate-spin" style={{ borderColor: studioColor + '40', borderTopColor: studioColor }} />
            <p className="text-sm text-gray-400">Loading grade data…</p>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && selectedStudioId && data.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No students found in this Studio.</p>
        </div>
      )}

      {!selectedStudioId && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Select a Studio above to view marks.</p>
        </div>
      )}

      {/* Student rows */}
      {!loading && sorted.length > 0 && (
        <div className="space-y-2">
          {sorted.map(student => {
            const isExpanded = expandedId === student.user.id;
            const sAvg = avgScore(student.courses);

            return (
              <div
                key={student.user.id}
                className={`bg-white rounded-2xl border shadow-sm transition-all ${isExpanded ? 'border-gray-300' : 'border-gray-100'}`}
              >
                {/* Collapsed row */}
                <button
                  className="w-full text-left px-5 py-4 flex items-center gap-4"
                  onClick={() => setExpandedId(isExpanded ? null : student.user.id)}
                >
                  {/* Name */}
                  <div className="w-44 flex-shrink-0">
                    <p className="font-semibold text-gray-900 text-sm">{student.user.name}</p>
                    <p className="text-xs text-gray-400">Grade {student.user.grade || '—'}</p>
                  </div>

                  {/* Overall avg */}
                  <div className="flex-shrink-0">
                    <span className={`inline-block text-sm font-bold px-3 py-1 rounded-lg ${gradeScoreBg(sAvg)}`}>
                      {sAvg != null ? `${sAvg}%` : '—'}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5 text-center">Overall avg</p>
                  </div>

                  {/* Course pills — up to 4 visible */}
                  <div className="flex-1 flex items-center gap-1.5 flex-wrap min-w-0 overflow-hidden">
                    {student.courses.slice(0, 5).map(c => (
                      <span
                        key={c.id}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0 ${gradeScoreBg(c.current_period_score)}`}
                        title={c.name}
                      >
                        <span className="max-w-[80px] truncate">{c.course_code || c.name}</span>
                        {c.current_period_score != null && <span className="font-bold">{Math.round(c.current_period_score)}%</span>}
                      </span>
                    ))}
                    {student.courses.length > 5 && (
                      <span className="text-xs text-gray-400">+{student.courses.length - 5} more</span>
                    )}
                  </div>

                  {/* Missing/Late badges */}
                  <div className="flex items-center gap-2 flex-shrink-0 mr-2">
                    {student.missingCount > 0 && (
                      <span className="flex items-center gap-1 bg-red-50 text-red-600 text-xs font-semibold px-2 py-1 rounded-full border border-red-200">
                        <AlertTriangle className="w-3 h-3" /> {student.missingCount} missing
                      </span>
                    )}
                    {student.lateCount > 0 && (
                      <span className="flex items-center gap-1 bg-amber-50 text-amber-600 text-xs font-semibold px-2 py-1 rounded-full border border-amber-200">
                        <Clock className="w-3 h-3" /> {student.lateCount} late
                      </span>
                    )}
                  </div>

                  {/* Chevron */}
                  <div className="flex-shrink-0 text-gray-300">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                      {/* Course table */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">All Courses</p>
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Course</th>
                                <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Period</th>
                                <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Year</th>
                              </tr>
                            </thead>
                            <tbody>
                              {student.courses.map((c, i) => (
                                <tr key={c.id} className={i > 0 ? 'border-t border-gray-100' : ''}>
                                  <td className="px-3 py-2">
                                    <p className="font-medium text-gray-800 text-xs truncate max-w-[160px]">{c.name}</p>
                                    {c.course_code && <p className="text-xs text-gray-400">{c.course_code}</p>}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${gradeScoreBg(c.current_period_score)}`}>
                                      {c.current_period_score != null ? `${Math.round(c.current_period_score)}%` : '—'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${gradeScoreBg(c.year_score)}`}>
                                      {c.year_score != null ? `${Math.round(c.year_score)}%` : '—'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              {student.courses.length === 0 && (
                                <tr><td colSpan={3} className="px-3 py-4 text-center text-xs text-gray-400">No course data available</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Recent grades + missing/late */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Submissions</p>
                          {student.recentGrades.length === 0 ? (
                            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3 border border-gray-200">No recent graded submissions</p>
                          ) : (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {student.recentGrades.map((g, i) => {
                                const pct = g.points_possible > 0 ? Math.round((g.score / g.points_possible) * 100) : null;
                                return (
                                  <div key={i} className="flex items-center justify-between gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium text-gray-800 truncate">{g.assignment_title}</p>
                                      <p className="text-xs text-gray-400 truncate">{g.course_name}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${gradeScoreBg(pct)}`}>
                                        {g.score != null ? `${g.score}/${g.points_possible}` : g.grade || '—'}
                                        {pct != null && <span className="ml-1 opacity-70">({pct}%)</span>}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {(student.missingCount > 0 || student.lateCount > 0) && (
                          <div className="flex gap-3">
                            {student.missingCount > 0 && (
                              <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                                <p className="text-xl font-bold text-red-700">{student.missingCount}</p>
                                <p className="text-xs text-red-500">Missing</p>
                              </div>
                            )}
                            {student.lateCount > 0 && (
                              <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                                <p className="text-xl font-bold text-amber-700">{student.lateCount}</p>
                                <p className="text-xs text-amber-500">Late</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HPT LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

function HPTLoginPage({ onLogin, onBack }) {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiCall('/hpt/auth/login', 'POST', { passcode });
      onLogin(data);
    } catch (e) {
      setError('Invalid passcode. Please check with your administrator.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-purple-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 relative">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-purple-600 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-purple-700 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-xs font-bold leading-none">H</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PlanAssist</h1>
          <p className="text-lg font-semibold text-purple-600">HPT Mode</p>
          <button
            onClick={onBack}
            className="mt-2 text-sm text-gray-400 hover:text-purple-600 underline underline-offset-2 transition-colors"
          >
            Student? Click Here
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Passcode</label>
            <input
              type="password"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your passcode"
              autoFocus
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Please wait...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT HPT APP
// ─────────────────────────────────────────────────────────────────────────────

export default function AppHPT({ onBack }) {
  const [hptUser, setHptUser] = useState(() => {
    try {
      const stored = localStorage.getItem('planassist-hpt-user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('planassist-hpt-token') || null);
  const [currentPage, setCurrentPage] = useState('hub');
  const [studios, setStudios] = useState([]);

  const handleLogin = (data) => {
    const { token: t, ...user } = data;
    setToken(t);
    setHptUser(user);
    localStorage.setItem('planassist-hpt-token', t);
    localStorage.setItem('planassist-hpt-user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setToken(null);
    setHptUser(null);
    localStorage.removeItem('planassist-hpt-token');
    localStorage.removeItem('planassist-hpt-user');
  };

  const NAV_ITEMS = [
    { id: 'hub',      label: 'Hub',      icon: Home },
    { id: 'studios',  label: 'Studios',  icon: Users },
    { id: 'monitor',  label: 'Monitor',  icon: Monitor },
    { id: 'marks',    label: 'Marks',    icon: BarChart3 },
  ];

  const [darkMode, setDarkMode] = React.useState(() => localStorage.getItem('planassist-hpt-dark') === 'true');

  // Inject scrollbar CSS + dark mode into document.head
  React.useEffect(() => {
    const id = 'planassist-hpt-styles';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('style');
      el.id = id;
      document.head.appendChild(el);
    }
    const dark = darkMode;
    el.textContent = `
      html, body { overflow: hidden; margin: 0; padding: 0; }
      .planassist-hpt ::-webkit-scrollbar { width: 7px; height: 7px; }
      .planassist-hpt ::-webkit-scrollbar-track { background: ${dark ? '#0d0d14' : '#f1f5f9'}; }
      .planassist-hpt ::-webkit-scrollbar-thumb { background: ${dark ? '#3d3d6b' : '#cbd5e1'}; border-radius: 4px; }
      .planassist-hpt ::-webkit-scrollbar-thumb:hover { background: ${dark ? '#7c4dff' : '#7c3aed'}; }
      .planassist-hpt * { scrollbar-color: ${dark ? '#3d3d6b #0d0d14' : '#cbd5e1 #f1f5f9'}; scrollbar-width: thin; }
      .planassist-hpt .scrollbar-stable { scrollbar-gutter: stable; }
      ${dark ? `
      .planassist-hpt { background: #0d0d14 !important; color: #e2e8f0 !important; }
      .planassist-hpt nav { background: #13131f !important; border-color: #2d2d4a !important; }
      .planassist-hpt .bg-white { background: #13131f !important; }
      .planassist-hpt .bg-gray-50 { background: #1a1a2e !important; }
      .planassist-hpt .bg-gray-100 { background: #1e1e30 !important; }
      .planassist-hpt .border-gray-100 { border-color: #2d2d4a !important; }
      .planassist-hpt .border-gray-200 { border-color: #3d3d6b !important; }
      .planassist-hpt .text-gray-900 { color: #f1f5f9 !important; }
      .planassist-hpt .text-gray-800 { color: #e2e8f0 !important; }
      .planassist-hpt .text-gray-700 { color: #cbd5e1 !important; }
      .planassist-hpt .text-gray-600 { color: #b39ddb !important; }
      .planassist-hpt .text-gray-500 { color: #94a3b8 !important; }
      .planassist-hpt .text-gray-400 { color: #64748b !important; }
      .planassist-hpt .hover\\:bg-gray-100:hover { background: #1e1e30 !important; }
      .planassist-hpt .hover\\:bg-gray-50:hover { background: #1a1a2e !important; }
      .planassist-hpt .shadow-sm { box-shadow: 0 1px 3px rgba(0,0,0,0.5) !important; }
      ` : ''}
    `;
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    return () => { el.textContent = ''; };
  }, [darkMode]);

  useEffect(() => {
    if (!token) return;
    apiCall('/hpt/studios', 'GET', null, token)
      .then(d => setStudios(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [token]);

  if (!hptUser || !token) {
    return <HPTLoginPage onLogin={handleLogin} onBack={onBack} />;
  }

  return (
    <div className="planassist-hpt h-screen overflow-hidden bg-gradient-to-br from-yellow-50 via-purple-50 to-blue-50 flex flex-col">
      {/* Top nav bar — flex-shrink-0 so it never participates in height distribution */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* LEFT: logo + name — identical to PlanAssist logo block */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-700 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-white text-[9px] font-bold leading-none">H</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">PlanAssist</h1>
                <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">HPT Mode</span>
              </div>
              <p className="text-sm text-gray-600">{hptUser.name}</p>
            </div>
          </div>

          {/* RIGHT: nav buttons + account + logout */}
          <div className="flex items-center gap-2">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentPage(id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === id ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
            <button
              onClick={() => setCurrentPage('account')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'account' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Account"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg flex items-center gap-2 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto scrollbar-stable">
        {currentPage === 'hub'     && <HubPage hptUser={hptUser} token={token} studios={studios} onNavigate={setCurrentPage} />}
        {currentPage === 'studios' && <StudiosPage token={token} hptUser={hptUser} onStudiosChange={setStudios} />}
        {currentPage === 'monitor' && <MonitorPage token={token} studios={studios} />}
        {currentPage === 'marks'   && <MarksPage   token={token} studios={studios} />}
        {currentPage === 'account' && (
          <div className="p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Account</h1>
                <p className="text-sm text-gray-500">{hptUser.name}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-500" /> Settings
              </h2>
              <div className="space-y-4">
                {/* Dark Mode */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {darkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Dark Mode</p>
                      <p className="text-xs text-gray-500">{darkMode ? 'Dark theme active' : 'Light theme active'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const next = !darkMode;
                      setDarkMode(next);
                      localStorage.setItem('planassist-hpt-dark', String(next));
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${darkMode ? 'bg-purple-600' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
