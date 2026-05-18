// PlanAssist - OneSchool Global Study Planner Frontend (ENHANCED)
// App.jsx - PART 1: Imports and State

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Play, Check, Settings, BarChart3, List, Home, LogOut, BookOpen, Brain, TrendingUp, AlertCircle, Upload, Save, Pause, X, Send, Lock, Unlock, Info, Edit2, FileText, Trophy, Zap, Target, Award, TrendingDown, Timer, RefreshCw, LayoutList, Trash2, Plus, ClipboardList, Shield, Ban, UserCheck, Search, Bell, ChevronDown, ChevronRight, Eye, AlertTriangle, HelpCircle, CheckCircle, UserCircle, MessageSquare } from 'lucide-react';

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

// ── GoalsPanel — standalone component to avoid Rules of Hooks violations ─────
const GoalsPanel = ({ courses, userGoals, setUserGoals, loadGoals, apiCall }) => {
  const goalCourses = courses.filter(c => c.grading_period_id != null && c.enabled !== false);

  const [localGoals, setLocalGoals] = useState(() => {
    const init = {};
    goalCourses.forEach(c => {
      init[String(c.course_id)] = userGoals[String(c.course_id)] != null ? String(userGoals[String(c.course_id)]) : '';
    });
    return init;
  });
  const [goalsSaving, setGoalsSaving] = useState(false);
  const [goalsDiscarding, setGoalsDiscarding] = useState(false);

  const hasExistingGoals = Object.keys(userGoals).length > 0;
  const allFilled = goalCourses.length > 0 && goalCourses.every(c => {
    const v = parseFloat(localGoals[String(c.course_id)]);
    return !isNaN(v) && v >= 45 && v <= 100;
  });

  const handleSetGoals = async () => {
    if (!allFilled) return;
    setGoalsSaving(true);
    try {
      const goals = {};
      goalCourses.forEach(c => { goals[String(c.course_id)] = parseFloat(localGoals[String(c.course_id)]); });
      await apiCall('/goals', 'POST', { goals });
      await loadGoals();
      alert('Goals saved!');
    } catch (e) {
      alert('Failed to save goals: ' + e.message);
    } finally {
      setGoalsSaving(false);
    }
  };

  const handleDiscardGoals = async () => {
    if (!window.confirm('This will remove all your academic goals and restore the Next Up bubble on the Hub. Are you sure?')) return;
    setGoalsDiscarding(true);
    try {
      await apiCall('/goals', 'DELETE');
      setUserGoals({});
      setLocalGoals(() => {
        const init = {};
        goalCourses.forEach(c => { init[String(c.course_id)] = ''; });
        return init;
      });
    } catch (e) {
      alert('Failed to discard goals: ' + e.message);
    } finally {
      setGoalsDiscarding(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-gray-900">Academic Goals</h2>
        {hasExistingGoals && (
          <button onClick={handleDiscardGoals} disabled={goalsDiscarding}
            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
            {goalsDiscarding ? 'Discarding...' : '✕ Discard Goals'}
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-6">Set a target percentage for each course. Goals power the Goal Snapshot on the Hub and progress markers on Marks.</p>

      {goalCourses.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No courses with an active grading period found.</p>
          <p className="text-sm mt-1">Sync Canvas to populate your courses.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {goalCourses.map(course => {
              const color = course.color || '#7c3aed';
              const courseIdStr = String(course.course_id);
              const val = localGoals[courseIdStr] ?? '';
              const num = parseFloat(val);
              const isValid = !isNaN(num) && num >= 45 && num <= 100;
              const isInvalid = val !== '' && !isValid;
              return (
                <div key={course.course_id}
                  className="w-48 rounded-2xl border-2 p-4 flex flex-col gap-3 shadow-sm transition-shadow hover:shadow-md"
                  style={{ borderColor: color + '55', background: color + '0a' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{course.name}</p>
                  </div>
                  {course.grading_period_title && (
                    <p className="text-xs text-gray-400 -mt-1">{course.grading_period_title}</p>
                  )}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Target %</label>
                    <div className="relative">
                      <input
                        type="number" min="45" max="100"
                        value={val}
                        onChange={e => setLocalGoals(prev => ({ ...prev, [courseIdStr]: e.target.value }))}
                        placeholder="e.g. 90"
                        className={`w-full px-3 py-2 border-2 rounded-xl text-sm font-bold text-center focus:outline-none focus:ring-2 ${
                          isInvalid
                            ? 'border-red-400 focus:ring-red-300 text-red-600'
                            : isValid
                            ? 'border-green-400 focus:ring-green-300 text-green-700'
                            : 'border-gray-200 focus:ring-purple-300 text-gray-800'
                        }`}
                      />
                      {isValid && <span className="absolute right-3 top-2 text-green-500 text-sm font-bold">%</span>}
                    </div>
                    {isInvalid && <p className="text-xs text-red-500 mt-1">Must be 45–100</p>}
                  </div>
                  {course.current_period_score != null && (
                    <div className="text-center">
                      <span className="text-xs text-gray-400">Current: </span>
                      <span className="text-xs font-bold text-gray-700">{parseFloat(course.current_period_score).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <button onClick={handleSetGoals}
              disabled={!allFilled || goalsSaving}
              className={`px-8 py-3 rounded-xl font-semibold text-white transition-all shadow-md ${
                allFilled && !goalsSaving
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}>
              {goalsSaving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : hasExistingGoals ? 'Update Goals' : 'Set Goals'}
            </button>
          </div>
          {!allFilled && (
            <p className="text-center text-xs text-gray-400 mt-3">All courses must have a valid goal (45–100) before saving.</p>
          )}
        </>
      )}
    </div>
  );
};

const PlanAssist = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState(null);   // deferred install event
  const [showPwaBanner, setShowPwaBanner] = useState(false);         // show install banner
  const [isAppLoading, setIsAppLoading] = useState(false);
  // calendarTasks removed - calendar now reads from `tasks` state directly
  const [calendarExpandedId, setCalendarExpandedId] = useState(null);
  const [token, setToken] = useState(null);
  const tokenRef = React.useRef(null); // Always-current token for use in intervals/callbacks
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
  const [adminFilter, setAdminFilter] = useState({ status: 'all', grade: 'all' });
  const [adminSort, setAdminSort] = useState('name_asc');
  const [adminSelectedUser, setAdminSelectedUser] = useState(null);
  const [adminUserDetail, setAdminUserDetail] = useState(null);
  const [adminDiagnostics, setAdminDiagnostics] = useState(null);
  const [adminAuditLog, setAdminAuditLog] = useState([]);
  const [adminFeedback, setAdminFeedback] = useState([]);
  const [adminSection, setAdminSection] = useState('users');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminAnnouncements, setAdminAnnouncements] = useState([]);
  const [newAnnouncementAudience, setNewAnnouncementAudience] = useState('all');
  const [newAnnouncementMsg, setNewAnnouncementMsg] = useState('');
  const [newAnnouncementType, setNewAnnouncementType] = useState('info');
  const [banReason, setBanReason] = useState('');
  const [showBanDialog, setShowBanDialog] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [adminHelpContent, setAdminHelpContent] = useState('');
  const [adminHelpSaving, setAdminHelpSaving] = useState(false);
  // Account page state
  const [accountTab, setAccountTab] = useState('settings');
  const [settingsSubTab, setSettingsSubTab] = useState('other');
  const [tokenDirty, setTokenDirty] = useState(false);
  const [resolvedTasks, setResolvedTasks] = useState([]);
  const [resolvedSearch, setResolvedSearch] = useState('');
  const [resolvedSort, setResolvedSort] = useState('created_at');
  const [resolvedLoading, setResolvedLoading] = useState(false);
  const [editingActualTime, setEditingActualTime] = useState(null);
  const [editingActualTimeVal, setEditingActualTimeVal] = useState('');
  const [activityFilter, setActivityFilter] = useState('grades');
  const [activitySearch, setActivitySearch] = useState('');
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
  const [syncType, setSyncType] = useState(null); // 'main' | 'background' | null
  const [syncStep, setSyncStep] = useState('');   // current step label for Main Sync overlay
  const [courseSyncLoading, setCourseSyncLoading] = useState(false); // Course Sync spinner
  const [gradeSyncLoading, setGradeSyncLoading] = useState(false);   // Grade Sync spinner
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(null);
  const [showSplitTask, setShowSplitTask] = useState(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionPriorities, setSessionPriorities] = useState(null); // null=not set today, []=empty, [...ids]=set
  const [sessionPrioritiesLoading, setSessionPrioritiesLoading] = useState(false);
  const [sessionPrioritiesPickerOpen, setSessionPrioritiesPickerOpen] = useState(false);
  const [sessionPickerSel, setSessionPickerSel] = useState([]); // selected task IDs in picker modal
  const [sessionDashView, setSessionDashView] = useState('timeline'); // 'timeline' | 'kanban' | 'focus'
  const [sessionStartingId, setSessionStartingId] = useState(null); // task ID currently being started
  const [splitSegments, setSplitSegments] = useState([{ name: 'Part 1', deadlineDate: '', deadlineTime: '' }]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [addSessionForm, setAddSessionForm] = useState({ period: '2' });
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [showTaskDescription, setShowTaskDescription] = useState(null);
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
  const [gradeImpact, setGradeImpact] = useState({}); // { task_id: 'Low'|'Moderate'|'High' }
  const [userGoals, setUserGoals] = useState({}); // { course_id: target_score }
  const [goalsLoaded, setGoalsLoaded] = useState(false);

  // UI theme
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem('planassist-theme') || 'system');
  const [showHubExplainer, setShowHubExplainer] = useState(false);
  const [zoomBanner, setZoomBanner] = useState(null); // { period, zoomNumber, isTutorial }
  const [lastAutoSync, setLastAutoSync] = useState(null);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(null); // ISO string from DB

  // Streak & shields
  const [streakShieldsAvailable, setStreakShieldsAvailable] = useState(0);
  const [streakShieldMode, setStreakShieldMode] = useState('manual');
  const [streakShieldLog, setStreakShieldLog] = useState([]); // dates shields were used
  const [streakShieldToast, setStreakShieldToast] = useState(null);

  // Insignia
  const [insigniaDays, setInsigniaDays] = useState(0);
  const [insigniaSelected, setInsigniaSelected] = useState('Default');
  const [insigniaUnlocked, setInsigniaUnlocked] = useState([]);
  const [insigniaNewUnlock, setInsigniaNewUnlock] = useState(null); // toast

  // Badges / Gallery
  const [userBadges, setUserBadges] = useState([]);

  // Break timer
  const [breakTimerActive, setBreakTimerActive] = useState(false);
  const [breakTimerSeconds, setBreakTimerSeconds] = useState(0);
  const [breakTimerTotal, setBreakTimerTotal] = useState(0);

  // Task list quick filters
  const [quickFilter, setQuickFilter] = useState(null); // 'today' | 'week' | 'overdue' | null

  // Undo state for task list checkbox
  const [undoCompleteTask, setUndoCompleteTask] = useState(null); // { taskId, title, timeout }

  // Completion animation
  const [completionAnim, setCompletionAnim] = useState(null); // { type: 'task'|'agenda', x, y }

  // Agenda finish animation
  const [agendaFinishAnim, setAgendaFinishAnim] = useState(false);

  // Streak pane
  const [streakPaneData, setStreakPaneData] = useState(null);
  const [streakLoading, setStreakLoading] = useState(false);
  const [insigniaLoading, setInsigniaLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [autoSyncToast, setAutoSyncToast] = useState(null); // '3 new tasks added'

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
    // Use tokenRef.current (always up-to-date) instead of token state (stale closure risk in intervals)
    const currentToken = tokenRef.current || token;
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (response.status === 401 || response.status === 403) {
      // JWT expired or invalid — session is dead. Show re-auth prompt.
      setSessionExpired(true);
      throw new Error('Session expired');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }
    return response.json();
  };
  
  // Check for existing session on mount — warm up server first to avoid cold-start failures
  // Keep tokenRef in sync with token state — avoids stale closure bugs in intervals
  useEffect(() => { tokenRef.current = token; }, [token]);
  // ── Break timer countdown ────────────────────────────────────────────────
  useEffect(() => {
    if (!breakTimerActive || breakTimerSeconds <= 0) {
      if (breakTimerActive && breakTimerSeconds <= 0) setBreakTimerActive(false);
      return;
    }
    const t = setTimeout(() => setBreakTimerSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [breakTimerActive, breakTimerSeconds]);

  // ── Completion animation auto-dismiss ───────────────────────────────────
  useEffect(() => {
    if (!completionAnim) return;
    const t = setTimeout(() => setCompletionAnim(null), 1400);
    return () => clearTimeout(t);
  }, [completionAnim]);

  // ── Agenda finish animation auto-dismiss ────────────────────────────────
  useEffect(() => {
    if (!agendaFinishAnim) return;
    const t = setTimeout(() => setAgendaFinishAnim(false), 3000);
    return () => clearTimeout(t);
  }, [agendaFinishAnim]);


  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const BLOCKED_PAGES = ['session-active', 'agenda-active'];
    // Detect if any dialog/modal is open: check for fixed z-50+ overlays or open state flags
    const isDialogOpen = () => {
      return showTaskDescription || showNotesPopup || showSplitTask ||
             sessionPrioritiesPickerOpen || showEnhanceDialog ||
             showHubExplainer || breakTimerActive ||
             document.querySelector('[data-modal-open]') !== null;
    };
    const handler = (e) => {
      // Don't fire inside input/textarea/select
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
      if (BLOCKED_PAGES.includes(currentPage)) return;
      if (isDialogOpen()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      const pageMap = {
        'c': 'calendar', 't': 'tasks', 'f': 'sessions',
        'a': 'agendas', 'i': 'itinerary', 'm': 'marks',
      };
      if (pageMap[key]) {
        e.preventDefault();
        if (!isLoadingTasks) setCurrentPage(pageMap[key]);
        return;
      }
      if (key === 's') { e.preventDefault(); setCurrentPage('account'); setAccountTab('settings'); return; }
      if (key === 'r') { e.preventDefault(); if (!isLoadingTasks) fetchCanvasTasks(); return; }
      if (key === 'h') { e.preventDefault(); if (!isLoadingTasks) setCurrentPage('hub'); return; }
      if (key === 'g') { e.preventDefault(); setCurrentPage('account'); setAccountTab('goals'); return; }
      if (key === 'u' && user?.isAdmin) { e.preventDefault(); setCurrentPage('admin'); setAdminTab('users'); return; }
      if (key === 'l') { e.preventDefault(); handleLogout(); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentPage, isLoadingTasks, showTaskDescription, showNotesPopup, showSplitTask,
      sessionPrioritiesPickerOpen, showEnhanceDialog, showHubExplainer, breakTimerActive, user]);



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
      // Ping the health endpoint first — if server is cold this waits for it to wake
      // before firing all the real data requests, avoiding a flood of 502 errors
      const warmUp = async () => {
        const MAX_WAIT = 35000; // 35s max — Render cold starts take up to 30s
        const POLL_INTERVAL = 2000;
        const start = Date.now();
        while (Date.now() - start < MAX_WAIT) {
          try {
            const resp = await fetch(`${API_URL.replace('/api', '')}/health`, { method: 'GET' });
            if (resp.ok) break; // server is ready
          } catch (e) { /* still waking */ }
          await new Promise(r => setTimeout(r, POLL_INTERVAL));
        }
      };
      warmUp().then(() => {
        loadUserData(savedToken).finally(() => setIsAppLoading(false));
        loadAnnouncements(savedToken);
      });
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
        if (setupData.lastSync) {
          setLastSyncTimestamp(setupData.lastSync);
        }
        
        // Update user object with grade + isAdmin + showInFeed (merge, don't clobber prior setUser)
        setUser(prev => {
          const merged = {
            ...(prev || {}),
            grade: setupData.grade,
            isAdmin: setupData.is_admin || false,
            showInFeed: setupData.showInFeed !== false
          };
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

      if (Array.isArray(tasksData) && tasksData.length > 0) {
        setTasks(tasksData.map(hydrateTask));
      }




      const historyData = await fetch(`${API_URL}/learning`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).then(r => r.json());

      if (Array.isArray(historyData)) {
        setCompletionHistory(historyData.map(h => ({
          taskTitle: h.task_title,
          type: h.task_type,
          estimatedTime: h.estimated_time,
          actualTime: h.actual_time,
          date: new Date(h.completed_at)
        })));
      }

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


  // ── Hydrate a raw task row from the API into frontend shape ─────────────
  const hydrateTask = (t) => {
    let dueDate;
    let hasSpecificTime = false;
    if (t.deadline_date) {
      let dateString = t.deadline_date;
      if (typeof dateString !== 'string') dateString = new Date(dateString).toISOString();
      const datePart = dateString.split('T')[0];
      if (t.deadline_time !== null && t.deadline_time !== undefined) {
        dueDate = new Date(`${datePart}T${t.deadline_time}Z`);
        hasSpecificTime = true;
      } else {
        dueDate = new Date(`${datePart}T23:59:00`);
      }
    } else if (t.deadline) {
      dueDate = new Date(t.deadline);
      hasSpecificTime = true;
    } else {
      dueDate = new Date();
    }
    return {
      id: t.id, title: t.title, segment: t.segment, class: t.class,
      description: t.description, url: t.url, dueDate, hasSpecificTime,
      estimatedTime: t.estimated_time, userEstimate: t.user_estimated_time,
      accumulatedTime: t.accumulated_time || 0,
      completed: t.completed, deleted: t.deleted || false,
      submittedAt: t.submitted_at || null, assignmentId: t.assignment_id || null,
      course_id: t.course_id || null, manuallyCreated: t.manually_created || false,
      deadlineDateRaw: t.deadline_date
        ? (typeof t.deadline_date === 'string' ? t.deadline_date.split('T')[0] : new Date(t.deadline_date).toISOString().split('T')[0])
        : null
    };
  };

  // Load tasks from API
  const loadTasks = async () => {
    try {
      const tasksData = await apiCall('/tasks', 'GET');
      if (Array.isArray(tasksData)) {
        setTasks(tasksData.map(hydrateTask));
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  // Auth handlers
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
      tokenRef.current = data.token; // Immediately sync ref — don't wait for effect
      setSessionExpired(false);      // Clear any prior expiry state before loading
      setUser({ ...data.user, isAdmin: data.user.isAdmin || false });
      setIsAuthenticated(true);
      setAccountSetup(prev => ({ ...prev, name: data.user.name }));
      if (data.user.isNewUser) {
        setCurrentPage('account');
        setAccountTab('initial-setup');
      } else {
        // Load user data (tasks, history, settings) while login loading state is still active
        await loadUserData(data.token);
        loadAnnouncements(data.token);

        // Login-time sync: run before showing Hub so user sees fresh data immediately.
        // authLoading stays TRUE throughout — the login button keeps its loading state
        // until sync completes and Hub is fully ready.
        // Only run if user has a Canvas token (setupData.canvasApiToken is returned by loadUserData
        // and stored in accountSetup state — but since React state may not have updated yet,
        // re-fetch account/setup directly to read last_sync and canvasApiToken reliably).
        try {
          const setupCheck = await apiCall('/account/setup', 'GET');
          if (setupCheck?.canvasApiToken) {
            const lastSync = setupCheck.lastSync ? new Date(setupCheck.lastSync) : null;
            const now = new Date();
            const isStale = !lastSync || (now - lastSync) >= 14 * 24 * 60 * 60 * 1000;
            if (isStale) {
              console.log('[LOGIN SYNC] last_sync null or 14+ days — running Main Sync');
              await fetchCanvasTasks({ silent: true });
            } else {
              console.log('[LOGIN SYNC] last_sync recent — running Background Sync');
              await runBackgroundSync();
            }
          } else {
            console.log('[LOGIN SYNC] No Canvas token — skipping sync');
          }
        } catch (err) {
          console.warn('[LOGIN SYNC] Sync check failed:', err.message);
        }

        // Only navigate to Hub after sync is fully done
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
      tokenRef.current = data.token;
      setSessionExpired(false);
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
    tokenRef.current = null;
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

  // ── Account page functions ────────────────────────────────────────────────
  // Auto-save a single setting field immediately (no token — that needs explicit Confirm)
  const autoSaveSetting = async (patch) => {
    try {
      const merged = { ...accountSetup, ...patch };
      await apiCall('/account/setup', 'POST', {
        grade: merged.grade,
        presentPeriods: merged.presentPeriods,
        schedule: merged.schedule,
        calendarShowHomeroom: merged.calendarShowHomeroom,
        calendarShowCompleted: merged.calendarShowCompleted,
        calendarShowPrevWeek: merged.calendarShowPrevWeek,
        calendarShowCurrentWeek: merged.calendarShowCurrentWeek,
        calendarShowNextWeek1: merged.calendarShowNextWeek1,
        calendarShowNextWeek2: merged.calendarShowNextWeek2,
        calendarShowWeekends: merged.calendarShowWeekends,
      });
      if (patch.grade !== undefined) {
        const updatedUser = { ...user, grade: patch.grade };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) { console.error('autoSaveSetting failed:', err.message); }
  };
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
      setCurrentPage('tasks');
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

  // runGradeMiniSync removed — replaced by runGradeSync (POST /canvas/grade-sync)

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

  // OSG GPA scale: score → GPA points
  const scoreToGPA = (score) => {
    if (score == null) return null;
    const s = parseFloat(score);
    if (isNaN(s)) return null;
    if (s >= 93) return 4.00;
    if (s >= 90) return 3.67;
    if (s >= 88) return 3.33;
    if (s >= 83) return 3.00;
    if (s >= 80) return 2.67;
    if (s >= 78) return 2.33;
    if (s >= 73) return 2.00;
    if (s >= 70) return 1.67;
    if (s >= 60) return 1.00;
    return 0.00;
  };

  const calculateGPA = (courseList) => {
    const valid = courseList.filter(c => {
      const s = c.current_period_score;
      if (s == null || s === '') return false;
      const n = parseFloat(s);
      return !isNaN(n);
    });
    if (valid.length === 0) return null;
    const sum = valid.reduce((acc, c) => acc + scoreToGPA(parseFloat(c.current_period_score)), 0);
    return (sum / valid.length).toFixed(2);
  };

  const calculateYearAverage = (courseList) => {
    const valid = courseList.filter(c => {
      const s = c.current_score;
      if (s == null || s === '') return false;
      const n = parseFloat(s);
      return !isNaN(n);
    });
    if (valid.length === 0) return null;
    const sum = valid.reduce((acc, c) => acc + parseFloat(c.current_score), 0);
    return (sum / valid.length).toFixed(1);
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
    setActivitySearch('');
    if (tab === 'grades') {
      setActivityFilter('grades');
      // Trigger Grade Sync (shows spinner over Activity pane) then load supporting data
      runGradeSync();
      loadCanvasAnnouncements();
      loadCanvasDiscussions();
      loadActivityStream();
      // 5-min polling for activity stream while tab is open
      const actInterval = setInterval(loadActivityStream, 300000);
      setActivityPollingRef(prev => { if (prev) clearInterval(prev); return actInterval; });
    } else {
      setActivityPollingRef(prev => { if (prev) clearInterval(prev); return null; });
      setGradeMiniSyncRef(prev => { if (prev) clearInterval(prev); return null; });
    }
    if (tab === 'goals') runCourseSync(true, false); // Course Sync with session_active clear + spinner
    if (tab === 'streak') {
      // Load both concurrently. Auto-consume (if mode=automatic) is triggered by the
      // useEffect watching [completionHistory, streakShieldLog, streakShieldMode].
      Promise.all([loadStreakData(), loadCompletionHistory()]);
    }
    if (tab === 'feedlabel') loadInsignia();
    if (tab === 'gallery') { loadBadges(); checkNewUnlocks(computeStreak(
      [...new Set(completionHistory.map(h => h.localDate || (h.date instanceof Date
        ? `${h.date.getFullYear()}-${String(h.date.getMonth()+1).padStart(2,'0')}-${String(h.date.getDate()).padStart(2,'0')}`
        : String(h.date).slice(0,10))).filter(Boolean))],
      streakShieldLog
    )); }
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
      
      const parsedTaskObjs = parsedTasks.map((t, idx) => ({
        id: Date.now() + idx,
        title: t.title,
        description: t.description,
        dueDate: new Date(t.dueDate),
        estimatedTime: 20,
        userEstimate: null,
        completed: false,
        type: detectTaskType(t.title),
      }));
      
      const filteredNewTasks = parsedTaskObjs.filter(newTask => {
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
      
      alert(`Loaded ${filteredNewTasks.length} tasks from file!`);
    } catch (error) {
      alert('Failed to parse calendar file: ' + error.message);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // ── MAIN SYNC ────────────────────────────────────────────────────────────
  const startBreakTimer = (sessionDurationSeconds) => {
    // Suggest break duration based on session length, max 15 min
    const mins = Math.max(1, Math.min(15, Math.round(sessionDurationSeconds / 60 / 5)));
    setBreakTimerSeconds(mins * 60);
    setBreakTimerTotal(mins * 60);
    setBreakTimerActive(true);
  };

  const triggerCompletionAnim = (type = 'task') => {
    setCompletionAnim({ type });
    if (type === 'agenda') {
      setTimeout(() => setAgendaFinishAnim(true), 200);
    }
  };

  const fetchCanvasTasks = async ({ silent = false } = {}) => {
    if (!accountSetup.canvasApiToken) {
      alert('Please enter your Canvas API Token first');
      return;
    }
    setSyncType('main');
    setIsLoadingTasks(true);
    setSyncStep('Fetching assignments from Canvas…');
    try {
      const data = await apiCall('/canvas/sync', 'POST', {});
      if (!data || !Array.isArray(data.tasks)) {
        throw new Error('Canvas sync returned unexpected data. Please try again.');
      }
      setSyncStep(`Processing ${data.tasks.length} assignments…`);
      const formattedTasks = data.tasks.map(t => ({
        title: t.title, segment: t.segment, class: t.class,
        description: t.description, url: t.url,
        deadlineDate: t.deadlineDate, deadlineTime: t.deadlineTime,
        estimatedTime: t.estimatedTime,
        courseId: t.courseId ?? null, assignmentId: t.assignmentId ?? null,
        pointsPossible: t.pointsPossible ?? null, assignmentGroupId: t.assignmentGroupId ?? null,
        currentScore: t.currentScore ?? null, currentGrade: t.currentGrade ?? null,
        gradingType: t.gradingType ?? 'points',
        unlockAt: t.unlockAt ?? null, lockAt: t.lockAt ?? null,
        submittedAt: t.submittedAt ?? null,
        isMissing: t.isMissing ?? false, isLate: t.isLate ?? false,
        completed: t.completed ?? false,
      }));
      setSyncStep('Saving to PlanAssist…');
      const saveResult = await apiCall('/tasks/sync-save', 'POST', { tasks: formattedTasks, partial: false, syncType: 'main' });
      if (!saveResult?.stats) throw new Error('Failed to save synced tasks. Please try again.');
      setSyncStep('Done! Loading your plan…');
      await loadTasks();
      const { updated, new: newCount, cleaned } = saveResult.stats;
      let msg = `Sync complete! ${updated} tasks updated`;
      if (newCount > 0) msg += `, ${newCount} new`;
      if (cleaned > 0) msg += `, ${cleaned} past-due removed`;
      if (!silent) alert(msg + '.');
    } catch (error) {
      console.error('Main sync failed:', error);
      let msg = 'Sync failed.';
      if (error.message?.includes('401') || error.message?.includes('invalid or expired')) {
        msg = 'Canvas API token is invalid or expired. Please update your token in Settings.';
      } else if (error.message) {
        msg = 'Sync failed: ' + error.message;
      }
      if (!silent) alert(msg);
    } finally {
      setIsLoadingTasks(false);
      setSyncType(null);
      setSyncStep('');
    }
  };

  // ── BACKGROUND SYNC ───────────────────────────────────────────────────────
  const runBackgroundSync = async () => {
    try {
      setSyncType('background');
      const data = await apiCall('/canvas/background-sync', 'POST', {});
      if (!data || !data.shouldSync === false) {
        // shouldSync:false returned — no token, skip silently
        if (data?.shouldSync === false) { setSyncType(null); return; }
      }
      if (!Array.isArray(data.tasks)) { setSyncType(null); return; }
      if (data.tasks.length === 0) { setSyncType(null); return; }
      const formattedTasks = data.tasks.map(t => ({
        title: t.title, segment: t.segment, class: t.class,
        description: t.description, url: t.url,
        deadlineDate: t.deadlineDate, deadlineTime: t.deadlineTime,
        estimatedTime: t.estimatedTime,
        courseId: t.courseId ?? null, assignmentId: t.assignmentId ?? null,
        pointsPossible: t.pointsPossible ?? null, assignmentGroupId: t.assignmentGroupId ?? null,
        currentScore: t.currentScore ?? null, currentGrade: t.currentGrade ?? null,
        gradingType: t.gradingType ?? 'points',
        unlockAt: t.unlockAt ?? null, lockAt: t.lockAt ?? null,
        submittedAt: t.submittedAt ?? null,
        isMissing: t.isMissing ?? false, isLate: t.isLate ?? false,
        completed: t.completed ?? false,
      }));
      const saveResult = await apiCall('/tasks/sync-save', 'POST', { tasks: formattedTasks, partial: true, syncType: 'background' });
      if (saveResult?.stats) {
        const { new: newCount } = saveResult.stats;
        await loadTasks();
        if (newCount > 0) {
          setAutoSyncToast(`Background sync: ${newCount} new task${newCount !== 1 ? 's' : ''} added`);
          setTimeout(() => setAutoSyncToast(null), 4000);
        }
      }
    } catch (err) {
      console.error('[Background Sync] Failed:', err.message);
    } finally {
      setSyncType(null);
    }
  };

  // ── COURSE SYNC ───────────────────────────────────────────────────────────
  // clearSessionActive=true for Marks/Goals triggers; false for silent 60-min interval
  const runCourseSync = async (clearSessionActive = false, silent = false) => {
    if (!silent) setCourseSyncLoading(true);
    try {
      await apiCall('/canvas/course-sync', 'POST', { clearSessionActive });
      await loadCourses();
    } catch (err) {
      console.error('[Course Sync] Failed:', err.message);
    } finally {
      if (!silent) setCourseSyncLoading(false);
    }
  };

  // ── GRADE SYNC ────────────────────────────────────────────────────────────
  const runGradeSync = async () => {
    setGradeSyncLoading(true);
    try {
      await apiCall('/canvas/grade-sync', 'POST', {});
      await loadCanvasGrades();
    } catch (err) {
      console.error('[Grade Sync] Failed:', err.message);
    } finally {
      setGradeSyncLoading(false);
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
      if (!Array.isArray(data)) return;
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
          accumulatedTime: (t.accumulated_time || 0) * 60,
          sessionActive: t.session_active || false,
          assignmentId: t.assignment_id || null,
          course_id: t.course_id || null,
          manuallyCreated: t.manually_created || false,
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
    setSessionStartingId(task.id);
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
    } finally {
      setSessionStartingId(null);
    }
  };

  const pauseTaskSession = async () => {
    if (!currentSessionTask) return;
    setSavingSession(true);
    try {
      // Snap elapsed from wall clock if timer is currently running
      let snappedElapsed = sessionElapsed;
      if (isTimerRunning && timerStartWallRef.current !== null) {
        const wallElapsed = Math.floor((Date.now() - timerStartWallRef.current) / 1000);
        snappedElapsed = timerBaseElapsedRef.current + wallElapsed;
      }
      // /end clears session_active; user is leaving the session screen
      await apiCall(`/sessions/end/${currentSessionTask.id}`, 'POST', {
        accumulatedTime: Math.round(snappedElapsed / 60) // DB stores minutes
      });
      setIsTimerRunning(false);
      const newAccumMins = Math.round(snappedElapsed / 60);
      const updated = { ...currentSessionTask, accumulatedTime: snappedElapsed, sessionActive: false };
      setSessionTasks(prev => prev.map(t => t.id === currentSessionTask.id ? updated : t));
      // Also update the Task List tasks state so Start → Resume is immediate
      setTasks(prev => prev.map(t =>
        t.id === currentSessionTask.id
          ? { ...t, accumulatedTime: newAccumMins }
          : t
      ));
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
      // Check if Canvas has also marked this task completed (for leaderboard)
      let canvasCompleted = false;
      try {
        if (currentSessionTask.assignmentId && currentSessionTask.course_id) {
          const canvasCheck = await apiCall(`/canvas/check-completed/${currentSessionTask.id}`, 'GET');
          canvasCompleted = canvasCheck?.completed === true;
        }
      } catch (e) { /* silent — leaderboard just won't update */ }
      await apiCall(`/tasks/${currentSessionTask.id}/complete`, 'POST', {
        timeSpent: Math.round(sessionElapsed / 60),
        canvasCompleted
      });
      setIsTimerRunning(false);
      setSessionTasks(prev => prev.filter(t => t.id !== currentSessionTask.id));
      setTasks(prev => prev.map(t =>
        t.id === currentSessionTask.id
          ? { ...t, completed: true, deleted: true }
          : t
      ));
      triggerCompletionAnim('task');
      startBreakTimer(sessionElapsed); // sessionElapsed is in seconds
      setShowSessionComplete({ task: currentSessionTask, timeSpent: sessionElapsed }); // seconds
      // Don't null currentSessionTask yet — completion screen still needs it
      // It gets cleared when user clicks "Back to Focus" 
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
      const segments = splitSegments.map(seg => ({
        name: seg.name,
        deadlineDate: seg.deadlineDate || null,
        deadlineTime: seg.deadlineTime || null,
      }));
      const result = await apiCall(`/tasks/${taskId}/split`, 'POST', { segments: segments.map(s => s.name) });
      if (result.success) {
        // Apply individual segment deadlines if provided
        for (let i = 0; i < result.segments.length; i++) {
          const seg = segments[i];
          if (seg.deadlineDate && result.segments[i]) {
            await apiCall(`/tasks/${result.segments[i].id}/segment-deadline`, 'PATCH', {
              deadlineDate: seg.deadlineDate,
              deadlineTime: seg.deadlineTime || null,
            }).catch(() => {}); // non-fatal
          }
        }
        await loadTasks();
        setShowSplitTask(null);
        setSplitSegments([{ name: 'Part 1', deadlineDate: '', deadlineTime: '' }]);
      }
    } catch (error) {
      console.error('Error splitting task:', error);
      alert('Error splitting task: ' + error.message);
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
    // Mark the current row's task as session_active
    if (rowData?.taskId) {
      apiCall(`/sessions/agenda-start/${rowData.taskId}`, 'POST').catch(() => {});
    }
    setCurrentPage('agenda-active');
  };

  const agendaSaveAndExit = async () => {
    const { snappedElapsed, snappedCountdown } = agendaStopTimer();
    const row = (currentAgenda.rows || [])[agendaCurrentRow];
    // Clear session_active for current row's task
    if (row?.taskId) {
      apiCall(`/sessions/agenda-end/${row.taskId}`, 'POST').catch(() => {});
    }
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
        // Clear session_active — agenda is done
        if (row?.taskId) {
          apiCall(`/sessions/agenda-end/${row.taskId}`, 'POST').catch(() => {});
        }
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
        // Update session_active to the next row's task
        if (nextRowData?.taskId) {
          apiCall(`/sessions/agenda-start/${nextRowData.taskId}`, 'POST').catch(() => {});
        }
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
      // Check if Canvas has also marked this task completed (for leaderboard)
      let canvasCompleted = false;
      const rowTask = sessionTasks.find(t => t.id === currentRow.taskId) || tasks.find(t => t.id === currentRow.taskId);
      try {
        if (rowTask?.assignmentId && rowTask?.course_id) {
          const canvasCheck = await apiCall(`/canvas/check-completed/${currentRow.taskId}`, 'GET');
          canvasCompleted = canvasCheck?.completed === true;
        }
      } catch (e) { /* silent */ }
      // Complete the task (marks it done, saves time)
      await apiCall(`/tasks/${currentRow.taskId}/complete`, 'POST', {
        timeSpent: Math.round(Math.max(0, snappedElapsed - agendaBaseElapsed) / 60),
        canvasCompleted
      });
      setTasks(prev => prev.map(t => t.id === currentRow.taskId ? { ...t, completed: true, deleted: true } : t));
      setAgendaTotalElapsed(prev => prev + snappedElapsed);
      // Now advance — same as Save & Proceed but task is already saved
      const isLastRow = agendaCurrentRow >= rows.length - 1;
      if (isLastRow) {
        const totalSecs = agendaTotalElapsed + snappedElapsed;
        await apiCall(`/agendas/${currentAgenda.id}/finish`, 'PATCH');
        setAgendaFinishedSummary({ name: currentAgenda.name, totalSecs, rowCount: rows.length });
        // Clear session_active — agenda is done
        if (currentRow?.taskId) {
          apiCall(`/sessions/agenda-end/${currentRow.taskId}`, 'POST').catch(() => {});
        }
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
        // Update session_active to the next row's task
        if (nextRowData?.taskId) {
          apiCall(`/sessions/agenda-start/${nextRowData.taskId}`, 'POST').catch(() => {});
        }
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
      (data || []).forEach(t => {
        // Normalize date: pg returns DATE columns as ISO timestamp strings,
        // extract just the YYYY-MM-DD part so keys match viewDateStr
        const dateKey = t.date
          ? (typeof t.date === 'string' ? t.date.split('T')[0] : new Date(t.date).toISOString().split('T')[0])
          : null;
        if (dateKey) map[`${dateKey}-${t.period}`] = { ...t, date: dateKey };
      });
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

  const loadAdminFeedback = async () => {
    try {
      const data = await apiCall('/admin/feedback', 'GET');
      setAdminFeedback(data || []);
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





  const adminCreateAnnouncement = async () => {
    if (!newAnnouncementMsg.trim()) return;
    try {
      const data = await apiCall('/admin/announcements', 'POST', { message: newAnnouncementMsg, type: newAnnouncementType, target_audience: newAnnouncementAudience || 'all' });
      setAdminAnnouncements(prev => [data, ...prev]);
      setNewAnnouncementMsg('');
      setNewAnnouncementAudience('all');
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

  // ── Priority normalize (no-op — tasks are now always deadline-sorted) ────────
  const normalizePriority = async () => {
    // No-op: priority_order removed. Tasks always sort by deadline.
  };

  // ── Toggle task completion (manual checkbox) ──────────────────────────────────
  const toggleTaskCompletion = async (taskId) => {
    setCheckingTask(taskId);
    try {
      await apiCall(`/tasks/${taskId}/complete`, 'PATCH');
      setTasks(prev => prev.map(t => t.id === taskId
        ? { ...t, deleted: true, completed: true }
        : t
      ));
      setSessionTasks(prev => prev.filter(t => t.id !== taskId));
      setAgendas(prev => prev.map(a => ({
        ...a,
        tasks: (a.tasks || []).filter(t => t.id !== taskId)
      })));
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




  // ── Session priorities functions ──────────────────────────────────────────
  const getLocalDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const loadSessionPriorities = async () => {
    setSessionPrioritiesLoading(true);
    try {
      const data = await apiCall(`/session-priorities/today?date=${getLocalDateStr()}`, 'GET');
      setSessionPriorities(data.taskIds ? data.taskIds.map(Number) : null); // null if not set today
    } catch (err) {
      console.error('Failed to load session priorities:', err);
    } finally {
      setSessionPrioritiesLoading(false);
    }
  };

  const saveSessionPriorities = async (taskIds) => {
    try {
      const ids = taskIds.map(Number);
      await apiCall('/session-priorities/today', 'POST', { taskIds: ids, date: getLocalDateStr() });
      setSessionPriorities(ids);
    } catch (err) {
      console.error('Failed to save session priorities:', err);
    }
  };

  const clearSessionPriorities = async () => {
    try {
      await apiCall(`/session-priorities/today?date=${getLocalDateStr()}`, 'DELETE');
      setSessionPriorities(null);
    } catch (err) {
      console.error('Failed to clear session priorities:', err);
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

  // Inactivity auto-pause: if tab is hidden for 180+ minutes, pause any running timer
  useEffect(() => {
    let hiddenAt = null;
    const INACTIVITY_LIMIT_MS = 180 * 60 * 1000; // 180 minutes

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
      } else {
        if (hiddenAt !== null) {
          const hiddenMs = Date.now() - hiddenAt;
          hiddenAt = null;
          if (hiddenMs >= INACTIVITY_LIMIT_MS) {
            // Auto-pause session timer if running
            if (isTimerRunning && currentSessionTask) {
              setIsTimerRunning(false);
              timerBaseElapsedRef.current = sessionElapsed;
              apiCall(`/sessions/pause/${currentSessionTask.id}`, 'POST', {
                accumulatedTime: Math.round(sessionElapsed / 60)
              }).catch(() => {});
              alert(`Your session timer was paused after ${Math.round(hiddenMs / 60000)} minutes of inactivity.`);
            }
            // Auto-pause agenda timer if running
            if (agendaRunning) {
              setAgendaRunning(false);
              if (agendaTimerRef.current) {
                clearInterval(agendaTimerRef.current.intervalRef);
                agendaTimerRef.current = null;
              }
              alert(`Your agenda timer was paused after ${Math.round(hiddenMs / 60000)} minutes of inactivity.`);
            }
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTimerRunning, currentSessionTask, sessionElapsed, agendaRunning]);

  // Feature 1: Period Zoom banner — check every 30s if a period is starting within 2 min or started within 5 min
  useEffect(() => {
    if (!isAuthenticated || !accountSetup.presentPeriods) return;
    const PERIOD_TIMES_UTC = {
      1: { h: 11, m: 25 }, 2: { h: 12, m: 28 }, 3: { h: 13, m: 31 },
      4: { h: 15, m: 21 }, 5: { h: 17, m: 1  }, 6: { h: 18, m: 4  },
      7: { h: 19, m: 7  }, 8: { h: 20, m: 37 }
    };
    const check = () => {
      const now = new Date();
      const nowUTCMins = now.getUTCHours() * 60 + now.getUTCMinutes();
      for (const [p, t] of Object.entries(PERIOD_TIMES_UTC)) {
        const periodMins = t.h * 60 + t.m;
        const diff = periodMins - nowUTCMins; // negative = period already started
        // Show banner from 5 min before start up to 2 min after start
        if (diff >= -2 && diff <= 5) {
          const period = parseInt(p);
          const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
          const tutorial = tutorials[`${todayStr}-${period}`];
          const todayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];
          const lesson = scheduleLessons.find(sl => sl.day === todayName && sl.period === period);
          const zoomNumber = tutorial?.zoom_number || lesson?.zoom_number || null;
          if (zoomNumber) {
            setZoomBanner({ period, zoomNumber, isTutorial: !!tutorial?.zoom_number });
          }
          break;
        }
      }
    };
    check(); // run immediately on mount / when deps change
    const interval = setInterval(check, 30000); // check every 30s for tighter window
    return () => clearInterval(interval);
  }, [isAuthenticated, accountSetup.presentPeriods, scheduleLessons, tutorials]);

  // Feature 6: Auto-sync every 30 minutes while app is visible
  useEffect(() => {
    if (!isAuthenticated) return;
    const runBgSync = async () => {
      if (document.hidden) return;
      if (isLoadingTasks || ['session-active','agenda-active'].includes(currentPage)) return;
      console.log('[Background Sync] Interval triggered');
      await runBackgroundSync();
    };
    const BG_SYNC_INTERVAL = 30 * 60 * 1000; // 30 minutes
    const interval = setInterval(runBgSync, BG_SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [isAuthenticated, isLoadingTasks, currentPage]);

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

  const loadGradeImpact = async () => {
    try {
      const data = await apiCall('/tasks/grade-impact', 'GET');
      setGradeImpact(data || {});
    } catch (e) { console.error('Failed to load grade impact:', e); }
  };

  const loadGoals = async () => {
    try {
      const data = await apiCall('/goals', 'GET');
      setUserGoals(data || {});
      setGoalsLoaded(true);
    } catch (e) {
      console.error('Failed to load goals:', e);
      setGoalsLoaded(true);
    }
  };


  // ── Theme CSS injection ──────────────────────────────────────────────────
  useEffect(() => {
    // color-scheme on html for browser native elements
    document.documentElement.style.colorScheme = (colorTheme === 'dark' || colorTheme === 'cool') ? 'dark' : 'light';

    // Inject or update the theme stylesheet
    let styleEl = document.getElementById('planassist-theme-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'planassist-theme-styles';
      document.head.appendChild(styleEl);
    }

    const themes = {
      system: `
        :root { color-scheme: light; }
        [data-planassist-theme="system"] { --pa-bg-page: #f0f4ff; --pa-bg-page2: #eff6ff; }
        /* Scrollbar */
        [data-planassist-theme="system"] ::-webkit-scrollbar { width: 7px; height: 7px; }
        [data-planassist-theme="system"] ::-webkit-scrollbar-track { background: #f1f5f9; }
        [data-planassist-theme="system"] ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        [data-planassist-theme="system"] ::-webkit-scrollbar-thumb:hover { background: #7c3aed; }
        [data-planassist-theme="system"] * { scrollbar-color: #cbd5e1 #f1f5f9; scrollbar-width: thin; }
        /* Sync overlay cards (Activity/Goals/Marks pane spinners) */
        [data-planassist-theme="system"] .pa-sync-overlay { background: rgba(255,255,255,0.82); }
        [data-planassist-theme="system"] .pa-sync-card { background: #ffffff; box-shadow: 0 8px 32px rgba(0,0,0,0.18); }
        [data-planassist-theme="system"] .pa-sync-text { color: #7c3aed; }
      `,
      warm: `
        :root { color-scheme: light; }
        /* ── Scrollbars ─────────────────────────────────────── */
        [data-planassist-theme="warm"] ::-webkit-scrollbar { width: 7px; height: 7px; }
        [data-planassist-theme="warm"] ::-webkit-scrollbar-track { background: #fce4ec; }
        [data-planassist-theme="warm"] ::-webkit-scrollbar-thumb { background: #f48fb1; border-radius: 4px; }
        [data-planassist-theme="warm"] ::-webkit-scrollbar-thumb:hover { background: #c2185b; }
        [data-planassist-theme="warm"] * { scrollbar-color: #f48fb1 #fce4ec; scrollbar-width: thin; }
        /* Sync overlay cards */
        [data-planassist-theme="warm"] .pa-sync-overlay { background: rgba(255,240,245,0.88); }
        [data-planassist-theme="warm"] .pa-sync-card { background: #fff5f8; box-shadow: 0 8px 32px rgba(194,24,91,0.15); }
        [data-planassist-theme="warm"] .pa-sync-text { color: #c2185b; }
        [data-planassist-theme="warm"] .pa-sync-card .border-purple-600 { border-color: #e91e8c !important; }
        /* ── Page background: white ──────────────────────────── */
        [data-planassist-theme="warm"] { background: #ffffff !important; }
        [data-planassist-theme="warm"] .bg-white { background-color: #ffffff !important; }
        [data-planassist-theme="warm"] .bg-gray-50 { background-color: #fff0f5 !important; }
        [data-planassist-theme="warm"] .bg-gray-100 { background-color: #fce4ec !important; }
        [data-planassist-theme="warm"] .bg-gray-200 { background-color: #f8bbd0 !important; }
        [data-planassist-theme="warm"] .bg-gray-700 { background-color: #880e4f !important; }
        [data-planassist-theme="warm"] .bg-black { background-color: #1a0010 !important; }
        [data-planassist-theme="warm"] .from-gray-50 { --tw-gradient-from: #fff0f5 !important; }
        [data-planassist-theme="warm"] .to-blue-50 { --tw-gradient-to: #fce4ec !important; }
        [data-planassist-theme="warm"] .from-yellow-50 { --tw-gradient-from: #fff0f5 !important; }
        [data-planassist-theme="warm"] .via-purple-50 { --tw-gradient-via: #fce4ec !important; }
        /* ── Text on background (black) ──────────────────────── */
        [data-planassist-theme="warm"] .text-gray-900 { color: #1a0010 !important; }
        [data-planassist-theme="warm"] .text-gray-800 { color: #2d0020 !important; }
        [data-planassist-theme="warm"] .text-gray-700 { color: #560027 !important; }
        [data-planassist-theme="warm"] .text-gray-600 { color: #880e4f !important; }
        [data-planassist-theme="warm"] .text-gray-500 { color: #ad1457 !important; }
        [data-planassist-theme="warm"] .text-gray-400 { color: #e91e8c !important; }
        [data-planassist-theme="warm"] .text-gray-300 { color: #f48fb1 !important; }
        /* ── Borders ─────────────────────────────────────────── */
        [data-planassist-theme="warm"] .border-gray-100 { border-color: #fce4ec !important; }
        [data-planassist-theme="warm"] .border-gray-200 { border-color: #f8bbd0 !important; }
        [data-planassist-theme="warm"] .border-gray-300 { border-color: #f48fb1 !important; }
        [data-planassist-theme="warm"] .border-t { border-color: #fce4ec !important; }
        [data-planassist-theme="warm"] .border-b { border-color: #fce4ec !important; }
        [data-planassist-theme="warm"] .border-r { border-color: #fce4ec !important; }
        [data-planassist-theme="warm"] .border-l { border-color: #fce4ec !important; }
        [data-planassist-theme="warm"] .divide-y > * + * { border-color: #fce4ec !important; }
        /* ── Hover ───────────────────────────────────────────── */
        [data-planassist-theme="warm"] .hover\:bg-gray-50:hover { background-color: #fff0f5 !important; }
        [data-planassist-theme="warm"] .hover\:bg-gray-100:hover { background-color: #fce4ec !important; }
        [data-planassist-theme="warm"] .hover\:bg-gray-200:hover { background-color: #f8bbd0 !important; }
        /* ── Nav: white bg, pink border ─────────────────────── */
        [data-planassist-theme="warm"] nav { background-color: #ffffff !important; border-color: #f8bbd0 !important; }
        [data-planassist-theme="warm"] nav.bg-white { background-color: #ffffff !important; }
        /* ── Main accent: Pink replaces Purple ───────────────── */
        /* Objects (buttons, banners, icons) use pink; text on them is white */
        [data-planassist-theme="warm"] .from-purple-600 { --tw-gradient-from: #e91e8c !important; }
        [data-planassist-theme="warm"] .to-blue-600 { --tw-gradient-to: #1e88e5 !important; }
        [data-planassist-theme="warm"] .from-purple-500 { --tw-gradient-from: #ec407a !important; }
        [data-planassist-theme="warm"] .to-blue-500 { --tw-gradient-to: #42a5f5 !important; }
        [data-planassist-theme="warm"] .from-purple-50 { --tw-gradient-from: #fce4ec !important; }
        [data-planassist-theme="warm"] .to-blue-50 { --tw-gradient-to: #e3f2fd !important; }
        [data-planassist-theme="warm"] .bg-purple-600 { background-color: #e91e8c !important; }
        [data-planassist-theme="warm"] .bg-purple-700 { background-color: #c2185b !important; }
        [data-planassist-theme="warm"] .bg-purple-500 { background-color: #ec407a !important; }
        [data-planassist-theme="warm"] .bg-purple-100 { background-color: #fce4ec !important; }
        [data-planassist-theme="warm"] .bg-purple-50 { background-color: #fff0f5 !important; }
        [data-planassist-theme="warm"] .bg-purple-900 { background-color: #fce4ec !important; }
        [data-planassist-theme="warm"] .hover\:bg-purple-600:hover { background-color: #e91e8c !important; }
        [data-planassist-theme="warm"] .hover\:bg-purple-700:hover { background-color: #c2185b !important; }
        [data-planassist-theme="warm"] .hover\:bg-purple-50:hover { background-color: #fff0f5 !important; }
        /* Purple text in accent contexts */
        [data-planassist-theme="warm"] .text-purple-600 { color: #e91e8c !important; }
        [data-planassist-theme="warm"] .text-purple-700 { color: #c2185b !important; }
        [data-planassist-theme="warm"] .text-purple-500 { color: #ec407a !important; }
        [data-planassist-theme="warm"] .text-purple-400 { color: #f06292 !important; }
        [data-planassist-theme="warm"] .text-purple-300 { color: #f48fb1 !important; }
        /* These appear ON the pink banner — must be white/near-white */
        [data-planassist-theme="warm"] .text-purple-200 { color: #ffffff !important; }
        [data-planassist-theme="warm"] .text-purple-100 { color: #ffffff !important; }
        [data-planassist-theme="warm"] .text-purple-900 { color: #880e4f !important; }
        /* Purple borders */
        [data-planassist-theme="warm"] .border-purple-100 { border-color: #fce4ec !important; }
        [data-planassist-theme="warm"] .border-purple-200 { border-color: #f8bbd0 !important; }
        [data-planassist-theme="warm"] .border-purple-300 { border-color: #f48fb1 !important; }
        [data-planassist-theme="warm"] .border-purple-400 { border-color: rgba(233,30,140,0.45) !important; }
        [data-planassist-theme="warm"] .border-purple-500 { border-color: #e91e8c !important; }
        [data-planassist-theme="warm"] .border-purple-600 { border-color: #e91e8c !important; }
        /* ── Blue stays blue (secondary main color) ──────────── */
        [data-planassist-theme="warm"] .text-blue-100 { color: #ffffff !important; }
        [data-planassist-theme="warm"] .text-blue-200 { color: #ffffff !important; }
        [data-planassist-theme="warm"] .text-blue-600 { color: #1565c0 !important; }
        [data-planassist-theme="warm"] .text-blue-700 { color: #0d47a1 !important; }
        [data-planassist-theme="warm"] .bg-blue-50 { background-color: #e3f2fd !important; }
        [data-planassist-theme="warm"] .bg-blue-100 { background-color: #bbdefb !important; }
        [data-planassist-theme="warm"] .border-blue-200 { border-color: #90caf9 !important; }
        [data-planassist-theme="warm"] .border-blue-100 { border-color: #bbdefb !important; }
        /* ── Semantic colors: keep natural, tweak borders ────── */
        [data-planassist-theme="warm"] .bg-green-50 { background-color: #e8f5e9 !important; }
        [data-planassist-theme="warm"] .bg-green-100 { background-color: #c8e6c9 !important; }
        [data-planassist-theme="warm"] .border-green-100 { border-color: #c8e6c9 !important; }
        [data-planassist-theme="warm"] .border-green-200 { border-color: #a5d6a7 !important; }
        [data-planassist-theme="warm"] .bg-amber-50 { background-color: #fff8e1 !important; }
        [data-planassist-theme="warm"] .bg-amber-100 { background-color: #ffecb3 !important; }
        [data-planassist-theme="warm"] .border-amber-100 { border-color: #ffecb3 !important; }
        [data-planassist-theme="warm"] .border-amber-200 { border-color: #ffe082 !important; }
        [data-planassist-theme="warm"] .bg-orange-50 { background-color: #fff3e0 !important; }
        [data-planassist-theme="warm"] .border-orange-100 { border-color: #ffe0b2 !important; }
        [data-planassist-theme="warm"] .bg-red-50 { background-color: #fce4ec !important; }
        [data-planassist-theme="warm"] .bg-red-100 { background-color: #f8bbd0 !important; }
        [data-planassist-theme="warm"] .border-red-200 { border-color: #f48fb1 !important; }
        [data-planassist-theme="warm"] .text-red-700 { color: #880e4f !important; }
        /* ── Emerald (Marks Excellent tier) ─────────────────── */
        [data-planassist-theme="warm"] .bg-emerald-50 { background-color: #e8f5e9 !important; }
        [data-planassist-theme="warm"] .bg-emerald-100 { background-color: #c8e6c9 !important; }
        [data-planassist-theme="warm"] .border-emerald-200 { border-color: #a5d6a7 !important; }
        [data-planassist-theme="warm"] .text-emerald-600 { color: #2e7d32 !important; }
        /* ── Inputs ──────────────────────────────────────────── */
        [data-planassist-theme="warm"] input, [data-planassist-theme="warm"] select, [data-planassist-theme="warm"] textarea {
          background-color: #fff0f5 !important;
          color: #1a0010 !important;
          border-color: #f8bbd0 !important;
        }
        [data-planassist-theme="warm"] input:focus, [data-planassist-theme="warm"] select:focus, [data-planassist-theme="warm"] textarea:focus {
          border-color: #e91e8c !important;
          background-color: #ffffff !important;
        }
        [data-planassist-theme="warm"] input::placeholder, [data-planassist-theme="warm"] textarea::placeholder { color: #e91e8c !important; opacity: 0.5; }
        [data-planassist-theme="warm"] input[type="checkbox"] { accent-color: #e91e8c; }
        [data-planassist-theme="warm"] input[type="range"] { accent-color: #e91e8c; }
        [data-planassist-theme="warm"] .focus\:ring-purple-500:focus { --tw-ring-color: rgba(233,30,140,0.30) !important; }
        /* ── Shadows ─────────────────────────────────────────── */
        [data-planassist-theme="warm"] .shadow-sm { box-shadow: 0 1px 4px rgba(233,30,140,0.08) !important; }
        [data-planassist-theme="warm"] .shadow-md { box-shadow: 0 4px 12px rgba(233,30,140,0.10) !important; }
        [data-planassist-theme="warm"] .shadow-lg { box-shadow: 0 8px 20px rgba(233,30,140,0.12) !important; }
        /* ── Tables ──────────────────────────────────────────── */
        [data-planassist-theme="warm"] table thead { background-color: #fff0f5 !important; }
        [data-planassist-theme="warm"] table tbody tr { border-color: #fce4ec !important; }
        /* ── Misc ────────────────────────────────────────────── */
        [data-planassist-theme="warm"] .animate-spin { border-color: #e91e8c !important; border-top-color: transparent !important; }
        /* ── Banner chip fix: bg-white.bg-opacity-20 on pink banner ── */
        /* Override so chips use semi-transparent dark instead of white */
        [data-planassist-theme="warm"] .bg-opacity-20 { --tw-bg-opacity: 1 !important; background-color: rgba(0,0,0,0.18) !important; }
        [data-planassist-theme="warm"] .bg-opacity-15 { --tw-bg-opacity: 1 !important; background-color: rgba(0,0,0,0.15) !important; }
        [data-planassist-theme="warm"] .hover\:bg-opacity-30:hover { background-color: rgba(0,0,0,0.28) !important; }
        /* bg-purple-800: Session Save & Exit button on pink banner */
        [data-planassist-theme="warm"] .bg-purple-800 { background-color: rgba(0,0,0,0.30) !important; }
        [data-planassist-theme="warm"] .hover\:bg-purple-900:hover { background-color: rgba(0,0,0,0.40) !important; }
        /* bg-gray-300: Goals disabled button */
        [data-planassist-theme="warm"] .bg-gray-300 { background-color: #f8bbd0 !important; }
        /* Marks banner: from-blue-600 to-purple-600 → pink-to-blue in Blossom */
        [data-planassist-theme="warm"] .from-blue-600 { --tw-gradient-from: #e91e8c !important; }
        [data-planassist-theme="warm"] .from-blue-600.to-purple-600 { --tw-gradient-to: #1e88e5 !important; }

        /* Join Zoom button on blue banner: bg-white = white chip ✓, text-blue-600 = dark blue ✓ */
        /* text-blue-200 on Zoom banner → white */
        [data-planassist-theme="warm"] .text-blue-200 { color: #ffffff !important; }

        [data-planassist-theme="warm"] .border-b-2.border-purple-600 { border-color: #e91e8c !important; }
        [data-planassist-theme="warm"] .bg-indigo-600 { background-color: #e91e8c !important; }
      `,
      cool: `
        :root { color-scheme: dark; }
        /* ── Scrollbars ─────────────────────────────────────── */
        [data-planassist-theme="cool"] ::-webkit-scrollbar { width: 7px; height: 7px; }
        [data-planassist-theme="cool"] ::-webkit-scrollbar-track { background: #0a0f0a; }
        [data-planassist-theme="cool"] ::-webkit-scrollbar-thumb { background: #2e7d32; border-radius: 4px; }
        [data-planassist-theme="cool"] ::-webkit-scrollbar-thumb:hover { background: #43a047; }
        [data-planassist-theme="cool"] * { scrollbar-color: #2e7d32 #0a0f0a; scrollbar-width: thin; }
        /* Sync overlay cards */
        [data-planassist-theme="cool"] .pa-sync-overlay { background: rgba(10,15,10,0.82); }
        [data-planassist-theme="cool"] .pa-sync-card { background: #192218; box-shadow: 0 8px 32px rgba(0,0,0,0.50); }
        [data-planassist-theme="cool"] .pa-sync-text { color: #66bb6a; }
        [data-planassist-theme="cool"] .pa-sync-card .border-purple-600 { border-color: #43a047 !important; }
        /* ── Page background: black ──────────────────────────── */
        [data-planassist-theme="cool"] { background: #0a0f0a !important; color: #e8f5e9; }
        [data-planassist-theme="cool"] .bg-white { background-color: #111811 !important; }
        [data-planassist-theme="cool"] .bg-gray-50 { background-color: #141f14 !important; }
        [data-planassist-theme="cool"] .bg-gray-100 { background-color: #1a2a1a !important; }
        [data-planassist-theme="cool"] .bg-gray-200 { background-color: #1e3520 !important; }
        [data-planassist-theme="cool"] .bg-gray-700 { background-color: #1e3520 !important; }
        [data-planassist-theme="cool"] .bg-black { background-color: #060a06 !important; }
        [data-planassist-theme="cool"] .from-gray-50 { --tw-gradient-from: #111811 !important; }
        [data-planassist-theme="cool"] .to-blue-50 { --tw-gradient-to: #0d1a0d !important; }
        [data-planassist-theme="cool"] .from-yellow-50 { --tw-gradient-from: #0a0f0a !important; }
        [data-planassist-theme="cool"] .via-purple-50 { --tw-gradient-via: #111811 !important; }
        [data-planassist-theme="cool"] .bg-gradient-to-br { background-image: linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to)) !important; }
        /* ── Text on background: white ───────────────────────── */
        [data-planassist-theme="cool"] .text-gray-900 { color: #e8f5e9 !important; }
        [data-planassist-theme="cool"] .text-gray-800 { color: #c8e6c9 !important; }
        [data-planassist-theme="cool"] .text-gray-700 { color: #a5d6a7 !important; }
        [data-planassist-theme="cool"] .text-gray-600 { color: #81c784 !important; }
        [data-planassist-theme="cool"] .text-gray-500 { color: #4caf50 !important; }
        [data-planassist-theme="cool"] .text-gray-400 { color: #388e3c !important; }
        [data-planassist-theme="cool"] .text-gray-300 { color: #2e7d32 !important; }
        /* ── Borders ─────────────────────────────────────────── */
        [data-planassist-theme="cool"] .border-gray-100 { border-color: #1a2a1a !important; }
        [data-planassist-theme="cool"] .border-gray-200 { border-color: #1e3520 !important; }
        [data-planassist-theme="cool"] .border-gray-300 { border-color: #2e4d30 !important; }
        [data-planassist-theme="cool"] .border-t { border-color: #1a2a1a !important; }
        [data-planassist-theme="cool"] .border-b { border-color: #1a2a1a !important; }
        [data-planassist-theme="cool"] .border-r { border-color: #1a2a1a !important; }
        [data-planassist-theme="cool"] .border-l { border-color: #1a2a1a !important; }
        [data-planassist-theme="cool"] .border-white { border-color: rgba(255,255,255,0.10) !important; }
        [data-planassist-theme="cool"] .divide-y > * + * { border-color: #1a2a1a !important; }
        /* ── Hover ───────────────────────────────────────────── */
        [data-planassist-theme="cool"] .hover\:bg-gray-50:hover { background-color: #1a2a1a !important; }
        [data-planassist-theme="cool"] .hover\:bg-gray-100:hover { background-color: #1e3520 !important; }
        [data-planassist-theme="cool"] .hover\:bg-gray-200:hover { background-color: #243d26 !important; }
        /* ── Nav ─────────────────────────────────────────────── */
        [data-planassist-theme="cool"] nav { background-color: #080d08 !important; border-color: #1a2a1a !important; }
        [data-planassist-theme="cool"] nav.bg-white { background-color: #080d08 !important; }
        /* ── Main accent: Green replaces Purple ──────────────── */
        /* Objects use green; "Text on Objects" = black/near-black */
        [data-planassist-theme="cool"] .from-purple-600 { --tw-gradient-from: #2e7d32 !important; }
        [data-planassist-theme="cool"] .to-blue-600 { --tw-gradient-to: #1565c0 !important; }
        [data-planassist-theme="cool"] .from-purple-500 { --tw-gradient-from: #388e3c !important; }
        [data-planassist-theme="cool"] .to-blue-500 { --tw-gradient-to: #1976d2 !important; }
        [data-planassist-theme="cool"] .from-purple-50 { --tw-gradient-from: #1a2a1a !important; }
        [data-planassist-theme="cool"] .to-blue-50 { --tw-gradient-to: #0d1a28 !important; }
        [data-planassist-theme="cool"] .bg-purple-600 { background-color: #2e7d32 !important; }
        [data-planassist-theme="cool"] .bg-purple-700 { background-color: #1b5e20 !important; }
        [data-planassist-theme="cool"] .bg-purple-500 { background-color: #388e3c !important; }
        [data-planassist-theme="cool"] .bg-purple-100 { background-color: #1a2a1a !important; }
        [data-planassist-theme="cool"] .bg-purple-50 { background-color: #141f14 !important; }
        [data-planassist-theme="cool"] .bg-purple-900 { background-color: #1a2a1a !important; }
        [data-planassist-theme="cool"] .hover\:bg-purple-600:hover { background-color: #2e7d32 !important; }
        [data-planassist-theme="cool"] .hover\:bg-purple-700:hover { background-color: #1b5e20 !important; }
        [data-planassist-theme="cool"] .hover\:bg-purple-50:hover { background-color: #141f14 !important; }
        /* Text on objects = black (dark green for readability on bright objects) */
        /* But on dark banners (green bg), text should be WHITE for contrast */
        [data-planassist-theme="cool"] .text-purple-600 { color: #43a047 !important; }
        [data-planassist-theme="cool"] .text-purple-700 { color: #66bb6a !important; }
        [data-planassist-theme="cool"] .text-purple-500 { color: #4caf50 !important; }
        [data-planassist-theme="cool"] .text-purple-400 { color: #388e3c !important; }
        [data-planassist-theme="cool"] .text-purple-300 { color: #2e7d32 !important; }
        /* On the green banner — must be white for contrast */
        [data-planassist-theme="cool"] .text-purple-200 { color: #e8f5e9 !important; }
        [data-planassist-theme="cool"] .text-purple-100 { color: #ffffff !important; }
        [data-planassist-theme="cool"] .text-purple-900 { color: #a5d6a7 !important; }
        /* Purple borders → green */
        [data-planassist-theme="cool"] .border-purple-100 { border-color: #1a2a1a !important; }
        [data-planassist-theme="cool"] .border-purple-200 { border-color: #1e3520 !important; }
        [data-planassist-theme="cool"] .border-purple-300 { border-color: #2e4d30 !important; }
        [data-planassist-theme="cool"] .border-purple-400 { border-color: rgba(46,125,50,0.50) !important; }
        [data-planassist-theme="cool"] .border-purple-500 { border-color: #2e7d32 !important; }
        /* ── Blue: stays blue (secondary main color) ─────────── */
        [data-planassist-theme="cool"] .text-blue-600 { color: #42a5f5 !important; }
        [data-planassist-theme="cool"] .text-blue-700 { color: #64b5f6 !important; }
        [data-planassist-theme="cool"] .text-blue-200 { color: #e8f5e9 !important; }
        [data-planassist-theme="cool"] .text-blue-100 { color: #ffffff !important; }
        [data-planassist-theme="cool"] .bg-blue-50 { background-color: #0d1a28 !important; }
        [data-planassist-theme="cool"] .bg-blue-100 { background-color: #0d2035 !important; }
        [data-planassist-theme="cool"] .border-blue-200 { border-color: #1a3a50 !important; }
        [data-planassist-theme="cool"] .border-blue-100 { border-color: #122a3a !important; }
        /* ── Semantic colors: darkened ───────────────────────── */
        [data-planassist-theme="cool"] .bg-green-50 { background-color: #0f1f10 !important; }
        [data-planassist-theme="cool"] .bg-green-100 { background-color: #142414 !important; }
        [data-planassist-theme="cool"] .text-green-600 { color: #66bb6a !important; }
        [data-planassist-theme="cool"] .text-green-700 { color: #81c784 !important; }
        [data-planassist-theme="cool"] .border-green-100 { border-color: #142414 !important; }
        [data-planassist-theme="cool"] .border-green-200 { border-color: #1b3a1c !important; }
        [data-planassist-theme="cool"] .bg-emerald-50 { background-color: #0f1f10 !important; }
        [data-planassist-theme="cool"] .bg-emerald-100 { background-color: #142414 !important; }
        [data-planassist-theme="cool"] .border-emerald-200 { border-color: #1b3a1c !important; }
        [data-planassist-theme="cool"] .text-emerald-600 { color: #66bb6a !important; }
        [data-planassist-theme="cool"] .bg-amber-50 { background-color: #1a1500 !important; }
        [data-planassist-theme="cool"] .bg-amber-100 { background-color: #221c00 !important; }
        [data-planassist-theme="cool"] .text-amber-600 { color: #ffca28 !important; }
        [data-planassist-theme="cool"] .border-amber-100 { border-color: #2a2200 !important; }
        [data-planassist-theme="cool"] .border-amber-200 { border-color: #332a00 !important; }
        [data-planassist-theme="cool"] .bg-red-50 { background-color: #1a0808 !important; }
        [data-planassist-theme="cool"] .bg-red-100 { background-color: #220e0e !important; }
        [data-planassist-theme="cool"] .text-red-600 { color: #ef9a9a !important; }
        [data-planassist-theme="cool"] .text-red-500 { color: #e57373 !important; }
        [data-planassist-theme="cool"] .border-red-200 { border-color: #3a1414 !important; }
        [data-planassist-theme="cool"] .bg-orange-50 { background-color: #1a1008 !important; }
        [data-planassist-theme="cool"] .bg-orange-100 { background-color: #221610 !important; }
        [data-planassist-theme="cool"] .text-orange-600 { color: #ffb74d !important; }
        [data-planassist-theme="cool"] .text-orange-500 { color: #ffa726 !important; }
        [data-planassist-theme="cool"] .border-orange-100 { border-color: #2a1e0e !important; }
        [data-planassist-theme="cool"] .border-orange-200 { border-color: #33240e !important; }
        [data-planassist-theme="cool"] .bg-yellow-50 { background-color: #1a1500 !important; }
        [data-planassist-theme="cool"] .text-yellow-600 { color: #fff176 !important; }
        /* ── Inputs ──────────────────────────────────────────── */
        [data-planassist-theme="cool"] input, [data-planassist-theme="cool"] select, [data-planassist-theme="cool"] textarea {
          background-color: #141f14 !important;
          color: #e8f5e9 !important;
          border-color: #1e3520 !important;
        }
        [data-planassist-theme="cool"] input:focus, [data-planassist-theme="cool"] select:focus, [data-planassist-theme="cool"] textarea:focus {
          border-color: #43a047 !important;
          background-color: #111811 !important;
        }
        [data-planassist-theme="cool"] input::placeholder, [data-planassist-theme="cool"] textarea::placeholder { color: #388e3c !important; opacity: 0.7; }
        [data-planassist-theme="cool"] input[type="checkbox"] { accent-color: #43a047; }
        [data-planassist-theme="cool"] input[type="range"] { accent-color: #43a047; }
        [data-planassist-theme="cool"] input[type="color"] { background-color: transparent !important; border-color: #1e3520 !important; }
        [data-planassist-theme="cool"] .focus\:ring-purple-500:focus { --tw-ring-color: rgba(67,160,71,0.35) !important; }
        /* ── Shadows ─────────────────────────────────────────── */
        [data-planassist-theme="cool"] .shadow-sm { box-shadow: 0 1px 6px rgba(0,0,0,0.40) !important; }
        [data-planassist-theme="cool"] .shadow-md { box-shadow: 0 4px 12px rgba(0,0,0,0.45) !important; }
        [data-planassist-theme="cool"] .shadow-lg { box-shadow: 0 8px 24px rgba(0,0,0,0.50) !important; }
        [data-planassist-theme="cool"] .shadow-xl { box-shadow: 0 12px 32px rgba(0,0,0,0.55) !important; }
        [data-planassist-theme="cool"] .shadow-2xl { box-shadow: 0 20px 48px rgba(0,0,0,0.60) !important; }
        /* ── Overlays ────────────────────────────────────────── */
        [data-planassist-theme="cool"] .bg-opacity-50 { background-color: rgba(0,0,0,0.70) !important; }
        [data-planassist-theme="cool"] .bg-black.bg-opacity-50 { background-color: rgba(0,0,0,0.80) !important; }
        [data-planassist-theme="cool"] .backdrop-blur-sm { backdrop-filter: blur(8px); }
        [data-planassist-theme="cool"] .bg-white\/10 { background-color: rgba(255,255,255,0.06) !important; }
        [data-planassist-theme="cool"] .bg-white\/5 { background-color: rgba(255,255,255,0.03) !important; }
        [data-planassist-theme="cool"] .hover\:bg-white\/10:hover { background-color: rgba(255,255,255,0.09) !important; }
        [data-planassist-theme="cool"] .bg-white\/20 { background-color: rgba(255,255,255,0.09) !important; }
        /* ── Tables / misc ───────────────────────────────────── */
        [data-planassist-theme="cool"] table thead { background-color: #141f14 !important; }
        [data-planassist-theme="cool"] table tbody tr { border-color: #1a2a1a !important; }
        [data-planassist-theme="cool"] .animate-spin { border-color: #43a047 !important; border-top-color: transparent !important; }
        [data-planassist-theme="cool"] .border-b-2.border-purple-600 { border-color: #43a047 !important; }
        [data-planassist-theme="cool"] .prose { color: #a5d6a7 !important; }
        [data-planassist-theme="cool"] .prose h1, [data-planassist-theme="cool"] .prose h2, [data-planassist-theme="cool"] .prose h3 { color: #e8f5e9 !important; }
        [data-planassist-theme="cool"] .bg-indigo-600 { background-color: #2e7d32 !important; }
        [data-planassist-theme="cool"] .text-green-900 { color: #a5d6a7 !important; }
        [data-planassist-theme="cool"] .text-red-900 { color: #ef9a9a !important; }
        [data-planassist-theme="cool"] .text-orange-900 { color: #ffb74d !important; }
        [data-planassist-theme="cool"] .text-blue-900 { color: #64b5f6 !important; }
        [data-planassist-theme="cool"] .text-green-500 { color: #66bb6a !important; }
        /* Hub explainer card: yellow Leaderboard bubble */
        [data-planassist-theme="cool"] .border-yellow-100 { border-color: #2a2200 !important; }
        [data-planassist-theme="cool"] .text-yellow-900 { color: #fff176 !important; }
        [data-planassist-theme="cool"] .text-yellow-800 { color: #ffe57f !important; }
        /* Info card body text (blue-800, green-800 on colored bg) */
        [data-planassist-theme="cool"] .text-blue-800 { color: #90caf9 !important; }
        [data-planassist-theme="cool"] .text-green-800 { color: #a5d6a7 !important; }
        /* ── Banner chip fix: bg-white.bg-opacity-20 on green banner ── */
        [data-planassist-theme="cool"] .bg-opacity-20 { --tw-bg-opacity: 1 !important; background-color: rgba(0,0,0,0.22) !important; }
        [data-planassist-theme="cool"] .bg-opacity-15 { --tw-bg-opacity: 1 !important; background-color: rgba(0,0,0,0.18) !important; }
        [data-planassist-theme="cool"] .hover\:bg-opacity-30:hover { background-color: rgba(0,0,0,0.32) !important; }
        /* bg-purple-800: Session Save & Exit on dark green banner */
        [data-planassist-theme="cool"] .bg-purple-800 { background-color: rgba(0,0,0,0.35) !important; }
        [data-planassist-theme="cool"] .hover\:bg-purple-900:hover { background-color: rgba(0,0,0,0.45) !important; }
        /* bg-gray-300: Goals disabled button on dark bg */
        [data-planassist-theme="cool"] .bg-gray-300 { background-color: #1e3520 !important; color: #4caf50; }
        /* Marks banner: from-blue-600 to-purple-600 → blue-to-green in Grove */
        [data-planassist-theme="cool"] .from-blue-600 { --tw-gradient-from: #1565c0 !important; }
        [data-planassist-theme="cool"] .from-blue-600.to-purple-600 { --tw-gradient-to: #2e7d32 !important; }

        /* Join Zoom: bg-white button → show clearly on banner */
        [data-planassist-theme="cool"] .bg-white.text-blue-600 { background-color: #e8f5e9 !important; color: #1b5e20 !important; }

      `,
      dark: `
        :root { color-scheme: dark; }
        /* ── Scrollbars ─────────────────────────────────────── */
        [data-planassist-theme="dark"] ::-webkit-scrollbar { width: 7px; height: 7px; }
        [data-planassist-theme="dark"] ::-webkit-scrollbar-track { background: #0d0d14; }
        [data-planassist-theme="dark"] ::-webkit-scrollbar-thumb { background: #3d3d6b; border-radius: 4px; }
        [data-planassist-theme="dark"] ::-webkit-scrollbar-thumb:hover { background: #7c4dff; }
        [data-planassist-theme="dark"] * { scrollbar-color: #3d3d6b #0d0d14; scrollbar-width: thin; }
        /* Sync overlay cards */
        [data-planassist-theme="dark"] .pa-sync-overlay { background: rgba(13,13,20,0.82); }
        [data-planassist-theme="dark"] .pa-sync-card { background: #13131f; box-shadow: 0 8px 32px rgba(0,0,0,0.60); }
        [data-planassist-theme="dark"] .pa-sync-text { color: #b39ddb; }
        [data-planassist-theme="dark"] .pa-sync-card .border-purple-600 { border-color: #7c4dff !important; }
        /* ── Page background: black ──────────────────────────── */
        [data-planassist-theme="dark"] { background: #0d0d14 !important; color: #e8eaf6; }
        [data-planassist-theme="dark"] .bg-white { background-color: #13131f !important; }
        [data-planassist-theme="dark"] .bg-gray-50 { background-color: #181828 !important; }
        [data-planassist-theme="dark"] .bg-gray-100 { background-color: #1e1e30 !important; }
        [data-planassist-theme="dark"] .bg-gray-200 { background-color: #282840 !important; }
        [data-planassist-theme="dark"] .bg-gray-700 { background-color: #24243a !important; }
        [data-planassist-theme="dark"] .bg-black { background-color: #08080d !important; }
        [data-planassist-theme="dark"] .from-gray-50 { --tw-gradient-from: #13131f !important; }
        [data-planassist-theme="dark"] .to-blue-50 { --tw-gradient-to: #0f0f1e !important; }
        [data-planassist-theme="dark"] .from-yellow-50 { --tw-gradient-from: #0d0d14 !important; }
        [data-planassist-theme="dark"] .via-purple-50 { --tw-gradient-via: #13131f !important; }
        [data-planassist-theme="dark"] .bg-gradient-to-br { background-image: linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to)) !important; }
        /* ── Text on background: white ───────────────────────── */
        [data-planassist-theme="dark"] .text-gray-900 { color: #e8eaf6 !important; }
        [data-planassist-theme="dark"] .text-gray-800 { color: #c5cbe8 !important; }
        [data-planassist-theme="dark"] .text-gray-700 { color: #9fa8c8 !important; }
        [data-planassist-theme="dark"] .text-gray-600 { color: #7986a8 !important; }
        [data-planassist-theme="dark"] .text-gray-500 { color: #5c6694 !important; }
        [data-planassist-theme="dark"] .text-gray-400 { color: #434878 !important; }
        [data-planassist-theme="dark"] .text-gray-300 { color: #2e3260 !important; }
        /* ── Borders ─────────────────────────────────────────── */
        [data-planassist-theme="dark"] .border-gray-100 { border-color: #1e1e30 !important; }
        [data-planassist-theme="dark"] .border-gray-200 { border-color: #282840 !important; }
        [data-planassist-theme="dark"] .border-gray-300 { border-color: #32325a !important; }
        [data-planassist-theme="dark"] .border-t { border-color: #1e1e30 !important; }
        [data-planassist-theme="dark"] .border-b { border-color: #1e1e30 !important; }
        [data-planassist-theme="dark"] .border-r { border-color: #1e1e30 !important; }
        [data-planassist-theme="dark"] .border-l { border-color: #1e1e30 !important; }
        [data-planassist-theme="dark"] .border-white { border-color: rgba(255,255,255,0.10) !important; }
        [data-planassist-theme="dark"] .divide-y > * + * { border-color: #1e1e30 !important; }
        /* ── Hover ───────────────────────────────────────────── */
        [data-planassist-theme="dark"] .hover\:bg-gray-50:hover { background-color: #1e1e30 !important; }
        [data-planassist-theme="dark"] .hover\:bg-gray-100:hover { background-color: #24243a !important; }
        [data-planassist-theme="dark"] .hover\:bg-gray-200:hover { background-color: #2e2e48 !important; }
        /* ── Nav ─────────────────────────────────────────────── */
        [data-planassist-theme="dark"] nav { background-color: #09090f !important; border-color: #1e1e30 !important; }
        [data-planassist-theme="dark"] nav.bg-white { background-color: #09090f !important; }
        /* ── Main accent: Purple + Blue (unchanged hue, lightened for dark bg) ─ */
        [data-planassist-theme="dark"] .from-purple-600 { --tw-gradient-from: #7c4dff !important; }
        [data-planassist-theme="dark"] .to-blue-600 { --tw-gradient-to: #2979ff !important; }
        [data-planassist-theme="dark"] .from-purple-500 { --tw-gradient-from: #7e57c2 !important; }
        [data-planassist-theme="dark"] .to-blue-500 { --tw-gradient-to: #42a5f5 !important; }
        [data-planassist-theme="dark"] .from-purple-50 { --tw-gradient-from: #1e1e30 !important; }
        [data-planassist-theme="dark"] .to-blue-50 { --tw-gradient-to: #0f1a30 !important; }
        [data-planassist-theme="dark"] .bg-purple-600 { background-color: #7c4dff !important; }
        [data-planassist-theme="dark"] .bg-purple-700 { background-color: #651fff !important; }
        [data-planassist-theme="dark"] .bg-purple-500 { background-color: #7e57c2 !important; }
        [data-planassist-theme="dark"] .bg-purple-100 { background-color: #1e1e30 !important; }
        [data-planassist-theme="dark"] .bg-purple-50 { background-color: #181828 !important; }
        [data-planassist-theme="dark"] .bg-purple-900 { background-color: #1e1e30 !important; }
        [data-planassist-theme="dark"] .hover\:bg-purple-600:hover { background-color: #7c4dff !important; }
        [data-planassist-theme="dark"] .hover\:bg-purple-700:hover { background-color: #651fff !important; }
        [data-planassist-theme="dark"] .hover\:bg-purple-50:hover { background-color: #181828 !important; }
        /* Purple text */
        [data-planassist-theme="dark"] .text-purple-600 { color: #9575cd !important; }
        [data-planassist-theme="dark"] .text-purple-700 { color: #b39ddb !important; }
        [data-planassist-theme="dark"] .text-purple-500 { color: #7e57c2 !important; }
        [data-planassist-theme="dark"] .text-purple-400 { color: #6948b8 !important; }
        [data-planassist-theme="dark"] .text-purple-300 { color: #4a3490 !important; }
        /* On the purple/blue banner — white for contrast */
        [data-planassist-theme="dark"] .text-purple-200 { color: #e8eaf6 !important; }
        [data-planassist-theme="dark"] .text-purple-100 { color: #ffffff !important; }
        [data-planassist-theme="dark"] .text-purple-900 { color: #b39ddb !important; }
        /* Purple borders */
        [data-planassist-theme="dark"] .border-purple-100 { border-color: #1e1e30 !important; }
        [data-planassist-theme="dark"] .border-purple-200 { border-color: #282840 !important; }
        [data-planassist-theme="dark"] .border-purple-300 { border-color: #32325a !important; }
        [data-planassist-theme="dark"] .border-purple-400 { border-color: rgba(124,77,255,0.45) !important; }
        [data-planassist-theme="dark"] .border-purple-500 { border-color: #7c4dff !important; }
        [data-planassist-theme="dark"] .border-purple-600 { border-color: #7c4dff !important; }
        /* ── Blue: stays blue ────────────────────────────────── */
        [data-planassist-theme="dark"] .text-blue-600 { color: #64b5f6 !important; }
        [data-planassist-theme="dark"] .text-blue-700 { color: #90caf9 !important; }
        [data-planassist-theme="dark"] .text-blue-200 { color: #e8eaf6 !important; }
        [data-planassist-theme="dark"] .text-blue-100 { color: #ffffff !important; }
        [data-planassist-theme="dark"] .bg-blue-50 { background-color: #0f1a30 !important; }
        [data-planassist-theme="dark"] .bg-blue-100 { background-color: #12203d !important; }
        [data-planassist-theme="dark"] .border-blue-200 { border-color: #1a3060 !important; }
        [data-planassist-theme="dark"] .border-blue-100 { border-color: #121e45 !important; }
        /* ── Semantic colors: darkened ───────────────────────── */
        [data-planassist-theme="dark"] .bg-green-50 { background-color: #0a1a0c !important; }
        [data-planassist-theme="dark"] .bg-green-100 { background-color: #0e2210 !important; }
        [data-planassist-theme="dark"] .text-green-600 { color: #81c784 !important; }
        [data-planassist-theme="dark"] .text-green-700 { color: #a5d6a7 !important; }
        [data-planassist-theme="dark"] .border-green-100 { border-color: #0e2210 !important; }
        [data-planassist-theme="dark"] .border-green-200 { border-color: #14301a !important; }
        [data-planassist-theme="dark"] .bg-emerald-50 { background-color: #0a1a0c !important; }
        [data-planassist-theme="dark"] .bg-emerald-100 { background-color: #0e2210 !important; }
        [data-planassist-theme="dark"] .border-emerald-200 { border-color: #14301a !important; }
        [data-planassist-theme="dark"] .text-emerald-600 { color: #81c784 !important; }
        [data-planassist-theme="dark"] .bg-amber-50 { background-color: #1a1400 !important; }
        [data-planassist-theme="dark"] .bg-amber-100 { background-color: #221b00 !important; }
        [data-planassist-theme="dark"] .text-amber-600 { color: #ffca28 !important; }
        [data-planassist-theme="dark"] .border-amber-100 { border-color: #221b00 !important; }
        [data-planassist-theme="dark"] .border-amber-200 { border-color: #2e2500 !important; }
        [data-planassist-theme="dark"] .bg-red-50 { background-color: #1a0808 !important; }
        [data-planassist-theme="dark"] .bg-red-100 { background-color: #220e0e !important; }
        [data-planassist-theme="dark"] .text-red-600 { color: #ef9a9a !important; }
        [data-planassist-theme="dark"] .text-red-500 { color: #e57373 !important; }
        [data-planassist-theme="dark"] .text-red-700 { color: #ef9a9a !important; }
        [data-planassist-theme="dark"] .border-red-200 { border-color: #3a1414 !important; }
        [data-planassist-theme="dark"] .bg-orange-50 { background-color: #1a1008 !important; }
        [data-planassist-theme="dark"] .bg-orange-100 { background-color: #221610 !important; }
        [data-planassist-theme="dark"] .text-orange-600 { color: #ffb74d !important; }
        [data-planassist-theme="dark"] .text-orange-500 { color: #ffa726 !important; }
        [data-planassist-theme="dark"] .border-orange-100 { border-color: #221610 !important; }
        [data-planassist-theme="dark"] .border-orange-200 { border-color: #2e200e !important; }
        [data-planassist-theme="dark"] .bg-yellow-50 { background-color: #1a1400 !important; }
        [data-planassist-theme="dark"] .text-yellow-600 { color: #fff176 !important; }
        /* ── Inputs ──────────────────────────────────────────── */
        [data-planassist-theme="dark"] input, [data-planassist-theme="dark"] select, [data-planassist-theme="dark"] textarea {
          background-color: #181828 !important;
          color: #e8eaf6 !important;
          border-color: #282840 !important;
        }
        [data-planassist-theme="dark"] input:focus, [data-planassist-theme="dark"] select:focus, [data-planassist-theme="dark"] textarea:focus {
          border-color: #7c4dff !important;
          background-color: #13131f !important;
        }
        [data-planassist-theme="dark"] input::placeholder, [data-planassist-theme="dark"] textarea::placeholder { color: #434878 !important; opacity: 0.8; }
        [data-planassist-theme="dark"] input[type="checkbox"] { accent-color: #7c4dff; }
        [data-planassist-theme="dark"] input[type="range"] { accent-color: #7c4dff; }
        [data-planassist-theme="dark"] input[type="color"] { background-color: transparent !important; border-color: #282840 !important; }
        [data-planassist-theme="dark"] .focus\:ring-purple-500:focus { --tw-ring-color: rgba(124,77,255,0.35) !important; }
        /* ── Shadows ─────────────────────────────────────────── */
        [data-planassist-theme="dark"] .shadow-sm { box-shadow: 0 1px 6px rgba(0,0,0,0.45) !important; }
        [data-planassist-theme="dark"] .shadow-md { box-shadow: 0 4px 12px rgba(0,0,0,0.50) !important; }
        [data-planassist-theme="dark"] .shadow-lg { box-shadow: 0 8px 24px rgba(0,0,0,0.55) !important; }
        [data-planassist-theme="dark"] .shadow-xl { box-shadow: 0 12px 32px rgba(0,0,0,0.60) !important; }
        [data-planassist-theme="dark"] .shadow-2xl { box-shadow: 0 20px 48px rgba(0,0,0,0.65) !important; }
        /* ── Overlays ────────────────────────────────────────── */
        [data-planassist-theme="dark"] .bg-opacity-50 { background-color: rgba(0,0,0,0.72) !important; }
        [data-planassist-theme="dark"] .bg-black.bg-opacity-50 { background-color: rgba(0,0,0,0.80) !important; }
        [data-planassist-theme="dark"] .backdrop-blur-sm { backdrop-filter: blur(8px); }
        [data-planassist-theme="dark"] .bg-white\/10 { background-color: rgba(255,255,255,0.06) !important; }
        [data-planassist-theme="dark"] .bg-white\/5 { background-color: rgba(255,255,255,0.03) !important; }
        [data-planassist-theme="dark"] .hover\:bg-white\/10:hover { background-color: rgba(255,255,255,0.09) !important; }
        [data-planassist-theme="dark"] .bg-white\/20 { background-color: rgba(255,255,255,0.09) !important; }
        /* ── Tables / misc ───────────────────────────────────── */
        [data-planassist-theme="dark"] table thead { background-color: #181828 !important; }
        [data-planassist-theme="dark"] table tbody tr { border-color: #1e1e30 !important; }
        [data-planassist-theme="dark"] .animate-spin { border-color: #7c4dff !important; border-top-color: transparent !important; }
        [data-planassist-theme="dark"] .border-b-2.border-purple-600 { border-color: #7c4dff !important; }
        [data-planassist-theme="dark"] .prose { color: #9fa8c8 !important; }
        [data-planassist-theme="dark"] .prose h1, [data-planassist-theme="dark"] .prose h2, [data-planassist-theme="dark"] .prose h3 { color: #e8eaf6 !important; }
        [data-planassist-theme="dark"] .bg-indigo-600 { background-color: #5c6bc0 !important; }
        [data-planassist-theme="dark"] .text-green-900 { color: #a5d6a7 !important; }
        [data-planassist-theme="dark"] .text-red-900 { color: #ef9a9a !important; }
        [data-planassist-theme="dark"] .text-orange-900 { color: #ffb74d !important; }
        [data-planassist-theme="dark"] .text-blue-900 { color: #64b5f6 !important; }
        [data-planassist-theme="dark"] .text-green-500 { color: #81c784 !important; }
        [data-planassist-theme="dark"] .text-green-400 { color: #66bb6a !important; }
        /* Hub explainer card: yellow Leaderboard bubble */
        [data-planassist-theme="dark"] .border-yellow-100 { border-color: #221b00 !important; }
        [data-planassist-theme="dark"] .text-yellow-900 { color: #fff176 !important; }
        [data-planassist-theme="dark"] .text-yellow-800 { color: #ffe57f !important; }
        /* Info card body text (blue-800, green-800 on colored bg) */
        [data-planassist-theme="dark"] .text-blue-800 { color: #90caf9 !important; }
        [data-planassist-theme="dark"] .text-green-800 { color: #a5d6a7 !important; }
        /* ── Banner chip fix: bg-white.bg-opacity-20 on dark purple banner ── */
        [data-planassist-theme="dark"] .bg-opacity-20 { --tw-bg-opacity: 1 !important; background-color: rgba(0,0,0,0.25) !important; }
        [data-planassist-theme="dark"] .bg-opacity-15 { --tw-bg-opacity: 1 !important; background-color: rgba(0,0,0,0.20) !important; }
        [data-planassist-theme="dark"] .hover\:bg-opacity-30:hover { background-color: rgba(0,0,0,0.35) !important; }
        /* bg-purple-800: Session Save & Exit on dark purple banner */
        [data-planassist-theme="dark"] .bg-purple-800 { background-color: rgba(0,0,0,0.35) !important; }
        [data-planassist-theme="dark"] .hover\:bg-purple-900:hover { background-color: rgba(0,0,0,0.45) !important; }
        /* bg-gray-300: Goals disabled button on dark bg */
        [data-planassist-theme="dark"] .bg-gray-300 { background-color: #1e1e30 !important; }
        /* Marks banner: from-blue-600 to-purple-600 → blue-to-bright-purple in Dark */
        [data-planassist-theme="dark"] .from-blue-600 { --tw-gradient-from: #2979ff !important; }
        [data-planassist-theme="dark"] .from-blue-600.to-purple-600 { --tw-gradient-to: #7c4dff !important; }

        /* Join Zoom: bg-white button on blue banner */
        [data-planassist-theme="dark"] .bg-white.text-blue-600 { background-color: #e8eaf6 !important; color: #1565c0 !important; }

      `,
    };

    styleEl.textContent = themes[colorTheme] || themes.system;
    
    // Apply page background
    const appDiv = document.querySelector('[data-planassist-theme]');
    if (appDiv) {
      const themeData = { warm: 'linear-gradient(135deg,#ffffff,#fff0f5)', cool: 'linear-gradient(135deg,#0a0f0a,#111811)', dark: 'linear-gradient(135deg,#0d0d14,#13131f)' };
      if (themeData[colorTheme]) {
        document.body.style.background = themeData[colorTheme];
      } else {
        document.body.style.background = '';
      }
    }
  }, [colorTheme]);

  // ── Streak data loader (client-side calculation) ──────────────────────
  // Insignia tiers — unlock thresholds by days with ≥1 completion
  const INSIGNIA_THRESHOLDS = [
    [0,'Default'],[2,'Copper'],[5,'Silver'],[10,'Gold'],[20,'Emerald'],
    [30,'Amethyst'],[40,'Ruby'],[50,'Diamond'],[75,'Obsidian'],[100,'Aether']
  ];

  // Single source of truth for Insignia styles — used in Insignia pane, nav, Hub, Feed, and Leaderboard
  const INSIGNIA_STYLES = {
    // Default — plain gray, no decoration
    Default:   { animClass:'', nameStyle:{ color:'#374151', fontWeight:600 } },
    // Copper — warm orange, no gradient, no animation
    Copper:    { animClass:'', nameStyle:{ color:'#c2651a', fontWeight:700 } },
    // Silver — cool metallic gray, slight gradient via textShadow
    Silver:    { animClass:'', nameStyle:{ background:'linear-gradient(135deg,#9ca3af,#d1d5db,#6b7280)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', fontWeight:700 } },
    // Gold — warm metallic gold, noticeable gradient
    Gold:      { animClass:'', nameStyle:{ background:'linear-gradient(135deg,#d97706,#fbbf24,#92400e)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', fontWeight:800 } },
    // Emerald — vivid bright emerald, gradient + shimmer
    Emerald:   { animClass:'ins-emerald', nameStyle:{ background:'linear-gradient(135deg,#059669,#34d399,#065f46)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', fontWeight:800, backgroundSize:'200% auto' } },
    // Amethyst — deep mysterious amethyst, gradient + shimmer
    Amethyst:  { animClass:'ins-amethyst', nameStyle:{ background:'linear-gradient(135deg,#7c3aed,#a78bfa,#4c1d95)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', fontWeight:800, backgroundSize:'200% auto' } },
    // Ruby — vivid bold ruby, gradient + heavy shimmer
    Ruby:      { animClass:'ins-ruby', nameStyle:{ background:'linear-gradient(135deg,#be123c,#f43f5e,#881337)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', fontWeight:900, backgroundSize:'200% auto' } },
    // Diamond — fluorescent diamond, heavy gradient + bling animation
    Diamond:   { animClass:'ins-diamond', nameStyle:{ background:'linear-gradient(90deg,#a5f3fc,#818cf8,#f0abfc,#67e8f9,#c7d2fe)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', fontWeight:900, backgroundSize:'400% auto' } },
    // Obsidian — deep obsidian, heavy gradient + murky cloud animation
    Obsidian:  { animClass:'ins-obsidian', nameStyle:{ background:'linear-gradient(135deg,#1e1b4b,#312e81,#0f172a,#1e1b4b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', fontWeight:900, backgroundSize:'300% auto' } },
    // Aether — luminous iridescent cosmic color-shifting, shifting gradient + float animation
    Aether:    { animClass:'ins-aether', nameStyle:{ background:'linear-gradient(90deg,#f0abfc,#818cf8,#34d399,#fbbf24,#f43f5e,#a5f3fc,#f0abfc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', fontWeight:900, backgroundSize:'600% auto' } },
  };
  const INSIGNIA_KEYFRAMES = `
    @keyframes ins-shimmer { 0%{background-position:0% center} 100%{background-position:200% center} }
    @keyframes ins-shimmer-heavy { 0%{background-position:0% center} 100%{background-position:200% center} }
    @keyframes ins-bling { 0%,100%{background-position:0% center;filter:brightness(1)} 25%{background-position:50% center;filter:brightness(1.3)} 50%{background-position:100% center;filter:brightness(1)} 75%{background-position:150% center;filter:brightness(1.4)} }
    @keyframes ins-cloud { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    @keyframes ins-float { 0%,100%{transform:translateY(0);opacity:1} 25%{transform:translateY(-1.5px);opacity:0.92} 50%{transform:translateY(0);opacity:1} 75%{transform:translateY(1px);opacity:0.88} }
    @keyframes ins-color-shift { 0%{background-position:0% center} 100%{background-position:600% center} }
    .ins-emerald  { animation: ins-shimmer 3s linear infinite }
    .ins-amethyst { animation: ins-shimmer 2.5s linear infinite }
    .ins-ruby     { animation: ins-shimmer-heavy 1.8s linear infinite }
    .ins-diamond  { animation: ins-bling 2s ease-in-out infinite }
    .ins-obsidian { animation: ins-cloud 6s ease-in-out infinite }
    .ins-aether   { animation: ins-color-shift 5s linear infinite, ins-float 3s ease-in-out infinite }
  `;


  // Render a name with the user's Insignia tier style applied — used in Feed and Leaderboard.
  const renderInsigniaName = (name, insignia, opts = {}) => {
    const tier = insignia && INSIGNIA_STYLES[insignia] ? insignia : 'Default';
    const s = INSIGNIA_STYLES[tier];
    const { fontSize, fontWeight, ...rest } = opts;
    if (tier === 'Default') {
      return <span style={{ fontWeight: fontWeight || 600, fontSize: fontSize || 'inherit', ...rest }}>{name}</span>;
    }
    return (
      <span
        className={s.animClass || ''}
        style={{ ...s.nameStyle, fontSize: fontSize || 'inherit', display:'inline-block', ...rest }}
      >{name}</span>
    );
  };

  // Parse a 'YYYY-MM-DD' string as LOCAL midnight (avoids UTC-offset day shift).
  const parseLocalDate = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Get day-of-week from a 'YYYY-MM-DD' string in LOCAL time (0=Sun, 6=Sat).
  const isWeekday = (dateStr) => {
    const d = parseLocalDate(dateStr);
    const day = d.getDay();
    return day !== 0 && day !== 6;
  };

  // Format a Date object as 'YYYY-MM-DD' in local time.
  const fmtLocal = (d) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  // Compute current streak.
  // completionDates: 'YYYY-MM-DD' strings in LOCAL time.
  // shieldDates:     'YYYY-MM-DD' strings (from DB DATE column — already date-only, no shift needed).
  const computeStreak = (completionDates, shieldDates) => {
    const allDays = new Set([...completionDates, ...shieldDates]);
    const today = getLocalDateStr();

    // Walk backwards from today counting consecutive covered weekdays.
    // If today (or the most recent weekday) is uncovered, allow skipping it once —
    // the streak is "at risk" but its length is still the run ending on the last
    // covered weekday. A second consecutive uncovered weekday breaks the chain.
    let d = parseLocalDate(today);
    let streak = 0;
    let passedAtRiskDay = false; // true once we've skipped one uncovered weekday

    while (true) {
      const ds = fmtLocal(d);
      if (!isWeekday(ds)) { d.setDate(d.getDate() - 1); continue; } // skip weekend
      if (allDays.has(ds)) {
        streak++;
        d.setDate(d.getDate() - 1);
        continue;
      }
      // Uncovered weekday
      if (!passedAtRiskDay) {
        // First uncovered weekday — this is the at-risk day (today or last weekday).
        // Allow skipping it once and keep looking for the chain behind it.
        passedAtRiskDay = true;
        d.setDate(d.getDate() - 1);
        continue;
      }
      // Second consecutive uncovered weekday — chain is truly broken.
      break;
    }
    return streak;
  };

  // Compute personal record streak from a sorted array of unique local-date strings.
  // Accounts for weekends (Fri→Mon gap of 3 days is continuous) and shields.
  const computePersonalRecord = (uniqueDays, shieldDates) => {
    const allDays = new Set([...uniqueDays, ...(shieldDates || [])]);
    const sorted = [...allDays].filter(d => isWeekday(d)).sort();
    if (sorted.length === 0) return 0;
    let max = 0, cur = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = parseLocalDate(sorted[i - 1]);
      const curr = parseLocalDate(sorted[i]);
      const diffDays = Math.round((curr - prev) / 86400000);
      // Gap of 1 = consecutive weekdays; gap of 3 = Fri→Mon over weekend; anything else breaks streak
      const bridgesWeekend = diffDays === 3 &&
        parseLocalDate(sorted[i - 1]).getDay() === 5 && // prev is Friday
        parseLocalDate(sorted[i]).getDay() === 1;       // curr is Monday
      if (diffDays === 1 || bridgesWeekend) {
        cur++;
      } else {
        cur = 1;
      }
      if (cur > max) max = cur;
    }
    if (sorted.length > 0 && max === 0) max = 1; // at least 1 if there are days
    return max;
  };

  const loadStreakData = async ({ silent = false } = {}) => {
    if (!silent) setStreakLoading(true);
    try {
      const [shieldsR, logR] = await Promise.all([
        apiCall('/streak/shields', 'GET'),
        apiCall('/streak/shields/log', 'GET'),
      ]);
      setStreakShieldsAvailable(shieldsR.available ?? 0);
      setStreakShieldMode(shieldsR.mode ?? 'manual');
      const serverDates = (logR.shieldDates ?? []).map(d =>
        (typeof d === 'string' ? d : d.toISOString()).slice(0, 10)
      );
      // Merge server dates with any optimistic local additions so a just-used shield
      // is never wiped out by a loadStreakData call that races with the DB write.
      setStreakShieldLog(prev => [...new Set([...prev, ...serverDates])]);
    } catch (err) { console.error('loadStreakData error:', err.message); } finally { if (!silent) setStreakLoading(false); }
  };

  // Auto-consume shields for gap weekdays when mode is 'automatic'.
  // Called after completion history and shield log are both loaded.
  const autoConsumeShieldsIfNeeded = async (completionDays, shieldLog, shieldsAvailable, mode) => {
    if (mode !== 'automatic') return;
    if (shieldsAvailable <= 0) return;

    const allCovered = new Set([...completionDays, ...shieldLog]);
    const today = getLocalDateStr();
    const todayDate = parseLocalDate(today);

    // Walk backwards from yesterday, looking only for gaps in the chain
    // immediately behind today. Stop at the first covered day — gaps further
    // back are unrelated to today's at-risk streak and must never be auto-shielded.
    const gapDates = [];
    let d = new Date(todayDate);
    d.setDate(d.getDate() - 1); // start from yesterday

    for (let i = 0; i < 30; i++) {
      const ds = fmtLocal(d);
      if (!isWeekday(ds)) { d.setDate(d.getDate() - 1); continue; }
      if (allCovered.has(ds)) {
        // Covered day found — chain is intact here, nothing to shield
        break;
      }
      // Single uncovered weekday immediately behind today — shield it
      gapDates.push(ds);
      break; // only ever shield one day; two consecutive gaps = streak already broken
    }

    if (gapDates.length === 0) return;

    // Only auto-shield gaps we can cover without breaking the chain
    const toShield = gapDates.slice(0, shieldsAvailable);
    if (toShield.length === 0) return;

    try {
      const result = await apiCall('/streak/shields/auto-consume', 'POST', { gapDates: toShield });
      if (result.consumed > 0) {
        setStreakShieldsAvailable(result.remaining);
        setStreakShieldLog(prev => [...new Set([...prev, ...toShield])]);
        setStreakShieldToast(`🛡️ Auto-shield used ${result.consumed > 1 ? `(×${result.consumed})` : ''}: streak protected!`);
        setTimeout(() => setStreakShieldToast(null), 5000);
        console.log(`[AUTO-SHIELD] Consumed ${result.consumed} shield(s) for: ${toShield.join(', ')}`);
      }
    } catch (err) {
      console.error('[AUTO-SHIELD] Failed:', err.message);
    }
  };

  const loadInsignia = async () => {
    setInsigniaLoading(true);
    try {
      const data = await apiCall('/insignia', 'GET');
      setInsigniaDays(data.days ?? 0);
      setInsigniaSelected(data.selected ?? 'Default');
      setInsigniaUnlocked(data.unlocked ?? []);
    } catch (err) { console.error('loadInsignia error:', err.message); } finally { setInsigniaLoading(false); }
  };

  const loadBadges = async () => {
    setGalleryLoading(true);
    try {
      const data = await apiCall('/badges', 'GET');
      setUserBadges(data.badges ?? []);
    } catch (err) { console.error('loadBadges error:', err.message); } finally { setGalleryLoading(false); }
  };

  const checkNewUnlocks = async (currentStreak) => {
    try {
      // Check streak badges
      await apiCall('/badges/check', 'POST', { currentStreak });
      // Check insignia unlocks
      const unlockData = await apiCall('/insignia/check-unlock', 'POST', {});
      if (unlockData.newlyUnlocked?.length > 0) {
        const newest = unlockData.newlyUnlocked[unlockData.newlyUnlocked.length - 1];
        setInsigniaNewUnlock(newest);
        setTimeout(() => setInsigniaNewUnlock(null), 6000);
        await loadInsignia();
        await loadBadges();
      }
    } catch (err) { console.error('checkNewUnlocks error:', err.message); }
  };

  const loadCompletionHistory = async () => {
    try {
      const historyData = await apiCall('/learning', 'GET');
      if (Array.isArray(historyData)) {
        setCompletionHistory(historyData.map(h => {
          // completed_at is a UTC timestamp from Postgres.
          // Convert to LOCAL date string immediately so streak calculations
          // credit the day the student actually completed the task, not the UTC date.
          const utcDate = new Date(h.completed_at);
          const localDateString = `${utcDate.getFullYear()}-${String(utcDate.getMonth()+1).padStart(2,'0')}-${String(utcDate.getDate()).padStart(2,'0')}`;
          return {
            taskTitle: h.task_title,
            type: h.task_type,
            estimatedTime: h.estimated_time,
            actualTime: h.actual_time,
            date: utcDate,
            localDate: localDateString, // pre-computed local YYYY-MM-DD
          };
        }));
      }
    } catch (error) {
      console.error('Failed to refresh completion history:', error);
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

    // Streak: use the canonical computeStreak (shield-aware, local-date-correct).
    // completionHistory already has localDate populated from loadCompletionHistory.
    const hubCompletionDays = [...new Set(completionHistory.map(h =>
      h.localDate || (h.date instanceof Date
        ? `${h.date.getFullYear()}-${String(h.date.getMonth()+1).padStart(2,'0')}-${String(h.date.getDate()).padStart(2,'0')}`
        : String(h.date).slice(0,10))
    ).filter(Boolean))];
    const streak = computeStreak(hubCompletionDays, streakShieldLog);

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
      loadGradeImpact();
      loadGoals();
      
      // Delay initial feed/leaderboard load by 2s to let the server warm up
      // (Render free tier spins down after inactivity)
      const initialDelay = setTimeout(() => {
        loadCompletionFeed();
        loadLeaderboard();
      }, 2000);
      
      // Refresh feed, leaderboard, and hub stats every 2 minutes
      const interval = setInterval(() => {
        loadCompletionFeed();
        loadLeaderboard();
        loadCompletionHistory();
        loadStreakData({ silent: true });
      }, 120000);

      // Silent Course Sync every 60 minutes (regardless of page, but not if tab hidden)
      const courseSyncInterval = setInterval(() => {
        if (!document.hidden) {
          console.log('[Course Sync] 60-min silent interval triggered');
          runCourseSync(false, true); // no session_active clear, silent (no spinner)
        }
      }, 60 * 60 * 1000);
      
      return () => {
        clearTimeout(initialDelay);
        clearInterval(interval);
        clearInterval(courseSyncInterval);
      };
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    calculateHubStats();
  }, [completionHistory, streakShieldLog]);

  // Trigger auto-shield whenever completion history or shield data changes and mode is automatic
  useEffect(() => {
    if (streakShieldMode !== 'automatic') return;
    if (streakShieldsAvailable <= 0) return;
    if (completionHistory.length === 0) return;
    const completionDays = [...new Set(completionHistory.map(h =>
      h.localDate || (h.date instanceof Date
        ? `${h.date.getFullYear()}-${String(h.date.getMonth()+1).padStart(2,'0')}-${String(h.date.getDate()).padStart(2,'0')}`
        : String(h.date).slice(0,10))
    ).filter(Boolean))];
    autoConsumeShieldsIfNeeded(completionDays, streakShieldLog, streakShieldsAvailable, streakShieldMode);
  }, [completionHistory, streakShieldLog, streakShieldMode]);

  // Scroll to top when navigating to Hub; reload courses when navigating to Marks
  useEffect(() => {
    if (currentPage === 'hub') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      loadCompletionHistory();
      loadStreakData({ silent: true });
      loadInsignia();
      loadBadges();
    }
    if (currentPage === 'marks') {
      runCourseSync(true, false); // Course Sync with session_active clear + spinner
    }
    if (currentPage === 'sessions') {
      loadSessionTasks();
      loadSessionPriorities();
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
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-purple-50 to-blue-50 flex items-center justify-center p-6" data-planassist-theme={colorTheme}>
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
      body: 'This is where all your Canvas assignments live. Tasks are automatically sorted by deadline. Set manual time estimates, split big tasks into segments, or start a session directly. Hit Sync to pull in fresh assignments from Canvas.',
      arrow: null,
    },
    {
      page: 'sessions',
      title: '⏱ Focus',
      body: "Focus is your productivity launchpad. Set today's priority list, start timed work sessions on individual tasks, and track your progress. The timer runs while you work.",
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
      body: "Start by syncing your Canvas tasks, then use Focus to set today's priorities and start working. Good luck!",
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
      <div className={`fixed inset-0 bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center z-50`} data-planassist-theme={colorTheme}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">PlanAssist</h2>
          <p className="text-gray-500 text-sm mt-1">Loading your plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-gray-50 to-blue-50 ${currentPage === 'tasks' ? 'h-screen overflow-hidden' : 'min-h-screen'}`} data-theme={colorTheme} data-planassist-theme={colorTheme}>

      {/* ── Session Expired Modal ── */}
      {sessionExpired && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Session Expired</h2>
            <p className="text-gray-500 text-sm mb-6">
              You've been away for a while and your session has expired. Please log in again to continue.
            </p>
            <button
              onClick={() => {
                setSessionExpired(false);
                handleLogout();
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
            >
              Log In Again
            </button>
          </div>
        </div>
      )}

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
            <button onClick={() => !isLoadingTasks && !['session-active','agenda-active'].includes(currentPage) && setCurrentPage('hub')} disabled={['session-active','agenda-active'].includes(currentPage) || isLoadingTasks} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'hub' ? 'bg-purple-100 text-purple-700' : ['session-active','agenda-active'].includes(currentPage) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Home className="w-5 h-5" />
              <span className="font-medium">Hub</span>
            </button>
            <button onClick={() => !isLoadingTasks && !['session-active','agenda-active'].includes(currentPage) && setCurrentPage('calendar')} disabled={['session-active','agenda-active'].includes(currentPage) || isLoadingTasks} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'calendar' ? 'bg-purple-100 text-purple-700' : (['session-active','agenda-active'].includes(currentPage) ) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Calendar</span>
            </button>
            <button onClick={() => !isLoadingTasks && !['session-active','agenda-active'].includes(currentPage) && setCurrentPage('tasks')} disabled={['session-active','agenda-active'].includes(currentPage) || isLoadingTasks} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'tasks' ? 'bg-purple-100 text-purple-700' : (['session-active','agenda-active'].includes(currentPage) ) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <List className="w-5 h-5" />
              <span className="font-medium">Tasks</span>
            </button>
            <button onClick={() => !isLoadingTasks && !['session-active','agenda-active'].includes(currentPage) && setCurrentPage('sessions')} disabled={['session-active','agenda-active'].includes(currentPage) || isLoadingTasks} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'sessions' ? 'bg-purple-100 text-purple-700' : (['session-active','agenda-active'].includes(currentPage)) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Play className="w-5 h-5" />
              <span className="font-medium">Focus</span>
            </button>
            <button onClick={() => !isLoadingTasks && !['session-active','agenda-active'].includes(currentPage) && setCurrentPage('agendas')} disabled={['session-active','agenda-active'].includes(currentPage) || isLoadingTasks} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'agendas' ? 'bg-purple-100 text-purple-700' : (['session-active','agenda-active'].includes(currentPage) ) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <LayoutList className="w-5 h-5" />
              <span className="font-medium">Agendas</span>
            </button>
            <button onClick={() => !isLoadingTasks && !['session-active','agenda-active'].includes(currentPage) && setCurrentPage('itinerary')} disabled={['session-active','agenda-active'].includes(currentPage) || isLoadingTasks} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'itinerary' ? 'bg-purple-100 text-purple-700' : (['session-active','agenda-active'].includes(currentPage) ) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <ClipboardList className="w-5 h-5" />
              <span className="font-medium">Itinerary</span>
            </button>
            <button onClick={() => !isLoadingTasks && !['session-active','agenda-active'].includes(currentPage) && setCurrentPage('marks')} disabled={['session-active','agenda-active'].includes(currentPage) || isLoadingTasks} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'marks' ? 'bg-purple-100 text-purple-700' : (['session-active','agenda-active'].includes(currentPage) ) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Marks</span>
            </button>
            <button onClick={() => !isLoadingTasks && handleAccountPageOpen()} disabled={['session-active','agenda-active'].includes(currentPage) || isLoadingTasks} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'account' ? 'bg-purple-100 text-purple-700' : (['session-active','agenda-active'].includes(currentPage)) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <UserCircle className="w-5 h-5" />
            </button>
            {user?.isAdmin && (
              <button
                onClick={() => { setAdminSection('users'); setCurrentPage('admin'); loadAdminUsers(); }}
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
            <button onClick={handleLogout} disabled={['session-active','agenda-active'].includes(currentPage) || isLoadingTasks} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${(['session-active','agenda-active'].includes(currentPage)) ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}>
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Feature 1: Period Zoom Banner */}
      {zoomBanner && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Play className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">
                Period {zoomBanner.period} is starting!
                {zoomBanner.isTutorial && <span className="ml-2 text-xs bg-orange-400 text-white px-2 py-0.5 rounded-full">Tutorial</span>}
              </p>
              <p className="text-xs text-blue-200">Zoom: {zoomBanner.zoomNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={`https://oneschoolglobal.zoom.us/j/${zoomBanner.zoomNumber.replace(/[\s\-]/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              className="bg-white text-blue-600 font-semibold text-sm px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
              Join Zoom
            </a>
            <button onClick={() => setZoomBanner(null)} className="text-blue-200 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>
      )}

      {/* Feature 6: Auto-sync toast */}
      {autoSyncToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-lg z-50 flex items-center gap-2 animate-pulse">
          <RefreshCw className="w-4 h-4 text-green-400" />
          {autoSyncToast}
        </div>
      )}

      {/* Undo complete toast */}
      {undoCompleteTask && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl text-sm z-50 flex items-center gap-3">
          <span>✅ <span className="font-medium">{undoCompleteTask.title}</span> marked complete</span>
          <button onClick={async () => {
            clearTimeout(undoCompleteTask.timeout);
            try {
              await apiCall(`/tasks/${undoCompleteTask.taskId}/uncomplete`, 'PATCH', {});
              setTasks(prev => prev.map(t => t.id === undoCompleteTask.taskId ? { ...t, completed: false, deleted: false } : t));
            } catch (err) { console.error('Undo failed:', err); }
            setUndoCompleteTask(null);
          }} className="underline font-semibold hover:text-yellow-300 transition-colors ml-2">Undo</button>
        </div>
      )}

      {/* Insignia unlock toast */}
      {insigniaNewUnlock && (
        <div className="fixed top-20 right-4 bg-purple-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm z-50 flex items-center gap-2">
          🎉 New Insignia unlocked: <span className="font-bold">"{insigniaNewUnlock}"</span>
        </div>
      )}

      {/* Streak shield toast */}
      {streakShieldToast && (
        <div className="fixed top-20 right-4 bg-yellow-500 text-white px-5 py-3 rounded-xl shadow-xl text-sm z-50 flex items-center gap-2">
          {streakShieldToast}
        </div>
      )}

      {/* Hub Explainer Overlay — top-level so it covers the full viewport including nav */}
      {showHubExplainer && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[200] flex items-center justify-center p-4" onClick={() => setShowHubExplainer(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowHubExplainer(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2"><Info className="w-5 h-5 text-purple-500" /> How the Hub Works</h3>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="font-semibold text-blue-900 mb-1">📊 Stats (Today / This Week / Study Time / Accuracy / Streak)</p>
                <p className="text-blue-800">All tasks completed in PlanAssist count here — whether through a Session, Agenda, or checkbox. Accuracy compares your estimated vs actual time. Streak tracks consecutive days with at least one completion.</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="font-semibold text-green-900 mb-1">🟢 Live Activity Feed</p>
                <p className="text-green-800">Shows Canvas tasks (not manually created) completed inside a Session or Agenda with more than 0 minutes logged. Users who opt out of the feed won't appear here.</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                <p className="font-semibold text-yellow-900 mb-1">🏆 Leaderboard</p>
                <p className="text-yellow-800">Only counts tasks where Canvas confirms completion — either detected automatically during a Sync, or when you click Mark Complete and Canvas confirms the submission. Resets every Monday. Shows all participants in your grade.</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <p className="font-semibold text-purple-900 mb-1">⚡ Quick Actions</p>
                <p className="text-purple-800">Open Focus to set today's priorities and start timed work sessions. Manage Tasks opens your priority-ordered Task List. Book a Tutorial lets you schedule a teacher meeting.</p>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* ── Completion Animation Overlay ───────────────────────── */}
      {completionAnim && (
        <div className="fixed inset-0 z-[9500] pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 animate-fade-out" style={{ animation: 'fadeOut 1.2s ease forwards' }} />
          <div style={{ animation: 'popBounce 0.6s ease forwards' }} className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-2xl"
                 style={{ animation: 'checkPop 0.5s 0.1s ease both' }}>
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-white font-bold text-xl drop-shadow-lg">
              {completionAnim.type === 'agenda' ? '🎉 Agenda Complete!' : '✅ Task Complete!'}
            </div>
          </div>
          <style>{`
            @keyframes popBounce { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
            @keyframes checkPop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
            @keyframes fadeOut { 0% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; } }
          `}</style>
        </div>
      )}

      {/* ── Agenda Finish Animation ──────────────────────────────── */}
      {agendaFinishAnim && (
        <div className="fixed inset-0 z-[9500] pointer-events-none overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: '-10px',
              width: `${8 + Math.random() * 10}px`,
              height: `${8 + Math.random() * 10}px`,
              backgroundColor: ['#f59e0b','#10b981','#3b82f6','#ec4899','#8b5cf6'][i % 5],
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animation: `confettiFall ${1.5 + Math.random() * 1.5}s ${Math.random() * 0.5}s linear forwards`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }} />
          ))}
          <style>{`
            @keyframes confettiFall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* ── Break Timer Toast ────────────────────────────────────── */}
      {breakTimerActive && (
        <div className="fixed bottom-6 right-6 z-[9000] bg-white rounded-2xl shadow-2xl border border-green-200 p-5 min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">☕</span>
              <div>
                <p className="font-bold text-gray-900 text-sm">Break Time!</p>
                <p className="text-gray-500 text-xs">You earned a rest</p>
              </div>
            </div>
            <button onClick={() => setBreakTimerActive(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="text-center mb-3">
            <div className="text-4xl font-bold text-green-600 tabular-nums">
              {String(Math.floor(breakTimerSeconds/60)).padStart(2,'0')}:{String(breakTimerSeconds%60).padStart(2,'0')}
            </div>
            <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-green-400 rounded-full transition-all"
                   style={{ width: `${((breakTimerTotal - breakTimerSeconds) / breakTimerTotal) * 100}%` }} />
            </div>
          </div>
          <button onClick={() => setBreakTimerActive(false)}
            className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm">
            Skip Break
          </button>
        </div>
      )}

      {/* ── Break timer countdown effect ────────────────────────── */}
      {breakTimerActive && (() => {
        /* This IIFE just starts the interval — the actual timer is managed in useEffect below */
        return null;
      })()}

      {/* Sync Loading Overlay — Main Sync: full-screen themed; Background Sync: silent */}
      {isLoadingTasks && syncType === 'main' && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center" style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.45)' }}>
          <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4 pointer-events-none">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-gray-900 font-bold text-lg mb-1">Syncing with Canvas</p>
              <p className="text-purple-600 text-sm font-medium min-h-[20px]">{syncStep}</p>
            </div>
            <div className="w-full space-y-1.5">
              {[
                'Fetching assignments from Canvas…',
                'Processing assignments…',
                'Saving to PlanAssist…',
                'Done! Loading your plan…'
              ].map((step, i) => {
                const steps = ['Fetching assignments from Canvas…','Processing','Saving to PlanAssist…','Done! Loading your plan…'];
                const currentIdx = steps.findIndex(s => syncStep.startsWith(s.split(' ')[0]));
                const done = i < currentIdx;
                const active = syncStep.startsWith(step.split(' ')[0]);
                return (
                  <div key={step} className={`flex items-center gap-2.5 text-xs ${done ? 'text-green-600' : active ? 'text-purple-700 font-semibold' : 'text-gray-400'}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${done ? 'bg-green-500 text-white' : active ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                      {done ? '✓' : i + 1}
                    </div>
                    {step}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Background Sync: silent — no overlay, just update toast if new tasks */}

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
      <div className={currentPage === 'sessions' ? '' : 'py-6'}>
        {currentPage === 'hub' && (
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-8 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Student'}!</h1>
                  <p className="text-purple-100">Here's how you're doing today</p>
                </div>
                {/* Insight Box */}
                {(() => {
                  const insights = [];
                  if (hubStats.tasksCompletedToday > 0)
                    insights.push(`🔥 ${hubStats.tasksCompletedToday} task${hubStats.tasksCompletedToday > 1 ? 's' : ''} done today — keep the momentum!`);
                  if (hubStats.streak >= 3)
                    insights.push(`⚡ ${hubStats.streak}-day streak! Consistency is how goals get hit.`);
                  if (hubStats.tasksCompletedWeek >= 5)
                    insights.push(`📈 ${hubStats.tasksCompletedWeek} tasks this week — you're in a strong rhythm.`);
                  if (hubStats.averageAccuracy >= 80)
                    insights.push(`🎯 Your time accuracy is ${hubStats.averageAccuracy}% — you know yourself well.`);
                  else if (hubStats.averageAccuracy > 0 && hubStats.averageAccuracy < 60)
                    insights.push(`⏱ Your time estimates are running off — more sessions will improve accuracy.`);
                  // Goal insights
                  if (Object.keys(userGoals).length > 0) {
                    const coursesWithGoals = courses.filter(c => userGoals[String(c.course_id)] != null && c.current_period_score != null && c.enabled !== false);
                    const onTrack = coursesWithGoals.filter(c => parseFloat(c.current_period_score) >= parseFloat(userGoals[String(c.course_id)]));
                    const offTrack = coursesWithGoals.filter(c => parseFloat(c.current_period_score) < parseFloat(userGoals[String(c.course_id)]));
                    if (onTrack.length > 0)
                      insights.push(`✅ Hitting your goal in ${onTrack.length} course${onTrack.length > 1 ? 's' : ''}. Don't let up!`);
                    if (offTrack.length > 0) {
                      const closest = [...offTrack].sort((a,b) =>
                        (parseFloat(userGoals[String(a.course_id)]) - parseFloat(a.current_period_score)) -
                        (parseFloat(userGoals[String(b.course_id)]) - parseFloat(b.current_period_score))
                      )[0];
                      const gap = (parseFloat(userGoals[String(closest.course_id)]) - parseFloat(closest.current_period_score)).toFixed(1);
                      insights.push(`🎯 ${gap}% away from your ${closest.name.split(' ').slice(0,3).join(' ')} goal — your next session could move the needle.`);
                    }
                  }
                  const lowCourses = courses.filter(c => c.current_period_score != null && parseFloat(c.current_period_score) < 70 && c.enabled !== false);
                  if (lowCourses.length > 0)
                    insights.push(`⚠️ ${lowCourses[0].name.split(' ').slice(0,3).join(' ')} needs attention — sitting below 70%.`);
                  if (insights.length === 0)
                    insights.push('💡 Sync Canvas to get your latest tasks and grades.');
                  // Rotate every 10 minutes deterministically
                  const insight = insights[Math.floor(Date.now() / 1000 / 60 / 10) % insights.length];
                  return (
                    <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-xl px-5 py-4 max-w-xs flex-shrink-0 border border-white border-opacity-20">
                      <p className="text-xs text-purple-200 font-semibold uppercase tracking-wide mb-1.5">Insight</p>
                      <p className="text-sm text-white leading-relaxed">{insight}</p>
                    </div>
                  );
                })()}
              </div>
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
                {/* Next Up / Goal Snapshot — Goal Snapshot shown when goals are set, Next Up otherwise */}
                {(() => {
                  const hasGoals = Object.keys(userGoals).length > 0;
                  if (hasGoals) {
                    const goalCourses = courses.filter(c =>
                      userGoals[String(c.course_id)] != null &&
                      c.current_period_score != null &&
                      c.enabled !== false
                    );
                    if (goalCourses.length === 0) return null;
                    // Rotate every 5 minutes
                    const picked = goalCourses[Math.floor(Date.now() / 1000 / 60 / 5) % goalCourses.length];
                    const current = parseFloat(picked.current_period_score);
                    const target = parseFloat(userGoals[String(picked.course_id)]);
                    const pct = Math.min(100, Math.max(0, (current / target) * 100));
                    const gap = (target - current).toFixed(1);
                    const isHit = current >= target;
                    const color = picked.color || '#7c3aed';
                    return (
                      <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Target className="w-5 h-5" style={{ color }} />
                          <h2 className="text-xl font-bold text-gray-900">Goal Snapshot</h2>
                          <span className="text-xs text-gray-400 ml-auto">Rotates every 5 min</span>
                        </div>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">{picked.name}</p>
                            {picked.grading_period_title && <p className="text-xs text-gray-400 mt-0.5">{picked.grading_period_title}</p>}
                          </div>
                          <span className={`text-sm font-bold px-3 py-1 rounded-full flex-shrink-0 ml-3 ${isHit ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {isHit ? '✓ Goal Hit!' : `${gap}% to go`}
                          </span>
                        </div>
                        <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: isHit
                                ? 'linear-gradient(90deg, #10b981, #059669)'
                                : `linear-gradient(90deg, ${color}, ${color}bb)`,
                              transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                              animation: 'markBarSlide 1.2s cubic-bezier(0.4,0,0.2,1) 200ms both'
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
                        <style>{`@keyframes markBarSlide { from { width: 0%; opacity: 0.3; } to { opacity: 1; } }`}</style>
                      </div>
                    );
                  }
                  // No goals — show original Next Up
                              if (activeTasks.length === 0) return null;
                  const nextTask = activeTasks.sort((a, b) => { if (!a.dueDate && !b.dueDate) return 0; if (!a.dueDate) return 1; if (!b.dueDate) return -1; return a.dueDate - b.dueDate; })[0];
                  const color = getClassColor(nextTask.class);
                  return (
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <h2 className="text-xl font-bold text-gray-900">Next Up</h2>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{nextTask.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {nextTask.userEstimate || nextTask.estimatedTime} min
                              </span>
                              {nextTask.dueDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Due {nextTask.dueDate.toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <button onClick={() => setCurrentPage('tasks')} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium transition-colors flex-shrink-0">
                            View All
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Live Completion Feed */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-green-600" />
                    <h2 className="text-xl font-bold text-gray-900">Live Activity</h2>
                    <span className="ml-auto text-xs text-gray-500">Updates every 30s</span>
                  </div>
                  {/* Insignia keyframes */}
                  <style>{INSIGNIA_KEYFRAMES}</style>
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
                        
                        const feedInsignia = item.insignia || 'Default';
                        const reactions = item.reactions || [];
                        const userReaction = item.user_reaction;
                        const REACTION_EMOJIS = ['👏','⚡','🔥','💯','🎯'];
                        return (
                          <div key={item.id || index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900">
                                {renderInsigniaName(item.user_name.split(' ')[0], feedInsignia, { fontSize:'0.875rem' })}
                                {item.user_grade && <span className="text-gray-500"> (Grade {item.user_grade})</span>}
                                {' '}<span className="text-gray-600">completed</span>{' '}
                                <span className="font-medium text-purple-600">{item.task_title}</span>
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs text-gray-500">{timeAgo}</span>
                                {/* Reaction buttons */}
                                <div className="flex items-center gap-1">
                                  {reactions.map(r => (
                                    <button key={r.emoji}
                                      onClick={async () => {
                                        const isOwn = userReaction === r.emoji;
                                        try {
                                          if (isOwn) {
                                            await apiCall(`/feed-reactions/${item.id}`, 'DELETE');
                                          } else {
                                            await apiCall(`/feed-reactions/${item.id}`, 'POST', { emoji: r.emoji });
                                          }
                                          loadCompletionFeed();
                                        } catch (e) { console.error(e); }
                                      }}
                                      className={`text-xs px-1.5 py-0.5 rounded-full border transition-all ${
                                        userReaction === r.emoji ? 'bg-purple-100 border-purple-400 text-purple-700' : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300'
                                      }`}
                                    >{r.emoji} {r.count}</button>
                                  ))}
                                  {/* Add reaction picker */}
                                  <div className="relative group">
                                    <button className="text-xs px-1.5 py-0.5 rounded-full border border-gray-200 text-gray-400 hover:border-purple-300 hover:text-purple-600 transition-all">+</button>
                                    <div className="absolute bottom-6 left-0 bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex gap-1 hidden group-hover:flex z-10">
                                      {REACTION_EMOJIS.map(emoji => (
                                        <button key={emoji} onClick={async () => {
                                          try {
                                            await apiCall(`/feed-reactions/${item.id}`, 'POST', { emoji });
                                            loadCompletionFeed();
                                          } catch (e) { console.error(e); }
                                        }} className="text-lg hover:scale-125 transition-transform">{emoji}</button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
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
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Open Focus</h3>
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
                      <button onClick={() => setShowHubExplainer(true)} className="ml-auto text-gray-300 hover:text-gray-500 transition-colors" title="How does this work?">
                        <Info className="w-4 h-4" />
                      </button>
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

                    {/* Leaderboard List — all participants, scrollable */}
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {leaderboard.length > 0 ? (
                        leaderboard.map((entry, index) => {
                          const isCurrentUser = entry.user_name === user?.name;
                          const medals = ['🥇', '🥈', '🥉'];
                          const entryInsignia = entry.insignia || 'Default';
                          
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
                                  {renderInsigniaName(entry.user_name, entryInsignia, { fontSize:'0.875rem' })}
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
            <div className="flex-1">
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

                    {/* Task List */}
                    {/* Quick filter chips — inside the card, under the header */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {[
                        { id: null, label: 'All' },
                        { id: 'today', label: '📅 Due Today' },
                        { id: 'week', label: '📆 This Week' },
                        { id: 'overdue', label: '🔴 Overdue' },
                        { id: 'inprogress', label: '⏱ In Progress' },
                      ].map(chip => (
                        <button key={String(chip.id)}
                          onClick={() => setQuickFilter(quickFilter === chip.id ? null : chip.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                            quickFilter === chip.id
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-purple-400 hover:text-purple-600 hover:bg-white'
                          }`}
                        >{chip.label}</button>
                      ))}
                      {quickFilter && (
                        <button onClick={() => setQuickFilter(null)} className="text-xs text-gray-400 hover:text-gray-600 ml-1">✕ Clear</button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {(() => {
                        const now = new Date();
                        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const weekEnd = new Date(todayStart); weekEnd.setDate(weekEnd.getDate() + 7);
                        const allActive = tasks.filter(t => !t.deleted && !t.completed && isCourseEnabled(t));
                        const incompleteTasks = allActive.filter(t => {
                          if (!quickFilter) return true;
                          if (quickFilter === 'today') return t.dueDate && t.dueDate >= todayStart && t.dueDate < new Date(todayStart.getTime() + 86400000);
                          if (quickFilter === 'week') return t.dueDate && t.dueDate >= todayStart && t.dueDate <= weekEnd;
                          if (quickFilter === 'overdue') return t.dueDate && t.dueDate < todayStart;
                          if (quickFilter === 'inprogress') return (t.accumulatedTime || 0) > 0;
                          return true;
                        });

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
                                className="border-2 rounded-lg p-4 transition-all bg-white hover:shadow-lg"
                                style={{ 
                                  borderColor: classColor,
                                  borderLeftWidth: '6px'
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  {/* Checkbox with loading state */}
                                  {checkingTask === task.id ? (
                                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                  ) : (
                                    <input
                                      type="checkbox"
                                      checked={task.completed || false}
                                      onChange={() => {
                                        toggleTaskCompletion(task.id);
                                        if (!task.completed) {
                                          // Task is being marked complete — offer undo
                                          if (undoCompleteTask?.timeout) clearTimeout(undoCompleteTask.timeout);
                                          const timeout = setTimeout(() => setUndoCompleteTask(null), 5000);
                                          setUndoCompleteTask({ taskId: task.id, title: cleanTaskTitle(task), timeout });
                                        }
                                      }}
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
                                                  if (e.key === 'Enter') { handleSaveTimeEstimate(task.id); }
                                                  else if (e.key === 'Escape') { handleCancelEditTime(); }
                                                }}
                                              />
                                              <span>min</span>
                                              <button onClick={() => handleSaveTimeEstimate(task.id)} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                                              <button onClick={handleCancelEditTime} className="text-red-600 hover:text-red-700"><X className="w-4 h-4" /></button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              <span>{taskTime} min</span>
                                              <button onClick={() => handleStartEditTime(task.id, taskTime)} className="text-purple-600 hover:text-purple-700" title="Edit time estimate"><Edit2 className="w-4 h-4" /></button>
                                              {gradeImpact[task.id] && (
                                                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${gradeImpact[task.id] === 'High' ? 'bg-red-100 text-red-700' : gradeImpact[task.id] === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                                                  <TrendingUp className="w-3 h-3" />
                                                  {gradeImpact[task.id]}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2 flex-shrink-0 items-center">
                                    {/* Start/Resume Session — prominent, distinct from management buttons */}
                                    {!className.toLowerCase().includes('homeroom') && (() => {
                                      const hasProgress = (task.accumulatedTime || 0) > 0;
                                      const isStarting = sessionStartingId === task.id;
                                      return (
                                        <button
                                          onClick={() => {
                                            if (isStarting) return;
                                            const sessionTask = {
                                              id: task.id, title: task.title, segment: task.segment,
                                              class: task.class, url: task.url,
                                              dueDate: task.dueDate, deadlineDateRaw: task.deadlineDateRaw,
                                              estimatedTime: task.estimatedTime, userEstimate: task.userEstimate,
                                              accumulatedTime: (task.accumulatedTime || 0) * 60,
                                              sessionActive: false, assignmentId: task.assignmentId,
                                              course_id: task.course_id, manuallyCreated: task.manuallyCreated || false,
                                            };
                                            startTaskSession(sessionTask);
                                          }}
                                          disabled={isStarting}
                                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm transition-all shadow-sm ${isStarting ? 'opacity-80 cursor-not-allowed' : 'hover:shadow-md'} ${hasProgress ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'}`}
                                          title={hasProgress ? `Resume session (${task.accumulatedTime}m logged)` : 'Start a timed session on this task'}
                                        >
                                          {isStarting
                                            ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span className="hidden sm:inline">Loading…</span></>
                                            : <><Play className="w-3.5 h-3.5" /><span className="hidden sm:inline">{hasProgress ? 'Resume' : 'Start'}</span>{hasProgress && <span className="hidden sm:inline text-blue-200 text-xs font-normal ml-0.5">({task.accumulatedTime}m)</span>}</>
                                          }
                                        </button>
                                      );
                                    })()}
                                    {!className.toLowerCase().includes('homeroom') && (
                                      <button 
                                        onClick={() => setShowSplitTask(task.id)}
                                        className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium transition-all"
                                      >
                                        Split
                                      </button>
                                    )}
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
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-6 max-w-lg mx-4 w-full max-h-[85vh] overflow-y-auto">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Split Task into Segments</h3>
                  <p className="text-gray-500 text-sm mb-4">Each segment gets its own name and optional individual deadline. Time is divided equally.</p>
                  <div className="space-y-3 mb-4">
                    {splitSegments.map((seg, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={seg.name}
                            onChange={(e) => {
                              const newSegs = [...splitSegments];
                              newSegs[idx] = { ...newSegs[idx], name: e.target.value };
                              setSplitSegments(newSegs);
                            }}
                            placeholder={`Segment ${idx + 1} name`}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          {splitSegments.length > 1 && (
                            <button onClick={() => setSplitSegments(splitSegments.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 flex-shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-gray-500 flex-shrink-0">Deadline:</span>
                          <input
                            type="date"
                            value={seg.deadlineDate || ''}
                            onChange={(e) => {
                              const newSegs = [...splitSegments];
                              newSegs[idx] = { ...newSegs[idx], deadlineDate: e.target.value };
                              setSplitSegments(newSegs);
                            }}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                          <input
                            type="time"
                            value={seg.deadlineTime || ''}
                            onChange={(e) => {
                              const newSegs = [...splitSegments];
                              newSegs[idx] = { ...newSegs[idx], deadlineTime: e.target.value };
                              setSplitSegments(newSegs);
                            }}
                            className="w-28 px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setSplitSegments([...splitSegments, { name: `Part ${splitSegments.length + 1}`, deadlineDate: '', deadlineTime: '' }])}
                    className="w-full mb-4 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 font-medium text-sm border border-blue-200"
                  >
                    + Add Segment
                  </button>
                  <div className="flex gap-3">
                    <button onClick={() => { setShowSplitTask(null); setSplitSegments([{ name: 'Part 1', deadlineDate: '', deadlineTime: '' }]); }} className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium">
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
          const eligibleTasks = sessionTasks;
          const todayFocusIds = sessionPriorities;
          const focusTasks = todayFocusIds
            ? eligibleTasks.filter(t => todayFocusIds.includes(t.id))
                .sort((a, b) => todayFocusIds.indexOf(a.id) - todayFocusIds.indexOf(b.id))
            : null;
          const now = new Date();
          const totalFocusMins = (focusTasks || []).reduce((s, t) => s + (t.userEstimate || t.estimatedTime || 20), 0);
          const totalLoggedMins = (focusTasks || []).reduce((s, t) => s + Math.floor((t.accumulatedTime || 0) / 60), 0);
          const urgentCount = eligibleTasks.filter(t => t.dueDate && (t.dueDate - now) / (1000*60*60*24) <= 1).length;
          const suggested = [...eligibleTasks]
            .sort((a, b) => {
              const aD = a.dueDate ? a.dueDate - now : Infinity;
              const bD = b.dueDate ? b.dueDate - now : Infinity;
              return aD - bD;
            })
            .filter(t => !todayFocusIds?.includes(t.id))
            .slice(0, 8);

          const getDueInfo = (task) => {
            if (!task.dueDate) return { label: 'No deadline', color: 'text-gray-400', urgency: 'none' };
            const diff = (task.dueDate - now) / (1000*60*60*24);
            if (diff <= 0) return { label: 'Overdue', color: 'text-red-600 font-semibold', urgency: 'overdue' };
            if (diff < 1) return { label: 'Due today', color: 'text-orange-600 font-semibold', urgency: 'today' };
            if (diff < 2) return { label: 'Due tomorrow', color: 'text-amber-600', urgency: 'soon' };
            if (diff < 4) return { label: `Due ${task.dueDate.toLocaleDateString('en-US', { weekday: 'short' })}`, color: 'text-yellow-600', urgency: 'soon' };
            return { label: task.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'text-gray-500', urgency: 'normal' };
          };

          const getProgressPct = (task) => {
            const est = (task.userEstimate || task.estimatedTime || 20) * 60;
            return Math.min(100, Math.round(((task.accumulatedTime || 0) / est) * 100));
          };

          return (
            <div className="h-full bg-gray-50">
              {/* Header bar */}
              <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Today's Focus</h1>
                  <p className="text-gray-500 text-xs mt-0.5">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  {urgentCount > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5" />{urgentCount} urgent
                    </span>
                  )}
                  {focusTasks && focusTasks.length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full">
                      <Timer className="w-3.5 h-3.5" />{totalFocusMins >= 60 ? `${Math.floor(totalFocusMins/60)}h ${totalFocusMins%60}m` : `${totalFocusMins}m`} focus
                    </span>
                  )}
                  <button onClick={() => { loadSessionTasks(); loadSessionPriorities(); }} className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
                </div>
              </div>

              {sessionsLoading || sessionPrioritiesLoading ? (
                <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <div className="flex h-full" style={{ minHeight: 'calc(100vh - 120px)' }}>

                  {/* ── LEFT PANEL: Focus Picker ── */}
                  <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col" style={{ minWidth: '220px', maxWidth: '300px' }}>
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span className="font-bold text-gray-900 text-sm">Today's Focus</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {focusTasks && focusTasks.length > 0 && (
                            <button onClick={clearSessionPriorities} title="Reset focus list" className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => { setSessionPickerSel(todayFocusIds ? [...todayFocusIds] : []); setSessionPrioritiesPickerOpen(true); }}
                            className="flex items-center gap-1 text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-lg font-semibold transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />{focusTasks ? 'Edit' : 'Set'}
                          </button>
                        </div>
                      </div>
                      {focusTasks && focusTasks.length > 0 && (
                        <p className="text-xs text-gray-400">{focusTasks.length} task{focusTasks.length !== 1 ? 's' : ''} · {totalFocusMins}m est · {totalLoggedMins}m logged</p>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {focusTasks && focusTasks.length > 0 ? (
                        <div className="p-2 space-y-1">
                          {focusTasks.map((task, idx) => {
                            const classColor = getClassColor(task.class);
                            const { label: dueLabel, color: dueColor } = getDueInfo(task);
                            const hasProgress = (task.accumulatedTime || 0) > 0;
                            const pct = getProgressPct(task);
                            return (
                              <div key={task.id} className="rounded-xl border border-gray-100 bg-gray-50 hover:bg-purple-50 hover:border-purple-200 transition-colors p-3 group">
                                <div className="flex items-start gap-2">
                                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{idx + 1}</span>
                                  <div className="flex-1 min-w-0">
                                    <a href={task.url} target="_blank" rel="noopener noreferrer" className="text-gray-900 text-xs font-semibold line-clamp-2 leading-snug hover:text-purple-700 hover:underline">{cleanTaskTitle(task)}</a>
                                    <p className="text-gray-500 text-xs mt-0.5 truncate">{task.class?.replace(/[\[\]]/g, '') || '—'}</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      <span className={`text-xs ${dueColor}`}>{dueLabel}</span>
                                      <span className="text-gray-400 text-xs">{task.userEstimate || task.estimatedTime}m</span>
                                      {hasProgress && <span className="text-blue-500 text-xs font-medium">{Math.floor((task.accumulatedTime||0)/60)}m done</span>}
                                    </div>
                                    {hasProgress && (
                                      <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${pct}%`, backgroundColor: classColor }} />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => { if (sessionStartingId !== task.id) startTaskSession(task); }}
                                  disabled={sessionStartingId === task.id}
                                  className={`mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${sessionStartingId === task.id ? 'opacity-75 cursor-not-allowed' : ''} ${hasProgress ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                                >
                                  {sessionStartingId === task.id ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Loading…</> : <><Play className="w-3 h-3" />{hasProgress ? 'Resume' : 'Start'}</>}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3">
                          {eligibleTasks.length === 0 ? (
                            <div className="text-center py-8">
                              <Check className="w-10 h-10 text-green-400 mx-auto mb-2" />
                              <p className="text-gray-700 text-sm font-semibold">All caught up!</p>
                              <p className="text-gray-400 text-xs mt-1">No tasks remaining.</p>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 mb-2">
                                <Brain className="w-3.5 h-3.5 text-purple-400" />
                                <span className="text-xs font-semibold text-gray-700">Suggested for today</span>
                              </div>
                              <div className="space-y-1 mb-3">
                                {suggested.map((task) => {
                                  const { label: dueLabel, color: dueColor, urgency } = getDueInfo(task);
                                  const classColor = getClassColor(task.class);
                                  return (
                                    <div key={task.id}
                                      onClick={() => {
                                        // Toggle selection inline
                                        setSessionPickerSel(prev => {
                                          const cur = prev || suggested.map(t => t.id);
                                          return cur.includes(task.id) ? cur.filter(id => id !== task.id) : [...cur, task.id];
                                        });
                                      }}
                                      className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-purple-50 cursor-pointer group transition-colors">
                                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: classColor }} />
                                      <span className="text-gray-800 text-xs flex-1 truncate">{cleanTaskTitle(task)}</span>
                                      <span className={`text-xs flex-shrink-0 ${urgency === 'overdue' || urgency === 'today' ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{dueLabel}</span>
                                    </div>
                                  );
                                })}
                                {eligibleTasks.length > suggested.length && <p className="text-gray-400 text-xs pl-3">+{eligibleTasks.length - suggested.length} more not shown</p>}
                              </div>
                              <button
                                onClick={() => {
                                  // Pre-populate picker with the smart suggestion
                                  setSessionPickerSel(suggested.map(t => t.id));
                                  setSessionPrioritiesPickerOpen(true);
                                }}
                                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Target className="w-3.5 h-3.5" />Use These Suggestions
                              </button>
                              <button
                                onClick={() => { setSessionPickerSel([]); setSessionPrioritiesPickerOpen(true); }}
                                className="w-full py-1.5 text-purple-600 hover:text-purple-800 text-xs transition-colors flex items-center justify-center gap-1"
                              >
                                Choose manually instead
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── RIGHT PANEL: Dashboard ── */}
                  <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                    {focusTasks && focusTasks.length > 0 ? (
                      <>
                        {/* View toggle tabs */}
                        <div className="bg-white border-b border-gray-200 px-5 py-2 flex items-center gap-1">
                          {[
                            { id: 'timeline', label: 'Session Plan', icon: LayoutList },
                            { id: 'kanban', label: 'Progress Board', icon: BarChart3 },
                            { id: 'focus', label: 'Focus Mode', icon: Target },
                          ].map(({ id, label, icon: Icon }) => (
                            <button
                              key={id}
                              onClick={() => setSessionDashView(id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${sessionDashView === id ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                            >
                              <Icon className="w-4 h-4" />{label}
                            </button>
                          ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-5">

                          {/* ── VIEW: Session Plan (timeline-style work blocks) ── */}
                          {sessionDashView === 'timeline' && (() => {
                            let cumMins = 0;
                            return (
                              <div className="max-w-2xl mx-auto space-y-3">
                                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-4">Planned work blocks for today</p>
                                {focusTasks.map((task, idx) => {
                                  const classColor = getClassColor(task.class);
                                  const { label: dueLabel, color: dueColor, urgency } = getDueInfo(task);
                                  const estMins = task.userEstimate || task.estimatedTime || 20;
                                  const loggedMins = Math.floor((task.accumulatedTime || 0) / 60);
                                  const hasProgress = loggedMins > 0;
                                  const pct = getProgressPct(task);
                                  const blockStart = cumMins;
                                  cumMins += estMins;
                                  const startLabel = blockStart === 0 ? 'Start' : `+${blockStart}m`;
                                  return (
                                    <div key={task.id} className={`bg-white rounded-2xl border-2 shadow-sm transition-all hover:shadow-md ${urgency === 'overdue' ? 'border-red-200' : urgency === 'today' ? 'border-orange-200' : 'border-gray-100'}`}>
                                      <div className="flex items-stretch">
                                        {/* Color bar + index */}
                                        <div className="w-12 flex-shrink-0 flex flex-col items-center justify-center py-4 rounded-l-xl" style={{ backgroundColor: classColor + '22' }}>
                                          <span className="text-xs font-bold" style={{ color: classColor }}>#{idx+1}</span>
                                          <span className="text-xs text-gray-400 mt-1">{startLabel}</span>
                                        </div>
                                        <div className="flex-1 p-4">
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                              <a href={task.url} target="_blank" rel="noopener noreferrer" className="text-gray-900 font-semibold text-sm line-clamp-2 leading-snug hover:text-purple-700 hover:underline">{cleanTaskTitle(task)}</a>
                                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: classColor }} />
                                                  {task.class?.replace(/[\[\]]/g, '') || '—'}
                                                </span>
                                                <span className={`text-xs ${dueColor}`}>{dueLabel}</span>
                                              </div>
                                            </div>
                                            <button onClick={() => { if (sessionStartingId !== task.id) startTaskSession(task); }}
                                              disabled={sessionStartingId === task.id}
                                              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all ${sessionStartingId === task.id ? 'opacity-75 cursor-not-allowed' : ''} ${hasProgress ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
                                              {sessionStartingId === task.id ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Loading…</> : <><Play className="w-4 h-4" />{hasProgress ? 'Resume' : 'Start'}</>}
                                            </button>
                                          </div>
                                          {/* Time info row */}
                                          <div className="flex items-center gap-4 mt-3">
                                            <div className="flex items-center gap-1.5">
                                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                                              <span className="text-xs text-gray-500">{estMins}m estimated</span>
                                            </div>
                                            {hasProgress && (
                                              <div className="flex items-center gap-1.5">
                                                <Timer className="w-3.5 h-3.5 text-blue-400" />
                                                <span className="text-xs text-blue-600 font-medium">{loggedMins}m logged</span>
                                              </div>
                                            )}
                                          </div>
                                          {/* Progress bar */}
                                          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: hasProgress ? classColor : '#e5e7eb' }} />
                                          </div>
                                          {hasProgress && <p className="text-xs text-gray-400 mt-0.5 text-right">{pct}% done</p>}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                                {/* Total time summary */}
                                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Timer className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm font-semibold text-purple-700">Total session time</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-lg font-bold text-purple-700">{totalFocusMins >= 60 ? `${Math.floor(totalFocusMins/60)}h ${totalFocusMins%60}m` : `${totalFocusMins}m`}</span>
                                    {totalLoggedMins > 0 && <p className="text-xs text-purple-400">{totalLoggedMins}m completed</p>}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* ── VIEW: Progress Board (kanban-style columns) ── */}
                          {sessionDashView === 'kanban' && (() => {
                            const notStarted = focusTasks.filter(t => (t.accumulatedTime || 0) === 0);
                            const inProgress = focusTasks.filter(t => (t.accumulatedTime || 0) > 0 && getProgressPct(t) < 100);
                            const nearDone = focusTasks.filter(t => getProgressPct(t) >= 100);
                            const columns = [
                              { key: 'todo', label: 'To Do', tasks: notStarted, accent: 'border-gray-200 bg-gray-50', badge: 'bg-gray-200 text-gray-600' },
                              { key: 'progress', label: 'In Progress', tasks: inProgress, accent: 'border-blue-200 bg-blue-50', badge: 'bg-blue-200 text-blue-700' },
                              { key: 'done', label: 'Over Estimated', tasks: nearDone, accent: 'border-green-200 bg-green-50', badge: 'bg-green-200 text-green-700' },
                            ];
                            return (
                              <div className="flex gap-4 h-full min-h-0" style={{ alignItems: 'flex-start' }}>
                                {columns.map(col => (
                                  <div key={col.key} className={`flex-1 min-w-0 rounded-2xl border-2 ${col.accent} p-3 flex flex-col gap-2`}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-gray-700 text-sm">{col.label}</span>
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>{col.tasks.length}</span>
                                    </div>
                                    {col.tasks.length === 0 ? (
                                      <div className="py-6 text-center text-gray-400 text-xs">Empty</div>
                                    ) : (
                                      col.tasks.map(task => {
                                        const classColor = getClassColor(task.class);
                                        const { label: dueLabel, urgency } = getDueInfo(task);
                                        const loggedMins = Math.floor((task.accumulatedTime || 0) / 60);
                                        const pct = getProgressPct(task);
                                        const hasProgress = loggedMins > 0;
                                        return (
                                          <div key={task.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                                            <div className="flex items-start gap-2 mb-2">
                                              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: classColor }} />
                                              <div className="flex-1 min-w-0">
                                                <a href={task.url} target="_blank" rel="noopener noreferrer" className="text-gray-900 text-xs font-semibold line-clamp-2 hover:text-purple-700 hover:underline">{cleanTaskTitle(task)}</a>
                                                <p className="text-gray-400 text-xs mt-0.5 truncate">{task.class?.replace(/[\[\]]/g, '') || '—'}</p>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                              <span className={`text-xs ${urgency === 'overdue' || urgency === 'today' ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{dueLabel}</span>
                                              <span className="text-gray-400 text-xs">{task.userEstimate || task.estimatedTime}m</span>
                                              {hasProgress && <span className="text-blue-500 text-xs">{loggedMins}m done</span>}
                                            </div>
                                            {hasProgress && (
                                              <div className="mb-2">
                                                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: classColor }} />
                                                </div>
                                                <p className="text-right text-xs text-gray-400 mt-0.5">{pct}%</p>
                                              </div>
                                            )}
                                            <button onClick={() => { if (sessionStartingId !== task.id) startTaskSession(task); }}
                                              disabled={sessionStartingId === task.id}
                                              className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${sessionStartingId === task.id ? 'opacity-75 cursor-not-allowed' : ''} ${hasProgress ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
                                              {sessionStartingId === task.id ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Loading…</> : <><Play className="w-3 h-3" />{hasProgress ? 'Resume' : 'Start'}</>}
                                            </button>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}

                          {/* ── VIEW: Focus Mode (one task at a time spotlight) ── */}
                          {sessionDashView === 'focus' && (() => {
                            const nextUp = focusTasks.find(t => (t.accumulatedTime || 0) === 0) || focusTasks[0];
                            const remaining = focusTasks.filter(t => t.id !== nextUp?.id);
                            const totalDone = focusTasks.filter(t => getProgressPct(t) >= 100).length;
                            if (!nextUp) return null;
                            const classColor = getClassColor(nextUp.class);
                            const { label: dueLabel, color: dueColor, urgency } = getDueInfo(nextUp);
                            const loggedMins = Math.floor((nextUp.accumulatedTime || 0) / 60);
                            const estMins = nextUp.userEstimate || nextUp.estimatedTime || 20;
                            const pct = getProgressPct(nextUp);
                            const hasProgress = loggedMins > 0;
                            return (
                              <div className="max-w-lg mx-auto">
                                {/* Progress summary */}
                                <div className="flex items-center justify-between mb-6">
                                  <span className="text-sm text-gray-500">{totalDone}/{focusTasks.length} completed</span>
                                  <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${Math.round((totalDone/focusTasks.length)*100)}%` }} />
                                  </div>
                                  <span className="text-sm font-semibold text-purple-600">{Math.round((totalDone/focusTasks.length)*100)}%</span>
                                </div>
                                {/* Spotlight card */}
                                <div className={`rounded-3xl border-2 p-8 mb-5 shadow-lg ${urgency === 'overdue' ? 'border-red-200 bg-red-50' : urgency === 'today' ? 'border-orange-200 bg-orange-50' : 'bg-white border-gray-100'}`}>
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: classColor }} />
                                    <span className="text-xs font-medium text-gray-500">{nextUp.class?.replace(/[\[\]]/g, '') || 'No class'}</span>
                                    <span className="ml-auto text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Up Next</span>
                                  </div>
                                  <a href={nextUp.url} target="_blank" rel="noopener noreferrer" className="block text-xl font-bold text-gray-900 mb-2 leading-snug hover:text-purple-700 hover:underline">{cleanTaskTitle(nextUp)}</a>
                                  <div className="flex items-center gap-4 mb-5 flex-wrap">
                                    <span className={`text-sm ${dueColor}`}>{dueLabel}</span>
                                    <span className="text-sm text-gray-500 flex items-center gap-1"><Clock className="w-4 h-4" />{estMins}m estimated</span>
                                    {hasProgress && <span className="text-sm text-blue-600 font-medium flex items-center gap-1"><Timer className="w-4 h-4" />{loggedMins}m logged</span>}
                                  </div>
                                  {hasProgress && (
                                    <div className="mb-5">
                                      <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Progress</span><span>{pct}%</span></div>
                                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: classColor }} />
                                      </div>
                                    </div>
                                  )}
                                  <button onClick={() => { if (sessionStartingId !== nextUp.id) startTaskSession(nextUp); }}
                                    disabled={sessionStartingId === nextUp.id}
                                    className={`w-full py-3.5 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-md ${sessionStartingId === nextUp.id ? 'opacity-75 cursor-not-allowed' : ''} ${hasProgress ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
                                    {sessionStartingId === nextUp.id ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Loading…</> : <><Play className="w-5 h-5" />{hasProgress ? 'Resume' : 'Start'}</>}
                                  </button>
                                </div>
                                {/* Remaining tasks mini list */}
                                {remaining.length > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2">Still to do</p>
                                    <div className="space-y-1.5">
                                      {remaining.map((task, i) => {
                                        const tc = getClassColor(task.class);
                                        const { label: dl, urgency: urg } = getDueInfo(task);
                                        const lm = Math.floor((task.accumulatedTime||0)/60);
                                        return (
                                          <div key={task.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3 py-2.5">
                                            <span className="text-xs text-gray-400 w-4">#{i+2}</span>
                                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tc }} />
                                            <a href={task.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-gray-700 truncate font-medium hover:text-purple-700 hover:underline">{cleanTaskTitle(task)}</a>
                                            <span className={`text-xs flex-shrink-0 ${urg === 'overdue' || urg === 'today' ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>{dl}</span>
                                            {lm > 0 && <span className="text-xs text-blue-500 flex-shrink-0">{lm}m</span>}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                        </div>
                      </>
                    ) : (
                      /* No focus set yet — right panel prompt */
                      <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center max-w-sm">
                          <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                            <Target className="w-10 h-10 text-purple-400" />
                          </div>
                          <h2 className="text-xl font-bold text-gray-800 mb-2">No focus list set</h2>
                          <p className="text-gray-500 text-sm mb-6">Pick your priority tasks for today using the panel on the left to unlock the session dashboard.</p>
                          <button
                            onClick={() => { setSessionPickerSel([]); setSessionPrioritiesPickerOpen(true); }}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-colors flex items-center gap-2 mx-auto"
                          >
                            <Zap className="w-5 h-5" />Set Today's Priorities
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* PRIORITIES PICKER MODAL */}
              {sessionPrioritiesPickerOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="text-gray-900 text-xl font-bold">Set Today's Priorities</h3>
                        <p className="text-gray-500 text-sm mt-0.5">Pick 1–10 tasks to focus on ({sessionPickerSel.length}/10)</p>
                      </div>
                      <button onClick={() => setSessionPrioritiesPickerOpen(false)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                      {eligibleTasks.map((task) => {
                        const classColor = getClassColor(task.class);
                        const isSelected = sessionPickerSel.includes(task.id);
                        const selIdx = sessionPickerSel.indexOf(task.id);
                        const { label: dueLabel, urgency } = getDueInfo(task);
                        return (
                          <button key={task.id}
                            disabled={!isSelected && sessionPickerSel.length >= 10}
                            onClick={() => {
                              if (isSelected) setSessionPickerSel(sessionPickerSel.filter(id => id !== task.id));
                              else if (sessionPickerSel.length < 10) setSessionPickerSel([...sessionPickerSel, task.id]);
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSelected ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white hover:bg-gray-50'} ${!isSelected && sessionPickerSel.length >= 10 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                              {isSelected ? selIdx + 1 : ''}
                            </div>
                            <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: classColor }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 text-sm font-semibold line-clamp-1">{cleanTaskTitle(task)}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-xs ${urgency === 'overdue' || urgency === 'today' ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>{dueLabel}</span>
                                <span className="text-gray-400 text-xs">{task.userEstimate || task.estimatedTime}m</span>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-purple-500 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="p-4 border-t border-gray-100 flex gap-3">
                      {sessionPickerSel.length > 0 && (
                        <button onClick={() => setSessionPickerSel([])} className="px-4 py-2.5 text-gray-500 hover:text-gray-700 text-sm transition-colors">Clear</button>
                      )}
                      <button onClick={() => setSessionPrioritiesPickerOpen(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors">Cancel</button>
                      <button onClick={() => { saveSessionPriorities(sessionPickerSel); setSessionPrioritiesPickerOpen(false); }}
                        className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-colors">
                        Save Focus List
                      </button>
                    </div>
                  </div>
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
                Back to Focus
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
                                                  <option key={t.id} value={t.id}>{cleanTaskTitle(t)}{t.dueDate ? ` — due ${t.dueDate.toLocaleDateString("en-US",{month:"short",day:"numeric"})}` : ""}</option>
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
                                                <option key={t.id} value={t.id}>{cleanTaskTitle(t)}{t.dueDate ? ` — due ${t.dueDate.toLocaleDateString("en-US",{month:"short",day:"numeric"})}` : ""}</option>
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
                <button onClick={() => { setAgendaFinishedSummary(null); triggerCompletionAnim('agenda'); startBreakTimer((agendaFinishedSummary?.totalTime || 0)); setCurrentPage('agendas'); loadAgendas(); }}
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
            return [...tasks].filter(t => {
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
              if (!a.dueDate && !b.dueDate) return 0; if (!a.dueDate) return 1; if (!b.dueDate) return -1; return a.dueDate - b.dueDate;
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
          // priorityOrder removed — tasks are deadline-sorted


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
                    // Load indicator (weekdays only)
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const pendingTasks = dayTasks.filter(t => !t.completed && !t.deleted);
                    const totalEstMin = pendingTasks.reduce((s, t) => s + (t.userEstimate || t.estimatedTime || 20), 0);
                    const loadLevel = isWeekend ? null : totalEstMin >= 180 ? 'high' : totalEstMin >= 90 ? 'medium' : totalEstMin >= 30 ? 'low' : null;
                    const loadConfig = { low: { bar: '#86efac', label: 'bg-green-100 text-green-700' }, medium: { bar: '#fbbf24', label: 'bg-amber-100 text-amber-700' }, high: { bar: '#f87171', label: 'bg-red-100 text-red-700' } };
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
                        {/* Workload indicator */}
                        {loadLevel && (
                          <div className="px-2 pb-1.5 flex items-center gap-1.5">
                            <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min(100, Math.round((totalEstMin / 180) * 100))}%`,
                                  backgroundColor: loadConfig[loadLevel].bar,
                                }}
                              />
                            </div>
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${loadConfig[loadLevel].label}`}>
                              {totalEstMin}m
                            </span>
                          </div>
                        )}

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
                                        disabled={sessionStartingId === task.id}
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (sessionStartingId === task.id) return;
                                          setCalendarExpandedId(null);
                                          // Ensure sessionTasks are loaded, then start
                                          if (sessionTasks.length === 0) await loadSessionTasks();
                                          // Build a task object compatible with startTaskSession
                                          // task is from hydrated `tasks` state: use camelCase fields
                                          const sessionTask = sessionTasks.find(t => t.id === task.id) || {
                                            ...task,
                                            accumulatedTime: (task.accumulatedTime || 0) * 60, // already minutes → convert to seconds
                                            userEstimate: task.userEstimate || task.estimatedTime,
                                            estimatedTime: task.estimatedTime,
                                          };
                                          await startTaskSession(sessionTask);
                                        }}
                                        className={`w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-semibold transition-colors ${sessionStartingId === task.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                                      >
                                        {sessionStartingId === task.id
                                          ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Loading…</>
                                          : <><Play className="w-3 h-3" />{task.accumulatedTime > 0 ? 'Resume' : 'Start'}</>
                                        }
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
                <button onClick={() => { setCurrentPage('account'); setAccountTab('settings'); setSettingsSubTab('schedule'); setTimeout(() => { document.getElementById('enhance-schedule-btn')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300); }}
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

        {currentPage === 'marks' && (() => {
          // Only show enabled courses on the Marks page
          const enabledCourses = courses.filter(c => c.enabled !== false);
          return (
          <div className="max-w-6xl mx-auto p-6 relative">
              {/* Course Sync loading overlay for Marks page */}
              {courseSyncLoading && (
                <div className="fixed inset-0 z-[800] flex items-center justify-center" style={{ backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', background: 'rgba(0,0,0,0.40)' }}>
                  <div className="pa-sync-card flex flex-col items-center gap-3 px-8 py-6 rounded-2xl shadow-2xl">
                    <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <p className="pa-sync-text font-semibold">Refreshing course data…</p>
                  </div>
                </div>
              )}
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 shadow-lg mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-8 h-8" />
                <h1 className="text-3xl font-bold">Your Marks</h1>
              </div>
              <p className="text-blue-100">Track your progress and see how you stack up</p>
              {enabledCourses.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold">
                      {(() => {
                        const scored = enabledCourses.filter(c => {
                          const s = c.current_period_score;
                          if (s == null || s === '') return false;
                          const n = parseFloat(s);
                          return !isNaN(n);
                        });
                        if (scored.length === 0) return 'N/A';
                        const avg = scored.reduce((sum, c) => sum + parseFloat(c.current_period_score), 0) / scored.length;
                        return avg.toFixed(1) + '%';
                      })()}
                    </div>
                    <div className="text-xs text-blue-100">Period Average</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold">{enabledCourses.length}</div>
                    <div className="text-xs text-blue-100">Active Courses</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold">
                      {calculateGPA(enabledCourses) ?? 'N/A'}
                    </div>
                    <div className="text-xs text-blue-100">Current GPA</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold">
                      {calculateYearAverage(enabledCourses) != null ? calculateYearAverage(enabledCourses) + '%' : 'N/A'}
                    </div>
                    <div className="text-xs text-blue-100">Year Average</div>
                  </div>
                </div>
              )}
            </div>

            {/* No courses yet */}
            {enabledCourses.length === 0 ? (
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
                  {[...enabledCourses].sort((a, b) => {
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
                                <span className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-700">Your Score</span>
                                  {difference !== null && (
                                    <span className={`font-bold ${difference >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                      {difference >= 0 ? '▲' : '▼'} {Math.abs(difference).toFixed(1)}% vs Average
                                    </span>
                                  )}
                                </span>
                                {(() => {
                                  const goalVal = userGoals[String(course.course_id)];
                                  if (goalVal == null) return null;
                                  const goalPct = Math.min(parseFloat(goalVal), 100);
                                  const isHit = userScore >= goalPct;
                                  return (
                                    <span className={`font-bold ${isHit ? 'text-green-600' : 'text-amber-600'}`}>
                                      {isHit ? `✓ Goal: ${goalPct}%` : `Goal: ${goalPct}%`}
                                    </span>
                                  );
                                })()}
                              </div>
                              {(() => {
                                const goalVal = userGoals[String(course.course_id)];
                                const goalPct = goalVal != null ? Math.min(parseFloat(goalVal), 100) : null;
                                const isHit = goalPct != null && userScore >= goalPct;
                                // Bar colour: green if goal hit, amber if goal set but not hit, default purple→blue otherwise
                                const barBg = goalPct == null
                                  ? (userScore >= 80 ? 'linear-gradient(90deg, #7c3aed, #3b82f6)' : userScore >= 60 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #ef4444, #dc2626)')
                                  : isHit
                                  ? 'linear-gradient(90deg, #10b981, #059669)'
                                  : 'linear-gradient(90deg, #f59e0b, #fb923c)';
                                return (
                                  <div className="relative h-7 bg-gray-100 rounded-full overflow-visible">
                                    {/* Score fill */}
                                    <div
                                      className="absolute top-0 left-0 h-full rounded-full flex items-center justify-end pr-3 text-white text-xs font-bold overflow-hidden"
                                      style={{
                                        width: `${Math.min(userScore, 100)}%`,
                                        background: barBg,
                                        transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        animation: `markBarSlide 1.2s cubic-bezier(0.4,0,0.2,1) ${index * 80 + 200}ms both`
                                      }}
                                    >
                                      {userScore >= 20 && `${userScore.toFixed(0)}%`}
                                    </div>
                                    {/* Goal barrier line */}
                                    {goalPct != null && (
                                      <div
                                        className="absolute top-0 bottom-0 w-0.5 z-10"
                                        style={{
                                          left: `${goalPct}%`,
                                          transform: 'translateX(-50%)',
                                          backgroundColor: isHit ? '#059669' : '#d97706',
                                          boxShadow: isHit ? '0 0 5px #10b981' : '0 0 5px #f59e0b'
                                        }}
                                      />
                                    )}
                                  </div>
                                );
                              })()}

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
          );
        })()}
        {currentPage === 'account' && (
          <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-md">
                <UserCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Account</h1>
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
                    { id: 'grades', label: 'Activity', icon: BarChart3 },
                    { id: 'goals', label: 'Goals', icon: Target },
                    { id: 'streak', label: 'Streak', icon: Zap },
                    { id: 'feedlabel', label: 'Insignia', icon: MessageSquare },
                    { id: 'gallery', label: 'Gallery', icon: Award },
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
                {accountTab === 'settings' && (() => {
                  const SETTINGS_TABS = [
                    { id: 'courses',  label: 'Courses' },
                    { id: 'schedule', label: 'Schedule' },
                    { id: 'calendar', label: 'Calendar' },
                    { id: 'other',    label: 'Other' },
                  ];
                  return (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      {/* Header + sub-tab pills */}
                      <div className="flex items-center gap-3 mb-5 flex-wrap">
                        <h2 className="text-lg font-bold text-gray-900 flex-shrink-0">Settings</h2>
                        <div className="flex gap-1 flex-wrap">
                          {SETTINGS_TABS.map(t => (
                            <button key={t.id} onClick={() => setSettingsSubTab(t.id)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                settingsSubTab === t.id
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}>
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ── Courses sub-tab ── */}
                      {settingsSubTab === 'courses' && (
                        <div>
                          <p className="text-sm text-gray-500 mb-4">Toggle courses on or off to show or hide their tasks everywhere in PlanAssist. Customize colors per course.</p>
                          {courses.length === 0 ? (
                            <p className="text-gray-400 text-sm">No courses found. Sync Canvas to load your courses.</p>
                          ) : (
                            <div className="space-y-2">
                              {courses.map(course => {
                                const className = course.name;
                                const color = (JSON.parse(localStorage.getItem('classColors') || '{}')?.[className]) || getClassColor(className);
                                return (
                                  <div key={course.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${course.enabled !== false ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}`}>
                                    <input type="checkbox" checked={course.enabled !== false}
                                      onChange={(e) => toggleCourseEnabled(course.id, e.target.checked)}
                                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer" />
                                    <input type="color" value={color}
                                      onChange={(e) => {
                                        const stored = JSON.parse(localStorage.getItem('classColors') || '{}');
                                        stored[className] = e.target.value;
                                        localStorage.setItem('classColors', JSON.stringify(stored));
                                        setAccountSetup(prev => ({ ...prev, classColors: stored }));
                                      }}
                                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0" title="Change color" />
                                    <div className="flex-1 min-w-0">
                                      <p className={`font-medium text-sm truncate ${course.enabled !== false ? 'text-gray-900' : 'text-gray-400'}`}>{course.name}</p>
                                      {course.current_period_score != null ? (
                                        <p className="text-xs text-gray-400">{course.current_period_score}% · {course.current_period_grade || course.current_grade || '–'}</p>
                                      ) : course.current_score != null ? (
                                        <p className="text-xs text-gray-400">{course.current_score}% · {course.current_grade || '–'}</p>
                                      ) : null}
                                    </div>
                                    {course.enabled === false && <span className="text-xs text-gray-400 font-medium flex-shrink-0">Hidden</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Schedule sub-tab ── */}
                      {settingsSubTab === 'schedule' && (
                        <div className="space-y-6">
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
                                            onChange={async (e) => {
                                              const newSchedule = { ...accountSetup.schedule };
                                              if (!newSchedule[day]) newSchedule[day] = {};
                                              newSchedule[day][period] = e.target.value;
                                              const updated = { ...accountSetup, schedule: newSchedule };
                                              setAccountSetup(updated);
                                              await autoSaveSetting({ schedule: newSchedule });
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
                                id="enhance-schedule-btn"
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
                        </div>
                      )}

                      {/* ── Calendar sub-tab ── */}
                      {settingsSubTab === 'calendar' && (
                        <div className="space-y-5">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Calendar Settings</h3>
                            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                              {[
                                { key: 'calendarShowHomeroom', label: 'Show Homeroom Tasks', desc: 'Homeroom tasks appear on the calendar.' },
                                { key: 'calendarShowCompleted', label: 'Show Completed Tasks', desc: 'Submitted and completed tasks appear with a strikethrough.' },
                                { key: 'calendarShowWeekends', label: 'Show Weekends', desc: 'Saturday and Sunday columns are visible on the calendar.' },
                              ].map(({ key, label, desc }) => (
                                <div key={key} className="flex items-start gap-3 p-4">
                                  <input type="checkbox" checked={accountSetup[key] !== false}
                                    onChange={async (e) => {
                                      const updated = { ...accountSetup, [key]: e.target.checked };
                                      setAccountSetup(updated);
                                      await autoSaveSetting({ [key]: e.target.checked });
                                    }}
                                    className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500" />
                                  <div>
                                    <p className="font-medium text-gray-900">{label}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1">Visible Weeks</p>
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
                                      const otherKeys = ['calendarShowPrevWeek','calendarShowCurrentWeek','calendarShowNextWeek1','calendarShowNextWeek2'].filter(k => k !== key);
                                      const otherSelected = otherKeys.some(k => k === 'calendarShowCurrentWeek' ? accountSetup[k] !== false : accountSetup[k]);
                                      if (checked && !otherSelected) return;
                                      const newVal = !checked;
                                      const updated = { ...accountSetup, [key]: newVal };
                                      setAccountSetup(updated);
                                      await autoSaveSetting({ [key]: newVal });
                                    }}>
                                    <div className="flex-1">
                                      <p className={`font-medium text-sm ${checked ? 'text-purple-800' : 'text-gray-900'}`}>{label}</p>
                                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                                    </div>
                                    {checked && <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 ml-3" />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Other sub-tab ── */}
                      {settingsSubTab === 'other' && (
                        <div className="space-y-6">
                          {/* Display */}
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Display</h3>
                            <div className="border border-gray-200 rounded-xl p-4">
                              <p className="font-medium text-gray-900 mb-1">Colour Theme</p>
                              <p className="text-xs text-gray-500 mb-3">Saved automatically.</p>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { id: 'system', label: 'System',  emoji: '☀️', desc: 'Default clean look' },
                                  { id: 'warm',   label: 'Blossom', emoji: '🌸', desc: 'Light-hearted & pink' },
                                  { id: 'cool',   label: 'Grove',   emoji: '🌿', desc: 'Dark with green energy' },
                                  { id: 'dark',   label: 'Dark',    emoji: '🌙', desc: 'Tranquil & minimal' },
                                ].map(t => (
                                  <button key={t.id} onClick={() => { setColorTheme(t.id); localStorage.setItem('planassist-theme', t.id); }}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                                      colorTheme === t.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                    }`}>
                                    <span className="text-xl flex-shrink-0">{t.emoji}</span>
                                    <div className="min-w-0">
                                      <p className={`font-semibold text-sm ${colorTheme === t.id ? 'text-purple-700' : 'text-gray-800'}`}>{t.label}</p>
                                      <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                                    </div>
                                    {colorTheme === t.id && (
                                      <div className="ml-auto w-4 h-4 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          {/* Privacy */}
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Privacy</h3>
                            <div className="border border-gray-200 rounded-xl p-4">
                              <div className="flex items-start gap-3">
                                <input type="checkbox" checked={user?.showInFeed === true}
                                  onChange={async (e) => {
                                    const newVal = e.target.checked;
                                    setUser(prev => ({ ...prev, showInFeed: newVal }));
                                    try { await apiCall('/user/feed-preference', 'PUT', { showInFeed: newVal }); }
                                    catch (err) { setUser(prev => ({ ...prev, showInFeed: !newVal })); console.error(err); }
                                  }}
                                  className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500" />
                                <div>
                                  <p className="font-medium text-gray-900">Show my task completions in Live Activity feed</p>
                                  <p className="text-xs text-gray-500 mt-1">When enabled, other students will see when you complete tasks on the Hub page. Only your name and grade are shown.</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Canvas API Token */}
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Canvas API Token</h3>
                            <p className="text-xs text-gray-400 mb-3">Your token is encrypted and stored securely. To generate one: Canvas → Account → Settings → + New Access Token.</p>
                            <div className="flex gap-2">
                              <input type="password" value={accountSetup.canvasApiToken}
                                onChange={(e) => { setAccountSetup(prev => ({ ...prev, canvasApiToken: e.target.value })); setTokenDirty(true); }}
                                placeholder="Paste your Canvas API token here..."
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono text-sm" />
                              <button
                                disabled={!tokenDirty || settingsSaving}
                                onClick={async () => {
                                  setSettingsSaving(true);
                                  try {
                                    await apiCall('/account/setup', 'POST', {
                                      grade: accountSetup.grade,
                                      canvasApiToken: accountSetup.canvasApiToken,
                                      presentPeriods: accountSetup.presentPeriods,
                                      schedule: accountSetup.schedule,
                                    });
                                    const tokenChanged = accountSetup.canvasApiToken !== savedCanvasTokenRef.current;
                                    if (accountSetup.canvasApiToken && tokenChanged) {
                                      savedCanvasTokenRef.current = accountSetup.canvasApiToken;
                                      await fetchCanvasTasks();
                                    }
                                    setTokenDirty(false);
                                  } catch (err) { alert('Failed to save token: ' + err.message); }
                                  finally { setSettingsSaving(false); }
                                }}
                                className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all flex-shrink-0 ${
                                  tokenDirty && !settingsSaving
                                    ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}>
                                {settingsSaving ? 'Saving…' : 'Confirm'}
                              </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">🔒 Never share your token with anyone.</p>
                          </div>
                          {/* Grade */}
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Grade</h3>
                            <select value={accountSetup.grade}
                              onChange={async (e) => {
                                const updated = { ...accountSetup, grade: e.target.value };
                                setAccountSetup(updated);
                                await autoSaveSetting({ grade: e.target.value });
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500">
                              <option value="">Select your grade...</option>
                              {['3','4','5','6','7','8','9','10','11','12'].map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                          </div>
                          {/* Present Periods */}
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Present Periods (Time Zone)</h3>
                            <select value={accountSetup.presentPeriods}
                              onChange={async (e) => {
                                const updated = { ...accountSetup, presentPeriods: e.target.value };
                                setAccountSetup(updated);
                                await autoSaveSetting({ presentPeriods: e.target.value });
                              }}
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
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── ACTIVITY TAB ── */}
                {accountTab === 'grades' && (() => {
                  const FILTERS = [
                    { key: 'grades',        label: '📊 Grades' },
                    { key: 'announcements', label: '📢 Announcements' },
                    { key: 'discussions',   label: '💬 Discussions' },
                    { key: 'messages',      label: '✉️ Messages' },
                    { key: 'resolutions',   label: '✅ Resolutions' },
                  ];

                  const isLoading = activityFilter === 'grades' ? gradesLoading
                    : activityFilter === 'announcements' ? announcementsLoading
                    : activityFilter === 'discussions' ? discussionsLoading
                    : activityFilter === 'resolutions' ? resolvedLoading
                    : activityLoading;

                  // Filter items by search query
                  const searchLower = activitySearch.toLowerCase();
                  const filterBySearch = (arr, keys) => !searchLower ? arr : arr.filter(item =>
                    keys.some(k => (item[k] || '').toLowerCase().includes(searchLower))
                  );

                  const gradesFiltered = filterBySearch(gradesItems, ['assignmentName', 'courseName']);
                  const announcementsFiltered = filterBySearch(announcementItems, ['title', 'body', 'courseName']);
                  const discussionsFiltered = filterBySearch(discussionItems, ['title', 'body', 'courseName']);
                  const messagesFiltered = filterBySearch(
                    activityItems.filter(i => i.type === 'Message' || i.type === 'Conversation'),
                    ['title', 'body']
                  );
                  const resolutionsFiltered = filterBySearch(resolvedTasks, ['title', 'class']);

                  return (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative">
                      {gradeSyncLoading && (
                        <div className="pa-sync-overlay absolute inset-0 z-20 flex items-center justify-center rounded-2xl" style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
                          <div className="pa-sync-card flex flex-col items-center gap-3 px-6 py-4 rounded-xl">
                            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                            <p className="pa-sync-text text-sm font-semibold">Refreshing grades…</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Activity</h2>
                        {isLoading && <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />}
                      </div>

                      {/* Filter pills */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {FILTERS.map(f => (
                          <button key={f.key} onClick={() => {
                            setActivityFilter(f.key);
                            setActivitySearch('');
                            if (f.key === 'resolutions') loadResolvedTasks('', resolvedSort);
                          }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              activityFilter === f.key ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}>
                            {f.label}
                          </button>
                        ))}
                      </div>

                      {/* Search bar — all tabs */}
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input value={activitySearch}
                          onChange={(e) => {
                            setActivitySearch(e.target.value);
                            if (activityFilter === 'resolutions') loadResolvedTasks(e.target.value, resolvedSort);
                          }}
                          placeholder={`Search ${activityFilter}…`}
                          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500" />
                      </div>

                      {/* ── Grades ── */}
                      {activityFilter === 'grades' && (
                        <div>
                          {gradesLoading && gradesItems.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">Loading grades...</p>
                          ) : gradesFiltered.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">{gradesItems.length === 0 ? 'No graded assignments found yet. Grades appear here after a Sync detects a score change.' : 'No results.'}</p>
                          ) : (
                            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                              {gradesFiltered.map(item => {
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
                                      {gradedDate && <p className="text-xs text-gray-300 mt-0.5">Graded {gradedDate}</p>}
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

                      {/* ── Announcements ── */}
                      {activityFilter === 'announcements' && (
                        <div>
                          {announcementsLoading && announcementItems.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">Loading announcements...</p>
                          ) : announcementsFiltered.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">No results.</p>
                          ) : (
                            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                              {announcementsFiltered.map(item => (
                                <div key={item.id} className="p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                                  {item.htmlUrl ? (
                                    <a href={item.htmlUrl} target="_blank" rel="noreferrer"
                                      className="font-medium text-sm text-gray-900 hover:text-purple-700 hover:underline block">{item.title}</a>
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

                      {/* ── Discussions ── */}
                      {activityFilter === 'discussions' && (
                        <div>
                          {discussionsLoading && discussionItems.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">Loading discussions...</p>
                          ) : discussionsFiltered.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">No results.</p>
                          ) : (
                            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                              {discussionsFiltered.map(item => (
                                <div key={item.id} className="p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      {item.htmlUrl ? (
                                        <a href={item.htmlUrl} target="_blank" rel="noreferrer"
                                          className="font-medium text-sm text-gray-900 hover:text-purple-700 hover:underline block truncate">{item.title}</a>
                                      ) : (
                                        <p className="font-medium text-sm text-gray-900 truncate">{item.title}</p>
                                      )}
                                      {item.courseName && <p className="text-xs text-purple-500 font-medium mt-0.5">{item.courseName}</p>}
                                      {item.body && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{item.body}</p>}
                                      {item.lastReplyAt && <p className="text-xs text-gray-300 mt-1">Last reply {new Date(item.lastReplyAt).toLocaleDateString()}</p>}
                                    </div>
                                    {item.unreadCount > 0 && (
                                      <span className="flex-shrink-0 bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">{item.unreadCount} new</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Messages ── */}
                      {activityFilter === 'messages' && (
                        <div>
                          {activityLoading && activityItems.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">Loading messages...</p>
                          ) : messagesFiltered.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">No results.</p>
                          ) : (
                            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                              {messagesFiltered.map(item => (
                                <div key={item.id} className="p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                                  {item.htmlUrl ? (
                                    <a href={item.htmlUrl} target="_blank" rel="noreferrer"
                                      className="font-medium text-sm text-gray-900 hover:text-purple-700 hover:underline block truncate">{item.title || 'Message'}</a>
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

                      {/* ── Resolutions ── */}
                      {activityFilter === 'resolutions' && (
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <p className="text-sm text-gray-500 flex-1">Completed and dismissed tasks. Restore any task to send it back to your Task List.</p>
                            <select value={resolvedSort}
                              onChange={(e) => { setResolvedSort(e.target.value); loadResolvedTasks(activitySearch, e.target.value); }}
                              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 flex-shrink-0">
                              <option value="created_at">Sort: Sync Date</option>
                              <option value="deadline">Sort: Deadline</option>
                            </select>
                          </div>
                          {resolvedLoading ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : resolutionsFiltered.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">No resolved tasks found.</p>
                          ) : (
                            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                              {resolutionsFiltered.map(task => {
                                const deadlineStr = (() => {
                                  if (!task.deadline_date) return null;
                                  const dp = task.deadline_date.includes('T') ? task.deadline_date.split('T')[0] : task.deadline_date;
                                  const d = task.deadline_time ? new Date(`${dp}T${task.deadline_time}Z`) : new Date(`${dp}T23:59:00`);
                                  return d.toLocaleDateString();
                                })();
                                const isCompleted = task.completed === true || task.completed === 'true';
                                const statusLabel = isCompleted ? 'Completed' : 'Dismissed';
                                const statusColor = isCompleted ? 'text-green-600' : 'text-gray-400';
                                const dotColor = isCompleted ? 'bg-green-400' : 'bg-gray-300';
                                const hasSession = task.session_actual_time != null;
                                return (
                                  <div key={task.id} className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                                    <div className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
                                    <div className="flex-1 min-w-0">
                                      <a href={task.url} target="_blank" rel="noreferrer"
                                        className="font-medium text-sm text-gray-900 hover:text-purple-700 hover:underline block truncate">
                                        {task.title}{task.segment ? ` · ${task.segment}` : ''}
                                      </a>
                                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        <span className="text-xs text-gray-400">{task.class}</span>
                                        {deadlineStr && <><span className="text-xs text-gray-300">·</span><span className="text-xs text-gray-400">Due {deadlineStr}</span></>}
                                        <span className="text-xs text-gray-300">·</span>
                                        <span className={`text-xs font-medium ${statusColor}`}>
                                          {statusLabel}
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
                                          {statusLabel} {new Date(task.completed_at).toLocaleDateString()}
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
                    </div>
                  );
                })()}

                {/* ── GOALS TAB ── */}
                {accountTab === 'goals' && (
                  <div className="relative">
                    {courseSyncLoading && (
                      <div className="pa-sync-overlay absolute inset-0 z-20 flex items-center justify-center rounded-xl" style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
                        <div className="pa-sync-card flex flex-col items-center gap-3 px-6 py-4 rounded-xl">
                          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                          <p className="pa-sync-text text-sm font-semibold">Refreshing course data…</p>
                        </div>
                      </div>
                    )}
                  <GoalsPanel
                    courses={courses}
                    userGoals={userGoals}
                    setUserGoals={setUserGoals}
                    loadGoals={loadGoals}
                    apiCall={apiCall}
                  />
                  </div>
                )}

                {/* ── STREAK TAB ── */}
                {accountTab === 'streak' && (() => {
                  const completionDays = completionHistory
                    .map(h => h.localDate || (h.date instanceof Date
                      ? `${h.date.getFullYear()}-${String(h.date.getMonth()+1).padStart(2,'0')}-${String(h.date.getDate()).padStart(2,'0')}`
                      : String(h.date).slice(0,10)))
                    .filter(Boolean);
                  const uniqueDays = [...new Set(completionDays)];
                  const currentStreak = computeStreak(uniqueDays, streakShieldLog);
                  const today = getLocalDateStr();
                  const todayWeekday = isWeekday(today);
                  const todayDone = uniqueDays.includes(today);
                  const todayShielded = streakShieldLog.includes(today);

                  // Find the previous weekday (skipping weekend days backwards from yesterday)
                  const prevWeekday = (() => {
                    let d = parseLocalDate(today);
                    d.setDate(d.getDate() - 1);
                    while (!isWeekday(fmtLocal(d))) d.setDate(d.getDate() - 1);
                    return fmtLocal(d);
                  })();
                  const prevWeekdayShielded = streakShieldLog.includes(prevWeekday);
                  const prevWeekdayDone = uniqueDays.includes(prevWeekday);

                  // Streak state — determines colour and label only, not the streak count
                  let streakState = 'safe';
                  if (!todayWeekday) {
                    streakState = 'weekend';
                  } else if (todayDone || todayShielded) {
                    streakState = 'safe';
                  } else if (prevWeekdayShielded && !prevWeekdayDone) {
                    // The last weekday was shielded but not completed — streak is alive but fragile
                    streakState = 'shield_used_prev';
                  } else {
                    streakState = 'at_risk';
                  }

                  const stateConfig = {
                    weekend:          { color: 'from-blue-400 to-indigo-500',   label: 'Weekend',                  sub: 'Streak safe — enjoy your break!',             icon: '🏖️' },
                    safe:             { color: 'from-green-400 to-emerald-500',  label: 'Streak Safe!',             sub: todayShielded ? 'Streak protected by a shield today.' : "You've completed a task today.",  icon: todayShielded ? '🛡️' : '✅' },
                    at_risk:          { color: 'from-orange-400 to-red-500',     label: 'Streak at Risk!',          sub: 'Complete a task today to keep your streak.',  icon: '⚠️' },
                    shield_used_prev: { color: 'from-yellow-400 to-orange-400', label: 'Streak Hanging On!',       sub: 'Last weekday was shielded. Complete a task today!', icon: '🛡️' },
                  };
                  const cfg = stateConfig[streakState];

                  // Personal record — uses shield dates too so shielded days count toward PR
                  const personalRecord = Math.max(computePersonalRecord(uniqueDays, streakShieldLog), currentStreak);

                  if (streakLoading) return (
                    <div className="flex items-center justify-center py-20">
                      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  );
                  return (
                    <div className="space-y-4">
                      {/* Main streak card */}
                      <div className={`bg-gradient-to-br ${cfg.color} rounded-2xl p-8 text-white text-center shadow-lg`}>
                        <div className="text-5xl mb-2">{cfg.icon}</div>
                        <div className="text-7xl font-black mb-1">{currentStreak}</div>
                        <div className="text-white/80 text-sm font-medium mb-1">day streak</div>
                        <div className="font-bold text-lg">{cfg.label}</div>
                        <div className="text-white/80 text-sm mt-1">{cfg.sub}</div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
                          <div className="text-2xl font-bold text-purple-600">{personalRecord}</div>
                          <div className="text-xs text-gray-500 mt-0.5">Your record</div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
                          <div className="text-2xl font-bold text-yellow-500">{streakShieldsAvailable}</div>
                          <div className="text-xs text-gray-500 mt-0.5">Shields available</div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
                          <div className="text-2xl font-bold text-blue-500">{streakShieldLog.length}</div>
                          <div className="text-xs text-gray-500 mt-0.5">Shields used</div>
                        </div>
                      </div>

                      {/* Shield controls */}
                      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">Streak Shield</p>
                            <p className="text-xs text-gray-500 mt-0.5">Protect your streak on missed weekdays</p>
                          </div>
                          <button
                            disabled={streakShieldsAvailable < 1 || streakState === 'safe' || streakState === 'weekend'}
                            onClick={async () => {
                              try {
                                const r = await apiCall('/streak/shields/use', 'POST', { date: today });
                                const confirmedDate = r.shieldedDate || today;
                                // Optimistic update — snaps UI to 'safe' immediately
                                setStreakShieldsAvailable(r.remaining);
                                setStreakShieldLog(prev => [...new Set([...prev, confirmedDate])]);
                                if (r.alreadyShielded) {
                                  setStreakShieldToast('🛡️ This day is already shielded.');
                                } else {
                                  setStreakShieldToast('🛡️ Streak Shield used! Your streak is protected.');
                                }
                                setTimeout(() => setStreakShieldToast(null), 4000);
                                // Silent background sync to confirm server state
                                loadStreakData({ silent: true });
                              } catch (err) { alert(err.message); }
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                              streakShieldsAvailable < 1 || streakState === 'safe' || streakState === 'weekend'
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-yellow-400 hover:bg-yellow-500 text-white shadow-md'
                            }`}
                          >
                            {streakShieldsAvailable < 1 ? '🛡️ No shields' : '🛡️ Use Shield'}
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">Mode:</span>
                          {['manual','automatic'].map(m => (
                            <button key={m} onClick={async () => {
                              await apiCall('/streak/shields/mode', 'PUT', { mode: m });
                              setStreakShieldMode(m);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${streakShieldMode === m ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                              {m.charAt(0).toUpperCase() + m.slice(1)}
                            </button>
                          ))}
                          <span className="text-xs text-gray-400 ml-1">
                            {streakShieldMode === 'automatic' ? '(shields auto-fill gaps on Hub load)' : '(tap Use Shield to save your streak)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── INSIGNIA TAB ── */}
                {accountTab === 'feedlabel' && (() => {
                  // INSIGNIA_STYLES and INSIGNIA_KEYFRAMES defined at component scope above
                  const unlockedLabels = insigniaUnlocked.map(u => u.label);
                  if (insigniaLoading) return (
                    <div className="flex items-center justify-center py-20">
                      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  );
                  return (
                    <div>
                      <style>{INSIGNIA_KEYFRAMES}</style>
                      <h2 className="text-lg font-bold text-gray-900 mb-1">Insignia</h2>
                      <p className="text-sm text-gray-500 mb-1">Your Insignia styles your name across PlanAssist — in the nav, Hub, Feed, and Leaderboard.</p>
                      <p className="text-xs text-gray-400 mb-5">You have completed tasks on <span className="font-bold text-purple-600">{insigniaDays}</span> days — unlocking {unlockedLabels.length} / {INSIGNIA_THRESHOLDS.length} Insignias.</p>
                      <div className="grid grid-cols-2 gap-2">
                        {INSIGNIA_THRESHOLDS.map(([threshold, label]) => {
                          const unlocked = unlockedLabels.includes(label);
                          const selected = insigniaSelected === label;
                          return (
                            <button
                              key={label}
                              disabled={!unlocked || insigniaLoading}
                              onClick={async () => {
                                if (!unlocked || insigniaSelected === label) return;
                                setInsigniaSelected(label); // optimistic
                                try {
                                  await apiCall('/insignia', 'PUT', { label });
                                  // Refresh feed and leaderboard so the new insignia is reflected immediately
                                  loadCompletionFeed();
                                  loadLeaderboard();
                                } catch (err) {
                                  console.error('Insignia update failed:', err.message);
                                  await loadInsignia(); // revert on failure
                                }
                              }}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                                selected ? 'border-purple-500 shadow-md ring-2 ring-purple-200' :
                                unlocked ? 'border-gray-200 hover:border-gray-300 hover:shadow-sm' :
                                'border-gray-100 opacity-35 cursor-not-allowed'
                              }`}
                              style={{ background: '#fff' }}
                            >
                              <span className="flex-1 text-sm font-medium">
                                {renderInsigniaName(label, label, { fontSize:'0.875rem' })}
                              </span>
                              <span className="text-xs text-gray-500">{threshold === 0 ? 'default' : `${threshold} days`}</span>
                              {selected && <span className="text-purple-600 text-xs font-bold">✓</span>}
                              {!unlocked && <span className="text-gray-400 text-xs">🔒</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* ── GALLERY TAB ── */}
                {accountTab === 'gallery' && (() => {
                  const BADGE_DEFS = {
                    first_completion: { emoji: '🎯', name: 'First Step', desc: 'Completed your first task' },
                    tasks_10: { emoji: '📚', name: 'Getting Started', desc: '10 tasks completed' },
                    tasks_25: { emoji: '💪', name: 'Building Momentum', desc: '25 tasks completed' },
                    tasks_50: { emoji: '🔥', name: 'On Fire', desc: '50 tasks completed' },
                    tasks_100: { emoji: '💯', name: 'Century', desc: '100 tasks completed' },
                    tasks_250: { emoji: '⚡', name: 'Powerhouse', desc: '250 tasks completed' },
                    tasks_500: { emoji: '👑', name: 'Legend', desc: '500 tasks completed' },
                    streak_7: { emoji: '📅', name: 'Week Warrior', desc: '7-day streak' },
                    streak_14: { emoji: '🌟', name: 'Fortnight Focus', desc: '14-day streak' },
                    streak_30: { emoji: '🗓️', name: 'Monthly Devotion', desc: '30-day streak' },
                    streak_60: { emoji: '🏆', name: 'Champion', desc: '60-day streak' },
                    streak_100: { emoji: '🎖️', name: 'Elite', desc: '100-day streak' },
                    day_3: { emoji: '🌅', name: 'Productive Day', desc: '3 tasks in one day' },
                    day_5: { emoji: '⚡', name: 'High Output', desc: '5 tasks in one day' },
                    day_10: { emoji: '🚀', name: 'Beast Mode', desc: '10 tasks in one day' },
                    day_20: { emoji: '🌋', name: 'Unstoppable', desc: '20 tasks in one day' },
                    early_bird: { emoji: '🐦', name: 'Early Bird', desc: 'Completed a task before 8am' },
                    night_owl: { emoji: '🦉', name: 'Night Owl', desc: 'Completed a task after 10pm' },
                  };
                  const earnedKeys = new Set(userBadges.map(b => b.badge_key));
                  const earned = userBadges.map(b => ({
                      ...b,
                      ...(BADGE_DEFS[b.badge_key] || {
                        emoji: '🏅',
                        name: b.badge_key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                        desc: ''
                      })
                    }));
                  const locked = Object.entries(BADGE_DEFS).filter(([k]) => !earnedKeys.has(k));
                  if (galleryLoading) return (
                    <div className="flex items-center justify-center py-20">
                      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  );
                  return (
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-1">Gallery</h2>
                      <p className="text-sm text-gray-500 mb-5">{earned.length} of {Object.keys(BADGE_DEFS).length} badges earned</p>
                      {earned.length > 0 && (
                        <div className="mb-6">
                          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-3">Earned</p>
                          <div className="grid grid-cols-3 gap-3">
                            {earned.map(b => (
                              <div key={b.badge_key} className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-4 text-center shadow-sm">
                                <div className="text-3xl mb-1">{b.emoji}</div>
                                <div className="font-bold text-gray-800 text-xs">{b.name}</div>
                                <div className="text-gray-500 text-xs mt-0.5">{b.desc}</div>
                                <div className="text-gray-400 text-xs mt-1">{new Date(b.awarded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {locked.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-3">Locked</p>
                          <div className="grid grid-cols-3 gap-3">
                            {locked.map(([key, def]) => (
                              <div key={key} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center opacity-50">
                                <div className="text-3xl mb-1 grayscale">{def.emoji}</div>
                                <div className="font-bold text-gray-500 text-xs">{def.name}</div>
                                <div className="text-gray-400 text-xs mt-0.5">{def.desc}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

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
                { id: 'feedback', label: 'Feedback', icon: MessageSquare },
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
                    if (id === 'feedback') loadAdminFeedback();
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
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* User list */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-4 border-b border-gray-100 space-y-2">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        value={adminSearch}
                        onChange={e => setAdminSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    {/* Filters */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={adminFilter.status}
                        onChange={e => setAdminFilter(f => ({ ...f, status: e.target.value }))}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:ring-1 focus:ring-red-400 focus:border-transparent bg-white"
                      >
                        <option value="all">All Users</option>
                        <option value="new">New Users</option>
                        <option value="not_new">Not New</option>
                        <option value="active">Active Now</option>
                        <option value="not_active">Not Active</option>
                        <option value="banned">Banned</option>
                      </select>
                      <select
                        value={adminFilter.grade}
                        onChange={e => setAdminFilter(f => ({ ...f, grade: e.target.value }))}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:ring-1 focus:ring-red-400 focus:border-transparent bg-white"
                      >
                        <option value="all">All Grades</option>
                        {[...new Set(adminUsers.map(u => u.grade).filter(Boolean))].sort().map(g => (
                          <option key={g} value={String(g)}>Grade {g}</option>
                        ))}
                      </select>
                      <select
                        value={adminSort}
                        onChange={e => setAdminSort(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:ring-1 focus:ring-red-400 focus:border-transparent bg-white"
                      >
                        <option value="name_asc">A → Z</option>
                        <option value="name_desc">Z → A</option>
                        <option value="joined_newest">Newest First</option>
                        <option value="joined_oldest">Oldest First</option>
                        <option value="grade_asc">Grade ↑</option>
                        <option value="grade_desc">Grade ↓</option>
                        <option value="active_tasks_desc">Most Tasks</option>
                        <option value="active_tasks_asc">Fewest Tasks</option>
                        <option value="completions_desc">Most Completions</option>
                        <option value="completions_asc">Fewest Completions</option>
                        <option value="health_desc">Healthiest First</option>
                        <option value="health_asc">Needs Attention First</option>
                      </select>
                    </div>
                    {/* Active filter summary */}
                    {(() => {
                      const filtered = adminUsers
                        .filter(u => !adminSearch || u.name?.toLowerCase().includes(adminSearch.toLowerCase()) || u.email?.toLowerCase().includes(adminSearch.toLowerCase()) || u.grade?.toString().includes(adminSearch))
                        .filter(u => {
                          if (adminFilter.status === 'new') return u.is_new_user;
                          if (adminFilter.status === 'not_new') return !u.is_new_user;
                          if (adminFilter.status === 'active') return u.in_session;
                          if (adminFilter.status === 'not_active') return !u.in_session;
                          if (adminFilter.status === 'banned') return u.is_banned;
                          return true;
                        })
                        .filter(u => adminFilter.grade === 'all' || String(u.grade) === adminFilter.grade)
                        .filter(u => {
                          return true;
                        });
                      const hasFilters = adminFilter.status !== 'all' || adminFilter.grade !== 'all' || adminSearch;
                      return (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">{filtered.length} of {adminUsers.length} users</span>
                          {hasFilters && (
                            <button
                              onClick={() => { setAdminFilter({ status: 'all', grade: 'all', unsorted: 'all' }); setAdminSearch(''); }}
                              className="text-xs text-red-500 hover:text-red-700 font-medium"
                            >
                              Clear filters
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="overflow-y-auto max-h-[600px]">
                    {adminLoading && <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>}
                    {(() => {
                      const sortFn = (a, b) => {
                        switch (adminSort) {
                          case 'name_desc': return (b.name || '').localeCompare(a.name || '');
                          case 'joined_newest': return new Date(b.created_at) - new Date(a.created_at);
                          case 'joined_oldest': return new Date(a.created_at) - new Date(b.created_at);
                          case 'grade_asc': return (parseInt(a.grade) || 0) - (parseInt(b.grade) || 0);
                          case 'grade_desc': return (parseInt(b.grade) || 0) - (parseInt(a.grade) || 0);
                          case 'active_tasks_desc': return (parseInt(b.active_tasks) || 0) - (parseInt(a.active_tasks) || 0);
                          case 'active_tasks_asc': return (parseInt(a.active_tasks) || 0) - (parseInt(b.active_tasks) || 0);
                          case 'completions_desc': return (parseInt(b.total_completed) || 0) - (parseInt(a.total_completed) || 0);
                          case 'completions_asc': return (parseInt(a.total_completed) || 0) - (parseInt(b.total_completed) || 0);
                          case 'health_desc': {
                            const hs = (u) => { const d=u.last_sync?Math.floor((Date.now()-new Date(u.last_sync))/86400000):99; return Math.round(Math.min(100,Math.max(0,25-d*3)+(u.has_canvas_token?25:0)+Math.min(25,Math.round(((parseInt(u.completed_this_week)||0)/Math.max(1,parseInt(u.active_tasks)||1))*25))+(u.in_session?25:(parseInt(u.completed_this_week)>0?20:0)))); };
                            return hs(b) - hs(a);
                          }
                          case 'health_asc': {
                            const hs = (u) => { const d=u.last_sync?Math.floor((Date.now()-new Date(u.last_sync))/86400000):99; return Math.round(Math.min(100,Math.max(0,25-d*3)+(u.has_canvas_token?25:0)+Math.min(25,Math.round(((parseInt(u.completed_this_week)||0)/Math.max(1,parseInt(u.active_tasks)||1))*25))+(u.in_session?25:(parseInt(u.completed_this_week)>0?20:0)))); };
                            return hs(a) - hs(b);
                          }
                          default: return (a.name || '').localeCompare(b.name || '');
                        }
                      };
                      return adminUsers
                        .filter(u => !adminSearch || u.name?.toLowerCase().includes(adminSearch.toLowerCase()) || u.email?.toLowerCase().includes(adminSearch.toLowerCase()) || u.grade?.toString().includes(adminSearch))
                        .filter(u => {
                          if (adminFilter.status === 'new') return u.is_new_user;
                          if (adminFilter.status === 'not_new') return !u.is_new_user;
                          if (adminFilter.status === 'active') return u.in_session;
                          if (adminFilter.status === 'not_active') return !u.in_session;
                          if (adminFilter.status === 'banned') return u.is_banned;
                          return true;
                        })
                        .filter(u => adminFilter.grade === 'all' || String(u.grade) === adminFilter.grade)
                        .filter(u => {
                          return true;
                        })
                        .sort(sortFn)
                        .map(u => (
                          <div
                            key={u.id}
                            onClick={() => { setAdminSelectedUser(u.id); loadAdminUserDetail(u.id); }}
                            className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${adminSelectedUser === u.id ? 'bg-red-50 border-l-2 border-l-red-500' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-medium text-sm text-gray-900">{u.name || '(unnamed)'}</p>
                                  {(() => {
                                    const daysSinceSync = u.last_sync ? Math.floor((Date.now() - new Date(u.last_sync)) / 86400000) : 99;
                                    const s = Math.round(Math.min(100, Math.max(0,25-daysSinceSync*3) + (u.has_canvas_token?25:0) + Math.min(25,Math.round(((parseInt(u.completed_this_week)||0)/Math.max(1,parseInt(u.active_tasks)||1))*25)) + (u.in_session?25:(parseInt(u.completed_this_week)>0?20:0))));
                                    return <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${s>=75?'text-green-700 bg-green-100':s>=45?'text-amber-700 bg-amber-100':'text-red-700 bg-red-100'}`}>{s}</span>;
                                  })()}
                                </div>
                                <p className="text-xs text-gray-400">{u.email}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-xs text-gray-500">Gr {u.grade || '?'}</span>
                                <div className="flex gap-1 flex-wrap justify-end">
                                  {u.is_admin && <span className="text-xs bg-red-100 text-red-600 px-1.5 rounded font-medium">Admin</span>}
                                  {u.is_banned && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 rounded font-medium">Banned</span>}
                                  {u.is_new_user && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 rounded font-medium">New</span>}
                                  
                                  {u.in_session && <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded font-medium flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block"></span>Active</span>}
                                </div>
                              </div>
                            </div>
                            <div className="mt-1">
                              <span className="text-xs text-gray-400">{parseInt(u.active_tasks) || 0} tasks · {parseInt(u.total_completed) || 0} completed · joined {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} · last sync {u.last_sync ? new Date(u.last_sync).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'never'}</span>
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                </div>

                {/* User detail */}
                <div className="lg:col-span-3">
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
                              {adminUserDetail.tasks.some(t => t.session_active) && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block"></span>
                                  Active: {adminUserDetail.tasks.find(t => t.session_active)?.title?.replace(/\s*\[[^\]]+\]\s*/,'')?.slice(0,30) || 'Task'}
                                </span>
                              )}
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
                              <button onClick={async () => {
                                try {
                                  const r = await apiCall(`/admin/users/${u.id}/grant-shield`, 'POST', {});
                                  alert(`✅ Shield granted to ${u.name}. They now have ${r.shields} shield(s).`);
                                  loadAdminUsers();
                                } catch (err) { alert('Failed: ' + err.message); }
                              }} className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 flex items-center gap-1">
                                🛡️ Grant Shield {u.streak_shields_available > 0 && <span className="ml-1 font-bold">({u.streak_shields_available})</span>}
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
                          <h4 className="font-semibold text-gray-700 mb-3 text-sm">Active Tasks ({adminUserDetail.tasks.length})</h4>
                          {adminUserDetail.tasks.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">No active tasks.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {adminUserDetail.tasks.map(t => (
                                <div key={t.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-lg">
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium text-gray-800 truncate block">{t.title}{t.segment ? ` · ${t.segment}` : ''}</span>
                                    <span className="text-gray-400">{t.class} · {(() => { if (!t.deadline_date) return 'no date'; const dp = (t.deadline_date.includes('T') ? t.deadline_date.split('T')[0] : t.deadline_date); const d = t.deadline_time ? new Date(dp + 'T' + t.deadline_time + 'Z') : new Date(dp + 'T23:59:00'); return d.toLocaleDateString(); })()}</span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                    {t.session_active && <span className="text-green-500 text-xs font-medium">Active</span>}
                                    <button onClick={() => adminDeleteTask(t.id)} className="text-red-400 hover:text-red-600">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Recent completions */}
                        {adminUserDetail.recentCompletions?.length > 0 && (
                          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <h4 className="font-semibold text-gray-700 mb-3 text-sm">Recent Completions ({adminUserDetail.recentCompletions.length})</h4>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {adminUserDetail.recentCompletions.map((tc, i) => (
                                <div key={i} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-lg">
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium text-gray-800 truncate block">{tc.title}</span>
                                    <span className="text-gray-400">{tc.class}</span>
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-2">
                                    <p className="text-gray-600">{tc.actual_time}m logged</p>
                                    <p className="text-gray-400">{new Date(tc.completed_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}


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
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">Audience:</span>
                        {[['all','Everyone'],['existing','Existing Users'],['new','New Users']].map(([val,lbl]) => (
                          <button key={val}
                            onClick={() => setNewAnnouncementAudience(val)}
                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${(newAnnouncementAudience||'all') === val ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 text-gray-600 hover:border-red-400'}`}
                          >{lbl}</button>
                        ))}
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
                              <span className="text-gray-400">{u.last_sync ? new Date(u.last_sync).toLocaleDateString() : 'never'}</span>
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

                      {/* Activity Heatmap — time-of-day across all days */}
                      {d.activityHeatmap && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                          <h4 className="font-bold text-gray-900 mb-3">Activity Heatmap — Time of Day (all days combined)</h4>
                          <div className="flex items-end gap-1 h-20">
                            {d.activityHeatmap.map((bucket) => {
                              const max = Math.max(...d.activityHeatmap.map(b => b.count), 1);
                              const pct = Math.round((bucket.count / max) * 100);
                              return (
                                <div key={bucket.hour} className="flex flex-col items-center flex-1 gap-1" title={`${bucket.hour}:00 — ${bucket.count} completions`}>
                                  <div className="w-full rounded-t" style={{ height: `${Math.max(4, pct * 0.68)}px`, backgroundColor: `rgba(124,77,255,${0.15 + pct/100*0.85})` }} />
                                  <span className="text-xs text-gray-400" style={{ fontSize: '9px' }}>{bucket.hour}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Bulk Actions */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h4 className="font-bold text-gray-900 mb-3">Bulk Actions</h4>
                        <button onClick={async () => {
                          if (!window.confirm('Grant a Streak Shield to ALL users?')) return;
                          try {
                            const r = await apiCall('/admin/grant-shields-all', 'POST', {});
                            alert(`✅ Granted shields to ${r.affected} users.`);
                          } catch (err) { alert('Failed: ' + err.message); }
                        }} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors">
                          🛡️ Grant Streak Shield to All Users
                        </button>
                      </div>

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
                  {adminAuditLog.map(entry => {
                    const actionLabels = {
                      CREATE_ANNOUNCEMENT: '📢 Created Announcement',
                      DEACTIVATE_ANNOUNCEMENT: '🔕 Deactivated Announcement',
                      EDIT_USER: '✏️ Edited User',
                      BAN_USER: '🚫 Banned User',
                      UNBAN_USER: '✅ Unbanned User',
                      CLEAR_CANVAS_TOKEN: '🔑 Cleared Canvas Token',
                      DELETE_TASK: '🗑️ Deleted Task',
                      UPDATE_HELP: '📖 Updated Help Page',
                    };
                    const details = typeof entry.details === 'string' ? JSON.parse(entry.details) : (entry.details || {});
                    const detailKeys = Object.keys(details);
                    const friendlyDetails = detailKeys.length > 0
                      ? detailKeys.map(k => {
                          if (k === 'task_title') return `"${details[k]}"`;
                          if (k === 'message') return `"${details[k]}"`;
                          if (k === 'content_length') return `${details[k]} chars`;
                          if (k === 'reason') return `reason: ${details[k]}`;
                          if (k === 'type') return `type: ${details[k]}`;
                          return null;
                        }).filter(Boolean).join(', ')
                      : null;
                    return (
                      <div key={entry.id} className="flex items-start gap-3 text-xs p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <span className="font-bold text-gray-800">{entry.admin_name}</span>
                          <span className="mx-1.5 font-medium text-purple-700">{actionLabels[entry.action] || entry.action}</span>
                          {entry.target_user_name && <span className="text-gray-600">on <span className="font-medium">{entry.target_user_name}</span></span>}
                          {friendlyDetails && <span className="ml-2 text-gray-400 italic">{friendlyDetails}</span>}
                        </div>
                        <span className="text-gray-400 flex-shrink-0">{new Date(entry.created_at).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── FEEDBACK ── */}
            {adminSection === 'feedback' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">User Feedback & Bug Reports</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{adminFeedback.length} submission{adminFeedback.length !== 1 ? 's' : ''}</p>
                  </div>
                  <button onClick={loadAdminFeedback} className="text-sm text-gray-500 hover:text-gray-700 underline">Refresh</button>
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {adminFeedback.length === 0 && <p className="text-gray-400 text-sm">No feedback submitted yet.</p>}
                  {adminFeedback.map(fb => (
                    <div key={fb.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900">{fb.user_name || '(unknown)'}</span>
                          <span className="text-xs text-gray-400">{fb.user_email}</span>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{new Date(fb.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{fb.feedback_text}</p>
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
