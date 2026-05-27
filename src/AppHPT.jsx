// PlanAssist — HPT Mode (High Performing Team)
// AppHPT.jsx — Teacher/Staff Interface

import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, LogOut, Home, Users, X, Plus, Trash2, Bell, Share2,
  Info, RefreshCw, Check, ChevronDown, ChevronRight, Search,
  AlertCircle, Copy, Eye, Zap, Target, BarChart3,
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
                          <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Period</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((m, i) => (
                          <tr key={m.id || i} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium text-gray-800">{m.name}</td>
                            <td className="px-4 py-2 text-gray-500">Gr {m.grade || '—'}</td>
                            <td className={`px-4 py-2 text-right font-semibold ${gradeColor(m.current_period_score)}`}>
                              {m.current_period_score != null ? `${m.current_period_score}%` : '—'}
                            </td>
                            <td className={`px-4 py-2 text-right font-semibold ${gradeColor(m.final_score)}`}>
                              {m.final_score != null ? `${m.final_score}%` : '—'}
                            </td>
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

function StudiosPage({ token, hptUser }) {
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
    } catch (e) { console.error('Studios load error:', e.message); }
    finally { setLoading(false); }
  }, [token]);

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
// HUB PAGE (placeholder)
// ─────────────────────────────────────────────────────────────────────────────

function HubPage({ hptUser }) {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-purple-600 rounded-2xl flex items-center justify-center">
          <Home className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hub</h2>
          <p className="text-sm text-gray-500">Welcome back, {hptUser.name}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
        <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-400 mb-2">Hub Coming Soon</h3>
        <p className="text-sm text-gray-400">This area will show your studio overview, student activity summaries, and more.</p>
      </div>
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

  if (!hptUser || !token) {
    return <HPTLoginPage onLogin={handleLogin} onBack={onBack} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-purple-50 to-blue-50 flex flex-col">
      {/* Top nav bar — identical structure/sizing/style to PlanAssist */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo — same w-10 h-10 tile as PlanAssist, H badge differentiates */}
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
              <h1 className="text-xl font-bold text-gray-900">PlanAssist</h1>
              <p className="text-sm text-purple-600 font-medium">HPT Mode</p>
            </div>
          </div>

          {/* Nav buttons — same px-4 py-2 rounded-lg gap-2 pattern as PlanAssist */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage('hub')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'hub' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Hub</span>
            </button>
            <button
              onClick={() => setCurrentPage('studios')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'studios' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Studios</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg flex items-center gap-2 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Right: teacher name — mirrors the student name shown in PlanAssist nav */}
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{hptUser.name}</h1>
              <p className="text-sm text-gray-600">HPT Staff</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">
        {currentPage === 'hub' && <HubPage hptUser={hptUser} />}
        {currentPage === 'studios' && <StudiosPage token={token} hptUser={hptUser} />}
      </main>
    </div>
  );
}
