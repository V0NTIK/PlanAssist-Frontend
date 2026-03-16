// PlanAssist - OneSchool Global Study Planner Frontend (ENHANCED)
// App.jsx - PART 1: Imports and State

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Play, Check, Settings, BarChart3, List, Home, LogOut, BookOpen, Brain, TrendingUp, AlertCircle, Upload, Save, Pause, X, Send, GripVertical, Lock, Unlock, Info, Edit2, FileText, Trophy, Zap, Target, Award, TrendingDown, Timer, RefreshCw, LayoutList, Trash2, Plus, ClipboardList, Shield, Ban, UserCheck, Search, Bell, ChevronDown, ChevronRight, Eye, AlertTriangle, HelpCircle, CheckCircle, UserCircle } from 'lucide-react';

const API_URL = 'https://planassist-api.onrender.com/api';

// ── EditUserForm helper (used inside Admin Console) ─────────────────────────
const EditUserForm = ({ user, onSave, onCancel, currentUserId }) => {
  const [form, setForm] = React.useState({
    name: user.name || '',
    grade: user.grade || '',
    present_periods: user.present_periods || '',
    is_admin: user.is_admin || false,
  });
  return (
    <div className="space-y-3 mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
          <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-red-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Grade</label>
          <input value={form.grade} onChange={e => setForm(p => ({...p, grade: e.target.value}))}
            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-red-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Present Periods</label>
          <input value={form.present_periods} onChange={e => setForm(p => ({...p, present_periods: e.target.value}))}
            placeholder="e.g. 2-6"
            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-red-500" />
        </div>
        <div className="flex items-center gap-2 pt-4">
          <input type="checkbox" id="isAdminCheck" checked={form.is_admin}
            onChange={e => {
              if (!e.target.checked && user.id === currentUserId) return; // no self-demotion
              setForm(p => ({...p, is_admin: e.target.checked}));
            }}
            className="w-4 h-4 text-red-600 rounded" />
          <label htmlFor="isAdminCheck" className="text-sm font-medium text-gray-700">Admin</label>
          {user.id === currentUserId && <span className="text-xs text-gray-400">(can't remove own admin)</span>}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={() => onSave(form)} className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700">Save Changes</button>
      </div>
    </div>
  );
};

const PlanAssist = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState(null);   // deferred install event
  const [showPwaBanner, setShowPwaBanner] = useState(false);         // show install banner
  const [isAppLoading, setIsAppLoading] = useState(false);
  // calendarTasks removed - calendar now reads from `tasks` state directly
  const [calendarExpandedId, setCalendarExpandedId] = useState(null);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // App state
  const [currentPage, setCurrentPage] = useState('hub');
  const [accountSetup, setAccountSetup] = useState({
    name: '',
    grade: '',
    canvasApiToken: '',
    presentPeriods: '2-6',
    schedule: {},
    classColors: {},
    calendarShowHomeroom: true,
    calendarShowCompleted: true,
    calendarShowPrevWeek: false,
    calendarShowCurrentWeek: true,
    calendarShowNextWeek1: false,
    calendarShowNextWeek2: false,
    calendarShowWeekends: true
  });
  const [tasks, setTasks] = useState([]);
  const [sessionTasks, setSessionTasks] = useState([]);
  const [currentSessionTask, setCurrentSessionTask] = useState(null);
  const [sessionElapsed, setSessionElapsed] = useState(0); // seconds, counts up
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerStartWallRef = React.useRef(null);
  const timerBaseElapsedRef = React.useRef(0); // seconds accumulated before current run
  const [showSessionComplete, setShowSessionComplete] = useState(false);

  // ── Itinerary & Enhance Schedule state ───────────────────────────────────
  const [scheduleEnhanced, setScheduleEnhanced] = useState(false);
  const [showEnhanceDialog, setShowEnhanceDialog] = useState(false);   // full-screen enhance flow
  const [enhanceStep, setEnhanceStep] = useState(1);                   // 1=courses, 2=zoom
  const [enhanceLessons, setEnhanceLessons] = useState({});            // { 'Monday-3': { courseId, courseName } }
  const [enhanceZoom, setEnhanceZoom] = useState({});                  // { courseId: zoomNumber }
  const [scheduleLessons, setScheduleLessons] = useState([]);           // from DB after enhance
  const [itinerarySlots, setItinerarySlots] = useState({});            // { period: { agendaId, agendaName } }
  const [itineraryDate, setItineraryDate] = useState(null);              // Date object for currently viewed itinerary date
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [showAddAgendaSlot, setShowAddAgendaSlot] = useState(null);    // period number being picked
  const [tutorials, setTutorials] = useState({});          // { 'Monday-3': { zoom_number, topic, period, day } }
  const [showTutorialDialog, setShowTutorialDialog] = useState(null); // { day, period } or 'hub'
  const [tutorialZoom, setTutorialZoom] = useState('');
  const [tutorialTopic, setTutorialTopic] = useState('');
  const [tutorialDay, setTutorialDay] = useState('');     // for hub booking (kept for compat)
  const [tutorialDate, setTutorialDate] = useState('');   // ISO date string for hub booking
  const [tutorialPeriod, setTutorialPeriod] = useState('');
  const [isSavingTutorial, setIsSavingTutorial] = useState(false);
  const [checkingTask, setCheckingTask] = useState(null);    // taskId being checked off
  const [showAddTask, setShowAddTask] = useState(false);
  const [addTaskForm, setAddTaskForm] = useState({ title: '', deadlineDate: '', deadlineTime: '', estimatedTime: '', description: '', url: '' });
  const [isSavingManualTask, setIsSavingManualTask] = useState(false);

  // ── Admin state ───────────────────────────────────────────────────────────
  const [announcements, setAnnouncements] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminSelectedUser, setAdminSelectedUser] = useState(null);
  const [adminUserDetail, setAdminUserDetail] = useState(null);
  const [adminDiagnostics, setAdminDiagnostics] = useState(null);
  const [adminAuditLog, setAdminAuditLog] = useState([]);
  const [adminSection, setAdminSection] = useState('users');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminAnnouncements, setAdminAnnouncements] = useState([]);
  const [newAnnouncementMsg, setNewAnnouncementMsg] = useState('');
  const [newAnnouncementType, setNewAnnouncementType] = useState('info');
  const [banReason, setBanReason] = useState('');
  const [showBanDialog, setShowBanDialog] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [adminHelpContent, setAdminHelpContent] = useState('');
  const [adminHelpSaving, setAdminHelpSaving] = useState(false);
  // Account & Analytics page state
  const [accountTab, setAccountTab] = useState('settings');
  const [resolvedTasks, setResolvedTasks] = useState([]);
  const [resolvedSearch, setResolvedSearch] = useState('');
  const [resolvedSort, setResolvedSort] = useState('created_at');
  const [resolvedLoading, setResolvedLoading] = useState(false);
  const [editingActualTime, setEditingActualTime] = useState(null);
  const [editingActualTimeVal, setEditingActualTimeVal] = useState('');
  const [activityFilter, setActivityFilter] = useState('grades');
  // Activity sub-tab data
  const [gradesItems, setGradesItems] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [announcementItems, setAnnouncementItems] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [discussionItems, setDiscussionItems] = useState([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [activityItems, setActivityItems] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPollingRef, setActivityPollingRef] = useState(null);
  const [gradeMiniSyncRef, setGradeMiniSyncRef] = useState(null);
  const [helpContent, setHelpContent] = useState('');

  const [isSavingEnhance, setIsSavingEnhance] = useState(false);
  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);

  // ── Agendas state ──────────────────────────────────────────────────────────
  const [agendas, setAgendas] = useState([]);
  const [agendasLoading, setAgendasLoading] = useState(false);
  const [currentAgenda, setCurrentAgenda] = useState(null);
  // Active agenda runtime state
  const [agendaCurrentRow, setAgendaCurrentRow] = useState(0);
  const [agendaElapsed, setAgendaElapsed] = useState(0);         // seconds on in-session timer
  const [agendaCountdown, setAgendaCountdown] = useState(null);  // seconds remaining on countdown
  const [agendaCountdownFlash, setAgendaCountdownFlash] = useState(false);
  const [agendaBaseElapsed, setAgendaBaseElapsed] = useState(0); // task's accumulated_time in secs at row open
  const [agendaRunning, setAgendaRunning] = useState(false);
  const agendaTimerRef = React.useRef(null);    // { intervalRef, wallRef, baseElapsed, baseCountdown }
  const [agendaProceedLoading, setAgendaProceedLoading] = useState(false);
  const [agendaTotalElapsed, setAgendaTotalElapsed] = useState(0); // accumulated across all rows
  const [agendaFinishedSummary, setAgendaFinishedSummary] = useState(null); // { name, totalSecs }
  // Build / edit agenda
  const [showBuildAgenda, setShowBuildAgenda] = useState(false);
  const [buildAgendaName, setBuildAgendaName] = useState('');
  const [buildAgendaRows, setBuildAgendaRows] = useState([]);    // [{taskId, action, timeMins}]
  const [editingAgenda, setEditingAgenda] = useState(null);      // agenda being edited
  const [editAgendaRows, setEditAgendaRows] = useState([]);
  const [completionHistory, setCompletionHistory] = useState([]);

  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSplitTask, setShowSplitTask] = useState(null);
  const [splitSegments, setSplitSegments] = useState([{ name: 'Part 1' }]);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [addSessionForm, setAddSessionForm] = useState({ period: '2' });
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null);
  const [newTasks, setNewTasks] = useState([]);
  const [showTaskDescription, setShowTaskDescription] = useState(null);
  const [newTasksSidebarOpen, setNewTasksSidebarOpen] = useState(false);
  const savedCanvasTokenRef = React.useRef(''); // tracks last-saved token to avoid unnecessary syncs
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [editingTimeTaskId, setEditingTimeTaskId] = useState(null);
  const [tempTimeValue, setTempTimeValue] = useState('');
  const [markingComplete, setMarkingComplete] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [partialTaskTimes, setPartialTaskTimes] = useState({}); // Track accumulated time for partially completed tasks
  // Workspace state
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [workspaceTask, setWorkspaceTask] = useState(null);
  const [workspaceNotes, setWorkspaceNotes] = useState('');
  const [workspaceTab, setWorkspaceTab] = useState('canvas');
  const [savingNotes, setSavingNotes] = useState(false);
  const [canvasWindow, setCanvasWindow] = useState(null);
  const [workspaceSource, setWorkspaceSource] = useState('session'); // 'session' | 'agenda'
  const [workspaceToolEmbed, setWorkspaceToolEmbed] = useState(null); // null | 'calculator' | 'desmos'
  const [workspaceIntegrationEmbed, setWorkspaceIntegrationEmbed] = useState(null); // null | integration key
  const [workspaceEmbedZoom, setWorkspaceEmbedZoom] = useState(1.0); // zoom scale for inline embeds
  // Free timer state (Session workspace Timer tab only)
  const [freeTimerMins, setFreeTimerMins] = useState('');
  const [freeTimerSecs, setFreeTimerSecs] = useState(0);
  const [freeTimerRunning, setFreeTimerRunning] = useState(false);
  const [freeTimerDone, setFreeTimerDone] = useState(false);
  const freeTimerIntervalRef = React.useRef(null);
  
  // Whiteboard state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#000000');
  const [drawWidth, setDrawWidth] = useState(3);
  const whiteboardRef = React.useRef(null);
  const [whiteboardInitialized, setWhiteboardInitialized] = useState(false);
  
  // White noise state
  const [whiteNoiseAudio, setWhiteNoiseAudio] = useState(null);
  const [whiteNoiseType, setWhiteNoiseType] = useState('rain');
  const [whiteNoiseVolume, setWhiteNoiseVolume] = useState(0.5);
  const [isWhiteNoisePlaying, setIsWhiteNoisePlaying] = useState(false);
  
  // ── Count-up wall-clock timer for sessions ─────────────────────────────
  useEffect(() => {
    if (!isTimerRunning) return;
    const baseAtStart = timerBaseElapsedRef.current;
    const wallAtStart = Date.now();
    timerStartWallRef.current = wallAtStart;
    const interval = setInterval(() => {
      const wallElapsed = Math.floor((Date.now() - wallAtStart) / 1000);
      setSessionElapsed(baseAtStart + wallElapsed);
    }, 500);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isTimerRunning && timerStartWallRef.current !== null) {
        const wallElapsed = Math.floor((Date.now() - timerStartWallRef.current) / 1000);
        setSessionElapsed(timerBaseElapsedRef.current + wallElapsed);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTimerRunning]);

  // Pomodoro timer state
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes in seconds
  const [pomodoroMode, setPomodoroMode] = useState('work'); // 'work', 'shortBreak', 'longBreak'
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [pomodoroSessions, setPomodoroSessions] = useState(0);
  
  // Notes popup state (for quick notes from task list)
  const [showNotesPopup, setShowNotesPopup] = useState(null);
  const [popupNotes, setPopupNotes] = useState('');
  const [popupNotesSaving, setPopupNotesSaving] = useState(false);
  const [popupNotesLastSaved, setPopupNotesLastSaved] = useState(null);
  const [tasksWithNotes, setTasksWithNotes] = useState(new Set());

  // Marks / courses state
  const [courses, setCourses] = useState([]);
  const [courseAverages, setCourseAverages] = useState({});

  // Hub features state
  const [completionFeed, setCompletionFeed] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userLeaderboardPosition, setUserLeaderboardPosition] = useState(null);
  
  const [hubStats, setHubStats] = useState({
    tasksCompletedToday: 0,
    tasksCompletedWeek: 0,
    totalStudyTime: 0,
    averageAccuracy: 0,
    streak: 0
  });

  // Calculate selected periods based on presentPeriods
  const selectedPeriods = React.useMemo(() => {
    const [start, end] = accountSetup.presentPeriods.split('-').map(Number);
    const periods = [];
    for (let i = start; i <= end; i++) {
      periods.push(i);
    }
    return periods;
  }, [accountSetup.presentPeriods]);

  // Extract class name from task class field or title
  const extractClassName = (task) => {
    // Safety check: ensure task exists
    if (!task) return 'No Class';
    
    // If task has a class field, use it directly
    if (task.class) {
      return task.class.replace(/[\[\]]/g, ''); // Remove brackets if present
    }
    
    // Safety check: ensure title exists before matching
    if (!task.title) return 'No Class';
    
    // Fallback to title parsing (for legacy or imported tasks)
    const match = task.title.match(/\[([^\]]+)\]/);
    return match ? match[1] : 'No Class';
  };

  // Display task title with segment if present
  const cleanTaskTitle = (task) => {
    if (!task || !task.title) return '';
    const baseTitle = task.title.replace(/\s*\[([^\]]+)\]\s*/, '').trim();
    return task.segment ? `${baseTitle} - ${task.segment}` : baseTitle;
  };

  // Get color for a class
  const getClassColor = (taskOrClassName) => {
    // Handle if passed a string directly (className)
    let className;
    if (typeof taskOrClassName === 'string') {
      className = taskOrClassName;
    } else {
      // It's a task object
      className = extractClassName(taskOrClassName);
    }
    
    if (accountSetup.classColors[className]) {
      return accountSetup.classColors[className];
    }
    // Generate a consistent color based on class name
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#14b8a6'];
    let hash = 0;
    for (let i = 0; i < className.length; i++) {
      hash = className.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Group tasks by day and due date
  const groupTasksByDay = (taskList) => {
    const grouped = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    
    taskList.forEach(task => {
      if (!task.completed) {
        const dueDate = new Date(task.dueDate);
        
        // Normalize the due date to just the date part for comparison
        // If it's 11:59 PM, that counts as being due "that day"
        const normalizedDueDate = new Date(
          dueDate.getFullYear(), 
          dueDate.getMonth(), 
          dueDate.getDate(),
          0, 0, 0, 0
        );
        
        // Only include tasks from today onwards
        if (normalizedDueDate >= today) {
          const dayKey = normalizedDueDate.toDateString();
          if (!grouped[dayKey]) {
            grouped[dayKey] = [];
          }
          grouped[dayKey].push(task);
        }
      }
    });
    
    return grouped;
  };

  // API helper
  const apiCall = async (endpoint, method = 'GET', body = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }
    return response.json();
  };
  
  // Check for existing session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedColors = localStorage.getItem('classColors');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      setIsAppLoading(true);
      if (savedColors) {
        setAccountSetup(prev => ({ ...prev, classColors: JSON.parse(savedColors) }));
      }
      loadUserData(savedToken).finally(() => setIsAppLoading(false));
      loadAnnouncements(savedToken);
    }
  }, []);

  // Poll for new announcements every 60 seconds while authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => loadAnnouncements(), 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Capture the browser's PWA install prompt for our custom UI
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault(); // stop the browser's default mini-infobar
      setPwaInstallPrompt(e);
      // Only show banner if not already installed and user hasn't dismissed
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        const dismissed = localStorage.getItem('pwa-banner-dismissed');
        if (!dismissed) setShowPwaBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Load user data
  const loadUserData = async (authToken) => {
    try {
      const setupData = await fetch(`${API_URL}/account/setup`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).then(r => r.json());

      const savedColors = localStorage.getItem('classColors');
      const savedUser = localStorage.getItem('user');
      const userName = savedUser ? JSON.parse(savedUser).name : '';
      
      if (setupData.grade) {
        setAccountSetup({
          name: userName || '',
          grade: setupData.grade || '',
          canvasApiToken: setupData.canvasApiToken || '',
          presentPeriods: setupData.presentPeriods || '2-6',
        calendarShowHomeroom: setupData.calendarShowHomeroom ?? true,
        calendarShowCompleted: setupData.calendarShowCompleted ?? true,
        calendarShowPrevWeek: setupData.calendarShowPrevWeek ?? false,
        calendarShowCurrentWeek: setupData.calendarShowCurrentWeek ?? true,
        calendarShowNextWeek1: setupData.calendarShowNextWeek1 ?? false,
        calendarShowNextWeek2: setupData.calendarShowNextWeek2 ?? false,
        calendarShowWeekends: setupData.calendarShowWeekends ?? true,
          schedule: setupData.schedule || {},
          scheduleEnhanced: setupData.schedule_enhanced || false,
          classColors: savedColors ? JSON.parse(savedColors) : {}
        });
        setScheduleEnhanced(setupData.schedule_enhanced || false);
        // Sync name + isAdmin from DB (in case admin changed it)
        if (setupData.name) {
          setUser(prev => prev ? { ...prev, name: setupData.name, isAdmin: setupData.is_admin || false } : prev);
          setAccountSetup(prev => ({ ...prev, name: setupData.name }));
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            localStorage.setItem('user', JSON.stringify({ ...parsed, name: setupData.name, isAdmin: setupData.is_admin || false }));
          }
        }
        if (setupData.schedule_enhanced) {
          // Use authToken directly — React state `token` may not be set yet at this point
          fetch(`${API_URL}/schedule/lessons`, {
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
          }).then(r => r.ok ? r.json() : []).then(data => setScheduleLessons(data || [])).catch(() => {});
        }
        savedCanvasTokenRef.current = setupData.canvasApiToken || '';
        
        // Update user object with grade + isAdmin (merge, don't clobber prior setUser)
        setUser(prev => {
          const merged = { ...(prev || {}), grade: setupData.grade, isAdmin: setupData.is_admin || false };
          localStorage.setItem('user', JSON.stringify(merged));
          return merged;
        });
      } else {
        // If no grade setup yet, still set the name
        setAccountSetup(prev => ({
          ...prev,
          name: userName || '',
          classColors: savedColors ? JSON.parse(savedColors) : {}
        }));
      }

      const tasksData = await fetch(`${API_URL}/tasks`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).then(r => r.json());

      if (tasksData.length > 0) {
        const loadedTasks = tasksData.filter(t => !t.is_new).map(t => {
          // Convert deadline_date and deadline_time to local Date object
          let dueDate;
          let hasSpecificTime = false;
          
          // Handle new format (deadline_date + deadline_time)
          if (t.deadline_date) {
            // PostgreSQL DATE columns come back as ISO timestamps
            let dateString = t.deadline_date;
            if (typeof dateString !== 'string') {
              dateString = new Date(dateString).toISOString();
            }
            const datePart = dateString.split('T')[0]; // "2025-11-24"
            
            if (t.deadline_time !== null && t.deadline_time !== undefined) {
              // Has specific time - convert from UTC to local
              const utcDatetime = `${datePart}T${t.deadline_time}Z`;
              dueDate = new Date(utcDatetime);
              hasSpecificTime = true;
            } else {
              // Date-only task - use 23:59:00 in local timezone
              dueDate = new Date(`${datePart}T23:59:00`);
              hasSpecificTime = false;
            }
          }
          // Fallback for old format (single deadline column) - should not happen after migration
          else if (t.deadline) {
            console.warn('Task using old deadline format:', t.id, t.title);
            dueDate = new Date(t.deadline);
            hasSpecificTime = true;
          }
          // No deadline at all - use today as fallback
          else {
            console.error('Task missing deadline:', t.id, t.title);
            dueDate = new Date();
            hasSpecificTime = false;
          }
          
          return {
            id: t.id,
            title: t.title,
            segment: t.segment,
            class: t.class,
            description: t.description,
            url: t.url,
            dueDate: dueDate,
            hasSpecificTime: hasSpecificTime,
            estimatedTime: t.estimated_time,
            userEstimate: t.user_estimated_time,
            accumulatedTime: t.accumulated_time || 0,
            priorityOrder: t.priority_order,
            completed: t.completed,
            deleted: t.deleted || false,
            submittedAt: t.submitted_at || null,
            deadlineDateRaw: t.deadline_date
              ? (typeof t.deadline_date === 'string' ? t.deadline_date.split('T')[0] : new Date(t.deadline_date).toISOString().split('T')[0])
              : null
          };
        });
        
        const loadedNewTasks = tasksData.filter(t => t.is_new).map(t => {
          // Convert deadline_date and deadline_time to local Date object
          let dueDate;
          let hasSpecificTime = false;
          
          // Handle new format (deadline_date + deadline_time)
          if (t.deadline_date) {
            // PostgreSQL DATE columns come back as ISO timestamps
            let dateString = t.deadline_date;
            if (typeof dateString !== 'string') {
              dateString = new Date(dateString).toISOString();
            }
            const datePart = dateString.split('T')[0]; // "2025-11-24"
            
            if (t.deadline_time !== null && t.deadline_time !== undefined) {
              // Has specific time - convert from UTC to local
              const utcDatetime = `${datePart}T${t.deadline_time}Z`;
              dueDate = new Date(utcDatetime);
              hasSpecificTime = true;
            } else {
              // Date-only task - use 23:59:00 in local timezone
              dueDate = new Date(`${datePart}T23:59:00`);
              hasSpecificTime = false;
            }
          }
          // Fallback for old format (single deadline column)
          else if (t.deadline) {
            console.warn('Task using old deadline format:', t.id, t.title);
            dueDate = new Date(t.deadline);
            hasSpecificTime = true;
          }
          // No deadline at all - use today as fallback
          else {
            console.error('Task missing deadline:', t.id, t.title);
            dueDate = new Date();
            hasSpecificTime = false;
          }
          
          return {
            id: t.id,
            title: t.title,
            segment: t.segment,
            class: t.class,
            description: t.description,
            url: t.url,
            dueDate: dueDate,
            hasSpecificTime: hasSpecificTime,
            estimatedTime: t.estimated_time,
            userEstimate: t.user_estimated_time,
            accumulatedTime: t.accumulated_time || 0,
            priorityOrder: t.priority_order,
            completed: t.completed,
            deleted: t.deleted || false,
            submittedAt: t.submitted_at || null,
            deadlineDateRaw: t.deadline_date
              ? (typeof t.deadline_date === 'string' ? t.deadline_date.split('T')[0] : new Date(t.deadline_date).toISOString().split('T')[0])
              : null
          };
        });
        
        // generateSessions and task list only use active (non-deleted) tasks
        const activeTasks = loadedTasks.filter(t => !t.deleted);
        setTasks(loadedTasks); // full set for calendar
        setNewTasks(loadedNewTasks);
        // Session tasks loaded on demand when user navigates to Sessions page
      }



      const historyData = await fetch(`${API_URL}/learning`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).then(r => r.json());

      setCompletionHistory(historyData.map(h => ({
        taskTitle: h.task_title,
        type: h.task_type,
        estimatedTime: h.estimated_time,
        actualTime: h.actual_time,
        date: new Date(h.completed_at)
      })));

      // Load accumulated times from tasks (stored in tasks.accumulated_time)
      const partialTimes = {};
      tasksData.forEach(t => {
        if (t.accumulated_time > 0) {
          partialTimes[t.id] = t.accumulated_time;
        }
      });
      setPartialTaskTimes(partialTimes);

      // Session state stored on tasks (session_active, accumulated_time)
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Load tasks from API
  const loadTasks = async () => {
    try {
      const tasksData = await apiCall('/tasks', 'GET');
      
      
      const loadedTasks = tasksData.filter(t => !t.is_new).map(t => {
        // Convert deadline_date and deadline_time to local Date object
        let dueDate;
        let hasSpecificTime = false;
        
        // Handle new format (deadline_date + deadline_time)
        if (t.deadline_date) {
          // PostgreSQL DATE columns come back as ISO timestamps like "2025-11-24T00:00:00.000Z"
          // Extract just the date part
          let dateString = t.deadline_date;
          if (typeof dateString !== 'string') {
            dateString = new Date(dateString).toISOString();
          }
          const datePart = dateString.split('T')[0]; // "2025-11-24"
          
          if (t.deadline_time !== null && t.deadline_time !== undefined) {
            // Has specific time - convert from UTC to local
            const utcDatetime = `${datePart}T${t.deadline_time}Z`;
            dueDate = new Date(utcDatetime);
            hasSpecificTime = true;
          } else {
            // Date-only task - use 23:59:00 in local timezone
            const localDatetime = `${datePart}T23:59:00`;
            dueDate = new Date(localDatetime);
            hasSpecificTime = false;
          }
        }
        // Fallback for old format (single deadline column)
        else if (t.deadline) {
          console.warn('Task using old deadline format:', t.id, t.title);
          dueDate = new Date(t.deadline);
          hasSpecificTime = true;
        }
        // No deadline at all - use today as fallback
        else {
          console.error('Task missing deadline:', t.id, t.title);
          dueDate = new Date();
          hasSpecificTime = false;
        }
        
        return {
          id: t.id,
          title: t.title,
          segment: t.segment,
          class: t.class,
          description: t.description,
          url: t.url,
          dueDate: dueDate,
          hasSpecificTime: hasSpecificTime,
          estimatedTime: t.estimated_time,
          userEstimate: t.user_estimated_time,
          accumulatedTime: t.accumulated_time || 0,
          priorityOrder: t.priority_order,
          completed: t.completed,
          deleted: t.deleted || false,
          submittedAt: t.submitted_at || null,
          deadlineDateRaw: t.deadline_date
            ? (typeof t.deadline_date === 'string' ? t.deadline_date.split('T')[0] : new Date(t.deadline_date).toISOString().split('T')[0])
            : null
        };
      });
      
      const loadedNewTasks = tasksData.filter(t => t.is_new).map(t => {
        // Convert deadline_date and deadline_time to local Date object
        let dueDate;
        let hasSpecificTime = false;
        
        // Handle new format (deadline_date + deadline_time)
        if (t.deadline_date) {
          // PostgreSQL DATE columns come back as ISO timestamps
          let dateString = t.deadline_date;
          if (typeof dateString !== 'string') {
            dateString = new Date(dateString).toISOString();
          }
          const datePart = dateString.split('T')[0]; // "2025-11-24"
          
          if (t.deadline_time !== null && t.deadline_time !== undefined) {
            // Has specific time - convert from UTC to local
            const utcDatetime = `${datePart}T${t.deadline_time}Z`;
            dueDate = new Date(utcDatetime);
            hasSpecificTime = true;
          } else {
            // Date-only task - use 23:59:00 in local timezone
            dueDate = new Date(`${datePart}T23:59:00`);
            hasSpecificTime = false;
          }
        }
        // Fallback for old format (single deadline column)
        else if (t.deadline) {
          console.warn('Task using old deadline format:', t.id, t.title);
          dueDate = new Date(t.deadline);
          hasSpecificTime = true;
        }
        // No deadline at all - use today as fallback
        else {
          console.error('Task missing deadline:', t.id, t.title);
          dueDate = new Date();
          hasSpecificTime = false;
        }
        
        return {
          id: t.id,
          title: t.title,
          segment: t.segment,
          class: t.class,
          description: t.description,
          url: t.url,
          dueDate: dueDate,
          hasSpecificTime: hasSpecificTime,
          estimatedTime: t.estimated_time,
          userEstimate: t.user_estimated_time,
          accumulatedTime: t.accumulated_time || 0,
          priorityOrder: t.priority_order,
          completed: t.completed,
          deleted: t.deleted || false,
          submittedAt: t.submitted_at || null,
          deadlineDateRaw: t.deadline_date
            ? (typeof t.deadline_date === 'string' ? t.deadline_date.split('T')[0] : new Date(t.deadline_date).toISOString().split('T')[0])
            : null
        };
      });
      
      const activeTasks = loadedTasks.filter(t => !t.deleted);
      setTasks(loadedTasks); // full set for calendar
      setNewTasks(loadedNewTasks);



    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  // Auth handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    if (!email.endsWith('@na.oneschoolglobal.com')) {
      setAuthError('Email must be in format: first.last##@na.oneschoolglobal.com');
      setAuthLoading(false);
      return;
    }
    try {
      const data = await apiCall('/auth/login', 'POST', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser({ ...data.user, isAdmin: data.user.isAdmin || false });
      setIsAuthenticated(true);
      setAccountSetup(prev => ({ ...prev, name: data.user.name }));
      if (data.user.isNewUser) {
        setCurrentPage('account');
        setAccountTab('initial-setup');
      } else {
        await loadUserData(data.token);
        loadAnnouncements(data.token);
        setCurrentPage('hub');
      }
    } catch (error) {
      if (error.message === 'ACCOUNT_BLOCKED') {
        setAuthError('Your account has been temporarily blocked. Please contact your administrator.');
      } else {
        setAuthError(error.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    if (!email.endsWith('@na.oneschoolglobal.com')) {
      setAuthError('Email must be in format: first.last##@na.oneschoolglobal.com');
      setAuthLoading(false);
      return;
    }
    try {
      const data = await apiCall('/auth/register', 'POST', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      setAccountSetup(prev => ({ ...prev, name: data.user.name }));
      setCurrentPage('account');
      setAccountTab('initial-setup');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setCurrentPage('hub');
    setTasks([]);
    setSessionTasks([]);
    setCurrentSessionTask(null);
  };

  const saveAccountSetup = async () => {
    setSettingsSaving(true);
    try {
      await apiCall('/account/setup', 'POST', {
        grade: accountSetup.grade,
        canvasApiToken: accountSetup.canvasApiToken,
        presentPeriods: accountSetup.presentPeriods,
        schedule: accountSetup.schedule,
        calendarShowHomeroom: accountSetup.calendarShowHomeroom,
        calendarShowCompleted: accountSetup.calendarShowCompleted,
        calendarShowPrevWeek: accountSetup.calendarShowPrevWeek,
        calendarShowCurrentWeek: accountSetup.calendarShowCurrentWeek,
        calendarShowNextWeek1: accountSetup.calendarShowNextWeek1,
        calendarShowNextWeek2: accountSetup.calendarShowNextWeek2,
        calendarShowWeekends: accountSetup.calendarShowWeekends
      });
      localStorage.setItem('classColors', JSON.stringify(accountSetup.classColors));
      
      // Update user state with the new grade so leaderboard can load
      const updatedUser = { ...user, grade: accountSetup.grade };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Always sync on first save (new user). For returning users, only sync if token changed.
      const tokenChanged = accountSetup.canvasApiToken !== savedCanvasTokenRef.current;
      const isFirstSave = user?.isNewUser;
      if (accountSetup.canvasApiToken && (tokenChanged || isFirstSave)) {
        await fetchCanvasTasks();
      }
      // Update the ref to reflect the newly saved token
      savedCanvasTokenRef.current = accountSetup.canvasApiToken || '';
      
      setCurrentPage('hub');
      // Show tutorial only once for brand new users, then mark them as not new
      if (user?.isNewUser) {
        setTutorialStep(0);
        setShowTutorial(true);
        // Mark user as no longer new so tutorial doesn't re-trigger on next save
        const updatedUserWithFlag = { ...user, grade: accountSetup.grade, isNewUser: false };
        setUser(updatedUserWithFlag);
        localStorage.setItem('user', JSON.stringify(updatedUserWithFlag));
      }
    } catch (error) {
      alert('Failed to save settings: ' + error.message);
    } finally {
      setSettingsSaving(false);
    }
  };

  // ── Account & Analytics functions ────────────────────────────────────────
  const loadResolvedTasks = async (search = resolvedSearch, sort = resolvedSort) => {
    setResolvedLoading(true);
    try {
      const params = new URLSearchParams({ sort, search });
      const data = await apiCall(`/tasks/resolved?${params}`);
      setResolvedTasks(data);
    } catch (err) {
      console.error('Failed to load resolved tasks:', err);
    } finally {
      setResolvedLoading(false);
    }
  };

  const restoreTask = async (taskId) => {
    try {
      await apiCall(`/tasks/${taskId}/restore`, 'POST');
      await loadResolvedTasks();
      await loadTasks();
    } catch (err) {
      alert('Failed to restore task: ' + err.message);
    }
  };

  const saveActualTime = async (taskId, minutes) => {
    try {
      await apiCall(`/tasks/${taskId}/actual-time`, 'PATCH', { actualTime: parseInt(minutes) });
      setResolvedTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, session_actual_time: parseInt(minutes) } : t
      ));
      setEditingActualTime(null);
    } catch (err) {
      alert('Failed to update time: ' + err.message);
    }
  };

  const loadCanvasGrades = async () => {
    setGradesLoading(true);
    try {
      const data = await apiCall('/canvas/grades');
      setGradesItems(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Failed to load grades:', err); }
    finally { setGradesLoading(false); }
  };

  const loadCanvasAnnouncements = async () => {
    setAnnouncementsLoading(true);
    try {
      const data = await apiCall('/canvas/announcements');
      setAnnouncementItems(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Failed to load announcements:', err); }
    finally { setAnnouncementsLoading(false); }
  };

  const loadCanvasDiscussions = async () => {
    setDiscussionsLoading(true);
    try {
      const data = await apiCall('/canvas/discussions');
      setDiscussionItems(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Failed to load discussions:', err); }
    finally { setDiscussionsLoading(false); }
  };

  const loadActivityStream = async () => {
    setActivityLoading(true);
    try {
      const data = await apiCall('/canvas/activity');
      setActivityItems(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Failed to load activity stream:', err); }
    finally { setActivityLoading(false); }
  };

  const runGradeMiniSync = async () => {
    try { await apiCall('/canvas/grades/mini-sync', 'POST'); loadCanvasGrades(); }
    catch (err) { console.error('Grade mini-sync failed:', err); }
  };

  const loadHelpContent = async () => {
    try {
      const data = await apiCall('/help');
      setHelpContent(data.content || '');
    } catch (err) {
      console.error('Failed to load help:', err);
    }
  };

  const saveAdminHelp = async () => {
    setAdminHelpSaving(true);
    try {
      await apiCall('/admin/help', 'PUT', { content: adminHelpContent });
      alert('Help content saved.');
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setAdminHelpSaving(false);
    }
  };

  const toggleCourseEnabled = async (courseId, enabled) => {
    try {
      await apiCall(`/courses/${courseId}/enabled`, 'PATCH', { enabled });
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, enabled } : c));
    } catch (err) {
      alert('Failed to update course: ' + err.message);
    }
  };

  const handleAccountTabChange = (tab) => {
    setAccountTab(tab);
    if (tab === 'resolved') loadResolvedTasks('', resolvedSort);
    if (tab === 'grades') {
      // Load all sub-tabs upfront; default filter is 'grades'
      loadCanvasGrades();
      loadCanvasAnnouncements();
      loadCanvasDiscussions();
      loadActivityStream();
      // 5-min polling for activity stream
      const actInterval = setInterval(loadActivityStream, 300000);
      setActivityPollingRef(prev => { if (prev) clearInterval(prev); return actInterval; });
      // 60-min grade mini-sync
      const gradeInterval = setInterval(runGradeMiniSync, 3600000);
      setGradeMiniSyncRef(prev => { if (prev) clearInterval(prev); return gradeInterval; });
    } else {
      setActivityPollingRef(prev => { if (prev) clearInterval(prev); return null; });
      setGradeMiniSyncRef(prev => { if (prev) clearInterval(prev); return null; });
    }
    if (tab === 'help') loadHelpContent();
  };

  const handleAccountPageOpen = () => {
    setAccountTab('settings');
    setCurrentPage('account');
  };

    // Returns true if task's course is enabled (or if we can't determine)
  const isCourseEnabled = (task) => {
    if (!task || !courses || courses.length === 0) return true;
    const course = courses.find(c => 
      c.course_id === task.course_id || c.name === task.class
    );
    if (!course) return true; // Unknown course — show by default
    return course.enabled !== false;
  };

    const handleSendFeedback = async () => {
    if (!feedbackText.trim()) {
      alert('Please enter your feedback');
      return;
    }
    
    setFeedbackSending(true);
    try {
      await apiCall('/feedback', 'POST', {
        feedback: feedbackText,
        userEmail: user.email,
        userName: accountSetup.name
      });
      alert('Thank you! Your feedback has been sent.');
      setFeedbackText('');
      setShowFeedbackForm(false);
    } catch (error) {
      alert('Failed to send feedback. Please try again or email directly.');
    } finally {
      setFeedbackSending(false);
    }
  };

  const parseICSFile = (icsText) => {
    const tasks = [];
    const lines = icsText.split('\n');
    let currentEvent = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line.startsWith('SUMMARY:')) {
        currentEvent.title = line.substring(8);
      } else if (line.startsWith('DTSTART')) {
        const dateStr = line.split(':')[1] || line.split('=')[line.split('=').length - 1].split(':')[1];
        if (dateStr) {
          currentEvent.dueDate = new Date(
            dateStr.substring(0, 4),
            parseInt(dateStr.substring(4, 6)) - 1,
            dateStr.substring(6, 8)
          );
        }
      } else if (line.startsWith('DESCRIPTION:')) {
        currentEvent.description = line.substring(12);
      } else if (line === 'END:VEVENT' && currentEvent.title) {
        const dueDate = new Date(currentEvent.dueDate || new Date());
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate >= today) {
          tasks.push({
            title: currentEvent.title,
            description: currentEvent.description || '',
            dueDate: currentEvent.dueDate || new Date(),
          });
        }
      }
    }
    return tasks;
  };

  const handleICSUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsLoadingTasks(true);
    try {
      const text = await file.text();
      const parsedTasks = parseICSFile(text);
      
      const existingCompletedTasks = tasks.filter(t => t.completed);
      const existingSplitTasks = tasks.filter(t => 
        t.title.includes('  - Part ') || 
        t.title.includes('  - Segment ') ||
        t.title.includes(' - Part ') || 
        t.title.includes(' - Segment ')
      );
      
      const newTasks = parsedTasks.map((t, idx) => ({
        id: Date.now() + idx,
        title: t.title,
        description: t.description,
        dueDate: new Date(t.dueDate),
        estimatedTime: 20,
        userEstimate: null,
        completed: false,
        type: detectTaskType(t.title),
      }));
      
      const filteredNewTasks = newTasks.filter(newTask => {
        return !existingSplitTasks.some(splitTask => {
          const baseTitle = splitTask.title
            .split('  - Part ')[0]
            .split('  - Segment ')[0]
            .split(' - Part ')[0]
            .split(' - Segment ')[0];
          return newTask.title === baseTitle;
        });
      });
      
      for (let i = 0; i < filteredNewTasks.length; i++) {
        filteredNewTasks[i].estimatedTime = await estimateTaskTime(filteredNewTasks[i].title);
      }
      
      const allTasks = [...existingCompletedTasks, ...existingSplitTasks, ...filteredNewTasks];
      const saveResult = await apiCall('/tasks', 'POST', { tasks: allTasks });
      
      // CRITICAL FIX: Reload tasks from GET endpoint instead of using saveResult directly
      // This ensures deleted tasks are properly filtered out
      await loadTasks();
      
      const newTasksCount = saveResult.stats?.new || 0;
      
      if (newTasksCount > 0) {
        alert(`Loaded ${filteredNewTasks.length} tasks. ${newTasksCount} new tasks are in the sidebar.`);
      } else {
        alert(`Loaded ${filteredNewTasks.length} tasks from file!`);
      }
    } catch (error) {
      alert('Failed to parse calendar file: ' + error.message);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const fetchCanvasTasks = async () => {
    if (!accountSetup.canvasApiToken) {
      alert('Please enter your Canvas API Token first');
      return;
    }
    setIsLoadingTasks(true);
    try {
      // Fetch from Canvas API (replaces ICS calendar fetch)
      const data = await apiCall('/canvas/sync', 'POST', {});
      
      // Format tasks properly for saving to database
      // Backend expects camelCase fields
      if (!data || !Array.isArray(data.tasks)) {
        throw new Error('Canvas sync returned unexpected data. Please try again.');
      }
      const formattedTasks = data.tasks.map(t => ({
        title: t.title,
        segment: t.segment,
        class: t.class,
        description: t.description,
        url: t.url,
        deadlineDate: t.deadlineDate,
        deadlineTime: t.deadlineTime,
        estimatedTime: t.estimatedTime,
        // New Canvas API fields
        courseId: t.courseId ?? null,
        assignmentId: t.assignmentId ?? null,
        pointsPossible: t.pointsPossible ?? null,
        assignmentGroupId: t.assignmentGroupId ?? null,
        currentScore: t.currentScore ?? null,
        currentGrade: t.currentGrade ?? null,
        gradingType: t.gradingType ?? 'points',
        unlockAt: t.unlockAt ?? null,
        lockAt: t.lockAt ?? null,
        submittedAt: t.submittedAt ?? null,
        isMissing: t.isMissing ?? false,
        isLate: t.isLate ?? false,
        completed: t.completed ?? false,
        // Module fields
        moduleId: t.moduleId ?? null,
        moduleName: t.moduleName ?? null,
        modulePosition: t.modulePosition ?? null,
      }));
      
      // Save to database - this updates existing tasks and creates new ones
      const saveResult = await apiCall('/tasks', 'POST', { tasks: formattedTasks });
      
      if (!saveResult || !saveResult.stats) {
        throw new Error('Failed to save synced tasks. Please try again.');
      }
      console.log(`✓ Sync complete: ${saveResult.stats.updated} updated, ${saveResult.stats.new} new, ${saveResult.stats.cleaned || 0} cleaned`);
      
      // CRITICAL FIX: Don't use saveResult.tasks directly as it includes deleted tasks
      // Instead, reload from GET endpoint which properly filters deleted=false
      await loadTasks();
      await loadCourses(); // Refresh course grades after sync
      
      // Check how many new tasks we got
      const newTasksCount = saveResult.stats.new || 0;
      const cleanedCount = saveResult.stats.cleaned || 0;
      
      // Build notification message
      let message = `Sync complete! ${saveResult.stats.updated} tasks updated`;
      if (newTasksCount > 0) {
        message += `, ${newTasksCount} new tasks in sidebar`;
      }
      if (cleanedCount > 0) {
        message += `, ${cleanedCount} past-due tasks removed`;
      }
      message += '.';
      
      // Don't open sidebar on first sync — server auto-accepts all tasks directly to list
      const isFirstSync = saveResult.stats.firstSync === true;
      if (newTasksCount > 0 && !isFirstSync) {
        setNewTasksSidebarOpen(true);
        setHasUnsavedChanges(true);
      }
      
      alert(message);
    } catch (error) {
      console.error('Failed to fetch Canvas calendar:', error);
      
      let errorMessage = 'Sync failed.';
      
      if (error.message.includes('unexpected data') || error.message.includes('Failed to save')) {
        errorMessage = error.message;
      } else if (error.message.includes('401') || error.message.includes('invalid or expired')) {
        errorMessage = 'Canvas API token is invalid or expired. Please update your token in Settings.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Invalid request. Please check your Canvas API token and try again.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Canvas data not found. Please verify your API token is correct.';
      } else if (error.message.includes('timeout') || error.message.includes('408')) {
        errorMessage = 'Request timeout. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = 'Sync failed: ' + error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const detectTaskType = (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('homework') || lower.includes('hw')) return 'homework';
    if (lower.includes('lab')) return 'lab';
    if (lower.includes('read')) return 'reading';
    if (lower.includes('essay') || lower.includes('writing')) return 'essay';
    if (lower.includes('project')) return 'project';
    if (lower.includes('quiz') || lower.includes('test') || lower.includes('exam')) return 'test-prep';
    return 'general';
  };

  const extractKeywords = (title) => {
    const lower = title.toLowerCase();
    const keywords = new Set();
    const subjects = ['math', 'science', 'history', 'english', 'physics', 'chemistry', 'biology', 'geography', 'literature', 'spanish', 'french', 'german'];
    subjects.forEach(subject => { if (lower.includes(subject)) keywords.add(subject); });
    const types = ['homework', 'assignment', 'essay', 'lab', 'project', 'reading', 'study', 'review', 'quiz', 'test', 'exam'];
    types.forEach(type => { if (lower.includes(type)) keywords.add(type); });
    const chapterMatch = lower.match(/chapter\s*(\d+)/);
    if (chapterMatch) keywords.add('chapter');
    const unitMatch = lower.match(/unit\s*(\d+)/);
    if (unitMatch) keywords.add('unit');
    const actions = ['complete', 'write', 'read', 'finish', 'prepare', 'practice', 'solve'];
    actions.forEach(action => { if (lower.includes(action)) keywords.add(action); });
    return Array.from(keywords);
  };

  const estimateTaskTime = async (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('homeroom')) return 0;
    try {
      const globalData = await apiCall(`/tasks/global-estimate/${encodeURIComponent(title)}`, 'GET');
      if (globalData.estimate) return globalData.estimate;
    } catch (error) {}
    if (lower.includes('lab')) return 60;
    if (lower.includes('summative') || lower.includes('assessment') || lower.includes('project')) return 60;

    if (lower.includes('quiz') || lower.includes('exam') || lower.includes('test')) {
      const testHistory = completionHistory.filter(h => {
        const hLower = h.taskTitle.toLowerCase();
        return hLower.includes('quiz') || hLower.includes('exam') || hLower.includes('test');
      });
      if (testHistory.length > 0) {
        return Math.round(testHistory.reduce((sum, h) => sum + h.actualTime, 0) / testHistory.length);
      }
    }
    const keywords = extractKeywords(title);
    if (keywords.length > 0) {
      const matchingHistory = completionHistory.filter(h => {
        const hKeywords = extractKeywords(h.taskTitle);
        return keywords.some(k => hKeywords.includes(k));
      });
      if (matchingHistory.length > 0) {
        return Math.round(matchingHistory.reduce((sum, h) => sum + h.actualTime, 0) / matchingHistory.length);
      }
    }
    return 20;
  };

  // ── SESSION FUNCTIONS (DB-backed, today-only) ──────────────────────────────

  // ── Sessions v2: single-task count-up timer ─────────────────────────────

  const loadSessionTasks = async () => {
    setSessionsLoading(true);
    try {
      const data = await apiCall('/sessions/tasks', 'GET');
      const hydratedTasks = data.map(t => {
        const local = tasks.find(lt => lt.id === t.id);
        return {
          id: t.id,
          title: t.title,
          segment: t.segment,
          class: t.class,
          url: t.url,
          deadlineDateRaw: t.deadline_date
            ? (typeof t.deadline_date === 'string' ? t.deadline_date.split('T')[0] : new Date(t.deadline_date).toISOString().split('T')[0])
            : null,
          dueDate: local?.dueDate || null,
          estimatedTime: t.estimated_time,
          userEstimate: t.user_estimated_time,
          accumulatedTime: (t.accumulated_time || 0) * 60, // DB stores minutes, convert to seconds for timer
          sessionActive: t.session_active || false,
          priorityOrder: t.priority_order,
        };
      });
      setSessionTasks(hydratedTasks);
    } catch (err) {
      console.error('Failed to load session tasks:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const startTaskSession = async (task) => {
    try {
      await apiCall(`/sessions/start/${task.id}`, 'POST');
      setSessionTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, sessionActive: true } : { ...t, sessionActive: false }
      ));
      timerBaseElapsedRef.current = task.accumulatedTime; // seconds
      timerStartWallRef.current = Date.now();
      setSessionElapsed(task.accumulatedTime);
      setCurrentSessionTask(task);
      setIsTimerRunning(true);
      setCurrentPage('session-active');
    } catch (err) {
      console.error('Failed to start session:', err);
      alert('Failed to start session: ' + err.message);
    }
  };

  const pauseTaskSession = async () => {
    if (!currentSessionTask) return;
    setSavingSession(true);
    try {
      await apiCall(`/sessions/pause/${currentSessionTask.id}`, 'POST', {
        accumulatedTime: Math.round(sessionElapsed / 60) // DB stores minutes
      });
      setIsTimerRunning(false);
      const updated = { ...currentSessionTask, accumulatedTime: sessionElapsed, sessionActive: false };
      setSessionTasks(prev => prev.map(t => t.id === currentSessionTask.id ? updated : t));
      setCurrentSessionTask(null);
      setCurrentPage('sessions');
    } catch (err) {
      console.error('Failed to pause session:', err);
      alert('Failed to save progress: ' + err.message);
    } finally {
      setSavingSession(false);
    }
  };

  const completeTaskSession = async () => {
    if (!currentSessionTask || markingComplete) return;
    setMarkingComplete(true);
    try {
      await apiCall(`/tasks/${currentSessionTask.id}/complete`, 'POST', {
        timeSpent: Math.round(sessionElapsed / 60) // tasks_completed expects minutes
      });
      await normalizePriority(); // compact priority_order gaps + null completed tasks
      setIsTimerRunning(false);
      setSessionTasks(prev => prev.filter(t => t.id !== currentSessionTask.id));
      setTasks(prev => prev.map(t =>
        t.id === currentSessionTask.id
          ? { ...t, completed: true, deleted: true, priorityOrder: null, priority_order: null }
          : t
      ));
      setShowSessionComplete({ task: currentSessionTask, timeSpent: sessionElapsed }); // seconds
      // Don't null currentSessionTask yet — completion screen still needs it
      // It gets cleared when user clicks "Back to Sessions" 
    } catch (err) {
      console.error('Failed to complete task:', err);
      alert('Failed to complete task: ' + err.message);
    } finally {
      setMarkingComplete(false);
    }
  };


  const handleStartEditTime = (taskId, currentTime) => {
    setEditingTimeTaskId(taskId);
    setTempTimeValue(currentTime.toString());
  };

  const handleTimeInputChange = (e) => {
    const value = e.target.value;
    // Only allow numbers
    if (/^\d*$/.test(value)) {
      const numValue = parseInt(value) || 0;
      // Limit to 300 minutes
      if (numValue <= 300) {
        setTempTimeValue(value);
      }
    }
  };

  const handleSaveTimeEstimate = async (taskId) => {
    try {
      const newTime = parseInt(tempTimeValue) || 0;
      if (newTime < 1 || newTime > 300) {
        alert('Please enter a time between 1 and 300 minutes');
        return;
      }

      // Update local state
      const updatedTasks = tasks.map(t =>
        t.id === taskId ? { ...t, userEstimate: newTime } : t
      );
      setTasks(updatedTasks);

      // Update backend
      await apiCall(`/tasks/${taskId}/estimate`, 'PATCH', {
        userEstimate: newTime
      });

      setEditingTimeTaskId(null);
      setTempTimeValue('');
      setHasUnsavedChanges(true); // Trigger "Save and Adjust Plan" warning
    } catch (error) {
      console.error('Error updating time estimate:', error);
      alert('Error updating time estimate: ' + error.message);
    }
  };

  const handleCancelEditTime = () => {
    setEditingTimeTaskId(null);
    setTempTimeValue('');
  };

  const handleSplitTask = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Call the backend split endpoint
      const segmentNames = splitSegments.map(seg => seg.name);
      const result = await apiCall(`/tasks/${taskId}/split`, 'POST', { segments: segmentNames });
      
      if (result.success) {
        // Reload tasks from server to get the new segments
        await loadTasks();
        
        // Open the new tasks sidebar to let user prioritize segments
        setNewTasksSidebarOpen(true);
        setHasUnsavedChanges(true);
        
        setShowSplitTask(null);
        setSplitSegments([{ name: 'Part 1' }]);
      }
    } catch (error) {
      console.error('Error splitting task:', error);
      alert('Error splitting task: ' + error.message);
    }
  };

  // Drag-and-drop functions
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, task) => {
    e.preventDefault();
    if (draggedTask && draggedTask.id !== task.id) {
      setDragOverTask(task);
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverTask(null);
  };

  const handleDrop = async (e, dropTask) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.id === dropTask.id) return;

    const reorderedTasks = [...tasks];
    const draggedIndex = reorderedTasks.findIndex(t => t.id === draggedTask.id);
    const dropIndex = reorderedTasks.findIndex(t => t.id === dropTask.id);

    if (draggedIndex >= 0) {
      // Dragging within main list
      const [removed] = reorderedTasks.splice(draggedIndex, 1);
      reorderedTasks.splice(dropIndex, 0, removed);
      setTasks(reorderedTasks);
    } else {
      // Dragging from sidebar to main list - insert at drop position
      const updatedNewTasks = newTasks.filter(t => t.id !== draggedTask.id);
      reorderedTasks.splice(dropIndex, 0, draggedTask);
      
      setTasks(reorderedTasks);
      setNewTasks(updatedNewTasks);
      
      // Clear new flag for this task
      try {
        await apiCall('/tasks/clear-new-flags', 'POST', { taskIds: [draggedTask.id] });
      } catch (error) {
        console.error('Failed to clear new flag:', error);
      }
      
      // Close sidebar if no more new tasks
      if (updatedNewTasks.length === 0) {
        setNewTasksSidebarOpen(false);
      }
    }
    
    // Send new order to backend
    try {
      const taskOrder = reorderedTasks.map(t => t.id);
      await apiCall('/tasks/reorder', 'POST', { taskOrder });
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Failed to save task order:', error);
      // Don't show alert - reordering still works locally and will sync on next save
    }

    setDraggedTask(null);
    setDragOverTask(null);
  };

  const moveNewTaskToMain = async (taskId) => {
    const taskToMove = newTasks.find(t => t.id === taskId);
    if (!taskToMove) return;

    try {
      // Clear the is_new flag
      await apiCall('/tasks/clear-new-flags', 'POST', { taskIds: [taskId] });
      
      // Move to main list
      setNewTasks(newTasks.filter(t => t.id !== taskId));
      setTasks([...tasks, taskToMove]);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Failed to move task:', error);
      alert('Failed to move task');
    }
  };

  const clearAllNewTasks = async () => {
    if (newTasks.length === 0) return;

    try {
      const taskIds = newTasks.map(t => t.id);
      await apiCall('/tasks/clear-new-flags', 'POST', { taskIds });

      // Smart insertion: merge new tasks into existing list by deadline order.
      // Algorithm:
      //   1. Sort new tasks by deadline (ascending, nulls last).
      //   2. For each new task, find the insertion index in the current active list
      //      — insert before the first existing task whose deadline is strictly later,
      //      or append if no such task exists.
      //   3. After merging, reassign sequential priority_order values.

      const activeTasks = [...tasks]; // current ordered list

      // Sort new tasks by deadline
      const sortedNew = [...newTasks].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate - b.dueDate;
      });

      // Insert each new task into the active list
      let merged = [...activeTasks];
      for (const nt of sortedNew) {
        const insertIdx = merged.findIndex(existing => {
          if (!existing.dueDate) return false; // push before tasks with no date? No — append
          if (!nt.dueDate) return false; // new task has no date — will append
          return existing.dueDate > nt.dueDate;
        });
        if (insertIdx === -1) {
          merged.push(nt); // append if no later task found
        } else {
          merged.splice(insertIdx, 0, nt);
        }
      }

      // Reassign priority_order sequentially
      const reordered = merged.map((t, idx) => ({ ...t, priorityOrder: idx + 1, priority_order: idx + 1 }));

      // Persist new order to server — endpoint expects { taskOrder: [id, id, ...] }
      const taskOrder = reordered
        .filter(t => !t.completed && !t.deleted)
        .map(t => t.id);
      await apiCall('/tasks/reorder', 'POST', { taskOrder });

      setTasks(reordered);
      setNewTasks([]);
      setNewTasksSidebarOpen(false);
      setHasUnsavedChanges(false); // already persisted
    } catch (error) {
      console.error('Failed to clear new tasks:', error);
      alert('Failed to add tasks to list');
    }
  };

  const closeSidebarWithoutSaving = async () => {
    if (newTasks.length > 0) {
      const confirmClose = window.confirm(
        `You have ${newTasks.length} new task(s) that haven't been prioritized. Close sidebar to automatically add them to the bottom of your list?`
      );
      if (!confirmClose) return;
      
      // Auto-add all new tasks to the bottom of the list
      const updatedTasks = [...tasks, ...newTasks];
      setTasks(updatedTasks);
      
      // Clear new flags for these tasks
      try {
        await apiCall('/tasks/clear-new-flags', 'POST', { 
          taskIds: newTasks.map(t => t.id) 
        });
      } catch (error) {
        console.error('Failed to clear new flags:', error);
      }
      
      setHasUnsavedChanges(true);
    }
    setNewTasksSidebarOpen(false);
    setNewTasks([]);
  };

  const handleIgnoreTask = async (taskId) => {
    try {
      // Call the ignore endpoint to mark task as deleted
      await apiCall(`/tasks/${taskId}/ignore`, 'POST');
      
      // Remove from newTasks array in UI
      setNewTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
      
      console.log(`✓ Task ${taskId} ignored successfully`);
    } catch (error) {
      console.error('Failed to ignore task:', error);
      alert('Failed to ignore task: ' + error.message);
    }
  };

  // ── Agenda functions ────────────────────────────────────────────────────────

  const loadAgendas = async () => {
    setAgendasLoading(true);
    try {
      const data = await apiCall('/agendas', 'GET');
      setAgendas(data || []);
    } catch (err) {
      console.error('Failed to load agendas:', err);
    } finally {
      setAgendasLoading(false);
    }
  };

  const createAgenda = async () => {
    if (!buildAgendaName.trim() || buildAgendaRows.length === 0) return;
    try {
      await apiCall('/agendas', 'POST', {
        name: buildAgendaName.trim(),
        rows: buildAgendaRows,
      });
      setShowBuildAgenda(false);
      setBuildAgendaName('');
      setBuildAgendaRows([]);
      await loadAgendas();
    } catch (err) {
      alert('Failed to create agenda: ' + err.message);
    }
  };

  const deleteAgenda = async (agendaId) => {
    try {
      await apiCall(`/agendas/${agendaId}`, 'DELETE');
      setAgendas(prev => prev.filter(a => a.id !== agendaId));
    } catch (err) {
      console.error('Failed to delete agenda:', err);
    }
  };

  // ── Active agenda timer logic ──────────────────────────────────────────────
  const agendaStartTimer = (baseElapsed, baseCountdown) => {
    if (agendaTimerRef.current) clearInterval(agendaTimerRef.current.intervalRef);
    const wallStart = Date.now();
    const intervalId = setInterval(() => {
      const wallSecs = Math.floor((Date.now() - wallStart) / 1000);
      setAgendaElapsed(baseElapsed + wallSecs);
      const remaining = baseCountdown - wallSecs;
      if (remaining <= 0) {
        setAgendaCountdown(0);
        setAgendaCountdownFlash(true);
      } else {
        setAgendaCountdown(remaining);
        setAgendaCountdownFlash(false);
      }
    }, 500);
    agendaTimerRef.current = { intervalRef: intervalId, wallRef: wallStart, baseElapsed, baseCountdown };
    setAgendaRunning(true);
  };

  const agendaStopTimer = () => {
    if (agendaTimerRef.current) {
      clearInterval(agendaTimerRef.current.intervalRef);
      const wallSecs = Math.floor((Date.now() - agendaTimerRef.current.wallRef) / 1000);
      const snappedElapsed = agendaTimerRef.current.baseElapsed + wallSecs;
      const snappedCountdown = Math.max(0, agendaTimerRef.current.baseCountdown - wallSecs);
      agendaTimerRef.current = null;
      setAgendaElapsed(snappedElapsed);
      setAgendaCountdown(snappedCountdown);
      setAgendaRunning(false);
      return { snappedElapsed, snappedCountdown };
    }
    setAgendaRunning(false);
    return { snappedElapsed: agendaElapsed, snappedCountdown: agendaCountdown };
  };

  const openAgenda = (agenda) => {
    const row = agenda.current_row || 0;
    const rowData = (agenda.rows || [])[row];
    // Start elapsed from the task's total accumulated time (minutes → seconds), like Sessions
    const taskAccumSecs = ((rowData?.task?.accumulated_time) || 0) * 60;
    const fullCountdown = (rowData?.timeMins || 25) * 60;
    const savedCountdown = agenda.current_row_countdown ?? fullCountdown;
    setCurrentAgenda(agenda);
    setAgendaCurrentRow(row);
    setAgendaElapsed(taskAccumSecs);
    setAgendaBaseElapsed(taskAccumSecs);
    setAgendaCountdown(savedCountdown);
    setAgendaCountdownFlash(savedCountdown <= 0);
    setAgendaRunning(false);
    setAgendaTotalElapsed(0);
    agendaTimerRef.current = null;
    setCurrentPage('agenda-active');
  };

  const agendaSaveAndExit = async () => {
    const { snappedElapsed, snappedCountdown } = agendaStopTimer();
    const row = (currentAgenda.rows || [])[agendaCurrentRow];
    try {
      await apiCall(`/agendas/${currentAgenda.id}/save-exit`, 'POST', {
        taskId: row?.taskId ?? null,
        elapsedSeconds: Math.max(0, snappedElapsed - agendaBaseElapsed),
        countdownSecondsRemaining: snappedCountdown,
      });
    } catch (err) {
      console.error('Save-exit failed:', err);
    }
    agendaTimerRef.current = null;
    setCurrentAgenda(null);
    setCurrentPage('agendas');
    loadAgendas();
  };

  const agendaSaveAndProceed = async () => {
    setAgendaProceedLoading(true);
    const { snappedElapsed } = agendaStopTimer();
    const rows = currentAgenda.rows || [];
    const row = rows[agendaCurrentRow];
    try {
      const result = await apiCall(`/agendas/${currentAgenda.id}/proceed`, 'POST', {
        taskId: row?.taskId ?? null,
        elapsedSeconds: Math.max(0, snappedElapsed - agendaBaseElapsed),
      });
      setAgendaTotalElapsed(prev => prev + snappedElapsed);
      if (result.finished) {
        const totalSecs = agendaTotalElapsed + snappedElapsed;
        setAgendaFinishedSummary({ name: currentAgenda.name, totalSecs, rowCount: rows.length });
        setCurrentAgenda(null);
        setCurrentPage('agenda-summary');
        loadAgendas();
      } else {
        const nextRow = result.nextRow;
        const nextRowData = rows[nextRow];
        const nextCountdown = (nextRowData?.timeMins || 25) * 60;
        const nextTaskAccumSecs = ((nextRowData?.task?.accumulated_time) || 0) * 60;
        setAgendaCurrentRow(nextRow);
        setAgendaElapsed(nextTaskAccumSecs);
        setAgendaCountdown(nextCountdown);
        setAgendaCountdownFlash(false);
        // Update local agenda current_row
        setCurrentAgenda(prev => ({ ...prev, current_row: nextRow, current_row_elapsed: 0, current_row_countdown: null }));
      }
    } catch (err) {
      console.error('Proceed failed:', err);
      alert('Failed to proceed: ' + err.message);
    } finally {
      setAgendaProceedLoading(false);
    }
  };

  const agendaFinishLast = async () => {
    await agendaSaveAndProceed(); // last row proceed triggers finished
  };

  const saveEditAgenda = async () => {
    if (!editingAgenda) return;
    try {
      await apiCall(`/agendas/${editingAgenda.id}/rows`, 'PATCH', { rows: editAgendaRows });
      setEditingAgenda(null);
      setEditAgendaRows([]);
      await loadAgendas();
    } catch (err) {
      alert('Failed to save edits: ' + err.message);
    }
  };

  const agendaMarkComplete = async () => {
    const rows = currentAgenda?.rows || [];
    const currentRow = rows[agendaCurrentRow];
    if (!currentRow?.taskId) return;
    setAgendaProceedLoading(true);
    const { snappedElapsed } = agendaStopTimer();
    try {
      // Complete the task (marks it done, saves time)
      await apiCall(`/tasks/${currentRow.taskId}/complete`, 'POST', {
        timeSpent: Math.round(Math.max(0, snappedElapsed - agendaBaseElapsed) / 60)
      });
      await normalizePriority();
      setTasks(prev => prev.map(t => t.id === currentRow.taskId ? { ...t, completed: true, deleted: true } : t));
      setAgendaTotalElapsed(prev => prev + snappedElapsed);
      // Now advance — same as Save & Proceed but task is already saved
      const isLastRow = agendaCurrentRow >= rows.length - 1;
      if (isLastRow) {
        const totalSecs = agendaTotalElapsed + snappedElapsed;
        await apiCall(`/agendas/${currentAgenda.id}/finish`, 'PATCH');
        setAgendaFinishedSummary({ name: currentAgenda.name, totalSecs, rowCount: rows.length });
        setCurrentAgenda(null);
        setCurrentPage('agenda-summary');
        loadAgendas();
      } else {
        const nextRow = agendaCurrentRow + 1;
        // Update DB row pointer (elapsedSeconds=0 since task was completed, not just proceeded)
        await apiCall(`/agendas/${currentAgenda.id}/proceed`, 'POST', {
          taskId: null, // already saved via complete endpoint
          elapsedSeconds: 0,
        });
        const nextRowData = rows[nextRow];
        const nextCountdown = (nextRowData?.timeMins || 25) * 60;
        const nextTaskAccumSecs = ((nextRowData?.task?.accumulated_time) || 0) * 60;
        setAgendaCurrentRow(nextRow);
        setAgendaElapsed(nextTaskAccumSecs);
        setAgendaBaseElapsed(nextTaskAccumSecs);
        setAgendaCountdown(nextCountdown);
        setAgendaCountdownFlash(false);
        setCurrentAgenda(prev => ({ ...prev, current_row: nextRow, current_row_elapsed: 0, current_row_countdown: null }));
      }
    } catch (err) {
      console.error('Mark complete failed:', err);
      alert('Failed to mark complete: ' + err.message);
    } finally {
      setAgendaProceedLoading(false);
    }
  };

  // ── Itinerary functions ─────────────────────────────────────────────────────

  const loadScheduleLessons = async () => {
    try {
      const data = await apiCall('/schedule/lessons', 'GET');
      setScheduleLessons(data || []);
    } catch (err) {
      console.error('Failed to load schedule lessons:', err);
    }
  };

  const localDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const loadItinerary = async (dateStr) => {
    setItineraryLoading(true);
    try {
      const data = await apiCall(`/itinerary?date=${dateStr}`, 'GET');
      const slots = {};
      (data || []).forEach(row => {
        if (row.agenda_id && !row.finished) {
          slots[row.period] = { agendaId: row.agenda_id, agendaName: row.agenda_name };
        }
      });
      setItinerarySlots(slots);
    } catch (err) {
      console.error('Failed to load itinerary:', err);
    } finally {
      setItineraryLoading(false);
    }
  };

  const assignAgendaToSlot = async (dateStr, period, agendaId, agendaName) => {
    try {
      await apiCall('/itinerary', 'PUT', { date: dateStr, period, agendaId });
      setItinerarySlots(prev => ({
        ...prev,
        [period]: { agendaId, agendaName }
      }));
      setShowAddAgendaSlot(null);
    } catch (err) {
      console.error('Failed to assign agenda:', err);
    }
  };

  const clearAgendaFromSlot = async (dateStr, period) => {
    try {
      await apiCall('/itinerary', 'PUT', { date: dateStr, period, agendaId: null });
      setItinerarySlots(prev => {
        const next = { ...prev };
        delete next[period];
        return next;
      });
    } catch (err) {
      console.error('Failed to clear agenda from slot:', err);
    }
  };

  const submitEnhanceSchedule = async () => {
    const lessons = Object.entries(enhanceLessons).map(([key, val]) => {
      const [day, period] = key.split('-');
      return { day, period: parseInt(period), courseId: val.courseId, courseName: val.courseName };
    });
    const zoomNumbers = Object.entries(enhanceZoom)
      .filter(([, z]) => z && z.trim())
      .map(([courseId, zoomNumber]) => ({ courseId: parseInt(courseId), zoomNumber: zoomNumber.trim() }));

    setIsSavingEnhance(true);
    try {
      await apiCall('/schedule/enhance', 'POST', { lessons, zoomNumbers });
      setScheduleEnhanced(true);
      setAccountSetup(prev => ({ ...prev, scheduleEnhanced: true }));
      setShowEnhanceDialog(false);
      setEnhanceStep(1);
      await loadScheduleLessons();
    } catch (err) {
      console.error('Failed to enhance schedule:', err);
      alert('Failed to save enhanced schedule: ' + err.message);
    } finally {
      setIsSavingEnhance(false);
    }
  };


  // ── Tutorial functions ──────────────────────────────────────────────────────

  const loadTutorials = async (dateStr) => {
    try {
      const data = await apiCall(`/tutorials?date=${dateStr}`, 'GET');
      const map = {};
      (data || []).forEach(t => { map[`${t.date}-${t.period}`] = t; });
      setTutorials(map);
    } catch (err) {
      console.error('Failed to load tutorials:', err);
    }
  };

  const saveTutorial = async ({ date, period, zoomNumber, topic }) => {
    setIsSavingTutorial(true);
    try {
      await apiCall('/tutorials', 'PUT', { date, period, zoomNumber, topic });
      const key = `${date}-${period}`;
      setTutorials(prev => ({ ...prev, [key]: { date, period, zoom_number: zoomNumber, topic } }));
      setShowTutorialDialog(null);
      setTutorialZoom('');
      setTutorialTopic('');
      setTutorialDay('');
      setTutorialDate('');
      setTutorialPeriod('');
    } catch (err) {
      console.error('Failed to save tutorial:', err);
      alert('Failed to save tutorial: ' + err.message);
    } finally {
      setIsSavingTutorial(false);
    }
  };

  const deleteTutorial = async (date, period) => {
    try {
      await apiCall('/tutorials', 'DELETE', { date, period });
      const key = `${date}-${period}`;
      setTutorials(prev => { const n = { ...prev }; delete n[key]; return n; });
    } catch (err) {
      console.error('Failed to delete tutorial:', err);
    }
  };

  const openTutorialDialog = ({ date, period }) => {
    const existing = tutorials[`${date}-${period}`];
    setTutorialZoom(existing?.zoom_number || '');
    setTutorialTopic(existing?.topic || '');
    setShowTutorialDialog({ date, period });
  };

  const openHubTutorialDialog = () => {
    setTutorialZoom('');
    setTutorialTopic('');
    setTutorialDay('');
    setTutorialDate('');
    setTutorialPeriod('');
    setShowTutorialDialog('hub');
  };


  // ── Announcement loading ──────────────────────────────────────────────────
  const loadAnnouncements = async (authToken = null) => {
    try {
      // authToken param used on startup before React token state is set
      const headers = { 'Content-Type': 'application/json' };
      const t = authToken || token;
      if (t) headers['Authorization'] = `Bearer ${t}`;
      const response = await fetch(`${API_URL}/announcements`, { headers });
      if (!response.ok) return;
      const data = await response.json();
      setAnnouncements(data || []);
    } catch (err) { /* silent */ }
  };

  const handlePwaInstall = async () => {
    if (!pwaInstallPrompt) return;
    pwaInstallPrompt.prompt();
    const { outcome } = await pwaInstallPrompt.userChoice;
    setPwaInstallPrompt(null);
    setShowPwaBanner(false);
    if (outcome === 'accepted') {
      localStorage.setItem('pwa-banner-dismissed', 'true');
    }
  };

  const dismissPwaBanner = () => {
    setShowPwaBanner(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  const dismissAnnouncement = async (id) => {
    try {
      await apiCall(`/announcements/${id}/dismiss`, 'POST');
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
    } catch (err) { /* silent */ }
  };

  // ── Admin functions ────────────────────────────────────────────────────────
  const loadAdminUsers = async () => {
    setAdminLoading(true);
    try {
      const data = await apiCall('/admin/users', 'GET');
      setAdminUsers(data || []);
    } catch (err) { console.error(err); }
    finally { setAdminLoading(false); }
  };

  const loadAdminUserDetail = async (userId) => {
    try {
      const data = await apiCall(`/admin/users/${userId}`, 'GET');
      setAdminUserDetail(data);
    } catch (err) { console.error(err); }
  };

  const loadAdminDiagnostics = async () => {
    setAdminLoading(true);
    try {
      const data = await apiCall('/admin/diagnostics', 'GET');
      setAdminDiagnostics(data);
    } catch (err) { console.error(err); }
    finally { setAdminLoading(false); }
  };

  const loadAdminAuditLog = async () => {
    try {
      const data = await apiCall('/admin/audit-log', 'GET');
      setAdminAuditLog(data || []);
    } catch (err) { console.error(err); }
  };

  const loadAdminAnnouncements = async () => {
    try {
      const data = await apiCall('/admin/announcements', 'GET');
      setAdminAnnouncements(data || []);
    } catch (err) { console.error(err); }
  };

  const adminBanUser = async (userId, reason) => {
    try {
      await apiCall(`/admin/users/${userId}/ban`, 'POST', { reason });
      setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: true, ban_reason: reason } : u));
      if (adminUserDetail?.user?.id === userId) setAdminUserDetail(prev => ({ ...prev, user: { ...prev.user, is_banned: true, ban_reason: reason } }));
      setShowBanDialog(null); setBanReason('');
    } catch (err) { alert('Failed to ban user: ' + err.message); }
  };

  const adminUnbanUser = async (userId) => {
    try {
      await apiCall(`/admin/users/${userId}/unban`, 'POST');
      setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: false, ban_reason: null } : u));
      if (adminUserDetail?.user?.id === userId) setAdminUserDetail(prev => ({ ...prev, user: { ...prev.user, is_banned: false, ban_reason: null } }));
    } catch (err) { alert('Failed to unban: ' + err.message); }
  };

  const adminEditUser = async (userId, fields) => {
    try {
      await apiCall(`/admin/users/${userId}`, 'PATCH', fields);
      setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, ...fields } : u));
      if (adminUserDetail?.user?.id === userId) setAdminUserDetail(prev => ({ ...prev, user: { ...prev.user, ...fields } }));
      setEditingUser(null);
    } catch (err) { alert('Failed to edit user: ' + err.message); }
  };

  const adminClearToken = async (userId) => {
    if (!confirm('Clear this user\'s Canvas API token? They will need to re-enter it.')) return;
    try {
      await apiCall(`/admin/users/${userId}/clear-token`, 'POST');
      alert('Canvas token cleared.');
    } catch (err) { alert('Failed: ' + err.message); }
  };

  const adminDeleteTask = async (taskId) => {
    if (!confirm('Soft-delete this task?')) return;
    try {
      await apiCall(`/admin/tasks/${taskId}`, 'DELETE');
      if (adminUserDetail) {
        setAdminUserDetail(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, deleted: true } : t) }));
      }
    } catch (err) { alert('Failed: ' + err.message); }
  };

  const adminTasksScan = async (userId) => {
    if (!confirm('This will clear ALL is_new flags for this user and reassign priority order. Continue?')) return;
    try {
      const result = await apiCall(`/admin/users/${userId}/tasks-scan`, 'POST');
      // Refresh the user detail with updated tasks
      setAdminUserDetail(prev => prev ? { ...prev, tasks: result.tasks, newTasks: [] } : prev);
      // Also clear new_tasks count in user list
      setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, new_tasks: 0 } : u));
      alert('Tasks Scan complete. All is_new flags cleared and priority order reassigned.');
    } catch (err) { alert('Tasks Scan failed: ' + err.message); }
  };

  const adminCreateAnnouncement = async () => {
    if (!newAnnouncementMsg.trim()) return;
    try {
      const data = await apiCall('/admin/announcements', 'POST', { message: newAnnouncementMsg, type: newAnnouncementType });
      setAdminAnnouncements(prev => [data, ...prev]);
      setNewAnnouncementMsg('');
    } catch (err) { alert('Failed: ' + err.message); }
  };

  const adminDeactivateAnnouncement = async (id) => {
    if (!confirm('Deactivate this announcement?')) return;
    try {
      await apiCall(`/admin/announcements/${id}/deactivate`, 'PATCH');
      setAdminAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_active: false } : a));
      loadAnnouncements(); // refresh user-facing banners
    } catch (err) { alert('Failed: ' + err.message); }
  };

  // ── Priority normalize (remove gaps) ─────────────────────────────────────────
  const normalizePriority = async () => {
    try {
      await apiCall('/tasks/normalize', 'POST');
    } catch (err) {
      console.error('Failed to normalize priority:', err);
    }
  };

  // ── Toggle task completion (manual checkbox) ──────────────────────────────────
  const toggleTaskCompletion = async (taskId) => {
    setCheckingTask(taskId);
    try {
      await apiCall(`/tasks/${taskId}/complete`, 'PATCH'); // marks deleted=true
      // Remove task and immediately reassign sequential priorityOrder so
      // Calendar doesn't show stale numbers before normalizePriority completes
      setTasks(prev => {
        const remaining = prev.filter(t => t.id !== taskId);
        // Only reassign priorityOrder for active (non-completed, non-deleted) tasks
        let activeIdx = 0;
        return remaining.map(t => {
          if (t.completed || t.deleted) return t;
          activeIdx++;
          return { ...t, priorityOrder: activeIdx, priority_order: activeIdx };
        });
      });
      setSessionTasks(prev => prev.filter(t => t.id !== taskId));
      // Remove from any agendas in state
      setAgendas(prev => prev.map(a => ({
        ...a,
        tasks: (a.tasks || []).filter(t => t.id !== taskId)
      })));
      await normalizePriority();
    } catch (err) {
      console.error('Failed to check off task:', err);
      alert('Failed to mark task complete: ' + err.message);
    } finally {
      setCheckingTask(null);
    }
  };

  // ── Create manual task ────────────────────────────────────────────────────────
  const submitManualTask = async () => {
    const { title, deadlineDate, deadlineTime, estimatedTime } = addTaskForm;
    if (!title || !deadlineDate || !deadlineTime || !estimatedTime) return;
    setIsSavingManualTask(true);
    try {
      // Convert user's local date+time to UTC before storing
      // e.g. user at UTC-5 enters 2025-03-02 23:00 → DB gets 2025-03-03 04:00
      let utcDeadlineDate = addTaskForm.deadlineDate;
      let utcDeadlineTime = null;
      if (addTaskForm.deadlineTime) {
        const localDt = new Date(`${addTaskForm.deadlineDate}T${addTaskForm.deadlineTime}:00`);
        const utcIso = localDt.toISOString(); // always UTC
        utcDeadlineDate = utcIso.split('T')[0];                  // YYYY-MM-DD in UTC
        utcDeadlineTime = utcIso.split('T')[1].replace('.000Z', ''); // HH:MM:SS in UTC
      }
      // If no time given, store date as-is (no timezone shift needed for date-only tasks)

      await apiCall('/tasks/manual', 'POST', {
        title: addTaskForm.title,
        deadlineDate: utcDeadlineDate,
        deadlineTime: utcDeadlineTime,
        estimatedTime: parseInt(addTaskForm.estimatedTime),
        description: addTaskForm.description || '',
        url: addTaskForm.url || 'https://planassist.onrender.com/',
      });
      setShowAddTask(false);
      setAddTaskForm({ title: '', deadlineDate: '', deadlineTime: '', estimatedTime: '', description: '', url: '' });
      await loadTasks(); // refresh task list (new task appears in sidebar)
      setNewTasksSidebarOpen(true); // open sidebar so user can prioritize the new task
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to create task: ' + err.message);
    } finally {
      setIsSavingManualTask(false);
    }
  };


  const handleSaveAndAdjustPlan = async () => {
    if (isSavingPlan) return;
    setIsSavingPlan(true);
    try {
      // Convert tasks from frontend format (dueDate) to backend format (deadlineDate, deadlineTime)
      const tasksForBackend = tasks.map(task => {
        // Validate dueDate exists and is valid
        if (!task.dueDate || isNaN(task.dueDate.getTime())) {
          console.error('Invalid dueDate for task:', {
            id: task.id,
            title: task.title,
            dueDate: task.dueDate,
            dueDateType: typeof task.dueDate,
            rawTask: task
          });
          throw new Error(`Task "${task.title}" (ID: ${task.id}) has an invalid date. Please reload the page and try again.`);
        }
        
        // Extract date and time from the Date object — always use UTC methods
        // so deadlineDate and deadlineTime are a consistent UTC pair matching DB storage
        const year = task.dueDate.getUTCFullYear();
        const month = String(task.dueDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(task.dueDate.getUTCDate()).padStart(2, '0');
        const deadlineDate = `${year}-${month}-${day}`;
        
        // Validate the resulting date string
        if (deadlineDate.includes('NaN')) {
          console.error('NaN in deadlineDate for task:', task);
          throw new Error(`Task "${task.title}" produced invalid date: ${deadlineDate}. Please reload the page.`);
        }
        
        let deadlineTime = null;
        // If the task has a specific time (not just date-only), extract it
        if (task.hasSpecificTime) {
          // Convert local time to UTC for storage
          const utcHours = String(task.dueDate.getUTCHours()).padStart(2, '0');
          const utcMinutes = String(task.dueDate.getUTCMinutes()).padStart(2, '0');
          const utcSeconds = String(task.dueDate.getUTCSeconds()).padStart(2, '0');
          deadlineTime = `${utcHours}:${utcMinutes}:${utcSeconds}`;
          
          if (deadlineTime.includes('NaN')) {
            console.error('NaN in deadlineTime for task:', task);
            throw new Error(`Task "${task.title}" produced invalid time: ${deadlineTime}. Please reload the page.`);
          }
        }
        
        // Only send fields the backend expects
        return {
          id: task.id,
          title: task.title,
          segment: task.segment,
          class: task.class,
          description: task.description,
          url: task.url,
          deadlineDate,
          deadlineTime,
          estimatedTime: task.estimatedTime,
          userEstimate: task.userEstimate,
          accumulatedTime: task.accumulatedTime,
          priorityOrder: task.completed ? null : task.priorityOrder,
          completed: task.completed
        };
      });
      
      // Save all tasks with their current priority order to backend
      await apiCall('/tasks', 'POST', { tasks: tasksForBackend });
      
      // Reload tasks from server to get fresh data with correct IDs and priority order
      await loadTasks();
      // Session tasks auto-refresh when user navigates to Sessions page
      
      setHasUnsavedChanges(false);
      setNewTasksSidebarOpen(false);
      setCurrentPage('hub');
    } catch (error) {
      console.error('Failed to save tasks:', error);
      alert('Failed to save changes: ' + error.message);
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Workspace functions
  const loadTaskNotes = async (taskId) => {
    try {
      const data = await apiCall(`/tasks/${taskId}/notes`, 'GET');
      setWorkspaceNotes(data.notes || '');
    } catch (error) {
      console.error('Failed to load notes:', error);
      setWorkspaceNotes('');
    }
  };

  const saveTaskNotes = async () => {
    if (!workspaceTask) return;
  
    setSavingNotes(true);
    try {
      await apiCall(`/tasks/${workspaceTask.id}/notes`, 'POST', { notes: workspaceNotes });
      console.log('Notes saved successfully');
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const openWorkspace = async (task, source = 'session') => {
    setWorkspaceTask(task);
    setWorkspaceTab('canvas');
    setWorkspaceSource(source);
    setWorkspaceToolEmbed(null);
    setWorkspaceIntegrationEmbed(null);
    // Reset free timer
    setFreeTimerMins('');
    setFreeTimerSecs(0);
    setFreeTimerRunning(false);
    setFreeTimerDone(false);
    if (freeTimerIntervalRef.current) { clearInterval(freeTimerIntervalRef.current); freeTimerIntervalRef.current = null; }
    await loadTaskNotes(task.id);
    setShowWorkspace(true);
    
    // Automatically open Canvas in split-screen
    if (task.url) {
      openSplitScreen(task.url);
    }
  };

  const closeWorkspace = async () => {
    if (workspaceNotes) {
      await saveTaskNotes();
    }
    // Close Canvas window if open
    if (canvasWindow && !canvasWindow.closed) {
      canvasWindow.close();
    }
    // Stop free timer if running
    if (freeTimerIntervalRef.current) { clearInterval(freeTimerIntervalRef.current); freeTimerIntervalRef.current = null; }
    setFreeTimerRunning(false);
    setShowWorkspace(false);
    setWorkspaceTask(null);
    setWorkspaceNotes('');
    setCanvasWindow(null);
    setWorkspaceToolEmbed(null);
    setWorkspaceIntegrationEmbed(null);
    // Restore window to full size
    try {
      window.moveTo(0, 0);
      window.resizeTo(window.screen.availWidth, window.screen.availHeight);
    } catch (e) {
      // Ignore errors if window manipulation is blocked
    }
  };

  const openSplitScreen = (url) => {
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;
    
    // Close existing Canvas window if open
    if (canvasWindow && !canvasWindow.closed) {
      canvasWindow.close();
    }
    
    // Calculate half screen width
    const halfWidth = Math.floor(screenWidth / 2);
    
    // Open Canvas window on RIGHT half
    const newCanvasWindow = window.open(
      url,
      'canvas-window',
      `width=${halfWidth},height=${screenHeight},left=${halfWidth},top=0,resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=yes,status=yes,alwaysRaised=yes`
    );
    
    if (newCanvasWindow) {
      setCanvasWindow(newCanvasWindow);
      
      // NOTE: Modern browsers block resizing/moving the main window for security.
      // We attempt it here, but it will likely be blocked.
      // Users should manually resize their browser window to the left half of the screen.
      setTimeout(() => {
        try {
          window.resizeTo(halfWidth, screenHeight);
          window.moveTo(0, 0);
        } catch (e) {
          // Silently fail - this is expected in modern browsers
          console.log('Browser blocked window resize (expected behavior)');
        }
        
        // Focus Canvas window after positioning
        setTimeout(() => {
          if (newCanvasWindow && !newCanvasWindow.closed) {
            newCanvasWindow.focus();
          }
        }, 100);
      }, 100);
      
    }
  };

  // ============================================================================
  // NOTES POPUP FUNCTIONS (Quick notes from task list)
  // ============================================================================

  const openNotesPopup = async (task) => {
    setShowNotesPopup(task);
    setPopupNotesLastSaved(null);
    
    // Load existing notes
    try {
      const data = await apiCall(`/tasks/${task.id}/notes`, 'GET');
      setPopupNotes(data.notes || '');
    } catch (error) {
      console.error('Failed to load notes:', error);
      setPopupNotes('');
    }
  };

  const closeNotesPopup = async () => {
    // Auto-save before closing if there are notes
    if (popupNotes && showNotesPopup) {
      await savePopupNotes();
    }
    setShowNotesPopup(null);
    setPopupNotes('');
    setPopupNotesLastSaved(null);
  };

  const savePopupNotes = async () => {
    if (!showNotesPopup) return;

    setPopupNotesSaving(true);
    try {
      await apiCall(`/tasks/${showNotesPopup.id}/notes`, 'POST', { notes: popupNotes });
      setPopupNotesLastSaved(new Date());
      
      // Update the tasksWithNotes set
      if (popupNotes.trim()) {
        setTasksWithNotes(prev => new Set([...prev, showNotesPopup.id]));
      } else {
        setTasksWithNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(showNotesPopup.id);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('Failed to save notes');
    } finally {
      setPopupNotesSaving(false);
    }
  };

  // Auto-save notes after 2 seconds of inactivity
  useEffect(() => {
    if (!showNotesPopup) return;

    const timer = setTimeout(() => {
      savePopupNotes();
    }, 2000);

    return () => clearTimeout(timer);
  }, [popupNotes, showNotesPopup]);

  // ============================================================================
  // WORKSPACE TOOL FUNCTIONS - Whiteboard, White Noise, Pomodoro
  // ============================================================================

  // Initialize whiteboard once when tab is opened
  useEffect(() => {
    if (workspaceTab === 'whiteboard' && whiteboardRef.current && !whiteboardInitialized) {
      const canvas = whiteboardRef.current;
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Set canvas size to match display size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Attach touch listeners with {passive: false}
      const preventDefaultTouch = (e) => e.preventDefault();
      
      canvas.addEventListener('touchstart', preventDefaultTouch, { passive: false });
      canvas.addEventListener('touchmove', preventDefaultTouch, { passive: false });
      
      setWhiteboardInitialized(true);
      
      // Cleanup
      return () => {
        canvas.removeEventListener('touchstart', preventDefaultTouch);
        canvas.removeEventListener('touchmove', preventDefaultTouch);
      };
    }
  }, [workspaceTab, whiteboardInitialized]);

  // Reset initialization when leaving whiteboard tab
  useEffect(() => {
    if (workspaceTab !== 'whiteboard') {
      setWhiteboardInitialized(false);
    }
  }, [workspaceTab]);

  // Whiteboard drawing functions

  const getCoordinates = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Handle both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    const canvas = whiteboardRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    const canvas = whiteboardRef.current;
    if (!isDrawing || !canvas) return;
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e, canvas);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawWidth;
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    const canvas = whiteboardRef.current;
    if (!canvas) return;
    if (isDrawing) {
      const ctx = canvas.getContext('2d');
      ctx.closePath();
    }
    setIsDrawing(false);
  };

  const clearWhiteboard = () => {
    const canvas = whiteboardRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // White noise functions
  const toggleWhiteNoise = () => {
    if (isWhiteNoisePlaying) {
      if (whiteNoiseAudio && whiteNoiseAudio.context && whiteNoiseAudio.context.state !== 'closed') {
        whiteNoiseAudio.context.close();
      }
      setWhiteNoiseAudio(null);
      setIsWhiteNoisePlaying(false);
    } else {
      playWhiteNoise(whiteNoiseType);
    }
  };

  const playWhiteNoise = (type) => {
    // Stop any existing audio
    if (whiteNoiseAudio && whiteNoiseAudio.context && whiteNoiseAudio.context.state !== 'closed') {
      whiteNoiseAudio.context.close();
    }

    // Use Web Audio API to generate sounds (no external URLs needed!)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    let oscillator, gainNode, filter;
    
    switch(type) {
      case 'whitenoise':
        // Pure white noise using buffer
        const bufferSize = 2 * audioContext.sampleRate;
        const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = audioContext.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        gainNode = audioContext.createGain();
        gainNode.gain.value = whiteNoiseVolume * 0.3;
        whiteNoise.connect(gainNode);
        gainNode.connect(audioContext.destination);
        whiteNoise.start(0);
        
        setWhiteNoiseAudio({
          context: audioContext,
          gainNode: gainNode
        });
        break;
        
      case 'rain':
      case 'pink':
        // Pink noise (softer, more balanced than white)
        const pinkBufferSize = 2 * audioContext.sampleRate;
        const pinkBuffer = audioContext.createBuffer(1, pinkBufferSize, audioContext.sampleRate);
        const pinkOutput = pinkBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < pinkBufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          pinkOutput[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }
        const pinkNoise = audioContext.createBufferSource();
        pinkNoise.buffer = pinkBuffer;
        pinkNoise.loop = true;
        gainNode = audioContext.createGain();
        gainNode.gain.value = whiteNoiseVolume * 0.35;
        pinkNoise.connect(gainNode);
        gainNode.connect(audioContext.destination);
        pinkNoise.start(0);
        
        setWhiteNoiseAudio({
          context: audioContext,
          gainNode: gainNode
        });
        break;
        
      case 'ocean':
      case 'brown':
        // Brown noise (deep, bass-heavy rumble)
        const brownBufferSize = 2 * audioContext.sampleRate;
        const brownBuffer = audioContext.createBuffer(1, brownBufferSize, audioContext.sampleRate);
        const brownOutput = brownBuffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < brownBufferSize; i++) {
          const white = Math.random() * 2 - 1;
          brownOutput[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = brownOutput[i];
          brownOutput[i] *= 3.5;
        }
        const brownNoise = audioContext.createBufferSource();
        brownNoise.buffer = brownBuffer;
        brownNoise.loop = true;
        gainNode = audioContext.createGain();
        gainNode.gain.value = whiteNoiseVolume * 0.4;
        
        // Add extra low-pass filtering for ocean (deeper)
        if (type === 'ocean') {
          filter = audioContext.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 300; // Very low for deep ocean rumble
          filter.Q.value = 0.5;
          
          brownNoise.connect(filter);
          filter.connect(gainNode);
        } else {
          brownNoise.connect(gainNode);
        }
        
        gainNode.connect(audioContext.destination);
        brownNoise.start(0);
        
        setWhiteNoiseAudio({
          context: audioContext,
          gainNode: gainNode
        });
        break;
    }
    
    setIsWhiteNoisePlaying(true);
    setWhiteNoiseType(type);
  };

  const changeWhiteNoiseVolume = (volume) => {
    setWhiteNoiseVolume(volume);
    if (whiteNoiseAudio && whiteNoiseAudio.gainNode) {
      // Adjust gain node volume
      whiteNoiseAudio.gainNode.gain.value = volume * 0.4;
    }
  };

  // Cleanup white noise on unmount
  useEffect(() => {
    return () => {
      if (whiteNoiseAudio && whiteNoiseAudio.context && whiteNoiseAudio.context.state !== 'closed') {
        whiteNoiseAudio.context.close();
      }
    };
  }, [whiteNoiseAudio]);

  // Pomodoro functions
  const startPomodoro = () => {
    setIsPomodoroRunning(true);
  };

  const pausePomodoro = () => {
    setIsPomodoroRunning(false);
  };

  const resetPomodoro = () => {
    setIsPomodoroRunning(false);
    if (pomodoroMode === 'work') {
      setPomodoroTime(25 * 60);
    } else if (pomodoroMode === 'shortBreak') {
      setPomodoroTime(5 * 60);
    } else {
      setPomodoroTime(15 * 60);
    }
  };

  const switchPomodoroMode = (mode) => {
    setPomodoroMode(mode);
    setIsPomodoroRunning(false);
    if (mode === 'work') {
      setPomodoroTime(25 * 60);
    } else if (mode === 'shortBreak') {
      setPomodoroTime(5 * 60);
    } else {
      setPomodoroTime(15 * 60);
    }
  };

  // Pomodoro timer countdown
  useEffect(() => {
    let interval = null;
    if (isPomodoroRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(time => time - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      setIsPomodoroRunning(false);
      // Play notification sound or show alert
      alert(`${pomodoroMode === 'work' ? 'Work session' : 'Break'} complete!`);
      
      // Auto-switch mode
      if (pomodoroMode === 'work') {
        setPomodoroSessions(prev => prev + 1);
        if (pomodoroSessions + 1 >= 4) {
          switchPomodoroMode('longBreak');
          setPomodoroSessions(0);
        } else {
          switchPomodoroMode('shortBreak');
        }
      } else {
        switchPomodoroMode('work');
      }
    }
    return () => clearInterval(interval);
  }, [isPomodoroRunning, pomodoroTime, pomodoroMode, pomodoroSessions]);

  const formatPomodoroTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Free workspace timer (Session mode only) helpers
  const startFreeTimer = () => {
    const totalSecs = parseInt(freeTimerMins) * 60;
    if (!totalSecs || totalSecs <= 0) return;
    setFreeTimerSecs(totalSecs);
    setFreeTimerDone(false);
    setFreeTimerRunning(true);
    if (freeTimerIntervalRef.current) clearInterval(freeTimerIntervalRef.current);
    freeTimerIntervalRef.current = setInterval(() => {
      setFreeTimerSecs(prev => {
        if (prev <= 1) {
          clearInterval(freeTimerIntervalRef.current);
          freeTimerIntervalRef.current = null;
          setFreeTimerRunning(false);
          setFreeTimerDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  const resetFreeTimer = () => {
    if (freeTimerIntervalRef.current) { clearInterval(freeTimerIntervalRef.current); freeTimerIntervalRef.current = null; }
    setFreeTimerRunning(false);
    setFreeTimerDone(false);
    setFreeTimerSecs(0);
    setFreeTimerMins('');
  };

  // Handle Escape key to close notes popup
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showNotesPopup) {
        closeNotesPopup();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showNotesPopup]);

  // Load which tasks have notes on mount
  useEffect(() => {
    const loadTasksWithNotes = async () => {
      if (!isAuthenticated || tasks.length === 0) return;
      
      try {
        const notesPromises = tasks.map(task => 
          apiCall(`/tasks/${task.id}/notes`, 'GET').catch(() => ({ notes: '' }))
        );
        const notesResults = await Promise.all(notesPromises);
        
        const tasksWithNotesSet = new Set();
        notesResults.forEach((result, index) => {
          if (result.notes && result.notes.trim()) {
            tasksWithNotesSet.add(tasks[index].id);
          }
        });
        
        setTasksWithNotes(tasksWithNotesSet);
      } catch (error) {
        console.error('Failed to load tasks with notes:', error);
      }
    };

    loadTasksWithNotes();
  }, [isAuthenticated, tasks.length]);

  // ============================================================================
  // HUB FEATURES - Load completion feed, leaderboard, and stats
  // ============================================================================

  const loadCourses = async () => {
    try {
      const data = await apiCall('/courses', 'GET');
      const courseList = data || [];
      setCourses(courseList);
      // Fetch class averages for each course in parallel
      const averages = {};
      await Promise.all(courseList.map(async (course) => {
        try {
          const avg = await apiCall(`/courses/${course.course_id}/average`, 'GET');
          averages[course.course_id] = avg;
        } catch (e) {
          averages[course.course_id] = { averageScore: null, studentCount: 0 };
        }
      }));
      setCourseAverages(averages);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  const loadCompletionFeed = async () => {
    try {
      const data = await apiCall('/completion-feed', 'GET');
      setCompletionFeed(data || []);
    } catch (error) {
      // Silently ignore - backend may be cold-starting on Render free tier
    }
  };

  const loadLeaderboard = async () => {
    if (!user || !user.grade) return;
    
    try {
      const data = await apiCall(`/leaderboard/${user.grade}`, 'GET');
      setLeaderboard(data || []);
      
      // Also get user's position
      const position = await apiCall(`/leaderboard/position/${user.grade}`, 'GET');
      setUserLeaderboardPosition(position);
    } catch (error) {
      // Silently ignore - backend may be cold-starting on Render free tier
    }
  };

  const calculateHubStats = () => {
    if (!completionHistory || completionHistory.length === 0) {
      setHubStats({
        tasksCompletedToday: 0,
        tasksCompletedWeek: 0,
        totalStudyTime: 0,
        averageAccuracy: 0,
        streak: 0
      });
      return;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get Monday of this week
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const tasksCompletedToday = completionHistory.filter(task => 
      task.date >= todayStart
    ).length;

    const tasksCompletedWeek = completionHistory.filter(task => 
      task.date >= weekStart
    ).length;

    const totalStudyTime = completionHistory.reduce((sum, task) => 
      sum + (task.actualTime || 0), 0
    );

    // Calculate accuracy (actual time vs estimated time)
    // Only include tasks where both values exist
    const tasksWithBothTimes = completionHistory.filter(task => 
      task.estimatedTime && task.actualTime && task.estimatedTime > 0 && task.actualTime > 0
    );
    
    const accuracySum = tasksWithBothTimes.reduce((sum, task) => {
      // Accuracy = how close you were to your estimate
      // If actual time matches estimated time = 100%
      // If you underestimate (actual > estimated) = lower score
      // If you overestimate (actual < estimated) = also lower score
      const ratio = Math.min(task.estimatedTime / task.actualTime, task.actualTime / task.estimatedTime);
      const accuracy = ratio * 100;
      return sum + accuracy;
    }, 0);
    
    const averageAccuracy = tasksWithBothTimes.length > 0 
      ? Math.round(accuracySum / tasksWithBothTimes.length) 
      : 0;

    // Calculate streak (consecutive WEEKDAYS with completions, excluding weekends)
    const sortedCompletions = [...completionHistory].sort((a, b) => 
      b.date - a.date
    );
    
    // Get unique dates (ignore time)
    const completionDates = [...new Set(sortedCompletions.map(task => {
      const d = new Date(task.date);
      return d.toDateString();
    }))].map(dateStr => new Date(dateStr));
    
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    // Skip weekends when looking backwards
    while (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Check each weekday going backwards
    while (true) {
      const dateStr = checkDate.toDateString();
      const hasCompletion = completionDates.some(d => d.toDateString() === dateStr);
      
      if (hasCompletion) {
        streak++;
        // Move to previous weekday
        checkDate.setDate(checkDate.getDate() - 1);
        while (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
          checkDate.setDate(checkDate.getDate() - 1);
        }
      } else {
        // Streak broken
        break;
      }
      
      // Safety: don't go back more than 365 days
      if (streak > 365) break;
    }

    setHubStats({
      tasksCompletedToday,
      tasksCompletedWeek,
      totalStudyTime,
      averageAccuracy,
      streak
    });
  };

  // Load Hub data when authenticated or when completion history changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCourses();
      
      // Delay initial feed/leaderboard load by 2s to let the server warm up
      // (Render free tier spins down after inactivity)
      const initialDelay = setTimeout(() => {
        loadCompletionFeed();
        loadLeaderboard();
      }, 2000);
      
      // Refresh feed and leaderboard every 2 minutes (not 30s - reduces cold-start hammering)
      const interval = setInterval(() => {
        loadCompletionFeed();
        loadLeaderboard();
      }, 120000);
      
      return () => {
        clearTimeout(initialDelay);
        clearInterval(interval);
      };
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    calculateHubStats();
  }, [completionHistory]);

  // Scroll to top when navigating to Hub; reload courses when navigating to Marks
  useEffect(() => {
    if (currentPage === 'hub') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (currentPage === 'marks') {
      loadCourses();
    }
    if (currentPage === 'sessions') {
      loadSessionTasks();
    }
    if (currentPage === 'agendas') {
      loadAgendas();
      loadSessionTasks();
    }
    if (currentPage === 'itinerary') {
      const todayDate = new Date();
      const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth()+1).padStart(2,'0')}-${String(todayDate.getDate()).padStart(2,'0')}`;
      setItineraryDate(todayDate);
      loadItinerary(todayStr);
      loadTutorials(todayStr);
      loadScheduleLessons(); // always fetch; returns empty if not enhanced
      loadAgendas();
    }
  }, [currentPage]);

  const switchWorkspaceTab = async (tab) => {
    if (workspaceTab === 'notes' && tab !== 'notes') {
      await saveTaskNotes();
    }
    setWorkspaceToolEmbed(null);
    setWorkspaceIntegrationEmbed(null);
    setWorkspaceEmbedZoom(1.0);
    setWorkspaceTab(tab);
  };
  

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (accountSetup.presentPeriods) {
      const [start, end] = accountSetup.presentPeriods.split('-').map(Number);
      const newSchedule = {};
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      days.forEach(day => {
        newSchedule[day] = {};
        for (let period = start; period <= end; period++) {
          newSchedule[day][period] = accountSetup.schedule[day]?.[String(period)] || 'Study';
        }
      });
      if (JSON.stringify(newSchedule) !== JSON.stringify(accountSetup.schedule)) {
        setAccountSetup(prev => ({ ...prev, schedule: newSchedule }));
      }
    }
  }, [accountSetup.presentPeriods]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-purple-50 to-blue-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-purple-600 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">PlanAssist</h1>
            <p className="text-lg font-semibold text-purple-600">OneSchool Global Study Planner</p>
          </div>
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 rounded-md font-medium transition-colors ${authMode === 'login' ? 'bg-white text-purple-600 shadow' : 'text-gray-600'}`}>Login</button>
            <button onClick={() => setAuthMode('register')} className={`flex-1 py-2 rounded-md font-medium transition-colors ${authMode === 'register' ? 'bg-white text-purple-600 shadow' : 'text-gray-600'}`}>Sign Up</button>
          </div>
          {authError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{authError}</div>}
          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OneSchool Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="first.last##@na.oneschoolglobal.com" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required />
            </div>
            <button type="submit" disabled={authLoading} className="w-full bg-gradient-to-r from-yellow-400 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700 transition-all disabled:opacity-50">
              {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Login' : 'Create Account')}
            </button>
          </form>
        </div>
      </div>
    );
  }


  const TUTORIAL_STEPS = [
    {
      page: 'hub',
      title: '👋 Welcome to PlanAssist!',
      body: 'This is your Hub — your home base. Here you can see your live activity feed, leaderboard, and stats at a glance.',
      arrow: null,
    },
    {
      page: 'tasks',
      title: '📋 Your Task List',
      body: 'This is where all your Canvas assignments live. Drag tasks to reorder your priorities, set manual time estimates, or split big tasks into smaller chunks. Hit Sync to pull in fresh assignments from Canvas.',
      arrow: null,
    },
    {
      page: 'sessions',
      title: '⏱ Study Sessions',
      body: 'PlanAssist builds study sessions from your schedule. Each session fills your free periods with tasks in priority order. Hit Start when you\'re ready to work — the timer tracks your time on each task.',
      arrow: null,
    },
    {
      page: 'marks',
      title: '📊 Marks',
      body: 'The Marks page shows your current grade in every course, compared against the global average of all PlanAssist users. Grades update automatically when you sync.',
      arrow: null,
    },
    {
      page: 'hub',
      title: '🚀 You\'re all set!',
      body: 'Start by syncing your Canvas tasks, then drag them into priority order and hit Save & Adjust Plan. Your sessions will be ready to go. Good luck!',
      arrow: null,
    },
  ];

  const handleTutorialNext = () => {
    const next = tutorialStep + 1;
    if (next >= TUTORIAL_STEPS.length) {
      setShowTutorial(false);
      return;
    }
    setTutorialStep(next);
    const nextPage = TUTORIAL_STEPS[next].page;
    if (nextPage !== currentPage) setCurrentPage(nextPage);
  };

  const handleTutorialPrev = () => {
    const prev = tutorialStep - 1;
    if (prev < 0) return;
    setTutorialStep(prev);
    const prevPage = TUTORIAL_STEPS[prev].page;
    if (prevPage !== currentPage) setCurrentPage(prevPage);
  };

  // Full-page loading screen on refresh (fix 3+4)
  if (isAppLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">PlanAssist</h2>
          <p className="text-gray-500 text-sm mt-1">Loading your plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-gray-50 to-blue-50 ${currentPage === 'tasks' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PlanAssist</h1>
              <p className="text-sm text-gray-600">{accountSetup.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => !isSavingPlan && !['session-active','agenda-active'].includes(currentPage) && setCurrentPage('hub')} disabled={['session-active','agenda-active'].includes(currentPage) || isSavingPlan} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'hub' ? 'bg-purple-100 text-purple-700' : (['session-active','agenda-active'].includes(currentPage) || isSavingPlan) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Home className="w-5 h-5" />
              <span className="font-medium">Hub</span>
            </button>
            <button onClick={() => !isSavingPlan && !['session-active','agenda-active'].includes(currentPage) && setCurrentPage('calendar')} disabled={['session-active','agenda-active'].includes(currentPage) || isSavingPlan} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'calendar' ? 'bg-purple-100 text-purple-700' : (['session-active','agenda-active'].includes(currentPage) || isSavingPlan) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Calendar</span>
            </button>
            <button onClick={() => !isSavingPlan && !['session-active','agenda-active'].includes(currentPage) && setCurrentPage('tasks')} disabled={['session-active','agenda-active'].includes(currentPage) || isSavingPlan} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'tasks' ? 'bg-purple-100 text-purple-700' : (['session-active','agenda-active'].includes(currentPage) || isSavingPlan) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <List className="w-5 h-5" />
              <span className="font-medium">Tasks</span>
              {hasUnsavedChanges && !['session-active','agenda-active'].includes(currentPage) && <span className="w-2 h-2 bg-orange-500 rounded-full"></span>}
            </button>
            <button onClick={() => !isSavingPlan && !isLoadingTasks && !['session-active','agenda-active'].includes(currentPage) && setCurrentPage('sessions')} disabled={['session-active','agenda-active'].includes(currentPage) || isSavingPlan || isLoadingTasks} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'sessions' ? 'bg-purple-100 text-purple-700' : (['session-active','agenda-active'].includes(currentPage) || isSavingPlan || isLoadingTasks) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Play className="w-5 h-5" />
              <span className="font-medium">Sessions</span>
            </button>
            <button onClick={() => !isSavingPlan && !['session-active','agenda-active'].includes(currentPage) && setCurrentPage('agendas')} disabled={['session-active','agenda-active'].includes(currentPage) || isSavingPlan} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'agendas' ? 'bg-purple-100 text-purple-700' : (['session-active','agenda-active'].includes(currentPage) || isSavingPlan) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <LayoutList className="w-5 h-5" />
              <span className="font-medium">Agendas</span>
            </button>
            <button onClick={() => !isSavingPlan && !['session-active','agenda-active'].includes(currentPage) && setCurrentPage('itinerary')} disabled={['session-active','agenda-active'].includes(currentPage) || isSavingPlan} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'itinerary' ? 'bg-purple-100 text-purple-700' : (['session-active','agenda-active'].includes(currentPage) || isSavingPlan) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <ClipboardList className="w-5 h-5" />
              <span className="font-medium">Itinerary</span>
            </button>
            <button onClick={() => !isSavingPlan && !['session-active','agenda-active'].includes(currentPage) && setCurrentPage('marks')} disabled={['session-active','agenda-active'].includes(currentPage) || isSavingPlan} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'marks' ? 'bg-purple-100 text-purple-700' : (['session-active','agenda-active'].includes(currentPage) || isSavingPlan) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Marks</span>
            </button>
            <button onClick={() => !isSavingPlan && !isLoadingTasks && handleAccountPageOpen()} disabled={['session-active','agenda-active'].includes(currentPage) || isSavingPlan || isLoadingTasks} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'account' ? 'bg-purple-100 text-purple-700' : (['session-active','agenda-active'].includes(currentPage) || isSavingPlan || isLoadingTasks) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <UserCircle className="w-5 h-5" />
            </button>
            {user?.isAdmin && (
              <button
                onClick={() => { setAdminSection('users'); setCurrentPage('admin'); loadAdminUsers(); }}
                disabled={['session-active','agenda-active'].includes(currentPage) || isSavingPlan}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold ${currentPage === 'admin' ? 'bg-red-100 text-red-700' : 'text-red-600 hover:bg-red-50'}`}
              >
                <Shield className="w-5 h-5" />
              </button>
            )}
            {isLoadingTasks && currentPage !== 'tasks' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
                <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Syncing
              </div>
            )}
            <button onClick={handleLogout} disabled={['session-active','agenda-active'].includes(currentPage) || isSavingPlan || isLoadingTasks} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${(['session-active','agenda-active'].includes(currentPage) || isSavingPlan || isLoadingTasks) ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}>
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* PWA Install Banner */}
      {showPwaBanner && isAuthenticated && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">Install PlanAssist</p>
              <p className="text-purple-200 text-xs">Add to your desktop for quick access — no browser needed</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handlePwaInstall}
              className="bg-white text-purple-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Install
            </button>
            <button
              onClick={dismissPwaBanner}
              className="text-purple-200 hover:text-white transition-colors p-1"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Announcement Banners ─────────────────────────────────────────── */}
      {announcements.filter(a => !a.dismissed).map(a => (
        <div
          key={a.id}
          className={`w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium z-30 ${
            a.type === 'urgent'
              ? 'bg-red-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {a.type === 'urgent'
              ? <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              : <Bell className="w-4 h-4 flex-shrink-0" />}
            <span>{a.message}</span>
          </div>
          {a.type === 'info' && (
            <button
              onClick={() => dismissAnnouncement(a.id)}
              className="ml-4 flex-shrink-0 opacity-80 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}

      {/* Save & Adjust Plan - Full Lock Overlay */}
      {isSavingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40 cursor-not-allowed" />
      )}

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end justify-center pb-12 pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-md w-full pointer-events-auto border-2 border-purple-300">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-purple-500 uppercase tracking-wider">
                Step {tutorialStep + 1} of {TUTORIAL_STEPS.length}
              </span>
              <button onClick={() => setShowTutorial(false)} className="text-gray-400 hover:text-gray-600 text-sm">
                Skip tour
              </button>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{TUTORIAL_STEPS[tutorialStep].title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-5">{TUTORIAL_STEPS[tutorialStep].body}</p>
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {TUTORIAL_STEPS.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === tutorialStep ? 'bg-purple-600' : 'bg-gray-200'}`} />
                ))}
              </div>
              <div className="flex gap-2">
                {tutorialStep > 0 && (
                  <button onClick={handleTutorialPrev} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                    ← Back
                  </button>
                )}
                <button onClick={handleTutorialNext} className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700">
                  {tutorialStep === TUTORIAL_STEPS.length - 1 ? 'Get Started!' : 'Next →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="py-6">
        {currentPage === 'hub' && (
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-8 shadow-lg">
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Student'}!</h1>
              <p className="text-purple-100">Here's how you're doing today</p>
            </div>

            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-md border-2 border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <Check className="w-6 h-6 text-blue-600" />
                  <span className="text-3xl font-bold text-gray-900">{hubStats.tasksCompletedToday}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Today</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-md border-2 border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-6 h-6 text-purple-600" />
                  <span className="text-3xl font-bold text-gray-900">{hubStats.tasksCompletedWeek}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">This Week</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-md border-2 border-amber-100">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-6 h-6 text-amber-600" />
                  <span className="text-3xl font-bold text-gray-900">{Math.floor(hubStats.totalStudyTime / 60)}h</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Study Time</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-md border-2 border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-6 h-6 text-green-600" />
                  <span className="text-3xl font-bold text-gray-900">{hubStats.averageAccuracy}%</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Accuracy</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-md border-2 border-orange-100">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-6 h-6 text-orange-600" />
                  <span className="text-3xl font-bold text-gray-900">{hubStats.streak}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Day Streak</p>
              </div>
            </div>

            {/* Main Content Grid - Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Next Task and Quick Actions */}
              <div className="lg:col-span-2 space-y-6">
                {/* Next Up Task */}
                {tasks.filter(t => !t.deleted && !t.completed).length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <h2 className="text-xl font-bold text-gray-900">Next Up</h2>
                    </div>
                    {(() => {
                      const nextTask = tasks.filter(t => !t.deleted && !t.completed).sort((a, b) => a.dueDate - b.dueDate)[0];
                      return (
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 mb-2">{nextTask.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {nextTask.userEstimate || nextTask.estimatedTime} min
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Due {nextTask.dueDate.toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <button onClick={() => setCurrentPage('tasks')} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium transition-colors flex-shrink-0">
                              View All
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Live Completion Feed */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-green-600" />
                    <h2 className="text-xl font-bold text-gray-900">Live Activity</h2>
                    <span className="ml-auto text-xs text-gray-500">Updates every 30s</span>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {completionFeed.length > 0 ? (
                      completionFeed.map((item, index) => {
                        const timeAgo = (() => {
                          const seconds = Math.floor((new Date() - new Date(item.completed_at)) / 1000);
                          if (seconds < 60) return 'just now';
                          if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
                          if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
                          return `${Math.floor(seconds / 86400)}d ago`;
                        })();
                        
                        return (
                          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900">
                                <span className="font-semibold">{item.user_name.split(' ')[0]}</span>
                                {item.user_grade && <span className="text-gray-500"> (Grade {item.user_grade})</span>}
                                <span className="text-gray-600"> completed </span>
                                <span className="font-medium text-purple-600">{item.task_title}</span>
                              </p>
                              <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Award className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No recent activity</p>
                        <p className="text-xs mt-1">Complete tasks to appear here!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={() => setCurrentPage('sessions')} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all text-left border-2 border-transparent hover:border-green-200">
                    <Play className="w-10 h-10 text-green-600 mb-3" />
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Start Session</h3>
                    <p className="text-sm text-gray-600">Begin your study period</p>
                  </button>
                  <button onClick={() => setCurrentPage('tasks')} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all text-left border-2 border-transparent hover:border-blue-200">
                    <List className="w-10 h-10 text-blue-600 mb-3" />
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Manage Tasks</h3>
                    <p className="text-sm text-gray-600">View your task list</p>
                  </button>
                  {user?.grade && parseInt(user.grade) >= 7 && parseInt(user.grade) <= 12 && (
                    <button onClick={openHubTutorialDialog} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all text-left border-2 border-transparent hover:border-orange-200">
                      <BookOpen className="w-10 h-10 text-orange-500 mb-3" />
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Book a Tutorial</h3>
                      <p className="text-sm text-gray-600">Schedule a teacher meeting</p>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column - Leaderboard */}
              <div className="space-y-6">
                {user?.grade && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy className="w-5 h-5 text-yellow-600" />
                      <h2 className="text-xl font-bold text-gray-900">Grade {user.grade} Leaders</h2>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">Weekly tasks completed • Resets Monday</p>
                    
                    {/* User's Position */}
                    {userLeaderboardPosition && userLeaderboardPosition.position && (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Your Rank</p>
                            <p className="text-2xl font-bold text-purple-600">#{userLeaderboardPosition.position}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Tasks Done</p>
                            <p className="text-2xl font-bold text-gray-900">{userLeaderboardPosition.tasks_completed}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Leaderboard List */}
                    <div className="space-y-2">
                      {leaderboard.length > 0 ? (
                        leaderboard.map((entry, index) => {
                          const isCurrentUser = entry.user_name === user?.name;
                          const medals = ['🥇', '🥈', '🥉'];
                          
                          return (
                            <div 
                              key={index} 
                              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                isCurrentUser 
                                  ? 'bg-purple-100 border-2 border-purple-300' 
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                            >
                              <div className="w-8 text-center font-bold text-gray-900">
                                {index < 3 ? medals[index] : `#${index + 1}`}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${
                                  isCurrentUser ? 'text-purple-900' : 'text-gray-900'
                                }`}>
                                  {entry.user_name}
                                  {isCurrentUser && <span className="ml-2 text-xs text-purple-600">(You)</span>}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">{entry.tasks_completed}</p>
                                <p className="text-xs text-gray-500">tasks</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Trophy className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>No leaderboard yet</p>
                          <p className="text-xs mt-1">Complete tasks to appear!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pending Tasks Summary */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-900">In Progress</h2>
                  </div>
                  <div className="text-center py-6">
                    <div className="text-5xl font-bold text-gray-900 mb-2">
                      {tasks.filter(t => !t.deleted && !t.completed && t.accumulatedTime > 0).length}
                    </div>
                    <p className="text-gray-600">tasks with partial time</p>
                  </div>
                  <button 
                    onClick={() => setCurrentPage('tasks')} 
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    View All Tasks
                  </button>
                </div>
              </div>
            </div>

            {/* No Tasks State */}
            {tasks.length === 0 && (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Tasks Yet</h3>
                <p className="text-gray-600 mb-6">Connect your Canvas calendar to get started</p>
                <button onClick={() => setCurrentPage('settings')} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all">
                  Set Up Canvas
                </button>
              </div>
            )}
          </div>
        )}
        {currentPage === 'tasks' && (
          <div className="flex h-[calc(100vh-80px)] overflow-hidden">
            {/* Main Task List */}
            <div className={`flex-1 transition-all duration-300 ${newTasksSidebarOpen ? 'mr-96' : 'mr-0'}`}>
              <div className="h-full overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-xl shadow-md p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Task List</h2>
                        <p className="text-gray-600">Manage your upcoming tasks</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => { setAddTaskForm({ title: '', deadlineDate: '', deadlineTime: '', estimatedTime: '', description: '', url: '' }); setShowAddTask(true); }}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-medium flex items-center gap-2 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="hidden sm:inline">Add Task</span>
                        </button>
                        <button
                          onClick={fetchCanvasTasks}
                          disabled={isLoadingTasks}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2 disabled:opacity-50 transition-all"
                        >
                          {isLoadingTasks ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span className="hidden sm:inline">Sync</span></>
                          ) : (
                            <><Upload className="w-4 h-4" /><span className="hidden sm:inline">Sync</span></>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Unsaved Changes Warning */}
                    {hasUnsavedChanges && (
                      <div className="mb-4 p-3 bg-orange-50 border-2 border-orange-300 rounded-lg flex items-center justify-between">
                        <p className="text-orange-800 font-medium">
                          WARNING: You have unsaved changes. Click Save and Adjust Plan to apply.
                        </p>
                        <button 
                          onClick={handleSaveAndAdjustPlan} 
                          disabled={isSavingPlan}
                          className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-md transition-all ${isSavingPlan ? 'bg-orange-400 text-white cursor-not-allowed opacity-70' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
                        >
                          {isSavingPlan ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5" />
                              Save and Adjust Plan
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Task List */}
                    <div className="space-y-4">
                      {(() => {
                        const incompleteTasks = tasks.filter(t => !t.deleted && !t.completed && isCourseEnabled(t));
                        
                        if (incompleteTasks.length === 0) {
                          return (
                            <div className="text-center py-12">
                              <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                              <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
                              <p className="text-gray-600">No pending tasks</p>
                            </div>
                          );
                        }
                        
                        return incompleteTasks.map((task, index) => {
                            const taskTime = task.userEstimate || task.estimatedTime;
                            const className = extractClassName(task);
                            const classColor = getClassColor(task);
                            const dueDate = new Date(task.dueDate);
                            const dayName = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            
                            return (
                              <div 
                                key={task.id}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, task)}
                                onDragOver={(e) => handleDragOver(e, task)}
                                onDragEnd={handleDragEnd}
                                onDrop={(e) => handleDrop(e, task)}
                                className={`border-2 rounded-lg p-4 transition-all cursor-move bg-white hover:shadow-lg ${
                                  dragOverTask?.id === task.id ? 'opacity-50 scale-98 ring-2 ring-purple-400' : ''
                                }`}
                                style={{ 
                                  borderColor: classColor,
                                  borderLeftWidth: '6px'
                                }}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                                      {index + 1}
                                    </div>
                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                  </div>
                                  
                                  {/* Checkbox with loading state */}
                                  {checkingTask === task.id ? (
                                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                  ) : (
                                    <input
                                      type="checkbox"
                                      checked={task.completed || false}
                                      onChange={() => toggleTaskCompletion(task.id)}
                                      disabled={checkingTask !== null}
                                      className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer flex-shrink-0"
                                    />
                                  )}
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <a 
                                        href={task.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="font-semibold text-gray-900 text-lg hover:text-purple-600 hover:underline transition-colors"
                                      >
                                        {cleanTaskTitle(task)}
                                      </a>
                                      <span 
                                        className="px-2 py-0.5 rounded-full text-xs font-bold text-white flex-shrink-0"
                                        style={{ backgroundColor: classColor }}
                                      >
                                        {className}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {task.hasSpecificTime ? (
                                          <>
                                            {dayName} at <span title="Specific deadline time from Canvas">{dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                                          </>
                                        ) : (
                                          <span title="Due date (no specific time)">{dayName}</span>
                                        )}
                                      </span>
                                      {!className.toLowerCase().includes('homeroom') && taskTime > 0 && (
                                        <span className="flex items-center gap-2">
                                          <Brain className="w-4 h-4" />
                                          {editingTimeTaskId === task.id ? (
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="text"
                                                value={tempTimeValue}
                                                onChange={handleTimeInputChange}
                                                className="w-14 px-2 py-1 border border-purple-400 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    handleSaveTimeEstimate(task.id);
                                                  } else if (e.key === 'Escape') {
                                                    handleCancelEditTime();
                                                  }
                                                }}
                                              />
                                              <span>min</span>
                                              <button
                                                onClick={() => handleSaveTimeEstimate(task.id)}
                                                className="text-green-600 hover:text-green-700"
                                              >
                                                <Check className="w-4 h-4" />
                                              </button>
                                              <button
                                                onClick={handleCancelEditTime}
                                                className="text-red-600 hover:text-red-700"
                                              >
                                                <X className="w-4 h-4" />
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              <span>{taskTime} min</span>
                                              <button
                                                onClick={() => handleStartEditTime(task.id, taskTime)}
                                                className="text-purple-600 hover:text-purple-700"
                                                title="Edit time estimate"
                                              >
                                                <Edit2 className="w-4 h-4" />
                                              </button>
                                            </div>
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2 flex-shrink-0">
                                    <button 
                                      onClick={() => setShowTaskDescription(task)}
                                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition-all"
                                    >
                                      Details
                                    </button>
                                    <button 
                                      onClick={() => openNotesPopup(task)}
                                      className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 text-sm font-medium transition-all relative"
                                    >
                                      <span className="flex items-center gap-1">
                                        <FileText className="w-4 h-4" />
                                        Notes
                                      </span>
                                      {tasksWithNotes.has(task.id) && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" title="Has notes" />
                                      )}
                                    </button>
                                    {!className.toLowerCase().includes('homeroom') && (
                                      <button 
                                        onClick={() => setShowSplitTask(task.id)}
                                        className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium transition-all"
                                      >
                                        Split
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* New Tasks Sidebar */}
            {newTasksSidebarOpen && (
              <div className="fixed right-0 top-[80px] w-96 h-[calc(100vh-80px)] bg-gradient-to-br from-yellow-50 to-orange-50 border-l-4 border-yellow-400 shadow-2xl overflow-y-auto z-50">
                <div className="p-6">
                  {/* Sidebar Header */}
                  <div className="flex items-center justify-between mb-4 sticky top-0 bg-gradient-to-br from-yellow-50 to-orange-50 pb-4 border-b-2 border-yellow-300">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-6 h-6 text-yellow-700" />
                      <h3 className="text-xl font-bold text-yellow-900">New Tasks</h3>
                      <span className="bg-yellow-600 text-white px-2 py-1 rounded-full text-sm font-bold">{newTasks.length}</span>
                    </div>
                    <button 
                      onClick={closeSidebarWithoutSaving}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Instructions */}
                  <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-sm">
                    <p className="text-yellow-900 font-medium mb-1">📌 Drag tasks to your list</p>
                    <p className="text-yellow-800">Drag each task to its priority position in your main list, or click "Add All" to smart-insert them by deadline.</p>
                  </div>

                  {/* Add All Button */}
                  <button 
                    onClick={clearAllNewTasks}
                    className="w-full mb-4 bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 font-semibold shadow-md flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Add All to List
                  </button>

                  {/* New Tasks */}
                  <div className="space-y-3">
                    {newTasks.map((task) => {
                      const className = extractClassName(task);
                      const classColor = getClassColor(task);
                      const dueDate = new Date(task.dueDate);
                      const dayName = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      
                      return (
                        <div 
                          key={task.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          className="bg-white border-2 border-yellow-300 rounded-lg p-3 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5 cursor-move" />
                            <div className="flex-1 min-w-0">
                              <a 
                                href={task.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-semibold text-gray-900 text-sm mb-1 break-words hover:text-purple-600 hover:underline transition-colors block"
                              >
                                {cleanTaskTitle(task)}
                              </a>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span 
                                  className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                                  style={{ backgroundColor: classColor }}
                                >
                                  {className}
                                </span>
                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {task.hasSpecificTime ? (
                                    <>
                                      {dayName} at <span title="Specific deadline time from Canvas">{dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                                    </>
                                  ) : (
                                    <span title="Due date (no specific time)">{dayName}</span>
                                  )}
                                </span>
                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                  <Brain className="w-3 h-3" />
                                  {task.userEstimate || task.estimatedTime} min
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pl-7 gap-2">
                            <span className="text-xs text-gray-500 italic">
                              Drag to priority list →
                            </span>
                            <button
                              onClick={() => handleIgnoreTask(task.id)}
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium flex items-center gap-1"
                              title="Ignore this task - it will be removed and won't be re-imported"
                            >
                              <X className="w-3 h-3" />
                              Ignore
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {showCompleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md mx-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Complete Task?</h3>
                  <p className="text-gray-600 mb-6">
                    Mark "{showCompleteConfirm.title}" as complete?
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowCompleteConfirm(null)}
                      className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleCompleteTask(showCompleteConfirm.id)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showSplitTask && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md mx-4 w-full">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Split Task into Segments</h3>
                  <p className="text-gray-600 mb-4">
                    Split this task into multiple parts. Time will be divided equally.
                  </p>
                  <div className="space-y-3 mb-4">
                    {splitSegments.map((seg, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          type="text" 
                          value={seg.name} 
                          onChange={(e) => {
                            const newSegs = [...splitSegments];
                            newSegs[idx].name = e.target.value;
                            setSplitSegments(newSegs);
                          }} 
                          placeholder={`Segment ${idx + 1} name`} 
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" 
                        />
                        {splitSegments.length > 1 && (
                          <button onClick={() => setSplitSegments(splitSegments.filter((_, i) => i !== idx))} className="text-red-600 hover:text-red-800">
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setSplitSegments([...splitSegments, { name: `Part ${splitSegments.length + 1}` }])} className="w-full mb-4 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 font-medium">
                    + Add Segment
                  </button>
                  <div className="flex gap-3">
                    <button onClick={() => {
                      setShowSplitTask(null);
                      setSplitSegments([{ name: 'Part 1' }]);
                    }} className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium">
                      Cancel
                    </button>
                    <button onClick={() => handleSplitTask(showSplitTask)} className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium">
                      Split Task
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showTaskDescription && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 pr-8">{showTaskDescription.title}</h3>
                    <button 
                      onClick={() => setShowTaskDescription(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      Due: {new Date(showTaskDescription.dueDate).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      Estimated Time: {showTaskDescription.userEstimate || showTaskDescription.estimatedTime} min
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                    {showTaskDescription.description ? (
                      <div
                        className="text-gray-600 prose prose-sm max-w-none leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: showTaskDescription.description
                            .replace(/<p>\s*<\/p>/gi, '')
                            .replace(/\n{3,}/g, '\n\n')
                        }}
                      />
                    ) : (
                      <p className="text-gray-400 italic">No description available</p>
                    )}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={() => setShowTaskDescription(null)} 
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notes Popup Modal */}
            {showNotesPopup && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[80vh] flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 pr-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{showNotesPopup.title}</h3>
                      <p className="text-sm text-gray-600">{extractClassName(showNotesPopup)}</p>
                    </div>
                    <button 
                      onClick={closeNotesPopup}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-3 pb-3 border-b">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-600" />
                      <h4 className="font-semibold text-gray-700">Your Notes</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {popupNotesLastSaved && (
                        <span className="text-xs text-green-600">
                          Saved {popupNotesLastSaved.toLocaleTimeString()}
                        </span>
                      )}
                      <button
                        onClick={savePopupNotes}
                        disabled={popupNotesSaving}
                        className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {popupNotesSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Notes
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={popupNotes}
                    onChange={(e) => setPopupNotes(e.target.value)}
                    placeholder="Type your notes here... bullet points, reminders, key concepts, study tips, etc."
                    className="flex-1 w-full p-4 border-2 border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
                    autoFocus
                  />

                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      💡 Notes auto-save after 2 seconds of inactivity
                    </p>
                    <button 
                      onClick={closeNotesPopup} 
                      className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {currentPage === 'sessions' && (() => {
          return (
          <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Sessions</h2>
                <p className="text-gray-500 text-sm mt-1">Start working on a task — timer runs while you work</p>
              </div>
              <button onClick={loadSessionTasks} className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors" title="Refresh">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : sessionTasks.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Play className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No tasks to work on</p>
                <p className="text-sm mt-1">All caught up! Tasks sync from Canvas automatically.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessionTasks.map(task => {
                  const hasProgress = task.accumulatedTime > 0;
                  const classColor = getClassColor(task.class);
                  // Use the pre-parsed dueDate from tasks state (already UTC-corrected)
                  // Fall back to deadlineDateRaw+T12 only if dueDate wasn't hydrated
                  const dueLabel = task.dueDate
                    ? task.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : task.deadlineDateRaw
                      ? new Date(task.deadlineDateRaw + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : '—';
                  return (
                    <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors overflow-hidden">
                      <div className="flex items-center gap-4 p-4">
                        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: classColor }} />
                        <div className="flex-1 min-w-0">
                          <a href={task.url} target="_blank" rel="noopener noreferrer"
                            className="font-semibold text-gray-900 hover:text-purple-600 hover:underline text-sm line-clamp-1">
                            {cleanTaskTitle(task)}
                          </a>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500">{task.class ? task.class.replace(/[\[\]]/g, '') : 'No Class'}</span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />Due {dueLabel}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />{task.userEstimate || task.estimatedTime} min est.
                            </span>
                            {hasProgress && (
                              <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                <Timer className="w-3 h-3" />{task.accumulatedTime < 60 ? '< 1' : Math.floor(task.accumulatedTime / 60)} min logged
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => startTaskSession(task)}
                          className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-1.5 transition-colors ${
                            hasProgress ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          <Play className="w-4 h-4" />
                          {hasProgress ? 'Resume' : 'Start'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          );
        })()}

        {['session-active','agenda-active'].includes(currentPage) && (currentSessionTask || showSessionComplete) && (
          showSessionComplete ? (
            <div className="max-w-lg mx-auto p-6">
              <div className="bg-gradient-to-br from-green-500 to-blue-600 text-white rounded-xl p-8 text-center mb-6">
                <Check className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Task Complete!</h2>
                <p className="text-green-100 text-lg">{cleanTaskTitle(showSessionComplete.task)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 mb-6 text-center">
                <div className="text-5xl font-bold text-purple-600 mb-2">{formatTime(showSessionComplete.timeSpent)}</div>
                <div className="text-gray-500">Total time spent</div>
              </div>
              <button onClick={() => { setShowSessionComplete(false); setCurrentSessionTask(null); setCurrentPage('sessions'); loadUserData(token); }}
                className="w-full bg-gradient-to-r from-yellow-400 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700">
                Back to Sessions
              </button>
            </div>
          ) : (
            <div className="max-w-lg mx-auto p-6">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-xl p-8 mb-5">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getClassColor(currentSessionTask.class) }} />
                    <span className="text-purple-200 text-sm font-medium">
                      {currentSessionTask.class ? currentSessionTask.class.replace(/[\[\]]/g, '') : 'No Class'}
                    </span>
                  </div>
                  <a href={currentSessionTask.url} target="_blank" rel="noopener noreferrer"
                    className="block text-xl font-bold mb-6 hover:underline">{cleanTaskTitle(currentSessionTask)}</a>
                  <div className="text-7xl font-bold mb-1 tabular-nums">{formatTime(sessionElapsed)}</div>
                  <p className="text-purple-200 text-sm">Time on this task</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      if (isTimerRunning) {
                        const wallElapsed = Math.floor((Date.now() - timerStartWallRef.current) / 1000);
                        const snapped = timerBaseElapsedRef.current + wallElapsed;
                        setSessionElapsed(snapped);
                        timerBaseElapsedRef.current = snapped;
                      }
                      setIsTimerRunning(prev => !prev);
                    }}
                    className="bg-white bg-opacity-20 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-opacity-30 flex items-center gap-2"
                  >
                    {isTimerRunning ? <><Pause className="w-4 h-4" /> Pause Timer</> : <><Play className="w-4 h-4" /> Resume Timer</>}
                  </button>
                  <button onClick={pauseTaskSession} disabled={savingSession}
                    className="bg-purple-800 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-purple-900 flex items-center gap-2 disabled:opacity-50">
                    {savingSession
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                      : <><X className="w-4 h-4" /> Save & Exit</>}
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-5 flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />Est. {currentSessionTask.userEstimate || currentSessionTask.estimatedTime} min</span>
                  {currentSessionTask.deadlineDateRaw && (
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />
                      Due {(currentSessionTask.dueDate || new Date(currentSessionTask.deadlineDateRaw + 'T12:00:00')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {currentSessionTask.accumulatedTime > 0 && (
                    <span className="flex items-center gap-1 text-blue-600 font-medium">
                      <Timer className="w-4 h-4" />{currentSessionTask.accumulatedTime < 60 ? '< 1' : Math.floor(currentSessionTask.accumulatedTime / 60)} min previously
                    </span>
                  )}
                </div>
                <button onClick={completeTaskSession} disabled={markingComplete}
                  className="w-full bg-green-500 text-white py-3.5 rounded-lg font-semibold hover:bg-green-600 flex items-center justify-center gap-2 disabled:opacity-50 mb-3">
                  {markingComplete
                    ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Marking Complete...</>
                    : <><Check className="w-5 h-5" /> Mark Complete</>}
                </button>
                <button onClick={() => openWorkspace(currentSessionTask, 'session')}
                  className="w-full bg-purple-50 text-purple-700 py-3 rounded-lg font-semibold hover:bg-purple-100 flex items-center justify-center gap-2">
                  <BookOpen className="w-4 h-4" /> Open Workspace
                </button>
              </div>
            </div>
          )
        )}

                {currentPage === 'agendas' && (() => {
                  return (
                    <div className="max-w-3xl mx-auto p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Agendas</h2>
                        <div className="flex items-center gap-2">
                          <button onClick={loadAgendas} className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors" title="Refresh agendas">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setShowBuildAgenda(true); setBuildAgendaName(''); setBuildAgendaRows([]); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" /> Build an Agenda
                          </button>
                        </div>
                      </div>

                      {/* ── BUILD AGENDA PANEL ── */}
                      {showBuildAgenda && (() => {
                        const canAddRow = buildAgendaRows.length < 10;
                        const addRow = () => {
                          if (!canAddRow) return;
                          setBuildAgendaRows(prev => [...prev, { taskId: null, action: '', timeMins: 25 }]);
                        };
                        const removeRow = (idx) => setBuildAgendaRows(prev => prev.filter((_, i) => i !== idx));
                        const updateRow = (idx, field, val) => setBuildAgendaRows(prev =>
                          prev.map((r, i) => i === idx ? { ...r, [field]: val } : r)
                        );
                        const setRowTask = (idx, taskId) => {
                          const task = sessionTasks.find(t => t.id === taskId);
                          const defaultTime = task ? (task.userEstimate || task.user_estimated_time || task.estimatedTime || task.estimated_time || 25) : 25;
                          setBuildAgendaRows(prev => prev.map((r, i) =>
                            i === idx ? { ...r, taskId, timeMins: defaultTime } : r
                          ));
                        };
                        const allTasksSelected = buildAgendaRows.length > 0 && buildAgendaRows.every(r => r.taskId);
                        return (
                          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                              <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">Build an Agenda</h3>
                                  <p className="text-sm text-gray-500 mt-0.5">Add up to 10 rows. Each row = one task action.</p>
                                </div>
                                <button onClick={() => setShowBuildAgenda(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                              </div>
                              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                                {/* Name */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Agenda Name</label>
                                  <input type="text" value={buildAgendaName} onChange={e => setBuildAgendaName(e.target.value)}
                                    placeholder="e.g. Period 2, On the Bus, NEST..."
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
                                </div>
                                {/* Rows table */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Rows ({buildAgendaRows.length}/10)</label>
                                  {buildAgendaRows.length > 0 && (
                                    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
                                      {/* Header */}
                                      <div className="grid grid-cols-[32px_1fr_2fr_90px_130px_32px] gap-0 bg-gray-50 border-b border-gray-200">
                                        <div className="px-2 py-2.5 text-xs font-semibold text-gray-500 text-center">#</div>
                                        <div className="px-3 py-2.5 text-xs font-semibold text-gray-500">Task</div>
                                        <div className="px-3 py-2.5 text-xs font-semibold text-gray-500">Action</div>
                                        <div className="px-3 py-2.5 text-xs font-semibold text-gray-500">Time (min)</div>
                                        <div className="px-3 py-2.5 text-xs font-semibold text-gray-500">Zone</div>
                                        <div />
                                      </div>
                                      {/* Rows */}
                                      {buildAgendaRows.map((row, idx) => {
                                        const rowTask = row.taskId ? (sessionTasks.find(t => t.id === row.taskId) || tasks.find(t => t.id === row.taskId)) : null;
                                        const classColor = rowTask ? getClassColor(rowTask.class) : '#d1d5db';
                                        const dueDate = rowTask ? (tasks.find(t => t.id === rowTask.id)?.dueDate) : null;
                                        return (
                                          <div key={idx} className="grid grid-cols-[32px_1fr_2fr_90px_130px_32px] gap-0 border-b border-gray-100 last:border-b-0 items-center">
                                            {/* Row number */}
                                            <div className="flex items-center justify-center py-3">
                                              <span className="w-5 h-5 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                            </div>
                                            {/* Task picker */}
                                            <div className="px-2 py-2">
                                              <select
                                                value={row.taskId || ''}
                                                onChange={e => setRowTask(idx, parseInt(e.target.value) || null)}
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
                                              >
                                                <option value="">— pick task —</option>
                                                {sessionTasks.map(t => (
                                                  <option key={t.id} value={t.id}>{cleanTaskTitle(t)} (P{t.priorityOrder})</option>
                                                ))}
                                              </select>

                                            </div>
                                            {/* Action */}
                                            <div className="px-2 py-2">
                                              <input type="text" value={row.action} maxLength={100}
                                                onChange={e => updateRow(idx, 'action', e.target.value)}
                                                placeholder="Work on Task"
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500" />
                                            </div>
                                            {/* Time */}
                                            <div className="px-2 py-2">
                                              <input type="number" min={1} max={300} value={row.timeMins}
                                                onChange={e => updateRow(idx, 'timeMins', parseInt(e.target.value) || 1)}
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 text-center" />
                                            </div>
                                            {/* Zone */}
                                            <div className="px-2 py-2">
                                              <select value={row.zone || ''} onChange={e => updateRow(idx, 'zone', e.target.value || null)}
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500">
                                                <option value="">— none —</option>
                                                <option value="focus">Focus Zone</option>
                                                <option value="semi">Semi-Collaborative</option>
                                                <option value="collab">Collaborative Zone</option>
                                              </select>
                                            </div>
                                            {/* Remove */}
                                            <div className="flex items-center justify-center">
                                              <button onClick={() => removeRow(idx)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {/* Add row button */}
                                  {canAddRow && (
                                    <button onClick={addRow}
                                      className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors text-sm">
                                      <Plus className="w-4 h-4" /> Add Row
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="p-6 border-t border-gray-100 flex gap-3 flex-shrink-0">
                                <button onClick={() => setShowBuildAgenda(false)}
                                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
                                <button onClick={createAgenda}
                                  disabled={!buildAgendaName.trim() || buildAgendaRows.length === 0 || !allTasksSelected}
                                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                  Create Agenda
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* ── EDIT AGENDA MODAL ── */}
                      {editingAgenda && (() => {
                        const lockedCount = (editingAgenda.current_row || 0) + 1;
                        const canAddEditRow = editAgendaRows.length < 10;
                        const addEditRow = () => {
                          if (!canAddEditRow) return;
                          setEditAgendaRows(prev => [...prev, { rowIndex: lockedCount + prev.length, taskId: null, action: '', timeMins: 25 }]);
                        };
                        const removeEditRow = (idx) => setEditAgendaRows(prev => prev.filter((_, i) => i !== idx));
                        const updateEditRow = (idx, field, val) => setEditAgendaRows(prev =>
                          prev.map((r, i) => i === idx ? { ...r, [field]: val } : r)
                        );
                        const setEditRowTask = (idx, taskId) => {
                          const task = sessionTasks.find(t => t.id === taskId);
                          const defaultTime = task ? (task.userEstimate || task.user_estimated_time || task.estimatedTime || task.estimated_time || 25) : 25;
                          setEditAgendaRows(prev => prev.map((r, i) =>
                            i === idx ? { ...r, taskId, timeMins: defaultTime } : r
                          ));
                        };
                        const lockedRows = (editingAgenda.rows || []).slice(0, lockedCount);
                        return (
                          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                              <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">Edit Agenda</h3>
                                  <p className="text-sm text-gray-500 mt-0.5">Rows 1–{lockedCount} are locked (current or completed). You can edit rows {lockedCount+1}+.</p>
                                </div>
                                <button onClick={() => setEditingAgenda(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                              </div>
                              <div className="p-6 flex-1 overflow-y-auto space-y-3">
                                {/* Locked rows preview */}
                                {lockedRows.length > 0 && (
                                  <div className="border border-gray-100 rounded-xl overflow-hidden opacity-50">
                                    {lockedRows.map((row, idx) => {
                                      const rowTask = row.task || (row.taskId ? tasks.find(t => t.id === row.taskId) : null);
                                      return (
                                        <div key={idx} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100 last:border-b-0">
                                          <span className="w-5 h-5 bg-gray-300 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{idx+1}</span>
                                          <span className="text-xs text-gray-500 flex-1 truncate">{rowTask ? cleanTaskTitle(rowTask) : `Task ${row.taskId}`}</span>
                                          <span className="text-xs text-gray-400">{row.action || 'Work on Task'}</span>
                                          <span className="text-xs text-gray-400 w-12 text-right">{row.timeMins}m</span>
                                          <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">Locked</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                {/* Editable rows */}
                                {editAgendaRows.length > 0 && (
                                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="grid grid-cols-[32px_1fr_2fr_90px_130px_32px] bg-gray-50 border-b border-gray-200">
                                      <div className="px-2 py-2.5 text-xs font-semibold text-gray-500 text-center">#</div>
                                      <div className="px-3 py-2.5 text-xs font-semibold text-gray-500">Task</div>
                                      <div className="px-3 py-2.5 text-xs font-semibold text-gray-500">Action</div>
                                      <div className="px-3 py-2.5 text-xs font-semibold text-gray-500">Time (min)</div>
                                      <div className="px-3 py-2.5 text-xs font-semibold text-gray-500">Zone</div>
                                      <div />
                                    </div>
                                    {editAgendaRows.map((row, idx) => {
                                      const rowTask = row.taskId ? (sessionTasks.find(t => t.id === row.taskId) || tasks.find(t => t.id === row.taskId)) : null;
                                      const classColor = rowTask ? getClassColor(rowTask.class) : '#d1d5db';
                                      return (
                                        <div key={idx} className="grid grid-cols-[32px_1fr_2fr_90px_130px_32px] gap-0 border-b border-gray-100 last:border-b-0 items-center">
                                          <div className="flex items-center justify-center py-3">
                                            <span className="w-5 h-5 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">{lockedCount + idx + 1}</span>
                                          </div>
                                          <div className="px-2 py-2">
                                            <select value={row.taskId || ''} onChange={e => setEditRowTask(idx, parseInt(e.target.value) || null)}
                                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500">
                                              <option value="">— pick task —</option>
                                              {sessionTasks.map(t => (
                                                <option key={t.id} value={t.id}>{cleanTaskTitle(t)} (P{t.priorityOrder})</option>
                                              ))}
                                            </select>

                                          </div>
                                          <div className="px-2 py-2">
                                            <input type="text" value={row.action} maxLength={100} onChange={e => updateEditRow(idx, 'action', e.target.value)}
                                              placeholder="Work on Task"
                                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500" />
                                          </div>
                                          <div className="px-2 py-2">
                                            <input type="number" min={1} max={300} value={row.timeMins} onChange={e => updateEditRow(idx, 'timeMins', parseInt(e.target.value) || 1)}
                                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 text-center" />
                                          </div>
                                          <div className="px-2 py-2">
                                            <select value={row.zone || ''} onChange={e => updateEditRow(idx, 'zone', e.target.value || null)}
                                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500">
                                              <option value="">— none —</option>
                                              <option value="focus">Focus Zone</option>
                                              <option value="semi">Semi-Collaborative</option>
                                              <option value="collab">Collaborative Zone</option>
                                            </select>
                                          </div>
                                          <div className="flex items-center justify-center">
                                            <button onClick={() => removeEditRow(idx)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                {canAddEditRow && (
                                  <button onClick={addEditRow}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors text-sm">
                                    <Plus className="w-4 h-4" /> Add Row
                                  </button>
                                )}
                              </div>
                              <div className="p-6 border-t border-gray-100 flex gap-3 flex-shrink-0">
                                <button onClick={() => setEditingAgenda(null)}
                                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
                                <button onClick={saveEditAgenda}
                                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">Save Changes</button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* ── AGENDA LIST ── */}
                      {agendasLoading ? (
                        <div className="flex items-center justify-center py-16">
                          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : agendas.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                          <LayoutList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="font-medium">No agendas yet</p>
                          <p className="text-sm mt-1">Build an agenda to plan a focused work block row by row.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {agendas.map(agenda => {
                            const rows = agenda.rows || [];
                            const currentRowIdx = agenda.current_row || 0;
                            const currentRowData = rows[currentRowIdx];
                            const currentRowTask = currentRowData?.task;
                            const totalMins = rows.reduce((s, r) => s + (r.timeMins || 0), 0);
                            const classColor = currentRowTask ? getClassColor(currentRowTask.class) : '#a855f7';
                            const dueDate = currentRowTask ? tasks.find(t => t.id === currentRowTask.id)?.dueDate : null;
                            return (
                              <div key={agenda.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                  <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{agenda.name}</h3>
                                    <p className="text-sm text-gray-400 mt-0.5">{rows.length} row{rows.length !== 1 ? 's' : ''} · {totalMins} min total · Row {currentRowIdx + 1} of {rows.length}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => {
                                      setEditingAgenda(agenda);
                                      const lockedCount = (agenda.current_row || 0) + 1;
                                      const editableRows = rows.slice(lockedCount).map((r, i) => ({ ...r, rowIndex: lockedCount + i }));
                                      setEditAgendaRows(editableRows);
                                    }} className="p-2 text-gray-300 hover:text-purple-500 transition-colors" title="Edit agenda">
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => openAgenda(agenda)}
                                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 text-sm transition-colors">
                                      <Play className="w-3.5 h-3.5" /> Open
                                    </button>
                                    <button onClick={() => deleteAgenda(agenda.id)}
                                      className="p-2 text-gray-300 hover:text-red-400 transition-colors" title="Delete agenda">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                {/* Current row preview */}
                                {currentRowData && (
                                  <div className="px-5 py-3 bg-purple-50 border-b border-purple-100 flex items-center gap-3">
                                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: classColor }} />
                                    <div className="flex-shrink-0">
                                      <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{currentRowIdx + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-gray-900 truncate">{currentRowTask ? cleanTaskTitle(currentRowTask) : `Task ${currentRowData.taskId}`}</p>
                                      <p className="text-xs text-purple-600 mt-0.5 truncate">{currentRowData.action || 'Work on Task'}</p>
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                      <p className="text-sm font-bold text-gray-700">{currentRowData.timeMins}m</p>
                                      {dueDate && <p className="text-xs text-gray-400">Due {dueDate.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</p>}
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
                })()}

        {currentPage === 'agenda-active' && currentAgenda && (() => {
          const rows = currentAgenda.rows || [];
          const currentRow = rows[agendaCurrentRow];
          const isLastRow = agendaCurrentRow >= rows.length - 1;
          const rowTask = currentRow?.task || (currentRow?.taskId ? tasks.find(t => t.id === currentRow.taskId) : null);
          const classColor = rowTask ? getClassColor(rowTask.class) : '#a855f7';
          const dueDate = rowTask ? tasks.find(t => t.id === rowTask.id)?.dueDate : null;
          const countdownMins = Math.floor((agendaCountdown || 0) / 60);
          const countdownSecs = (agendaCountdown || 0) % 60;
          const countdownStr = `${String(countdownMins).padStart(2,'0')}:${String(countdownSecs).padStart(2,'0')}`;

          return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex flex-col">
              {/* Top bar */}
              <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-900">{currentAgenda.name}</h2>
                <div className="flex items-center gap-3">
                  {/* Countdown timer */}
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold transition-colors ${
                    agendaCountdownFlash ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700'
                  }`}>
                    <Timer className="w-4 h-4" />
                    {countdownStr}
                  </div>
                  {/* Save and Proceed / Finish Agenda */}
                  {isLastRow ? (
                    <button onClick={agendaFinishLast} disabled={agendaProceedLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 text-sm transition-colors disabled:opacity-60">
                      {agendaProceedLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                      Finish Agenda
                    </button>
                  ) : (
                    <button onClick={agendaSaveAndProceed} disabled={agendaProceedLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 text-sm transition-colors disabled:opacity-60">
                      {agendaProceedLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                      Save &amp; Proceed
                    </button>
                  )}
                  <button onClick={agendaSaveAndExit}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 text-sm transition-colors">
                    <X className="w-4 h-4" /> Save &amp; Exit
                  </button>
                </div>
              </div>

              {/* Main content: row tracker + in-session card */}
              <div className="flex flex-1 overflow-hidden">
                {/* ── Left: Row tracker ── */}
                <div className="w-56 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
                  <div className="p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Agenda Rows</p>
                    <div className="space-y-1">
                      {rows.map((row, idx) => {
                        const isCurrentRow = idx === agendaCurrentRow;
                        const isPast = idx < agendaCurrentRow;
                        const rTask = row.task || (row.taskId ? tasks.find(t => t.id === row.taskId) : null);
                        const rColor = rTask ? getClassColor(rTask.class) : '#d1d5db';
                        return (
                          <div key={idx} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors ${
                            isCurrentRow ? 'bg-purple-100 border border-purple-300' :
                            isPast ? 'opacity-40' : 'hover:bg-gray-50'
                          }`}>
                            <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: isPast ? '#d1d5db' : isCurrentRow ? '#7c3aed' : rColor }} />
                            <div className="flex-shrink-0">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                isCurrentRow ? 'bg-purple-600 text-white' : isPast ? 'bg-gray-300 text-white' : 'bg-gray-100 text-gray-500'
                              }`}>{idx + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium truncate ${isCurrentRow ? 'text-purple-900' : 'text-gray-700'}`}>
                                {rTask ? cleanTaskTitle(rTask) : `Task ${row.taskId}`}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{row.action || 'Work on Task'} · {row.timeMins}m{row.zone ? ` · ${row.zone === 'focus' ? '🎯' : row.zone === 'semi' ? '🤝' : '👥'}` : ''}</p>
                            </div>
                            {isPast && <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Right: In-session card ── */}
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="w-full max-w-md">
                    {currentRow ? (
                      <div className="rounded-2xl shadow-lg overflow-hidden">
                        {/* Session card top */}
                        <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white p-7 flex flex-col items-center">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: classColor }} />
                            <span className="text-purple-200 text-xs font-medium truncate max-w-[200px]">
                              {rowTask?.class?.replace(/[\[\]]/g,'') || 'No Class'}
                            </span>
                          </div>
                          {rowTask?.url ? (
                            <a href={rowTask.url} target="_blank" rel="noopener noreferrer"
                              className="text-lg font-bold text-center mb-1 hover:underline leading-tight line-clamp-2">
                              {rowTask ? cleanTaskTitle(rowTask) : `Task ${currentRow.taskId}`}
                            </a>
                          ) : (
                            <p className="text-lg font-bold text-center mb-1 leading-tight line-clamp-2">
                              {rowTask ? cleanTaskTitle(rowTask) : `Task ${currentRow.taskId}`}
                            </p>
                          )}
                          {/* Action label */}
                          <p className="text-purple-200 text-sm mb-2 italic">"{currentRow.action || 'Work on Task'}"</p>
                          {/* Zone badge */}
                          {currentRow.zone && (() => {
                            const zoneMap = {
                              focus: { label: 'Focus Zone', bg: 'bg-indigo-500 bg-opacity-40', text: 'text-indigo-100' },
                              semi:  { label: 'Semi-Collaborative Zone', bg: 'bg-yellow-500 bg-opacity-30', text: 'text-yellow-100' },
                              collab:{ label: 'Collaborative Zone', bg: 'bg-green-500 bg-opacity-30', text: 'text-green-100' },
                            };
                            const z = zoneMap[currentRow.zone];
                            return z ? (
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${z.bg} ${z.text}`}>{z.label}</span>
                            ) : null;
                          })()}
                          {!currentRow.zone && <div className="mb-3" />}
                          {/* In-session elapsed timer */}
                          <div className="text-5xl font-bold tabular-nums mb-1">{formatTime(agendaElapsed)}</div>
                          <p className="text-purple-200 text-xs mb-6">Time on this task</p>
                          {/* Start/pause button */}
                          <button
                            onClick={() => {
                              if (agendaRunning) {
                                agendaStopTimer();
                              } else {
                                agendaStartTimer(agendaElapsed, agendaCountdown ?? (currentRow.timeMins * 60));
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg font-semibold text-sm transition-colors"
                          >
                            {agendaRunning
                              ? <><Pause className="w-4 h-4" /> Pause Timer</>
                              : <><Play className="w-4 h-4" /> {agendaElapsed > 0 ? 'Resume Timer' : 'Start Timer'}</>
                            }
                          </button>
                        </div>
                        {/* Session card bottom */}
                        <div className="bg-white p-4 space-y-2">
                          <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Est. {rowTask?.userEstimate || rowTask?.user_estimated_time || rowTask?.estimatedTime || rowTask?.estimated_time || '—'} min</span>
                            {dueDate && (
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due {dueDate.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                            )}
                            <span className="flex items-center gap-1 text-purple-500 font-medium">
                              <span>Row {agendaCurrentRow + 1} of {rows.length}</span>
                            </span>
                          </div>
                          <button onClick={agendaMarkComplete} disabled={agendaProceedLoading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 text-sm transition-colors disabled:opacity-60">
                            {agendaProceedLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                            Mark Complete
                          </button>
                          <button onClick={() => openWorkspace(rowTask, 'agenda')}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 text-sm transition-colors">
                            <BookOpen className="w-3.5 h-3.5" /> Open Workspace
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center">No row data available.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {currentPage === 'agenda-summary' && agendaFinishedSummary && (() => {
          const totalMins = Math.floor(agendaFinishedSummary.totalSecs / 60);
          const totalSecsRemainder = agendaFinishedSummary.totalSecs % 60;
          return (
            <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-6">
              <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Agenda Complete!</h2>
                <p className="text-gray-500 text-sm mb-8">{agendaFinishedSummary.name}</p>
                <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Time in Agenda</p>
                  <p className="text-5xl font-bold text-gray-900 tabular-nums">
                    {String(totalMins).padStart(2,'0')}:{String(totalSecsRemainder).padStart(2,'0')}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">{agendaFinishedSummary.rowCount} row{agendaFinishedSummary.rowCount !== 1 ? 's' : ''} completed</p>
                </div>
                <button onClick={() => { setAgendaFinishedSummary(null); setCurrentPage('agendas'); loadAgendas(); }}
                  className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors">
                  Back to Agendas
                </button>
              </div>
            </div>
          );
        })()}

        {currentPage === 'calendar' && (() => {
          const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
          const today = new Date();

          // Build weeks as separate rows (each selected week = one row of columns)
          const todayIdx = today.getDay(); // 0=Sun
          const currentWeekSunday = new Date(today);
          currentWeekSunday.setDate(today.getDate() - todayIdx);

          const buildWeek = (sundayBase, offsetWeeks) => {
            const sun = new Date(sundayBase);
            sun.setDate(sundayBase.getDate() + offsetWeeks * 7);
            return Array.from({length:7}, (_, i) => {
              const d = new Date(sun);
              d.setDate(sun.getDate() + i);
              return d;
            });
          };

          // weeks is an array of week-arrays; each inner array = one row
          let weeks = [];
          if (accountSetup.calendarShowPrevWeek)              weeks.push(buildWeek(currentWeekSunday, -1));
          if (accountSetup.calendarShowCurrentWeek !== false) weeks.push(buildWeek(currentWeekSunday, 0));
          if (accountSetup.calendarShowNextWeek1)             weeks.push(buildWeek(currentWeekSunday, 1));
          if (accountSetup.calendarShowNextWeek2)             weeks.push(buildWeek(currentWeekSunday, 2));
          if (weeks.length === 0) weeks = [buildWeek(currentWeekSunday, 0)];

          // Filter weekends from each week if needed
          const showWeekends = accountSetup.calendarShowWeekends !== false;
          const filteredWeeks = weeks.map(week =>
            showWeekends ? week : week.filter(d => d.getDay() !== 0 && d.getDay() !== 6)
          );

          // For header date range display
          const allDays = filteredWeeks.flat();

          const isToday = (d) => d.toDateString() === today.toDateString();

          // Build dayStr from a Date object using LOCAL date parts
          const toDayStr = (d) =>
            `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

          // Get tasks for a specific day
          // Uses dueDate local date — same conversion the Task List uses, so calendar
          // and task list always agree on which day a task belongs to.
          const getTasksForDay = (dayDate) => {
            const dayStr = toDayStr(dayDate);
            return [...tasks, ...newTasks.filter(t => !t.deleted)].filter(t => {
              if (!t.dueDate) return false;
              if (toDayStr(t.dueDate) !== dayStr) return false;
              if (!isCourseEnabled(t)) return false;
              const isHomeroom = (t.class || '').toLowerCase().includes('homeroom');
              if (isHomeroom && !accountSetup.calendarShowHomeroom) return false;
              const isDone = t.completed || t.deleted || !!t.submittedAt;
              if (isDone && !accountSetup.calendarShowCompleted) return false;
              return true;
            }).sort((a, b) => {
              if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
              if (a.dueDate) return -1;
              if (b.dueDate) return 1;
              return (a.priorityOrder ?? 9999) - (b.priorityOrder ?? 9999);
            });
          };

          // Text color helper for contrast
          const getTextColor = (hex) => {
            try {
              const h = hex.replace('#','');
              const r = parseInt(h.substr(0,2),16);
              const g = parseInt(h.substr(2,2),16);
              const b = parseInt(h.substr(4,2),16);
              return (0.299*r + 0.587*g + 0.114*b)/255 > 0.55 ? '#1a1a1a' : '#ffffff';
            } catch { return '#ffffff'; }
          };

          const stripHtml = (html) => {
            if (!html) return '';
            return html
              .replace(/<br\s*\/?>/gi,' ').replace(/<\/p>/gi,' ')
              .replace(/<li>/gi,'• ').replace(/<[^>]+>/g,'')
              .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&')
              .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
              .replace(/&quot;/g,'"').replace(/&#39;/g,"'")
              .replace(/\s{2,}/g,' ').trim();
          };

          // Priority lookup
          const priorityMap = {};
          tasks.forEach(t => { if (t.priorityOrder) priorityMap[t.id] = t.priorityOrder; });


          return (
            <div className="flex flex-col h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-blue-50">

              {/* Header */}
              <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {allDays[0].toLocaleDateString('en-US',{month:'short',day:'numeric'})} – {allDays[allDays.length-1].toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  </p>
                </div>
                <button
                  onClick={() => { setCurrentPage('account'); setAccountTab('settings'); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Calendar Settings
                </button>
              </div>

              {/* Stacked week rows */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {filteredWeeks.map((weekDays, weekIdx) => (
                  <div key={weekIdx} className="grid gap-2" style={{gridTemplateColumns: `repeat(${weekDays.length}, minmax(0, 1fr))`, minHeight: '180px'}}>
                  {weekDays.map((day, colIdx) => {
                    const dayTasks = getTasksForDay(day);
                    const todayCol = isToday(day);
                    return (
                      <div
                        key={colIdx}
                        className={`flex flex-col rounded-xl border-2 overflow-hidden ${todayCol ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'}`}
                      >
                        {/* Day header */}
                        <div className={`px-2 py-2 text-center border-b ${todayCol ? 'bg-purple-600 border-purple-500' : 'bg-gray-50 border-gray-200'}`}>
                          <p className={`text-xs font-semibold uppercase tracking-wide ${todayCol ? 'text-purple-100' : 'text-gray-500'}`}>
                            {DAY_NAMES[day.getDay()].slice(0,3)}
                          </p>
                          <p className={`text-lg font-bold leading-tight ${todayCol ? 'text-white' : 'text-gray-900'}`}>
                            {day.getDate()}
                          </p>
                          <p className={`text-xs ${todayCol ? 'text-purple-200' : 'text-gray-400'}`}>
                            {day.toLocaleDateString('en-US',{month:'short'})}
                          </p>
                        </div>

                        {/* Task bubbles */}
                        <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                          {dayTasks.length === 0 && (
                            <p className="text-xs text-gray-300 text-center mt-4">—</p>
                          )}
                          {dayTasks.map((task) => {
                            const color = getClassColor(task.class || '');
                            const priority = priorityMap[task.id];
                            const timeStr = task.hasSpecificTime && task.dueDate
                              ? task.dueDate.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true})
                              : null;
                            const displayTitle = task.segment
                              ? `${(task.title||'').replace(/\s*\[[^\]]+\]\s*/,'')} – ${task.segment}`
                              : (task.title||'').replace(/\s*\[[^\]]+\]\s*/,'');
                            const isDone = task.completed || task.deleted || !!task.submittedAt;
                            const isExpanded = calendarExpandedId === task.id;

                            return (
                              <div
                                key={task.id}
                                className={`rounded-lg text-xs cursor-pointer transition-all duration-200 select-none ${isExpanded ? 'shadow-lg z-10 relative' : 'hover:brightness-110'}`}
                                style={{ backgroundColor: color, color: getTextColor(color) }}
                                onClick={() => {
                                  if (isExpanded) {
                                    if (task.url) window.open(task.url, '_blank', 'noopener,noreferrer');
                                    setCalendarExpandedId(null);
                                  } else {
                                    setCalendarExpandedId(task.id);
                                  }
                                }}
                              >
                                {!isExpanded && (
                                  <div className="px-1.5 py-1 flex items-start gap-1">
                                    {priority && <span className="font-bold opacity-80 flex-shrink-0">#{priority}</span>}
                                    <span className={`truncate flex-1 ${isDone ? 'line-through opacity-60' : ''}`}>
                                      {timeStr && <span className="opacity-75 mr-1">{timeStr}</span>}
                                      {displayTitle}
                                    </span>
                                  </div>
                                )}
                                {isExpanded && (
                                  <div className="p-2 space-y-1.5">
                                    <div className="flex items-start justify-between gap-1">
                                      <div className={`font-semibold leading-tight ${isDone ? 'line-through opacity-70' : ''}`}>
                                        {priority && <span className="opacity-80">#{priority} · </span>}
                                        {timeStr && <span className="opacity-80">{timeStr} · </span>}
                                        {displayTitle}
                                      </div>
                                      <button
                                        className="opacity-70 hover:opacity-100 flex-shrink-0 ml-1"
                                        onClick={(e) => { e.stopPropagation(); setCalendarExpandedId(null); }}
                                      >✕</button>
                                    </div>
                                    {isDone && (
                                      <span className="inline-block text-xs bg-white bg-opacity-20 rounded px-1 py-0.5">✓ Done</span>
                                    )}
                                    {stripHtml(task.description) ? (
                                      <p className="text-xs opacity-90 leading-relaxed line-clamp-5">{stripHtml(task.description)}</p>
                                    ) : (
                                      <p className="text-xs opacity-50 italic">No description</p>
                                    )}
                                    {!isDone && (
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          setCalendarExpandedId(null);
                                          // Ensure sessionTasks are loaded, then start
                                          if (sessionTasks.length === 0) await loadSessionTasks();
                                          // Build a task object compatible with startTaskSession
                                          const sessionTask = sessionTasks.find(t => t.id === task.id) || {
                                            ...task,
                                            accumulatedTime: (task.accumulated_time || 0) * 60, // min→sec if needed
                                            userEstimate: task.user_estimated_time || task.estimated_time,
                                            estimatedTime: task.estimated_time,
                                          };
                                          await startTaskSession(sessionTask);
                                        }}
                                        className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-semibold transition-colors"
                                      >
                                        <Play className="w-3 h-3" />
                                        {task.accumulated_time > 0 ? 'Resume Session' : 'Start Session'}
                                      </button>
                                    )}
                                    <p className="text-xs opacity-60 mt-1">Tap again to open in Canvas →</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {currentPage === 'itinerary' && (() => {
          const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
          const today = new Date();
          const viewDate = itineraryDate || today;
          const viewDayIdx = viewDate.getDay();
          const viewDayName = dayNames[viewDayIdx];
          const isViewWeekend = viewDayIdx === 0 || viewDayIdx === 6;
          const isViewToday = viewDate.toDateString() === today.toDateString();
          const userGrade = user?.grade ? parseInt(user.grade) : 0;
          const viewDateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth()+1).padStart(2,'0')}-${String(viewDate.getDate()).padStart(2,'0')}`;

          // Tutorial booking URL by grade
          const tutorialUrl = userGrade >= 11 ? 'https://outlook.office.com/book/Grade1112Tutorials@na.oneschoolglobal.com/?ismsaljsauthenabled'
            : userGrade >= 9 ? 'https://outlook.office.com/book/Grade910TutorialsCopy@na.oneschoolglobal.com/?ismsaljsauthenabled'
            : 'https://outlook.office.com/book/Grade9TutorialsCopy@na.oneschoolglobal.com/?ismsaljsauthenabled';

          const navigateItinerary = (delta) => {
            const newDate = new Date(viewDate);
            newDate.setDate(viewDate.getDate() + delta);
            setItineraryDate(newDate);
            const newStr = `${newDate.getFullYear()}-${String(newDate.getMonth()+1).padStart(2,'0')}-${String(newDate.getDate()).padStart(2,'0')}`;
            setItinerarySlots({});
            loadItinerary(newStr);
            loadTutorials(newStr);
          };

          // Grade 3-6 block
          if (userGrade >= 3 && userGrade <= 6) return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center relative">
                <button onClick={() => setCurrentPage('hub')} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                <ClipboardList className="w-14 h-14 mx-auto mb-4 text-purple-300" />
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Secondary Students Only</h2>
                <p className="text-gray-500 mb-6">The Itinerary is only available for students in grades 7–12.</p>
                <button onClick={() => setCurrentPage('hub')} className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700">Back to Hub</button>
              </div>
            </div>
          );

          // Not enhanced
          if (!scheduleEnhanced) return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center relative">
                <button onClick={() => setCurrentPage('hub')} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                <ClipboardList className="w-14 h-14 mx-auto mb-4 text-purple-300" />
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Enhance Your Schedule First</h2>
                <p className="text-gray-500 mb-6">Link your courses to your Lesson periods to unlock the Itinerary.</p>
                <button onClick={() => { setCurrentPage('account'); setAccountTab('settings'); setTimeout(() => { document.getElementById('enhance-schedule-btn')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300); }}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 mb-3">Enhance Schedule</button>
                <button onClick={() => setCurrentPage('hub')} className="w-full py-3 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50">Back to Hub</button>
              </div>
            </div>
          );

          // Build period list based on the viewed day's schedule
          const range = accountSetup.presentPeriods || '2-6';
          const [pStart, pEnd] = range.split('-').map(Number);
          const selectedPeriods = Array.from({ length: pEnd - pStart + 1 }, (_, i) => pStart + i);
          const viewSchedule = accountSetup.schedule?.[viewDayName] || {};
          const lessonCourseMap = {};
          scheduleLessons.forEach(sl => { if (sl.day === viewDayName) lessonCourseMap[sl.period] = sl; });
          const availableAgendas = agendas.filter(a => !a.finished);

          return (
            <div className="max-w-3xl mx-auto p-6">
              {/* Header with inline date navigation */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Itinerary</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {viewDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    {isViewToday && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">Today</span>}
                  </p>
                </div>

                {/* Date navigation — centered between title and button */}
                <div className="flex items-center gap-2">
                  <button onClick={() => navigateItinerary(-1)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="text-center min-w-[90px]">
                    <p className="font-semibold text-gray-800 text-sm">
                      {viewDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    {!isViewToday && (
                      <button onClick={() => {
                        const t = new Date();
                        setItineraryDate(t);
                        const s = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
                        setItinerarySlots({});
                        loadItinerary(s);
                        loadTutorials(s);
                      }} className="text-xs text-purple-500 hover:text-purple-700 font-medium">Today</button>
                    )}
                  </div>
                  <button onClick={() => navigateItinerary(1)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                <button onClick={openHubTutorialDialog}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 text-sm transition-colors">
                  <BookOpen className="w-4 h-4" /> Book a Tutorial
                </button>
              </div>

              {/* Weekend notice — shown inline, not a blocker */}
              {isViewWeekend && (
                <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                  <p className="text-gray-500 text-sm">📅 This is a weekend day. You can still plan ahead — periods are shown based on your schedule.</p>
                </div>
              )}

              {itineraryLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedPeriods.map(period => {
                    const slotType = viewSchedule[String(period)] || 'Study';
                    const isLesson = slotType === 'Lesson';
                    const lessonInfo = lessonCourseMap[period];
                    const assignedAgenda = itinerarySlots[period];
                    const tutorial = tutorials[`${viewDateStr}-${period}`];

                    return (
                      <div key={period} className={`rounded-2xl border-2 overflow-hidden shadow-sm ${isLesson ? 'border-blue-200' : 'border-gray-200'}`}>
                        {/* Period header bar */}
                        <div className={`px-5 py-3 flex items-center justify-between ${isLesson ? 'bg-blue-600' : 'bg-gray-700'}`}>
                          <div className="flex items-center gap-3">
                            <span className="text-white font-bold text-base">Period {period}</span>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isLesson ? 'bg-blue-500 text-blue-100' : 'bg-gray-600 text-gray-200'}`}>
                              {slotType}
                            </span>
                          </div>
                          {isLesson && lessonInfo?.zoom_number && (
                            <a href={`https://oneschoolglobal.zoom.us/j/${(lessonInfo.zoom_number || "").replace(/[\s\-]/g, "")}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs bg-white text-blue-700 px-3 py-1.5 rounded-full font-semibold hover:bg-blue-50 transition-colors">
                              🎥 Join Zoom
                            </a>
                          )}
                        </div>

                        <div className="bg-white p-5 space-y-4">
                          {/* Lesson info */}
                          {isLesson && (
                            <div className="flex items-center gap-3">
                              <div className="w-1 h-10 rounded-full bg-blue-400 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-gray-900 text-base">
                                  {lessonInfo?.course_name || <span className="text-gray-400 italic font-normal">No course assigned</span>}
                                </p>
                                {lessonInfo?.zoom_number && (
                                  <a href={`https://oneschoolglobal.zoom.us/j/${(lessonInfo.zoom_number || "").replace(/[\s\-]/g, "")}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:underline">
                                    zoom.us/j/{(lessonInfo.zoom_number || "").replace(/[\s\-]/g, "")}
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Tutorial row */}
                          {tutorial ? (
                            <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-xl">
                              <div className="flex items-center gap-3 min-w-0">
                                <BookOpen className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-orange-900">Tutorial{tutorial.topic ? `: ${tutorial.topic}` : ''}</p>
                                  {tutorial.zoom_number ? (
                                    <a href={`https://oneschoolglobal.zoom.us/j/${(tutorial.zoom_number || "").replace(/[\s\-]/g, "")}`}
                                      target="_blank" rel="noopener noreferrer"
                                      className="text-xs text-orange-600 hover:underline">
                                      zoom.us/j/{(tutorial.zoom_number || "").replace(/[\s\-]/g, "")}
                                    </a>
                                  ) : <p className="text-xs text-orange-400">No Zoom link</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => openTutorialDialog({ date: viewDateStr, period })}
                                  className="text-xs text-orange-600 hover:text-orange-800 font-medium px-2 py-1 rounded hover:bg-orange-100">Edit</button>
                                <button onClick={() => deleteTutorial(viewDateStr, period)}
                                  className="text-gray-300 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => openTutorialDialog({ date: viewDateStr, period })}
                              className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-700 transition-colors font-medium">
                              <BookOpen className="w-4 h-4" /> + Add Tutorial
                            </button>
                          )}

                          {/* Agenda row */}
                          {assignedAgenda ? (
                            <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-xl">
                              <div className="flex items-center gap-3 min-w-0">
                                <LayoutList className="w-5 h-5 text-purple-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-purple-900 truncate">{assignedAgenda.agendaName}</p>
                                  <p className="text-xs text-purple-400">Agenda</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => { const a = agendas.find(ag => ag.id === assignedAgenda.agendaId); if (a) openAgenda(a); }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700">
                                  <Play className="w-3 h-3" /> Open
                                </button>
                                <button onClick={() => clearAgendaFromSlot(viewDateStr, period)}
                                  className="text-gray-300 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                              </div>
                            </div>
                          ) : (
                            showAddAgendaSlot === period ? (
                              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                <p className="text-xs font-medium text-gray-600 mb-2">Select an Agenda:</p>
                                {availableAgendas.length === 0 ? (
                                  <p className="text-sm text-gray-400 italic">No agendas available.</p>
                                ) : (
                                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                    {availableAgendas.map(agenda => (
                                      <button key={agenda.id}
                                        onClick={() => assignAgendaToSlot(viewDateStr, period, agenda.id, agenda.name)}
                                        className="w-full flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 text-left transition-colors">
                                        <LayoutList className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-900 flex-1 truncate">{agenda.name}</span>
                                        <span className="text-xs text-gray-400">{(agenda.rows?.length || 0)} rows</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <button onClick={() => setShowAddAgendaSlot(null)} className="mt-2 text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => { setShowAddAgendaSlot(period); loadAgendas(); }}
                                className="flex items-center gap-2 text-sm text-purple-500 hover:text-purple-700 transition-colors font-medium">
                                <LayoutList className="w-4 h-4" /> + Add Agenda
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tutorial Dialog — shared for itinerary slot booking */}
              {showTutorialDialog && showTutorialDialog !== 'hub' && (() => {
                const { date: dlgDate, period } = showTutorialDialog;
                return (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                      <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Book a Tutorial</h3>
                          <p className="text-sm text-gray-500 mt-0.5">{dlgDate} · Period {period}</p>
                        </div>
                        <button onClick={() => setShowTutorialDialog(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <iframe src={tutorialUrl} className="w-full h-[420px] border-0" title="Book a Tutorial" />
                      </div>
                      <div className="p-5 border-t border-gray-100 space-y-3 flex-shrink-0">
                        <p className="text-xs text-gray-500">Once booked, enter your Zoom details below:</p>
                        <div className="flex gap-3">
                          <input type="text" value={tutorialZoom} onChange={e => setTutorialZoom(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="Zoom number (e.g. 74751073335)" maxLength={15}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                          <input type="text" value={tutorialTopic} onChange={e => setTutorialTopic(e.target.value)}
                            placeholder="Topic (optional, max 60 chars)" maxLength={60}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => setShowTutorialDialog(null)}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Close</button>
                          <button
                            onClick={() => saveTutorial({ date: dlgDate, period, zoomNumber: tutorialZoom, topic: tutorialTopic })}
                            disabled={isSavingTutorial}
                            className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-60 flex items-center justify-center gap-2">
                            {isSavingTutorial ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</> : 'Save'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {currentPage === 'marks' && (
          <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 shadow-lg mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-8 h-8" />
                <h1 className="text-3xl font-bold">Your Marks</h1>
              </div>
              <p className="text-blue-100">Track your progress and see how you stack up</p>
              {courses.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold">
                      {(() => {
                        const scored = courses.filter(c => c.current_period_score != null);
                        if (scored.length === 0) return 'N/A';
                        const avg = scored.reduce((sum, c) => sum + parseFloat(c.current_period_score), 0) / scored.length;
                        return avg.toFixed(1) + '%';
                      })()}
                    </div>
                    <div className="text-xs text-blue-100">Period Average</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold">{courses.length}</div>
                    <div className="text-xs text-blue-100">Active Courses</div>
                  </div>
                </div>
              )}
            </div>

            {/* No courses yet */}
            {courses.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Courses Yet</h3>
                <p className="text-gray-500 mb-1">Your courses will appear here after your first Canvas sync.</p>
                <p className="text-sm text-gray-400">Go to Settings → Sync Canvas to get started.</p>
              </div>
            ) : (
              <>
                {/* Grade cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[...courses].sort((a, b) => {
                    const aScore = a.current_period_score ?? null;
                    const bScore = b.current_period_score ?? null;
                    const aNum = aScore != null ? parseFloat(aScore) : null;
                    const bNum = bScore != null ? parseFloat(bScore) : null;
                    if (aNum === null && bNum === null) return 0;
                    if (aNum === null) return 1;
                    if (bNum === null) return -1;
                    return aNum - bNum; // lowest score first
                  }).map((course, index) => {
                    const avgData = courseAverages[course.course_id];
                    const classAverage = avgData?.averageScore ?? null;
                    const studentCount = avgData?.studentCount ?? 0;
                    // Show current grading period score only — no fallback to all-year
                    const displayScore = course.current_period_score ?? null;
                    const displayGrade = course.current_period_grade ?? null;
                    const hasScore = displayScore != null && parseFloat(displayScore) > 0;
                    const userScore = hasScore ? parseFloat(displayScore) : null;
                    const difference = (userScore !== null && classAverage !== null && studentCount > 1)
                      ? userScore - classAverage
                      : null;

                    // Performance tier
                    let perfColor = 'text-gray-500';
                    let perfBg = 'bg-gray-50';
                    let perfBorder = 'border-gray-200';
                    let PerfIcon = Target;
                    let perfLabel = 'No Score Yet';
                    if (userScore !== null) {
                      if (userScore >= 90) { perfColor = 'text-emerald-600'; perfBg = 'bg-emerald-50'; perfBorder = 'border-emerald-200'; PerfIcon = Award; perfLabel = 'Excellent'; }
                      else if (userScore >= 80) { perfColor = 'text-blue-600'; perfBg = 'bg-blue-50'; perfBorder = 'border-blue-200'; PerfIcon = TrendingUp; perfLabel = 'Great'; }
                      else if (userScore >= 70) { perfColor = 'text-purple-600'; perfBg = 'bg-purple-50'; perfBorder = 'border-purple-200'; PerfIcon = Target; perfLabel = 'On Track'; }
                      else if (userScore >= 60) { perfColor = 'text-amber-600'; perfBg = 'bg-amber-50'; perfBorder = 'border-amber-200'; PerfIcon = AlertCircle; perfLabel = 'Needs Work'; }
                      else { perfColor = 'text-red-600'; perfBg = 'bg-red-50'; perfBorder = 'border-red-200'; PerfIcon = TrendingDown; perfLabel = 'At Risk'; }
                    }

                    return (
                      <div key={course.id} className={`bg-white rounded-xl shadow-md border-2 ${perfBorder} overflow-hidden hover:shadow-lg transition-all duration-200`}
                        style={{ animationDelay: `${index * 80}ms` }}>
                        {/* Card header */}
                        <div className={`${perfBg} px-6 py-4 flex items-start justify-between`}>
                          <div className="flex-1 mr-4">
                            <a href={`https://canvas.oneschoolglobal.com/courses/${course.course_id}/grades`} target="_blank" rel="noopener noreferrer" className="font-bold text-gray-900 text-base leading-tight hover:text-blue-600 hover:underline transition-colors">{course.name}</a>
                            {course.course_code && <p className="text-xs text-gray-500 mt-0.5">{course.course_code}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className={`text-4xl font-black ${perfColor}`}>
                              {displayGrade || (hasScore ? `${userScore.toFixed(0)}%` : '—')}
                            </div>
                            {hasScore && displayGrade && (
                              <div className="text-sm text-gray-500 font-semibold">{userScore.toFixed(1)}%</div>
                            )}
                          </div>
                        </div>

                        <div className="px-6 py-4 space-y-4">
                          {/* Score bar */}
                          {hasScore && (
                            <div>
                              {/* Your score bar */}
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span className="font-semibold text-gray-700">Your Score</span>
                                {difference !== null && (
                                  <span className={`font-bold ${difference >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {difference >= 0 ? '▲' : '▼'} {Math.abs(difference).toFixed(1)}% vs Average
                                  </span>
                                )}
                              </div>
                              <div className="relative h-7 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full flex items-center justify-end pr-3 text-white text-xs font-bold`}
                                  style={{
                                    width: `${Math.min(userScore, 100)}%`,
                                    background: userScore >= 80 ? 'linear-gradient(90deg, #7c3aed, #3b82f6)' : userScore >= 60 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #ef4444, #dc2626)',
                                    transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    animation: `markBarSlide 1.2s cubic-bezier(0.4,0,0.2,1) ${index * 80 + 200}ms both`
                                  }}
                                >
                                  {userScore >= 20 && `${userScore.toFixed(0)}%`}
                                </div>
                              </div>

                              {/* Class average bar */}
                              {classAverage !== null && studentCount > 1 && (
                                <div className="mt-1.5">
                                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Global Average ({studentCount} students)</span>
                                    <span>{classAverage.toFixed(1)}%</span>
                                  </div>
                                  <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gray-300 rounded-full"
                                      style={{
                                        width: `${Math.min(classAverage, 100)}%`,
                                        transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        animation: `markBarSlide 1.2s cubic-bezier(0.4,0,0.2,1) ${index * 80 + 400}ms both`
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Performance badge + final grade */}
                          <div className="flex items-center justify-between">
                            <div className={`flex items-center gap-1.5 ${perfColor} text-sm font-semibold`}>
                              <PerfIcon className="w-4 h-4" />
                              <span>{perfLabel}</span>
                            </div>
                            {course.grading_period_title && (
                              <div className="text-xs text-gray-400">
                                {course.grading_period_title}
                              </div>
                            )}
                            {!course.grading_period_title && course.final_grade && course.final_grade !== displayGrade && (
                              <div className="text-xs text-gray-400">
                                Final: <span className="font-semibold text-gray-600">{course.final_grade}</span>
                                {course.final_score && ` (${parseFloat(course.final_score).toFixed(1)}%)`}
                              </div>
                            )}
                            {!hasScore && (
                              <span className="text-xs text-gray-400 italic">Sync Canvas to see your grade</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* CSS animation */}
            <style>{`
              @keyframes markBarSlide {
                from { width: 0%; opacity: 0.3; }
                to { opacity: 1; }
              }
            `}</style>
          </div>
        )}
        {currentPage === 'account' && (
          <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-md">
                <UserCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Account &amp; Analytics</h1>
                <p className="text-sm text-gray-500">{accountSetup.name || user?.email}</p>
              </div>
            </div>

            <div className="flex gap-6">
              {/* Left sidebar tabs — hidden during initial setup */}
              {accountTab !== 'initial-setup' && (
              <div className="w-48 flex-shrink-0">
                <nav className="space-y-1">
                  {[
                    { id: 'settings', label: 'Settings', icon: Settings },
                    { id: 'courses', label: 'Courses', icon: BookOpen },
                    { id: 'resolved', label: 'Resolved Tasks', icon: CheckCircle },
                    { id: 'grades', label: 'Activity', icon: BarChart3 },
                    { id: 'schedule', label: 'Schedule', icon: ClipboardList },
                    { id: 'help', label: 'Help', icon: HelpCircle },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => handleAccountTabChange(id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                        accountTab === id
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {label}
                    </button>
                  ))}
                </nav>
              </div>
              )}

              {/* Right content panel */}
              <div className="flex-1 min-w-0">

                {/* ── INITIAL SETUP TAB (new users only) ── */}
                {accountTab === 'initial-setup' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Welcome to PlanAssist!</h2>
                      <p className="text-sm text-gray-500 mt-1">Fill in a few details to get started. This only takes a minute.</p>
                    </div>

                    {/* Name (read only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input type="text" value={accountSetup.name || ''} disabled
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500" />
                      <p className="text-xs text-gray-400 mt-1">Extracted from your email</p>
                    </div>

                    {/* Grade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Grade <span className="text-red-500">*</span></label>
                      <select value={accountSetup.grade}
                        onChange={(e) => setAccountSetup(prev => ({ ...prev, grade: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500">
                        <option value="">Select your grade...</option>
                        {['3','4','5','6','7','8','9','10','11','12'].map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>

                    {/* Canvas API Token */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Canvas API Token <span className="text-red-500">*</span></label>
                      <input type="password" value={accountSetup.canvasApiToken}
                        onChange={(e) => setAccountSetup(prev => ({ ...prev, canvasApiToken: e.target.value }))}
                        placeholder="Paste your Canvas API token here..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono text-sm" />
                      <div className="mt-2 text-xs space-y-1 text-gray-500">
                        <p className="font-medium text-gray-700">How to get your Canvas API token:</p>
                        <ol className="list-decimal ml-4 space-y-1">
                          <li>Go to Canvas → Account (top left) → Settings</li>
                          <li>Scroll to "Approved Integrations" → click "+ New Access Token"</li>
                          <li>Set Purpose: "PlanAssist Integration" and leave Expires blank</li>
                          <li>Click "Generate Token", copy it, and paste it above</li>
                        </ol>
                        <p className="text-purple-600 font-medium mt-1">🔒 Your token is encrypted and stored securely</p>
                      </div>
                    </div>

                    {/* Present Periods */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Present Periods (Time Zone) <span className="text-red-500">*</span></label>
                      <select value={accountSetup.presentPeriods}
                        onChange={(e) => setAccountSetup(prev => ({ ...prev, presentPeriods: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500">
                        <option value="1-5">Periods 1-5</option>
                        <option value="2-6">Periods 2-6</option>
                        <option value="3-7">Periods 3-7</option>
                        <option value="4-8">Periods 4-8</option>
                      </select>
                    </div>

                    {/* Weekly Schedule */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Weekly Schedule <span className="text-red-500">*</span></label>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Period</th>
                              {['Monday','Tuesday','Wednesday','Thursday','Friday'].map(day => (
                                <th key={day} className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{day.slice(0,3)}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {selectedPeriods.map(period => (
                              <tr key={period} className="border-t">
                                <td className="px-4 py-3 font-medium text-gray-900">P{period}</td>
                                {['Monday','Tuesday','Wednesday','Thursday','Friday'].map(day => (
                                  <td key={day} className="px-4 py-3 text-center">
                                    <select
                                      value={accountSetup.schedule[day]?.[String(period)] || 'Study'}
                                      onChange={(e) => {
                                        const newSchedule = { ...accountSetup.schedule };
                                        if (!newSchedule[day]) newSchedule[day] = {};
                                        newSchedule[day][period] = e.target.value;
                                        setAccountSetup(prev => ({ ...prev, schedule: newSchedule }));
                                      }}
                                      className={`px-3 py-2 rounded-lg font-medium text-sm ${
                                        (accountSetup.schedule[day]?.[String(period)] || 'Study') === 'Study'
                                          ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                      }`}>
                                      <option value="Study">Study</option>
                                      <option value="Lesson">Lesson</option>
                                    </select>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Feedback */}
                    <div className="border-t pt-4">
                      <button onClick={() => setShowFeedbackForm(true)}
                        className="w-full bg-blue-50 text-blue-700 py-2.5 rounded-xl font-medium hover:bg-blue-100 flex items-center justify-center gap-2 text-sm">
                        <Send className="w-4 h-4" /> Submit Feedback or Bug Report
                      </button>
                    </div>

                    <button
                      onClick={saveAccountSetup}
                      disabled={settingsSaving || !accountSetup.grade || !accountSetup.canvasApiToken}
                      className="w-full bg-gradient-to-r from-yellow-400 to-purple-600 text-white py-4 rounded-xl font-bold hover:from-yellow-500 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-base transition-all shadow-md"
                    >
                      {settingsSaving ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Setting up your account...
                        </span>
                      ) : 'Save & Launch'}
                    </button>
                  </div>
                )}

                {/* ── SETTINGS TAB ── */}
                {accountTab === 'settings' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                    <h2 className="text-lg font-bold text-gray-900">Settings</h2>

                    {/* Calendar Settings */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Calendar Settings</h3>
                      <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 mb-4">
                        {[
                          { key: 'calendarShowHomeroom', label: 'Show Homeroom Tasks', desc: 'Homeroom tasks appear on the calendar.' },
                          { key: 'calendarShowCompleted', label: 'Show Completed Tasks', desc: 'Submitted and completed tasks appear with a strikethrough.' },
                          { key: 'calendarShowWeekends', label: 'Show Weekends', desc: 'Saturday and Sunday columns are visible on the calendar.' },
                        ].map(({ key, label, desc }) => (
                          <div key={key} className="flex items-start gap-3 p-4">
                            <input type="checkbox" checked={accountSetup[key] !== false}
                              onChange={(e) => setAccountSetup(prev => ({ ...prev, [key]: e.target.checked }))}
                              className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500" />
                            <div>
                              <p className="font-medium text-gray-900">{label}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">Visible Weeks</p>
                      <p className="text-xs text-gray-400 mb-3">Select which weeks appear on your calendar. At least one must be selected.</p>
                      <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                        {[
                          { key: 'calendarShowPrevWeek',    label: 'Previous Week', desc: 'The week before the current week.' },
                          { key: 'calendarShowCurrentWeek', label: 'Current Week',  desc: 'The week containing today.' },
                          { key: 'calendarShowNextWeek1',   label: 'Next Week',     desc: 'One week from now.' },
                          { key: 'calendarShowNextWeek2',   label: 'Next Week 2',   desc: 'Two weeks from now.' },
                        ].map(({ key, label, desc }) => {
                          const checked = key === 'calendarShowCurrentWeek' ? accountSetup[key] !== false : (accountSetup[key] || false);
                          return (
                            <div key={key}
                              className={`flex items-center p-4 cursor-pointer transition-colors select-none ${checked ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                              onClick={async () => {
                                // Prevent deselecting all — need at least one
                                const otherKeys = ['calendarShowPrevWeek','calendarShowCurrentWeek','calendarShowNextWeek1','calendarShowNextWeek2'].filter(k => k !== key);
                                const otherSelected = otherKeys.some(k => k === 'calendarShowCurrentWeek' ? accountSetup[k] !== false : accountSetup[k]);
                                if (checked && !otherSelected) return;
                                const newVal = !checked;
                                const updated = { ...accountSetup, [key]: newVal };
                                setAccountSetup(updated);
                                // Auto-save immediately
                                try {
                                  await apiCall('/account/setup', 'POST', {
                                    grade: updated.grade,
                                    canvasApiToken: updated.canvasApiToken,
                                    presentPeriods: updated.presentPeriods,
                                    schedule: updated.schedule,
                                    calendarShowHomeroom: updated.calendarShowHomeroom,
                                    calendarShowCompleted: updated.calendarShowCompleted,
                                    calendarShowPrevWeek: updated.calendarShowPrevWeek,
                                    calendarShowCurrentWeek: updated.calendarShowCurrentWeek,
                                    calendarShowNextWeek1: updated.calendarShowNextWeek1,
                                    calendarShowNextWeek2: updated.calendarShowNextWeek2,
                                    calendarShowWeekends: updated.calendarShowWeekends
                                  });
                                } catch (err) { console.error('Failed to save week setting:', err); }
                              }}>
                              <div className="flex-1">
                                <p className={`font-medium text-sm ${checked ? 'text-purple-800' : 'text-gray-900'}`}>{label}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                              </div>
                              {checked && (
                                <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 ml-3" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Privacy Settings */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Privacy Settings</h3>
                      <div className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={user?.showInFeed !== false}
                            onChange={async (e) => {
                              try {
                                await apiCall('/user/feed-preference', 'PUT', { showInFeed: e.target.checked });
                                setUser(prev => ({ ...prev, showInFeed: e.target.checked }));
                              } catch (err) { console.error(err); }
                            }}
                            className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500" />
                          <div>
                            <p className="font-medium text-gray-900">Show my task completions in Live Activity feed</p>
                            <p className="text-xs text-gray-500 mt-1">When enabled, other students will see when you complete tasks on the Hub page. Only your name and grade are shown.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Canvas Token */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Canvas API Token</h3>
                      <input type="password" value={accountSetup.canvasApiToken}
                        onChange={(e) => setAccountSetup(prev => ({ ...prev, canvasApiToken: e.target.value }))}
                        placeholder="Paste your Canvas API token here..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono text-sm" />
                      <p className="text-xs text-gray-500 mt-1">🔒 Encrypted and stored securely. Never share your token with anyone.</p>
                    </div>

                    {/* Grade */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Grade</h3>
                      <select value={accountSetup.grade}
                        onChange={(e) => setAccountSetup(prev => ({ ...prev, grade: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500">
                        <option value="">Select your grade...</option>
                        {['3','4','5','6','7','8','9','10','11','12'].map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>

                    {/* Present Periods */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Present Periods (Time Zone)</h3>
                      <select value={accountSetup.presentPeriods}
                        onChange={(e) => setAccountSetup(prev => ({ ...prev, presentPeriods: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500">
                        <option value="1-5">Periods 1-5</option>
                        <option value="2-6">Periods 2-6</option>
                        <option value="3-7">Periods 3-7</option>
                        <option value="4-8">Periods 4-8</option>
                      </select>
                    </div>

                    {/* Feedback */}
                    <div className="border-t pt-4">
                      <button onClick={() => setShowFeedbackForm(true)}
                        className="w-full bg-blue-50 text-blue-700 py-3 rounded-xl font-semibold hover:bg-blue-100 flex items-center justify-center gap-2 text-sm">
                        <Send className="w-4 h-4" /> Submit Feedback or Bug Report
                      </button>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setCurrentPage('hub')}
                        className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 text-sm">
                        Cancel
                      </button>
                      <button onClick={saveAccountSetup} disabled={settingsSaving}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 text-sm">
                        {settingsSaving ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── COURSES TAB ── */}
                {accountTab === 'courses' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Course Management</h2>
                    <p className="text-sm text-gray-500 mb-5">Toggle courses on or off to show or hide their tasks everywhere in PlanAssist. Customize colors per course.</p>
                    {courses.length === 0 ? (
                      <p className="text-gray-400 text-sm">No courses found. Sync Canvas to load your courses.</p>
                    ) : (
                      <div className="space-y-2">
                        {courses.map(course => {
                          const className = course.name;
                          const color = (JSON.parse(localStorage.getItem('classColors') || '{}')?.[className]) || getClassColor(className);
                          return (
                            <div key={course.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${course.enabled !== false ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}`}>
                              {/* Enable toggle */}
                              <div className="flex items-center">
                                <input type="checkbox" checked={course.enabled !== false}
                                  onChange={(e) => toggleCourseEnabled(course.id, e.target.checked)}
                                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer" />
                              </div>
                              {/* Color swatch */}
                              <input type="color" value={color}
                                onChange={(e) => {
                                  const stored = JSON.parse(localStorage.getItem('classColors') || '{}');
                                  stored[className] = e.target.value;
                                  localStorage.setItem('classColors', JSON.stringify(stored));
                                  setAccountSetup(prev => ({ ...prev, classColors: stored }));
                                }}
                                className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0" title="Change color" />
                              {/* Course name */}
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium text-sm truncate ${course.enabled !== false ? 'text-gray-900' : 'text-gray-400'}`}>{course.name}</p>
                                {course.current_period_score != null ? (
                                  <p className="text-xs text-gray-400">{course.current_period_score}% · {course.current_period_grade || course.current_grade || '–'}</p>
                                ) : course.current_score != null ? (
                                  <p className="text-xs text-gray-400">{course.current_score}% · {course.current_grade || '–'}</p>
                                ) : null}
                              </div>
                              {course.enabled === false && (
                                <span className="text-xs text-gray-400 font-medium flex-shrink-0">Hidden</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── RESOLVED TASKS TAB ── */}
                {accountTab === 'resolved' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Resolved Tasks</h2>
                    <p className="text-sm text-gray-500 mb-4">Completed and dismissed tasks. Restore any task to send it back to your Task List.</p>

                    {/* Search + Sort */}
                    <div className="flex gap-3 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input value={resolvedSearch}
                          onChange={(e) => { setResolvedSearch(e.target.value); loadResolvedTasks(e.target.value, resolvedSort); }}
                          placeholder="Search resolved tasks..."
                          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500" />
                      </div>
                      <select value={resolvedSort}
                        onChange={(e) => { setResolvedSort(e.target.value); loadResolvedTasks(resolvedSearch, e.target.value); }}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500">
                        <option value="created_at">Sort: Sync Date</option>
                        <option value="deadline">Sort: Deadline</option>
                      </select>
                    </div>

                    {resolvedLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : resolvedTasks.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-8">No resolved tasks found.</p>
                    ) : (
                      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                        {resolvedTasks.map(task => {
                          const deadlineStr = (() => {
                            if (!task.deadline_date) return null;
                            const dp = task.deadline_date.includes('T') ? task.deadline_date.split('T')[0] : task.deadline_date;
                            const d = task.deadline_time ? new Date(`${dp}T${task.deadline_time}Z`) : new Date(`${dp}T23:59:00`);
                            return d.toLocaleDateString();
                          })();
                          const isCompleted = task.completed;
                          const hasSession = task.session_actual_time != null;
                          return (
                            <div key={task.id} className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                              <div className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${isCompleted ? 'bg-green-400' : 'bg-gray-300'}`} />
                              <div className="flex-1 min-w-0">
                                <a href={task.url} target="_blank" rel="noreferrer"
                                  className="font-medium text-sm text-gray-900 hover:text-purple-700 hover:underline block truncate">
                                  {task.title}{task.segment ? ` · ${task.segment}` : ''}
                                </a>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-xs text-gray-400">{task.class}</span>
                                  {deadlineStr && <span className="text-xs text-gray-300">·</span>}
                                  {deadlineStr && <span className="text-xs text-gray-400">Due {deadlineStr}</span>}
                                  <span className="text-xs text-gray-300">·</span>
                                  <span className={`text-xs font-medium ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                                    {isCompleted ? 'Completed' : 'Dismissed'}
                                  </span>
                                </div>
                                {hasSession && (
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <Clock className="w-3 h-3 text-gray-300" />
                                    {editingActualTime === task.id ? (
                                      <div className="flex items-center gap-1">
                                        <input type="number" value={editingActualTimeVal} min="0"
                                          onChange={(e) => setEditingActualTimeVal(e.target.value)}
                                          className="w-16 px-2 py-0.5 border border-purple-300 rounded text-xs focus:ring-1 focus:ring-purple-500" />
                                        <span className="text-xs text-gray-400">min</span>
                                        <button onClick={() => saveActualTime(task.id, editingActualTimeVal)}
                                          className="text-xs text-green-600 font-medium hover:text-green-700 px-1">Save</button>
                                        <button onClick={() => setEditingActualTime(null)}
                                          className="text-xs text-gray-400 hover:text-gray-600 px-1">×</button>
                                      </div>
                                    ) : (
                                      <button onClick={() => { setEditingActualTime(task.id); setEditingActualTimeVal(String(task.session_actual_time)); }}
                                        className="text-xs text-gray-400 hover:text-purple-600 transition-colors">
                                        {task.session_actual_time} min <span className="text-gray-300">(tap to edit)</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                                {task.completed_at && (
                                  <p className="text-xs text-gray-300 mt-0.5">
                                    {isCompleted ? 'Completed' : 'Resolved'} {new Date(task.completed_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <button onClick={() => restoreTask(task.id)}
                                className="flex-shrink-0 text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium transition-colors">
                                Restore
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── ACTIVITY TAB ── */}
                {accountTab === 'grades' && (() => {
                  const FILTERS = [
                    { key: 'grades', label: '📊 Grades' },
                    { key: 'announcements', label: '📢 Announcements' },
                    { key: 'discussions', label: '💬 Discussions' },
                    { key: 'messages', label: '✉️ Messages' },
                  ];

                  // Pick data + loading state based on active filter
                  const isLoading = activityFilter === 'grades' ? gradesLoading
                    : activityFilter === 'announcements' ? announcementsLoading
                    : activityFilter === 'discussions' ? discussionsLoading
                    : activityLoading;

                  const items = activityFilter === 'grades' ? gradesItems
                    : activityFilter === 'announcements' ? announcementItems
                    : activityFilter === 'discussions' ? discussionItems
                    : activityItems.filter(i => i.type === 'Message' || i.type === 'Conversation');

                  return (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-1">
                        <h2 className="text-lg font-bold text-gray-900">Canvas Activity</h2>
                        {isLoading && <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />}
                      </div>
                      <p className="text-sm text-gray-500 mb-4">Your recent Canvas activity.</p>

                      {/* Filter pills */}
                      <div className="flex flex-wrap gap-2 mb-5">
                        {FILTERS.map(f => (
                          <button key={f.key} onClick={() => setActivityFilter(f.key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              activityFilter === f.key
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}>
                            {f.label}
                          </button>
                        ))}
                      </div>

                      {/* ── Grades sub-tab ── */}
                      {activityFilter === 'grades' && (
                        <div>
                          {gradesLoading && gradesItems.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">Loading grades...</p>
                          ) : gradesItems.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">No graded assignments found yet. Grades appear here after a Sync detects a score change.</p>
                          ) : (
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                              {gradesItems.map(item => {
                                const isPassFail = item.gradingType === 'pass_fail' || item.gradingType === 'complete_incomplete';
                                const scoreDisplay = (() => {
                                  if (isPassFail) return item.grade === 'complete' ? '✓ Complete' : item.grade === 'pass' ? '✓ Pass' : item.grade || '–';
                                  if (item.score != null && item.pointsPossible != null) return `${item.score} / ${item.pointsPossible}`;
                                  if (item.grade) return item.grade;
                                  return '–';
                                })();
                                const pct = item.score != null && item.pointsPossible > 0
                                  ? Math.round((item.score / item.pointsPossible) * 100) : null;
                                const pctColor = pct == null ? 'text-gray-500' : pct >= 90 ? 'text-green-600' : pct >= 70 ? 'text-yellow-600' : 'text-red-500';
                                const gradedDate = item.gradedAt ? new Date(item.gradedAt).toLocaleDateString() : null;
                                return (
                                  <div key={item.id} className="flex items-start gap-4 p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                                    <div className="flex-1 min-w-0">
                                      {item.htmlUrl ? (
                                        <a href={item.htmlUrl} target="_blank" rel="noreferrer"
                                          className="font-medium text-sm text-gray-900 hover:text-purple-700 hover:underline block truncate">
                                          {item.assignmentName}
                                        </a>
                                      ) : (
                                        <p className="font-medium text-sm text-gray-900 truncate">{item.assignmentName}</p>
                                      )}
                                      {item.courseName && <p className="text-xs text-gray-400 mt-0.5 truncate">{item.courseName}</p>}
                                      {gradedDate && <p className="text-xs text-gray-300 mt-0.5">Submitted {gradedDate}</p>}
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                      <p className={`text-sm font-bold ${pctColor}`}>{scoreDisplay}</p>
                                      {pct != null && <p className="text-xs text-gray-400">{pct}%</p>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Announcements sub-tab ── */}
                      {activityFilter === 'announcements' && (
                        <div>
                          {announcementsLoading && announcementItems.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">Loading announcements...</p>
                          ) : announcementItems.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">No recent announcements.</p>
                          ) : (
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                              {announcementItems.map(item => (
                                <div key={item.id} className="p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                                  {item.htmlUrl ? (
                                    <a href={item.htmlUrl} target="_blank" rel="noreferrer"
                                      className="font-medium text-sm text-gray-900 hover:text-purple-700 hover:underline block">
                                      {item.title}
                                    </a>
                                  ) : (
                                    <p className="font-medium text-sm text-gray-900">{item.title}</p>
                                  )}
                                  {item.courseName && <p className="text-xs text-purple-500 font-medium mt-0.5">{item.courseName}</p>}
                                  {item.body && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-3">{item.body}</p>}
                                  {item.postedAt && <p className="text-xs text-gray-300 mt-1.5">{new Date(item.postedAt).toLocaleDateString()}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Discussions sub-tab ── */}
                      {activityFilter === 'discussions' && (
                        <div>
                          {discussionsLoading && discussionItems.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">Loading discussions...</p>
                          ) : discussionItems.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">No recent discussions.</p>
                          ) : (
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                              {discussionItems.map(item => (
                                <div key={item.id} className="p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      {item.htmlUrl ? (
                                        <a href={item.htmlUrl} target="_blank" rel="noreferrer"
                                          className="font-medium text-sm text-gray-900 hover:text-purple-700 hover:underline block truncate">
                                          {item.title}
                                        </a>
                                      ) : (
                                        <p className="font-medium text-sm text-gray-900 truncate">{item.title}</p>
                                      )}
                                      {item.courseName && <p className="text-xs text-purple-500 font-medium mt-0.5">{item.courseName}</p>}
                                      {item.body && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{item.body}</p>}
                                      {item.lastReplyAt && <p className="text-xs text-gray-300 mt-1">Last reply {new Date(item.lastReplyAt).toLocaleDateString()}</p>}
                                    </div>
                                    {item.unreadCount > 0 && (
                                      <span className="flex-shrink-0 bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                        {item.unreadCount} new
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Messages sub-tab (activity stream filter) ── */}
                      {activityFilter === 'messages' && (
                        <div>
                          {activityLoading && activityItems.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">Loading messages...</p>
                          ) : items.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">No recent messages.</p>
                          ) : (
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                              {items.map(item => (
                                <div key={item.id} className="p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                                  {item.htmlUrl ? (
                                    <a href={item.htmlUrl} target="_blank" rel="noreferrer"
                                      className="font-medium text-sm text-gray-900 hover:text-purple-700 hover:underline block truncate">
                                      {item.title || 'Message'}
                                    </a>
                                  ) : (
                                    <p className="font-medium text-sm text-gray-900 truncate">{item.title || 'Message'}</p>
                                  )}
                                  {item.body && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.body.replace(/<[^>]*>/g, '')}</p>}
                                  {item.updatedAt && <p className="text-xs text-gray-300 mt-1">{new Date(item.updatedAt).toLocaleDateString()}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── SCHEDULE TAB ── */}
                {accountTab === 'schedule' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                    <h2 className="text-lg font-bold text-gray-900">Schedule Management</h2>

                    {/* Weekly Schedule grid */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Weekly Schedule</h3>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Period</th>
                              {['Monday','Tuesday','Wednesday','Thursday','Friday'].map(day => (
                                <th key={day} className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{day.slice(0,3)}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {selectedPeriods.map(period => (
                              <tr key={period} className="border-t">
                                <td className="px-4 py-3 font-medium text-gray-900">P{period}</td>
                                {['Monday','Tuesday','Wednesday','Thursday','Friday'].map(day => (
                                  <td key={day} className="px-4 py-3 text-center">
                                    <select
                                      value={accountSetup.schedule[day]?.[String(period)] || 'Study'}
                                      onChange={(e) => {
                                        const newSchedule = { ...accountSetup.schedule };
                                        if (!newSchedule[day]) newSchedule[day] = {};
                                        newSchedule[day][period] = e.target.value;
                                        setAccountSetup(prev => ({ ...prev, schedule: newSchedule }));
                                      }}
                                      className={`px-3 py-2 rounded-lg font-medium text-sm ${
                                        (accountSetup.schedule[day]?.[String(period)] || 'Study') === 'Study'
                                          ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                      }`}>
                                      <option value="Study">Study</option>
                                      <option value="Lesson">Lesson</option>
                                    </select>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Enhance / Re-enhance */}
                    {courses.length > 0 && parseInt(user?.grade || 0) >= 7 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-1">
                          {scheduleEnhanced ? 'Re-enhance Schedule' : 'Enhance Schedule'}
                        </h3>
                        <p className="text-xs text-gray-500 mb-3">
                          {scheduleEnhanced
                            ? 'Update your course-to-period assignments or Zoom numbers. Changes merge with your existing schedule.'
                            : 'Link your courses to Lesson periods and add Zoom numbers to unlock the Itinerary page.'}
                        </p>
                        <button
                          onClick={() => {
                            const prefillLessons = {};
                            scheduleLessons.forEach(sl => {
                              if (sl.course_id) prefillLessons[`${sl.day}-${sl.period}`] = { courseId: sl.course_id, courseName: sl.course_name };
                            });
                            const prefillZoom = {};
                            courses.forEach(c => { if (c.zoom_number) prefillZoom[c.id] = c.zoom_number; });
                            setEnhanceLessons(prefillLessons);
                            setEnhanceZoom(prefillZoom);
                            setShowEnhanceDialog(true);
                            setEnhanceStep(1);
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 text-sm transition-colors"
                        >
                          <ClipboardList className="w-4 h-4" />
                          {scheduleEnhanced ? 'Re-enhance Schedule' : 'Enhance Schedule'}
                          {scheduleEnhanced && <span className="ml-1 text-xs bg-green-400 text-white px-1.5 py-0.5 rounded-full">Enhanced</span>}
                        </button>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setCurrentPage('hub')}
                        className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 text-sm">
                        Cancel
                      </button>
                      <button onClick={saveAccountSetup} disabled={settingsSaving}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 text-sm">
                        {settingsSaving ? 'Saving...' : 'Save Schedule'}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── HELP TAB ── */}
                {accountTab === 'help' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Help</h2>
                    <p className="text-sm text-gray-500 mb-5">Guidance on using PlanAssist.</p>
                    {helpContent ? (
                      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {helpContent}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm text-center py-8">No help content has been added yet. Check back later.</p>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* ── ADMIN CONSOLE ───────────────────────────────────────────────── */}
        {currentPage === 'admin' && user?.isAdmin && (
          <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Console</h1>
                <p className="text-sm text-gray-500">PlanAssist administration — handle with care</p>
              </div>
            </div>

            {/* Section tabs */}
            <div className="flex gap-2 mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex-wrap">
              {[
                { id: 'users', label: 'Users', icon: UserCheck },
                { id: 'announcements', label: 'Banners', icon: Bell },
                { id: 'diagnostics', label: 'Diagnostics', icon: BarChart3 },
                { id: 'audit', label: 'Audit Log', icon: FileText },
                { id: 'help', label: 'Help Page', icon: HelpCircle },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setAdminSection(id);
                    if (id === 'users' && adminUsers.length === 0) loadAdminUsers();
                    if (id === 'diagnostics' && !adminDiagnostics) loadAdminDiagnostics();
                    if (id === 'audit') loadAdminAuditLog();
                    if (id === 'announcements') loadAdminAnnouncements();
                    if (id === 'help') { apiCall('/help').then(d => setAdminHelpContent(d.content || '')); }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${adminSection === id ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>

            {/* ── USERS ── */}
            {adminSection === 'users' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User list */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        value={adminSearch}
                        onChange={e => setAdminSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-[600px]">
                    {adminLoading && <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>}
                    {adminUsers
                      .filter(u => !adminSearch || u.name?.toLowerCase().includes(adminSearch.toLowerCase()) || u.email?.toLowerCase().includes(adminSearch.toLowerCase()) || u.grade?.toString().includes(adminSearch))
                      .map(u => (
                        <div
                          key={u.id}
                          onClick={() => { setAdminSelectedUser(u.id); loadAdminUserDetail(u.id); }}
                          className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${adminSelectedUser === u.id ? 'bg-red-50 border-l-2 border-l-red-500' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm text-gray-900">{u.name || '(unnamed)'}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs text-gray-500">Gr {u.grade || '?'}</span>
                              <div className="flex gap-1 flex-wrap justify-end">
                                {u.is_admin && <span className="text-xs bg-red-100 text-red-600 px-1.5 rounded font-medium">Admin</span>}
                                {u.is_banned && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 rounded font-medium">Banned</span>}
                                {u.is_new_user && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 rounded font-medium">New</span>}
                                {parseInt(u.new_tasks) > 0 && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 rounded font-medium">{u.new_tasks} unsorted</span>}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{u.active_tasks} tasks · {u.total_completed} completed</p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* User detail */}
                <div className="lg:col-span-2">
                  {!adminUserDetail && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
                      <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Select a user to view details</p>
                    </div>
                  )}
                  {adminUserDetail && (() => {
                    const u = adminUserDetail.user;
                    return (
                      <div className="space-y-4">
                        {/* Profile card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{u.name}</h3>
                              <p className="text-sm text-gray-500">{u.email}</p>
                              <p className="text-xs text-gray-400 mt-0.5">Grade {u.grade} · Joined {new Date(u.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2 flex-wrap justify-end">
                              {u.is_admin && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold">Admin</span>}
                              {u.is_banned && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-semibold">Blocked</span>}
                              {u.schedule_enhanced && <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-semibold">Enhanced</span>}
                            </div>
                          </div>

                          {/* Edit form */}
                          {editingUser === u.id ? (
                            <EditUserForm user={u} onSave={fields => adminEditUser(u.id, fields)} onCancel={() => setEditingUser(null)} currentUserId={user.id} />
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <button onClick={() => setEditingUser(u.id)} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1">
                                <Edit2 className="w-3.5 h-3.5" />Edit
                              </button>
                              <button onClick={() => adminClearToken(u.id)} className="text-xs px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 flex items-center gap-1">
                                <X className="w-3.5 h-3.5" />Clear Token
                              </button>
                              {u.is_banned ? (
                                <button onClick={() => adminUnbanUser(u.id)} className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5" />Unblock
                                </button>
                              ) : (
                                <button onClick={() => setShowBanDialog(u.id)} className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1">
                                  <Ban className="w-3.5 h-3.5" />Block Account
                                </button>
                              )}
                            </div>
                          )}

                          {u.is_banned && u.ban_reason && (
                            <p className="mt-3 text-xs text-orange-700 bg-orange-50 rounded-lg px-3 py-2">
                              Block reason: {u.ban_reason}
                            </p>
                          )}
                        </div>

                        {/* Tasks */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                          <h4 className="font-semibold text-gray-700 mb-3 text-sm">Active Tasks ({adminUserDetail.tasks.filter(t => !t.deleted && !t.completed).length})</h4>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {adminUserDetail.tasks.filter(t => !t.deleted && !t.completed).map(t => (
                              <div key={t.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium text-gray-800 truncate block">{t.title}{t.segment ? ` · ${t.segment}` : ''}</span>
                                  <span className="text-gray-400">{t.class} · {(() => { if (!t.deadline_date) return 'no date'; const dp = (t.deadline_date.includes('T') ? t.deadline_date.split('T')[0] : t.deadline_date); const d = t.deadline_time ? new Date(dp + 'T' + t.deadline_time + 'Z') : new Date(dp + 'T23:59:00'); return d.toLocaleDateString(); })()}</span>
                                </div>
                                <button onClick={() => adminDeleteTask(t.id)} className="ml-2 text-red-400 hover:text-red-600 flex-shrink-0">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Unsorted tasks (is_new) + Tasks Scan */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-700 text-sm">
                              Unsorted Tasks — is_new ({adminUserDetail.newTasks?.length || 0})
                            </h4>
                            <button
                              onClick={() => adminTasksScan(u.id)}
                              className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-1 font-semibold"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />Tasks Scan
                            </button>
                          </div>
                          {(!adminUserDetail.newTasks || adminUserDetail.newTasks.length === 0) ? (
                            <p className="text-green-600 text-xs">No unsorted tasks ✓</p>
                          ) : (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {adminUserDetail.newTasks.map(t => (
                                <div key={t.id} className="flex items-center justify-between text-xs p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium text-gray-800 truncate block">{t.title}{t.segment ? ` · ${t.segment}` : ''}</span>
                                    <span className="text-gray-400">{t.class}{t.manually_created ? ' · manual' : ''}</span>
                                  </div>
                                  <span className="ml-2 text-gray-400 flex-shrink-0">{(() => { if (!t.deadline_date) return 'no date'; const dp = (t.deadline_date.includes('T') ? t.deadline_date.split('T')[0] : t.deadline_date); const d = t.deadline_time ? new Date(dp + 'T' + t.deadline_time + 'Z') : new Date(dp + 'T23:59:00'); return d.toLocaleDateString(); })()}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Recent completions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                          <h4 className="font-semibold text-gray-700 mb-3 text-sm">Recent Completions</h4>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {adminUserDetail.recentCompletions.map((c, i) => (
                              <div key={i} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-800 flex-1 truncate">{c.title}</span>
                                <span className="text-gray-400 ml-2 flex-shrink-0">{c.actual_time}m · {new Date(c.completed_at).toLocaleDateString()}</span>
                              </div>
                            ))}
                            {adminUserDetail.recentCompletions.length === 0 && <p className="text-gray-400 text-xs">No completions yet</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ── ANNOUNCEMENTS ── */}
            {adminSection === 'announcements' && (
              <div className="space-y-6">
                {/* Compose */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">New Banner</h3>
                  <div className="space-y-3">
                    <textarea
                      value={newAnnouncementMsg}
                      onChange={e => setNewAnnouncementMsg(e.target.value)}
                      placeholder="Banner message..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 resize-none h-20"
                    />
                    <div className="flex gap-3 items-center flex-wrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setNewAnnouncementType('info')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border-2 ${newAnnouncementType === 'info' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}
                        >
                          <span className="flex items-center gap-1.5"><Bell className="w-3.5 h-3.5" />Dismissible (blue)</span>
                        </button>
                        <button
                          onClick={() => setNewAnnouncementType('urgent')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border-2 ${newAnnouncementType === 'urgent' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600'}`}
                        >
                          <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />Permanent (red)</span>
                        </button>
                      </div>
                      <button
                        onClick={adminCreateAnnouncement}
                        disabled={!newAnnouncementMsg.trim()}
                        className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                      >
                        Publish Banner
                      </button>
                    </div>
                    <div className={`text-xs rounded-lg px-3 py-2 ${newAnnouncementType === 'urgent' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                      Preview: {newAnnouncementMsg || 'Your message here...'}
                    </div>
                  </div>
                </div>

                {/* Existing */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Active Banners</h3>
                  <div className="space-y-3">
                    {adminAnnouncements.filter(a => a.is_active).map(a => (
                      <div key={a.id} className={`flex items-start justify-between p-3 rounded-lg text-sm ${a.type === 'urgent' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                        <div>
                          <p className={`font-medium ${a.type === 'urgent' ? 'text-red-800' : 'text-blue-800'}`}>{a.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{a.type === 'urgent' ? 'Permanent' : 'Dismissible'} · by {a.author_name} · {new Date(a.created_at).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => adminDeactivateAnnouncement(a.id)} className="ml-3 text-xs text-gray-500 hover:text-red-600 flex-shrink-0 underline">
                          Deactivate
                        </button>
                      </div>
                    ))}
                    {adminAnnouncements.filter(a => !a.is_active).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-2">Past Banners</p>
                        {adminAnnouncements.filter(a => !a.is_active).slice(0, 5).map(a => (
                          <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg text-xs bg-gray-50 text-gray-400 mb-1.5">
                            <span className="truncate">{a.message}</span>
                            <span className="ml-2 flex-shrink-0">{new Date(a.created_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {adminAnnouncements.filter(a => a.is_active).length === 0 && (
                      <p className="text-gray-400 text-sm">No active banners</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── DIAGNOSTICS ── */}
            {adminSection === 'diagnostics' && (
              <div className="space-y-6">
                {adminLoading && <div className="text-center py-10 text-gray-400">Loading diagnostics...</div>}
                {adminDiagnostics && (() => {
                  const d = adminDiagnostics;
                  return (
                    <div className="space-y-5">
                      {/* New user signups */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          New Signups — Last 3 Days ({d.newUsers.length})
                        </h4>
                        {d.newUsers.length === 0 && <p className="text-gray-400 text-sm">No new signups</p>}
                        <div className="space-y-1.5">
                          {d.newUsers.map(u => (
                            <div key={u.id} className="flex items-center justify-between text-xs p-2 bg-green-50 rounded-lg">
                              <div>
                                <span className="font-semibold text-gray-800">{u.name || '(unnamed)'}</span>
                                <span className="text-gray-500 ml-2">{u.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">Gr {u.grade || '?'}</span>
                                {u.is_new_user && <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-xs font-medium">Setup pending</span>}
                                <span className="text-gray-400">{new Date(u.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Grade stats */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h4 className="font-bold text-gray-900 mb-3">Completion Stats by Grade</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {d.gradeStats.map(g => (
                            <div key={g.grade} className="p-3 bg-gray-50 rounded-lg text-center">
                              <p className="text-lg font-bold text-purple-600">Grade {g.grade}</p>
                              <p className="text-xs text-gray-500">{g.user_count} users</p>
                              <p className="text-sm font-semibold text-gray-700">{g.total_completions} completions</p>
                              <p className="text-xs text-gray-400">Avg {g.avg_actual_min}m actual / {g.avg_estimated_min}m est</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* No token */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          No Canvas Token ({d.noToken.length})
                        </h4>
                        {d.noToken.length === 0 && <p className="text-green-600 text-sm">All set up ✓</p>}
                        <div className="space-y-1.5">
                          {d.noToken.map(u => (
                            <div key={u.id} className="flex justify-between text-xs p-2 bg-yellow-50 rounded-lg">
                              <span className="font-medium text-gray-800">{u.name} <span className="text-gray-400">({u.email})</span></span>
                              <span className="text-gray-400">Gr {u.grade}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Stale syncs */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          Stale Syncs — No activity in 7+ days ({d.staleSyncs.length})
                        </h4>
                        {d.staleSyncs.length === 0 && <p className="text-green-600 text-sm">All users syncing ✓</p>}
                        <div className="space-y-1.5">
                          {d.staleSyncs.map(u => (
                            <div key={u.id} className="flex justify-between text-xs p-2 bg-orange-50 rounded-lg">
                              <span className="font-medium text-gray-800">{u.name} <span className="text-gray-400">({u.email})</span></span>
                              <span className="text-gray-400">{u.last_task_import ? new Date(u.last_task_import).toLocaleDateString() : 'never'}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Duplicates */}
                      {d.duplicates.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            Duplicate Tasks ({d.duplicates.length})
                          </h4>
                          <div className="space-y-1.5">
                            {d.duplicates.map((d2, i) => (
                              <div key={i} className="flex justify-between text-xs p-2 bg-red-50 rounded-lg">
                                <span className="font-medium text-gray-800">{d2.user_name}</span>
                                <span className="text-gray-500 truncate mx-3 flex-1">{d2.url}</span>
                                <span className="text-red-600 font-bold">{d2.count}×</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bad tasks */}
                      {d.badTasks.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            Tasks Missing Deadlines ({d.badTasks.length})
                          </h4>
                          <div className="space-y-1.5">
                            {d.badTasks.map(t => (
                              <div key={t.id} className="flex justify-between text-xs p-2 bg-red-50 rounded-lg">
                                <span className="font-medium text-gray-800">{t.title}</span>
                                <span className="text-gray-400">{t.user_name} · Gr {t.grade}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-right">
                        <button onClick={loadAdminDiagnostics} className="text-sm text-gray-500 hover:text-gray-700 underline">Refresh diagnostics</button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── AUDIT LOG ── */}
            {adminSection === 'audit' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Admin Audit Log</h3>
                  <button onClick={loadAdminAuditLog} className="text-sm text-gray-500 hover:text-gray-700 underline">Refresh</button>
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {adminAuditLog.length === 0 && <p className="text-gray-400 text-sm">No actions recorded yet</p>}
                  {adminAuditLog.map(entry => (
                    <div key={entry.id} className="flex items-start gap-3 text-xs p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <span className="font-bold text-gray-800">{entry.admin_name}</span>
                        <span className="mx-1.5 font-mono bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">{entry.action}</span>
                        {entry.target_user_name && <span className="text-gray-600">on <span className="font-medium">{entry.target_user_name}</span></span>}
                        {entry.details && Object.keys(JSON.parse(typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details))).length > 0 && (
                          <span className="ml-2 text-gray-400">{JSON.stringify(typeof entry.details === 'string' ? JSON.parse(entry.details) : entry.details)}</span>
                        )}
                      </div>
                      <span className="text-gray-400 flex-shrink-0">{new Date(entry.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── HELP PAGE EDITOR ── */}
            {adminSection === 'help' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">Help Page Content</h3>
                    <p className="text-xs text-gray-500 mt-0.5">This content is shown to all users on their Help tab. Plain text is supported.</p>
                  </div>
                </div>
                <textarea
                  value={adminHelpContent}
                  onChange={e => setAdminHelpContent(e.target.value)}
                  placeholder="Write help content here... Explain how PlanAssist works, how to sync, how sessions work, etc."
                  className="w-full h-96 px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-red-500 font-mono"
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={saveAdminHelp}
                    disabled={adminHelpSaving}
                    className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {adminHelpSaving ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : 'Save Help Content'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ban Dialog */}
        {showBanDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Block Account</h3>
              <p className="text-sm text-gray-500 mb-4">The user will see this message when they try to log in.</p>
              <textarea
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                placeholder="Reason (shown to user on login attempt)..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-4 h-24 resize-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-3">
                <button onClick={() => { setShowBanDialog(null); setBanReason(''); }} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button
                  onClick={() => adminBanUser(showBanDialog, banReason || 'This account has been temporarily blocked. Please contact your administrator.')}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
                >
                  Confirm Block
                </button>
              </div>
            </div>
          </div>
        )}

      </div>{/* ── closes <div className="py-6"> ── */}

      {/* ── Enhance Schedule Dialog ─────────────────────────────────────────── */}
      {showEnhanceDialog && (() => {
        const allDays = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
        const range = accountSetup.presentPeriods || '2-6';
        const [start, end] = range.split('-').map(Number);
        const enhancePeriods = Array.from({ length: end - start + 1 }, (_, i) => start + i);

        const lessonSlots = [];
        allDays.forEach(day => {
          enhancePeriods.forEach(period => {
            if ((accountSetup.schedule?.[day]?.[String(period)] || 'Study') === 'Lesson') {
              lessonSlots.push({ day, period });
            }
          });
        });

        const assignedCourseIds = new Set(
          Object.values(enhanceLessons).map(v => v.courseId).filter(Boolean)
        );
        const coursesForZoom = courses.filter(c => assignedCourseIds.has(c.id));
        const allLessonsAssigned = lessonSlots.length > 0 && lessonSlots.every(({ day, period }) =>
          enhanceLessons[`${day}-${period}`]?.courseId
        );

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Enhance Schedule</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Step {enhanceStep} of 2</p>
                </div>
                <button onClick={() => setShowEnhanceDialog(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {enhanceStep === 1 && (
                <div className="flex-1 overflow-y-auto p-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Select which course you have for each <span className="font-semibold text-blue-700">Lesson</span> period.
                  </p>
                  {lessonSlots.length === 0 ? (
                    <p className="text-gray-400 italic text-sm">No Lesson periods found in your schedule. Go to the Schedule tab and mark some periods as Lesson first.</p>
                  ) : (
                    <div className="space-y-3">
                      {lessonSlots.map(({ day, period }) => {
                        const key = `${day}-${period}`;
                        const selected = enhanceLessons[key];
                        return (
                          <div key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                            <div className="flex-shrink-0 text-sm font-medium text-gray-600 w-28">{day} P{period}</div>
                            <select
                              value={selected?.courseId || ''}
                              onChange={e => {
                                const courseId = parseInt(e.target.value);
                                const course = courses.find(c => c.id === courseId);
                                setEnhanceLessons(prev => ({
                                  ...prev,
                                  [key]: { courseId, courseName: course?.name || '' }
                                }));
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              <option value="">— Select a course —</option>
                              {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {enhanceStep === 2 && (
                <div className="flex-1 overflow-y-auto p-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Optionally add the Zoom meeting number for each course.
                  </p>
                  {coursesForZoom.length === 0 ? (
                    <p className="text-gray-400 italic text-sm">No courses assigned yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {coursesForZoom.map(c => (
                        <div key={c.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                          <div className="flex-shrink-0 text-sm font-medium text-gray-700 flex-1 min-w-0 truncate">{c.name}</div>
                          <input
                            type="text"
                            value={enhanceZoom[c.id] || ''}
                            onChange={e => setEnhanceZoom(prev => ({ ...prev, [c.id]: e.target.value.replace(/[^0-9]/g, '') }))}
                            placeholder="Zoom number (e.g. 74751073335)"
                            maxLength={15}
                            className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="p-6 border-t border-gray-100 flex gap-3 flex-shrink-0">
                {enhanceStep === 1 ? (
                  <>
                    <button onClick={() => setShowEnhanceDialog(false)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                      Cancel
                    </button>
                    <button
                      onClick={() => setEnhanceStep(2)}
                      disabled={!allLessonsAssigned}
                      className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEnhanceStep(1)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                      ← Back
                    </button>
                    <button
                      onClick={submitEnhanceSchedule}
                      disabled={isSavingEnhance}
                      className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {isSavingEnhance ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</>
                      ) : 'Save & Enhance'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {showFeedbackForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Submit Feedback</h3>
            <p className="text-gray-600 mb-4">
              Have a suggestion, found a bug, or want to request a feature? Let us know!
            </p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Describe your feedback, bug report, or feature request..."
              className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowFeedbackForm(false);
                  setFeedbackText('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSendFeedback}
                disabled={feedbackSending}
                className="flex-1 bg-gradient-to-r from-yellow-400 to-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {feedbackSending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Feedback
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Task Workspace Modal */}
      {/* Hub Tutorial Dialog */}
      {showTutorialDialog === 'hub' && (() => {
          const userGrade = user?.grade ? parseInt(user.grade) : 0;
          const tutorialUrl = userGrade >= 11 ? 'https://outlook.office.com/book/Grade1112Tutorials@na.oneschoolglobal.com/?ismsaljsauthenabled'
            : userGrade >= 9 ? 'https://outlook.office.com/book/Grade910TutorialsCopy@na.oneschoolglobal.com/?ismsaljsauthenabled'
            : 'https://outlook.office.com/book/Grade9TutorialsCopy@na.oneschoolglobal.com/?ismsaljsauthenabled';
          const dayNames = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
          const range = accountSetup.presentPeriods || '2-6';
          const [pStart, pEnd] = range.split('-').map(Number);
          const periodOptions = Array.from({ length: pEnd - pStart + 1 }, (_, i) => pStart + i);
          const canSave = tutorialDate && tutorialPeriod;
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Book a Tutorial</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Book a meeting with your teacher</p>
                  </div>
                  <button onClick={() => setShowTutorialDialog(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <iframe src={tutorialUrl} className="w-full h-[380px] border-0" title="Book a Tutorial" />
                </div>
                <div className="p-5 border-t border-gray-100 space-y-3 flex-shrink-0">
                  <p className="text-xs text-gray-500">Once booked, fill in your tutorial details:</p>
                  <div className="flex gap-3">
                    <input type="date" value={tutorialDate} onChange={e => setTutorialDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                      placeholder="Date *" />
                    <select value={tutorialPeriod} onChange={e => setTutorialPeriod(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent">
                      <option value="">Period *</option>
                      {periodOptions.map(p => <option key={p} value={p}>Period {p}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <input type="text" value={tutorialZoom} onChange={e => setTutorialZoom(e.target.value)}
                      placeholder="Zoom number (optional)" maxLength={20}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                    <input type="text" value={tutorialTopic} onChange={e => setTutorialTopic(e.target.value)}
                      placeholder="Topic (optional, max 60 chars)" maxLength={60}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowTutorialDialog(null)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Close</button>
                    <button
                      onClick={() => saveTutorial({ date: tutorialDate, period: parseInt(tutorialPeriod), zoomNumber: tutorialZoom, topic: tutorialTopic })}
                      disabled={!canSave || isSavingTutorial}
                      className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {isSavingTutorial
                        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</>
                        : 'Save Tutorial'}
                    </button>
                  </div>
                  {!canSave && (tutorialZoom || tutorialTopic) && (
                    <p className="text-xs text-red-400 text-center">Please select a Date and Period to save.</p>
                  )}
                </div>
              </div>
            </div>
          );
      })()}

      {/* Add Task Dialog */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Add a Task</h3>
              <button onClick={() => setShowAddTask(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-400">*</span></label>
                <input type="text" value={addTaskForm.title}
                  onChange={e => setAddTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Task title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-red-400">*</span></label>
                  <input type="date" value={addTaskForm.deadlineDate}
                    onChange={e => setAddTaskForm(prev => ({ ...prev, deadlineDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Time <span className="text-red-400">*</span></label>
                  <input type="time" value={addTaskForm.deadlineTime}
                    onChange={e => setAddTaskForm(prev => ({ ...prev, deadlineTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Time (minutes) <span className="text-red-400">*</span>
                  <span className="text-gray-400 font-normal ml-1">(5–300)</span>
                </label>
                <input type="number" min="5" max="300" value={addTaskForm.estimatedTime}
                  onChange={e => setAddTaskForm(prev => ({ ...prev, estimatedTime: e.target.value }))}
                  placeholder="e.g. 45"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea value={addTaskForm.description}
                  onChange={e => setAddTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Any notes or context..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="url" value={addTaskForm.url}
                  onChange={e => setAddTaskForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowAddTask(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={submitManualTask}
                disabled={!addTaskForm.title || !addTaskForm.deadlineDate || !addTaskForm.deadlineTime || !addTaskForm.estimatedTime || parseInt(addTaskForm.estimatedTime) < 5 || parseInt(addTaskForm.estimatedTime) > 300 || isSavingManualTask}
                className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSavingManualTask
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Adding...</>
                  : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWorkspace && workspaceTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-xl flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold">{cleanTaskTitle(workspaceTask)}</h2>
                <p className="text-sm text-purple-100">
                  <span className="mr-3">{extractClassName(workspaceTask)}</span>
                  <span>Due: {workspaceTask.dueDate
                    ? workspaceTask.dueDate.toLocaleDateString()
                    : workspaceTask.deadlineDateRaw
                      ? new Date(workspaceTask.deadlineDateRaw + 'T12:00:00').toLocaleDateString()
                      : '—'
                  }</span>
                </p>
              </div>
              <button
                onClick={closeWorkspace}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                Close Workspace
              </button>
            </div>
              
            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Main Content: Notes/Calculator OR Canvas Launcher */}
              <div className="flex-1 flex flex-col">
                
                {/* Tab selector */}
                <div className="flex border-b border-gray-200 overflow-x-auto">
                  {[
                    { key: 'canvas', label: '🎓 Canvas Task' },
                    { key: 'notes', label: '📝 Notes' },
                    { key: 'whiteboard', label: '🎨 Whiteboard' },
                    { key: 'tools', label: '🛠️ Tools' },
                    { key: 'integrations', label: '🔗 Integrations' },
                    { key: 'whitenoise', label: '🎵 Focus Sounds' },
                    { key: 'timer', label: '⏱️ Timer' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => switchWorkspaceTab(tab.key)}
                      className={`flex-shrink-0 py-3 px-4 font-semibold text-sm ${
                        workspaceTab === tab.key
                          ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                  
                {/* Tab content */}
                <div className="flex-1 overflow-hidden">

                  {/* ── Canvas Task ── */}
                  {workspaceTab === 'canvas' ? (
                    <div className="h-full w-full bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
                      <div className="text-center max-w-md w-full">
                        <div className="mb-4">
                          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                            <BookOpen className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Open Canvas Task</h2>
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                          Canvas requires authentication and cannot be embedded. Click below to open this task in a split-screen view.
                        </p>
                        <div className="bg-white rounded-lg p-3 mb-4 text-left shadow-sm border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">Current Task:</div>
                          <div className="font-semibold text-gray-800 text-sm">{workspaceTask.title}</div>
                          <div className="text-xs text-purple-600 mt-1">{workspaceTask.class}</div>
                        </div>
                        {workspaceTask.url ? (
                          <>
                            <button
                              onClick={() => openSplitScreen(workspaceTask.url)}
                              className="w-full bg-purple-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl mb-2 text-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12m-12 5h12M3 7h.01M3 12h.01M3 17h.01" />
                              </svg>
                              Open in Split-Screen
                            </button>
                            <button
                              onClick={() => window.open(workspaceTask.url, '_blank')}
                              className="w-full bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Open in New Tab
                            </button>
                            <div className="mt-4 text-xs text-gray-500 bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                              <strong className="text-blue-700">💡 Tip:</strong> Split-screen opens Canvas alongside PlanAssist. You may need to manually resize your windows to see both side-by-side.
                            </div>
                          </>
                        ) : (
                          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
                            <p className="text-red-700 font-medium text-sm">No Canvas URL available</p>
                            <p className="text-red-600 text-xs mt-1">This task doesn't have a Canvas link.</p>
                          </div>
                        )}
                      </div>
                    </div>

                  ) : workspaceTab === 'notes' ? (
                    <div className="h-full flex flex-col p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-700">Your Notes</h3>
                        <button
                          onClick={saveTaskNotes}
                          disabled={savingNotes}
                          className="bg-purple-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          {savingNotes ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Saving...</>
                          ) : (
                            <><Save className="w-4 h-4" />Save</>
                          )}
                        </button>
                      </div>
                      <textarea
                        value={workspaceNotes}
                        onChange={(e) => setWorkspaceNotes(e.target.value)}
                        placeholder="Type your notes here... bullet points, reminders, key concepts, etc."
                        className="flex-1 w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                  ) : workspaceTab === 'whiteboard' ? (
                    <div className="h-full flex flex-col p-4">
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Color:</label>
                          <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)}
                            className="w-10 h-8 rounded cursor-pointer border border-gray-300" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Size:</label>
                          <input type="range" min="1" max="20" value={drawWidth}
                            onChange={(e) => setDrawWidth(parseInt(e.target.value))} className="w-24" />
                          <span className="text-sm text-gray-600 w-6">{drawWidth}</span>
                        </div>
                        <button onClick={clearWhiteboard}
                          className="ml-auto bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-red-700">
                          Clear
                        </button>
                      </div>
                      <canvas
                        ref={whiteboardRef}
                        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                        className="flex-1 w-full border-2 border-gray-300 rounded-lg cursor-crosshair bg-white"
                        style={{ touchAction: 'none', minHeight: '400px' }}
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center">Draw directly on the canvas • Great for diagrams, math problems, and brainstorming</p>
                    </div>

                  ) : workspaceTab === 'tools' ? (
                    <div className="h-full flex flex-col">
                      {/* Active tool embed */}
                      {workspaceToolEmbed ? (
                        <div className="h-full flex flex-col">
                          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
                            <span className="text-sm font-semibold text-gray-700">
                              {workspaceToolEmbed === 'calculator' ? '🔢 TI-84 Calculator' : '📈 Desmos Graphing Calculator'}
                            </span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setWorkspaceEmbedZoom(z => Math.max(0.5, parseFloat((z - 0.1).toFixed(1))))}
                                className="px-2 py-1 rounded text-gray-500 hover:bg-gray-200 text-sm font-bold leading-none" title="Zoom out">−</button>
                              <span className="text-xs text-gray-500 w-10 text-center">{Math.round(workspaceEmbedZoom * 100)}%</span>
                              <button onClick={() => setWorkspaceEmbedZoom(z => Math.min(2.0, parseFloat((z + 0.1).toFixed(1))))}
                                className="px-2 py-1 rounded text-gray-500 hover:bg-gray-200 text-sm font-bold leading-none" title="Zoom in">+</button>
                              <button onClick={() => setWorkspaceEmbedZoom(1.0)}
                                className="px-2 py-1 rounded text-xs text-gray-400 hover:bg-gray-200" title="Reset zoom">Reset</button>
                              <button
                                onClick={() => { setWorkspaceToolEmbed(null); setWorkspaceEmbedZoom(1.0); }}
                                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors ml-1"
                                title="Back to Tools"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 overflow-auto">
                            <div style={{ transform: `scale(${workspaceEmbedZoom})`, transformOrigin: 'top left', width: `${100 / workspaceEmbedZoom}%`, height: `${100 / workspaceEmbedZoom}%` }}>
                            {workspaceToolEmbed === 'calculator' ? (
                              <iframe
                                src="https://ti84calculator.us/"
                                height="100%" width="100%"
                                frameBorder="0"
                                sandbox="allow-scripts allow-same-origin allow-forms allow-storage-access-by-user-activation"
                                allow="storage-access"
                                className="w-full h-full"
                                style={{ minHeight: '600px' }}
                                title="TI-84 Calculator"
                              />
                            ) : (
                              <iframe
                                src={`https://www.desmos.com/calculator`}
                                height="100%" width="100%"
                                frameBorder="0"
                                sandbox="allow-scripts allow-same-origin allow-forms allow-storage-access-by-user-activation allow-popups"
                                allow="storage-access"
                                className="w-full h-full"
                                style={{ minHeight: '600px' }}
                                title="Desmos Graphing Calculator"
                              />
                            )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Tools button grid */
                        <div className="flex-1 overflow-y-auto p-6">
                          <div className="mb-5">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">🛠️ Tools</h3>
                            <p className="text-sm text-gray-500">Open a tool to use it inline in the workspace.</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={() => setWorkspaceToolEmbed('calculator')}
                              className="flex flex-col items-center gap-3 p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-md transition-all text-left"
                            >
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">🔢</div>
                              <div>
                                <div className="font-semibold text-gray-800 text-sm">TI-84 Calculator</div>
                                <div className="text-xs text-gray-500 mt-0.5">Scientific & graphing calculator</div>
                              </div>
                            </button>
                            <button
                              onClick={() => setWorkspaceToolEmbed('desmos')}
                              className="flex flex-col items-center gap-3 p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-md transition-all text-left"
                            >
                              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">📈</div>
                              <div>
                                <div className="font-semibold text-gray-800 text-sm">Desmos</div>
                                <div className="text-xs text-gray-500 mt-0.5">Graphing calculator</div>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  ) : workspaceTab === 'integrations' ? (
                    (() => {
                      // inline: loads directly in workspace iframe, no popup
                      // window: opens in a separate browser window, tab stays on grid
                      const integrations = [
                        { key: 'kami',        label: 'Kami',        emoji: '📄', desc: 'PDF annotation tool',         url: 'https://web.kamihq.com/web/viewer.html',                          mode: 'inline' },
                        { key: 'masteryprep', label: 'MasteryPrep', emoji: '🎯', desc: 'ACT/SAT prep',                url: 'https://app.masteryprep.com/login',                               mode: 'inline' },
                        { key: 'gmetrix',     label: 'GMetrix',     emoji: '💻', desc: 'IT certification practice',   url: 'https://www.gmetrix.net/Login.aspx?',                             mode: 'inline' },
                        { key: 'gizmos',      label: 'Gizmos',      emoji: '🔬', desc: 'Science & math simulations',  url: 'https://apps.explorelearning.com/account/gizmos/login/student',   mode: 'window' },
                        { key: 'ixl',         label: 'IXL',         emoji: '✏️', desc: 'Practice & assessments',      url: 'https://www.ixl.com/signin/osg/form',                             mode: 'window' },
                        { key: 'cengage',     label: 'Cengage',     emoji: '📚', desc: 'Digital textbooks',           url: 'https://k12.cengage.com/rostering/Account/LogOn?',                mode: 'window' },
                        { key: 'noredink',    label: 'NoRedInk',    emoji: '🖊️', desc: 'Writing & grammar',           url: 'https://www.noredink.com/login',                                  mode: 'window' },
                      ];

                      const active = workspaceIntegrationEmbed
                        ? integrations.find(i => i.key === workspaceIntegrationEmbed)
                        : null;

                      const handleIntegrationClick = (integration) => {
                        if (integration.mode === 'window') {
                          // Open in separate window, leave tab on grid
                          window.open(integration.url, `planassist_integration_${integration.key}`,
                            'width=1100,height=800,left=100,top=80,resizable=yes,scrollbars=yes');
                        } else {
                          // Load inline in workspace
                          setWorkspaceIntegrationEmbed(integration.key);
                        }
                      };

                      return (
                        <div className="h-full flex flex-col">
                          {active ? (
                            /* ── Inline embed view ── */
                            <div className="h-full flex flex-col">
                              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{active.emoji}</span>
                                  <span className="text-sm font-semibold text-gray-700">{active.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setWorkspaceEmbedZoom(z => Math.max(0.5, parseFloat((z - 0.1).toFixed(1))))}
                                    className="px-2 py-1 rounded text-gray-500 hover:bg-gray-200 text-sm font-bold leading-none" title="Zoom out">−</button>
                                  <span className="text-xs text-gray-500 w-10 text-center">{Math.round(workspaceEmbedZoom * 100)}%</span>
                                  <button onClick={() => setWorkspaceEmbedZoom(z => Math.min(2.0, parseFloat((z + 0.1).toFixed(1))))}
                                    className="px-2 py-1 rounded text-gray-500 hover:bg-gray-200 text-sm font-bold leading-none" title="Zoom in">+</button>
                                  <button onClick={() => setWorkspaceEmbedZoom(1.0)}
                                    className="px-2 py-1 rounded text-xs text-gray-400 hover:bg-gray-200" title="Reset zoom">Reset</button>
                                  <button
                                    onClick={() => { setWorkspaceIntegrationEmbed(null); setWorkspaceEmbedZoom(1.0); }}
                                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors ml-1"
                                    title="Back to Integrations"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex-1 overflow-auto">
                                <div style={{ transform: `scale(${workspaceEmbedZoom})`, transformOrigin: 'top left', width: `${100 / workspaceEmbedZoom}%`, height: `${100 / workspaceEmbedZoom}%` }}>
                                <iframe
                                  key={workspaceIntegrationEmbed}
                                  src={active.url}
                                  height="100%" width="100%"
                                  frameBorder="0"
                                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation"
                                  allow="storage-access"
                                  className="w-full h-full"
                                  style={{ minHeight: '600px' }}
                                  title={active.label}
                                />
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* ── Button grid ── */
                            <div className="flex-1 overflow-y-auto p-6">
                              <div className="mb-5">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">🔗 Integrations</h3>
                                <p className="text-sm text-gray-500">Click a service to open it.</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                {integrations.map(integration => (
                                  <button
                                    key={integration.key}
                                    onClick={() => handleIntegrationClick(integration)}
                                    className="flex flex-col items-center gap-3 p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-md transition-all text-left"
                                  >
                                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl">{integration.emoji}</div>
                                    <div>
                                      <div className="font-semibold text-gray-800 text-sm">{integration.label}</div>
                                      <div className="text-xs text-gray-500 mt-0.5">{integration.desc}</div>
                                    </div>
                                    {integration.mode === 'window' && (
                                      <div className="text-xs text-purple-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Opens in window
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-gray-400 mt-5 text-center">Sign-in info is saved in your browser cookies where supported.</p>
                            </div>
                          )}
                        </div>
                      );
                    })()

                  ) : workspaceTab === 'whitenoise' ? (
                    <div className="h-full flex flex-col p-6 items-center justify-center">
                      <div className="max-w-md w-full space-y-6">
                        <div className="text-center mb-6">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">Focus Sounds</h3>
                          <p className="text-sm text-gray-600">Play ambient sounds to help you concentrate</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'rain', label: '🌧️ Soft Rain', desc: 'Gentle pink noise' },
                            { id: 'ocean', label: '🌊 Deep Rumble', desc: 'Low frequency hum' },
                            { id: 'brown', label: '🎵 Brown Noise', desc: 'Deep, smooth tone' },
                            { id: 'pink', label: '💗 Pink Noise', desc: 'Balanced, calming' },
                            { id: 'whitenoise', label: '📻 White Noise', desc: 'Pure static' }
                          ].map(sound => (
                            <button
                              key={sound.id}
                              onClick={() => {
                                if (isWhiteNoisePlaying && whiteNoiseType === sound.id) {
                                  toggleWhiteNoise();
                                } else {
                                  playWhiteNoise(sound.id);
                                }
                              }}
                              className={`p-4 rounded-lg border-2 text-left transition-all ${
                                whiteNoiseType === sound.id && isWhiteNoisePlaying
                                  ? 'bg-purple-50 border-purple-600 shadow-md'
                                  : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow'
                              }`}
                            >
                              <div className="font-semibold text-gray-900">{sound.label}</div>
                              <div className="text-xs text-gray-600 mt-1">{sound.desc}</div>
                            </button>
                          ))}
                        </div>
                        <div className="space-y-4 pt-4 border-t">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={toggleWhiteNoise}
                              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                                isWhiteNoisePlaying
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                              }`}
                            >
                              {isWhiteNoisePlaying ? '⏸ Pause' : '▶ Play'}
                            </button>
                          </div>
                          {isWhiteNoisePlaying && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Volume: {Math.round(whiteNoiseVolume * 100)}%
                              </label>
                              <input
                                type="range" min="0" max="1" step="0.1"
                                value={whiteNoiseVolume}
                                onChange={(e) => changeWhiteNoiseVolume(parseFloat(e.target.value))}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  ) : workspaceTab === 'timer' ? (
                    <div className="h-full flex flex-col p-6 items-center justify-center">
                      {workspaceSource === 'agenda' ? (
                        /* ── Agenda mode: read-only mirror of the agenda row countdown ── */
                        <div className="max-w-sm w-full text-center space-y-4">
                          <h3 className="text-2xl font-bold text-gray-900">⏱️ Row Timer</h3>
                          <p className="text-sm text-gray-500">This timer is synced with the current agenda row.</p>
                          <div className={`text-8xl font-bold tabular-nums mt-4 ${
                            agendaCountdown !== null && agendaCountdown <= 60 && agendaCountdown > 0
                              ? 'text-red-500'
                              : agendaCountdown === 0
                                ? 'text-gray-400'
                                : 'text-purple-600'
                          }`}>
                            {agendaCountdown !== null
                              ? `${String(Math.floor(agendaCountdown / 60)).padStart(2,'0')}:${String(agendaCountdown % 60).padStart(2,'0')}`
                              : '--:--'
                            }
                          </div>
                          {agendaCountdown === 0 && (
                            <p className="text-red-500 font-semibold text-sm animate-pulse">⏰ Time's up!</p>
                          )}
                          {!agendaRunning && agendaCountdown !== 0 && (
                            <p className="text-xs text-gray-400">Timer is paused — start it from the agenda view.</p>
                          )}
                        </div>
                      ) : (
                        /* ── Session mode: free settable timer ── */
                        <div className="max-w-sm w-full space-y-6">
                          <div className="text-center">
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">⏱️ Timer</h3>
                            <p className="text-sm text-gray-500">Set a custom countdown for your work session.</p>
                          </div>

                          {/* Time display */}
                          <div className="text-center">
                            <div className={`text-8xl font-bold tabular-nums ${
                              freeTimerDone ? 'text-green-500' :
                              freeTimerRunning && freeTimerSecs <= 60 ? 'text-red-500' :
                              freeTimerRunning ? 'text-purple-600' : 'text-gray-700'
                            }`}>
                              {freeTimerRunning || freeTimerSecs > 0
                                ? `${String(Math.floor(freeTimerSecs / 60)).padStart(2,'0')}:${String(freeTimerSecs % 60).padStart(2,'0')}`
                                : `${String(parseInt(freeTimerMins) || 0).padStart(2,'0')}:00`
                              }
                            </div>
                            {freeTimerDone && (
                              <p className="text-green-500 font-semibold text-sm mt-2 animate-pulse">✅ Time's up!</p>
                            )}
                          </div>

                          {/* Input — only shown when timer is not running */}
                          {!freeTimerRunning && !freeTimerDone && (
                            <div className="flex items-center gap-3 justify-center">
                              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Minutes:</label>
                              <input
                                type="number"
                                min="1" max="180"
                                value={freeTimerMins}
                                onChange={e => setFreeTimerMins(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="e.g. 25"
                                className="w-28 px-3 py-2 border-2 border-gray-300 rounded-lg text-center text-lg font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                            </div>
                          )}

                          {/* Controls */}
                          <div className="flex gap-3 justify-center">
                            {!freeTimerRunning && !freeTimerDone ? (
                              <button
                                onClick={startFreeTimer}
                                disabled={!freeTimerMins || parseInt(freeTimerMins) < 1}
                                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all"
                              >
                                ▶ Start
                              </button>
                            ) : (
                              <button
                                onClick={resetFreeTimer}
                                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all"
                              >
                                🔄 Reset
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-gray-400 text-center">This timer is independent from your session timer.</p>
                        </div>
                      )}
                    </div>

                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanAssist;
