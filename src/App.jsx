// PlanAssist - OneSchool Global Study Planner Frontend (ENHANCED)
// App.jsx - PART 1: Imports and State

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Play, Check, Settings, BarChart3, List, Home, LogOut, BookOpen, Brain, TrendingUp, AlertCircle, Upload, Save, Pause, X, Send, GripVertical, Lock, Unlock, Info, Edit2, FileText, Trophy, Zap, Target, Award, TrendingDown } from 'lucide-react';

const API_URL = 'https://planassist-api.onrender.com/api';

const PlanAssist = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
    calendarTodayCentered: false,
    calendarShowHomeroom: true,
    calendarShowCompleted: true
  });
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionTime, setSessionTime] = useState(3600);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerStartWallRef = React.useRef(null); // wall-clock ms when timer last started
  const timerStartSessionRef = React.useRef(3600); // sessionTime value when timer last started
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [taskStartTime, setTaskStartTime] = useState(3600);
  const [sessionCompletions, setSessionCompletions] = useState([]);
  const [completionHistory, setCompletionHistory] = useState([]);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedSessionState, setSavedSessionState] = useState(null);
  const [showSplitTask, setShowSplitTask] = useState(null);
  const [splitSegments, setSplitSegments] = useState([{ name: 'Part 1' }]);
  const [completedSessionIds, setCompletedSessionIds] = useState([]);
  const [deletedSessionIds, setDeletedSessionIds] = useState([]);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [addedSessions, setAddedSessions] = useState([]); // [{id, day, period}] manually added
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [addSessionForm, setAddSessionForm] = useState({ day: 'Monday', period: '2' });
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
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
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
    }
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
        calendarTodayCentered: setupData.calendarTodayCentered ?? false,
        calendarShowHomeroom: setupData.calendarShowHomeroom ?? true,
        calendarShowCompleted: setupData.calendarShowCompleted ?? true,
          schedule: setupData.schedule || {},
          classColors: savedColors ? JSON.parse(savedColors) : {}
        });
        savedCanvasTokenRef.current = setupData.canvasApiToken || '';
        
        // Update user object with grade for leaderboard to work
        if (savedUser) {
          const updatedUser = { ...JSON.parse(savedUser), grade: setupData.grade };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
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
        generateSessions(activeTasks, setupData.schedule || {}, deletedSessionIds, addedSessions);
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

      const sessionStateData = await fetch(`${API_URL}/sessions/saved-state`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).then(r => r.json());

      if (sessionStateData.sessionId) {
        const savedDate = new Date(sessionStateData.savedAt);
        const today = new Date();
        const isToday = savedDate.toDateString() === today.toDateString();
        if (isToday) {
          setSavedSessionState(sessionStateData);
        } else {
          await fetch(`${API_URL}/sessions/saved-state`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Load tasks from API
  const loadTasks = async () => {
    try {
      const tasksData = await apiCall('/tasks', 'GET');
      
      // DEBUG: Log first task to see what format we're getting
      if (tasksData.length > 0) {
        console.log('Sample task from API:', tasksData[0]);
        console.log('deadline_date:', tasksData[0].deadline_date);
        console.log('deadline_time:', tasksData[0].deadline_time);
        console.log('deadline (old):', tasksData[0].deadline);
      }
      
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
            console.log(`Creating Date from UTC: ${utcDatetime}`);
            dueDate = new Date(utcDatetime);
            hasSpecificTime = true;
          } else {
            // Date-only task - use 23:59:00 in local timezone
            const localDatetime = `${datePart}T23:59:00`;
            console.log(`Creating Date from local: ${localDatetime}`);
            dueDate = new Date(localDatetime);
            hasSpecificTime = false;
          }
          console.log(`Result: ${dueDate}, isValid: ${!isNaN(dueDate.getTime())}`);
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
      generateSessions(activeTasks, accountSetup.schedule, deletedSessionIds, addedSessions);


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
      setUser(data.user);
      setIsAuthenticated(true);
      setAccountSetup(prev => ({ ...prev, name: data.user.name }));
      if (data.user.isNewUser) {
        setCurrentPage('settings');
      } else {
        await loadUserData(data.token);
        setCurrentPage('hub');
      }
    } catch (error) {
      setAuthError(error.message);
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
      setCurrentPage('settings');
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
    setSessions([]);
  };

  const saveAccountSetup = async () => {
    setSettingsSaving(true);
    try {
      await apiCall('/account/setup', 'POST', {
        grade: accountSetup.grade,
        canvasApiToken: accountSetup.canvasApiToken,
        presentPeriods: accountSetup.presentPeriods,
        schedule: accountSetup.schedule,
        calendarTodayCentered: accountSetup.calendarTodayCentered,
        calendarShowHomeroom: accountSetup.calendarShowHomeroom,
        calendarShowCompleted: accountSetup.calendarShowCompleted
      });
      localStorage.setItem('classColors', JSON.stringify(accountSetup.classColors));
      
      // Update user state with the new grade so leaderboard can load
      const updatedUser = { ...user, grade: accountSetup.grade };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Only sync if the Canvas API Token was actually changed (avoids unnecessary API usage)
      const tokenChanged = accountSetup.canvasApiToken !== savedCanvasTokenRef.current;
      if (accountSetup.canvasApiToken && tokenChanged) {
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
    
    if (newTasksCount > 0) {
      setNewTasksSidebarOpen(true);
      setHasUnsavedChanges(true);
    }
    
    alert(message);
  } catch (error) {
    console.error('Failed to fetch Canvas calendar:', error);
    
    let errorMessage = 'Failed to fetch Canvas calendar.';
    
    if (error.message.includes('Invalid Canvas URL')) {
      errorMessage = 'Invalid Canvas URL. Please use the format: https://canvas.oneschoolglobal.com/feeds/calendars/user_...';
    } else if (error.message.includes('400')) {
      errorMessage = 'Invalid request. Please check your Canvas URL format and try again.';
    } else if (error.message.includes('404')) {
      errorMessage = 'Canvas calendar not found. Please verify your URL is correct.';
    } else if (error.message.includes('timeout') || error.message.includes('408')) {
      errorMessage = 'Request timeout. Please check your Canvas URL and try again.';
    } else if (error.message) {
      errorMessage = 'Failed to fetch Canvas calendar: ' + error.message;
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
    if (lower.includes('[osg accelerate]')) return 5;
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

  const deleteSession = (sessionId) => {
    const newDeleted = [...deletedSessionIds, sessionId];
    setDeletedSessionIds(newDeleted);
    generateSessions(tasks, accountSetup.schedule, newDeleted, addedSessions);
  };

  const addSession = () => {
    const { day, period } = addSessionForm;
    const id = `${day}-${period}-extra`;
    // Don't add duplicates
    if (addedSessions.some(s => s.id === id)) {
      setShowAddSessionModal(false);
      return;
    }
    const newAdded = [...addedSessions, { id, day, period }];
    setAddedSessions(newAdded);
    setShowAddSessionModal(false);
    generateSessions(tasks, accountSetup.schedule, deletedSessionIds, newAdded);
  };

  const generateSessions = (taskList, scheduleData, deletedIds = [], extraSessions = []) => {
  console.log('generateSessions called with:', { taskList, scheduleData }); // Debug log
  
  if (!scheduleData || Object.keys(scheduleData).length === 0) {
    console.log('No schedule data available');
    setSessions([]);
    return;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Remove past due tasks from the task list
  const validTasks = taskList.filter(t => {
    const dueDate = new Date(t.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate >= today;
  });

  console.log('Valid tasks (not past due):', validTasks.length);

  const incompleteTasks = validTasks.filter(t => {
    const taskClass = extractClassName(t);
    return !t.completed && !taskClass.toLowerCase().includes('homeroom');
  }).sort((a, b) => a.dueDate - b.dueDate);
  
  console.log('Incomplete tasks:', incompleteTasks.length);
  
  if (incompleteTasks.length === 0) {
    console.log('No incomplete tasks to schedule');
    setSessions([]);
    return;
  }
  
  const newSessions = [];
  let taskIndex = 0;
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentDayArrayIndex = currentDayIndex === 0 ? -1 : currentDayIndex - 1;
  const dayOrder = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4 };
  
  console.log('Today is:', days[currentDayArrayIndex] || 'Sunday', 'Day index:', currentDayArrayIndex);
  
  // Build unified list of ALL session slots (schedule + added extras), sorted by day+period
  // This ensures added sessions get tasks in correct priority order
  const allSlots = [];
  
  for (const day of days) {
    const dayIndex = days.indexOf(day);
    if (currentDayArrayIndex !== -1 && dayIndex < currentDayArrayIndex) continue;
    if (!scheduleData[day]) continue;
    
    const periods = Object.keys(scheduleData[day]).sort((a, b) => parseInt(a) - parseInt(b));
    for (const period of periods) {
      if (scheduleData[day][period] === 'Study') {
        allSlots.push({ day, period, id: `${day}-${period}`, isExtra: false });
      }
    }
  }
  
  // Inject extra (manually added) sessions into the correct sorted position
  for (const extra of extraSessions) {
    const extraDayIndex = dayOrder[extra.day] ?? 5;
    const currentExtraDayIndex = dayOrder[days[currentDayArrayIndex]] ?? -1;
    if (currentDayArrayIndex !== -1 && extraDayIndex < (dayOrder[days[currentDayArrayIndex]] ?? 5)) continue;
    allSlots.push({ day: extra.day, period: extra.period, id: extra.id, isExtra: true });
  }
  
  allSlots.sort((a, b) => {
    const dayDiff = (dayOrder[a.day] ?? 5) - (dayOrder[b.day] ?? 5);
    return dayDiff !== 0 ? dayDiff : parseInt(a.period) - parseInt(b.period);
  });
  
  for (const slot of allSlots) {
    const { day, period, id: sessionId, isExtra } = slot;
    
    if (completedSessionIds.includes(sessionId)) {
      console.log(`Session ${sessionId} already completed, skipping`);
      continue;
    }
    if (deletedIds.includes(sessionId)) {
      console.log(`Session ${sessionId} deleted by user, skipping`);
      continue;
    }
    
    console.log(`Processing slot ${sessionId} (extra: ${isExtra})`);
    
    {
      const sessionTasks = [];
      let totalTime = 0;
      
      while (taskIndex < incompleteTasks.length) {
        const task = incompleteTasks[taskIndex];
        const taskTime = task.userEstimate || task.estimatedTime;
        if (totalTime + taskTime <= 60) {
          sessionTasks.push({ ...task, sessionTag: 'Get it Done' });
          totalTime += taskTime;
          taskIndex++;
        } else break;
      }
      
      if (taskIndex < incompleteTasks.length && totalTime < 60) {
        const nextTask = incompleteTasks[taskIndex];
        const nextTaskTime = nextTask.userEstimate || nextTask.estimatedTime;
        const tag = ((nextTask.accumulatedTime && nextTask.accumulatedTime > 0) || (nextTask.accumulated_time && nextTask.accumulated_time > 0)) ? 'Wrap it Up' : 'Make a Start';
        sessionTasks.push({ ...nextTask, sessionTag: tag });
        totalTime += nextTaskTime;
        taskIndex++;
        console.log(`Added overflow task "${nextTask.title}" with tag "${tag}"`);
      }
      
      if (sessionTasks.length > 0) {
        console.log(`Created session ${sessionId} with ${sessionTasks.length} tasks (${totalTime} min)`);
        newSessions.push({ id: sessionId, day, period: parseInt(period), tasks: sessionTasks, totalTime, isExtra });
      }
    }
    
    if (taskIndex >= incompleteTasks.length) {
      console.log('All tasks scheduled, stopping');
      break;
    }
  }
  
  console.log('Total sessions created:', newSessions.length);
  setSessions(newSessions);
};

  const updateTaskEstimate = async (taskId, estimate) => {
    try {
      await apiCall(`/tasks/${taskId}/estimate`, 'PATCH', { userEstimate: estimate });
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, userEstimate: estimate } : t);
      setTasks(updatedTasks);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Failed to update estimate:', error);
    }
  };

  const handleManualComplete = async (taskId) => {
    try {
      await apiCall(`/tasks/${taskId}/complete`, 'PATCH');
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, completed: true } : t);
      setTasks(updatedTasks);
      setShowCompleteConfirm(null);
      generateSessions(updatedTasks, accountSetup.schedule, deletedSessionIds, addedSessions);
    } catch (error) {
      console.error('Failed to complete task:', error);
      alert('Failed to complete task');
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await apiCall(`/tasks/${taskId}/complete`, 'PATCH');
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, completed: true } : t);
      setTasks(updatedTasks);
      setShowCompleteConfirm(null);
      generateSessions(updatedTasks, accountSetup.schedule, deletedSessionIds, addedSessions);
    } catch (error) {
      console.error('Failed to complete task:', error);
      alert('Failed to complete task');
    }
  };

  const toggleTaskCompletion = async (taskId) => {
    // Find task in the current tasks array by ID
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('Task not found:', taskId);
      alert('Task not found. Please try refreshing the page.');
      return;
    }

    // Update local state immediately for better UX
    const newCompletedStatus = !task.completed;
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, completed: newCompletedStatus } : t);
    setTasks(updatedTasks);
    generateSessions(updatedTasks, accountSetup.schedule, deletedSessionIds, addedSessions);

    try {
      if (newCompletedStatus) {
        // Complete the task - this marks it as deleted in backend
        await apiCall(`/tasks/${taskId}/complete`, 'PATCH');
        // Reload tasks from server to get proper filtered list (without deleted tasks)
        await loadTasks();
      } else {
        // Uncomplete the task
        await apiCall(`/tasks/${taskId}/uncomplete`, 'PATCH');
        await loadTasks();
      }
      // Successfully saved to backend
      console.log('Task completion toggled successfully');
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      console.error('Task ID:', taskId);
      console.error('Task details:', task);
      
      // Check if this is a newly split task that hasn't been saved yet
      if (error.message.includes('Failed to complete task') || error.message.includes('500')) {
        alert('This task needs to be saved first. Click "Save and Adjust Plan" to save your changes, then you can mark it complete.');
        // Revert the change
        setTasks(tasks);
        generateSessions(tasks, accountSetup.schedule, deletedSessionIds, addedSessions);
      } else {
        alert('Failed to update task: ' + error.message);
        // Revert on error
        setTasks(tasks);
        generateSessions(tasks, accountSetup.schedule, deletedSessionIds, addedSessions);
      }
    }
  };

  // Manual time editing handlers
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
      
      // Move all to main list
      setTasks([...tasks, ...newTasks]);
      setNewTasks([]);
      setNewTasksSidebarOpen(false);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Failed to clear new tasks:', error);
      alert('Failed to clear new tasks');
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
      // loadTasks calls generateSessions internally with the fresh task list,
      // ensuring sessions reflect the new priority order immediately
      
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

  const openWorkspace = async (task) => {
    setWorkspaceTask(task);
    setWorkspaceTab('canvas');
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
    setShowWorkspace(false);
    setWorkspaceTask(null);
    setWorkspaceNotes('');
    setCanvasWindow(null);
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
  }, [currentPage]);

  const switchWorkspaceTab = async (tab) => {
    if (workspaceTab === 'notes' && tab !== 'notes') {
      await saveTaskNotes();
    }
    setWorkspaceTab(tab);
  };
  
  const startSession = (session) => {
    endSessionCalledRef.current = false; // reset guard for new session
    setCurrentSession(session);
    setCurrentTaskIndex(0);
    setSessionTime(3600);
    setTaskStartTime(3600);
    setIsTimerRunning(true);
    setSessionCompletions([]);
    setPartialTaskTimes({}); // Clear partial times for new session
    setCurrentPage('session-active');
  };

  const resumeSession = async () => {
    try {
      if (!savedSessionState) {
        alert('No saved session found');
        return;
      }
      const session = sessions.find(s => s.id === savedSessionState.sessionId);
      if (!session) {
        alert('Session no longer exists');
        await apiCall('/sessions/saved-state', 'DELETE');
        setSavedSessionState(null);
        return;
      }
      
      console.log('Resuming session:', session.id);
      console.log('Saved state completed IDs:', savedSessionState.completedTaskIds);
      console.log('Original session tasks:', session.tasks.map(t => ({id: t.id, title: t.title})));
      
      // Filter out tasks that were already completed in the saved session
      const completedIds = savedSessionState.completedTaskIds || [];
      let remainingTasks = session.tasks.filter(t => !completedIds.includes(t.id));
      
      // IMPORTANT: Also filter out tasks that no longer exist in the current tasks list
      // This prevents working on deleted/completed tasks from old sessions
      const validTaskIds = new Set(tasks.map(t => t.id));
      const beforeValidation = remainingTasks.length;
      remainingTasks = remainingTasks.filter(t => {
        const exists = validTaskIds.has(t.id);
        if (!exists) {
          console.warn(`⚠ Task ${t.id} ("${t.title}") no longer exists in database, removing from session`);
        }
        return exists;
      });
      
      if (remainingTasks.length < beforeValidation) {
        console.log(`ℹ Filtered out ${beforeValidation - remainingTasks.length} non-existent tasks`);
      }
      
      console.log('Remaining tasks after filter:', remainingTasks.map(t => ({id: t.id, title: t.title})));
      
      if (remainingTasks.length === 0) {
        alert('All tasks in this session have been completed!');
        await apiCall('/sessions/saved-state', 'DELETE');
        setSavedSessionState(null);
        return;
      }
      
      // Reconstruct session with only remaining tasks
      const resumedSession = {
        ...session,
        tasks: remainingTasks
      };
      
      setCurrentSession(resumedSession);
      setSessionTime(savedSessionState.remainingTime);
      
      // Always start at index 0 since we've filtered the tasks
      setCurrentTaskIndex(0);
      // Set task start time to current remaining time
      setTaskStartTime(savedSessionState.remainingTime);
      
      // Clear completions since they're already saved
      setSessionCompletions([]);
      
      // Restore partial task times from backend
      if (savedSessionState.partialTaskTimes) {
        console.log('✓ Restoring partial times from backend:', savedSessionState.partialTaskTimes);
        console.log('  Tasks with partial time:');
        Object.entries(savedSessionState.partialTaskTimes).forEach(([taskId, time]) => {
          const task = remainingTasks.find(t => t.id === parseInt(taskId));
          console.log(`  - Task ${taskId}: ${time} min${task ? ` (${task.title})` : ' (not in session)'}`);
        });
        setPartialTaskTimes(savedSessionState.partialTaskTimes);
      } else {
        console.log('ℹ No partial times to restore');
        setPartialTaskTimes({});
      }
      
      setIsTimerRunning(true);
      setCurrentPage('session-active');
      
      console.log('Session resumed successfully');
    } catch (error) {
      console.error('Failed to resume session:', error);
      alert('Failed to resume session: ' + error.message);
    }
  };

  const pauseSession = async () => {
    setSavingSession(true);
    try {
      const currentTask = currentSession.tasks[currentTaskIndex];
      
      // Check if currentTask exists before proceeding
      if (!currentTask) {
        // If no current task, just save the session state without partial time
        await apiCall('/sessions/saved-state', 'POST', {
          sessionId: currentSession.id,
          day: currentSession.day,
          period: currentSession.period,
          remainingTime: sessionTime,
          currentTaskIndex: currentTaskIndex,
          taskStartTime: taskStartTime,
          completedTaskIds: sessionCompletions.map(c => c.task.id),
          partialTaskTimes: partialTaskTimes
        });
        
        setSessionSummary({
          isSaveAndExit: true,
          day: currentSession.day,
          period: currentSession.period,
          completions: sessionCompletions,
          partialTask: null,
          missedTasks: [],
          totalTime: Math.round((3600 - sessionTime) / 60),
          remainingTime: Math.round(sessionTime / 60)
        });
        
        setShowSessionSummary(true);
        setIsTimerRunning(false);
        return;
      }
      
      const currentTaskTimeSpent = Math.round((taskStartTime - sessionTime) / 60);
    
      // ✅ Calculate and save partial time (non-blocking - continue even if this fails)
      const previousAccumulatedTime = currentTask.accumulatedTime || 0;
      const newAccumulatedTime = previousAccumulatedTime + currentTaskTimeSpent;
    
      console.log('=== Saving Partial Time ===');
      console.log('Task ID:', currentTask.id);
      console.log('Time spent this session:', currentTaskTimeSpent, 'min');
      console.log('Previous accumulated:', previousAccumulatedTime, 'min');
      console.log('New total accumulated:', newAccumulatedTime, 'min');
    
      // Try to save accumulated time to database, but don't fail if it doesn't work
      try {
        await apiCall(`/tasks/${currentTask.id}/partial`, 'PATCH', {
          accumulatedTime: newAccumulatedTime
        });
      } catch (partialError) {
        console.error('Failed to save partial time (non-critical):', partialError);
        // Continue anyway - we'll still save the session state
      }
    
      // Save session state (this is critical)
      // Build partialTaskTimes: existing partial times + the current in-progress task's time
      const partialTimesToSave = { ...partialTaskTimes };
      if (newAccumulatedTime > 0) {
        partialTimesToSave[currentTask.id] = newAccumulatedTime;
      }
      const savedStatePayload = {
        sessionId: currentSession.id,
        day: currentSession.day,
        period: currentSession.period,
        remainingTime: sessionTime,
        currentTaskIndex: currentTaskIndex,
        taskStartTime: taskStartTime,
        completedTaskIds: sessionCompletions.map(c => c.task.id),
        partialTaskTimes: partialTimesToSave,
        savedAt: new Date().toISOString()
      };
      await apiCall('/sessions/saved-state', 'POST', savedStatePayload);

      // Update React state immediately so Sessions page shows "Resume" without reload
      setSavedSessionState(savedStatePayload);
    
      // Show summary
      const missedTasks = currentSession.tasks.slice(currentTaskIndex + 1);
      setSessionSummary({
        isSaveAndExit: true,
        day: currentSession.day,
        period: currentSession.period,
        completions: sessionCompletions,
        partialTask: {
          ...currentTask,
          partialTime: currentTaskTimeSpent
        },
        missedTasks: missedTasks,
        totalTime: Math.round((3600 - sessionTime) / 60),
        remainingTime: Math.round(sessionTime / 60)
      });
    
      setShowSessionSummary(true);
      setIsTimerRunning(false);
    } catch (error) {
      console.error('Failed to save session:', error);
      alert('Failed to save session: ' + error.message);
    } finally {
      setSavingSession(false);
    }
  };

  // Wall-clock-based timer: immune to tab throttling.
  // Records real Date.now() when started; each tick computes true elapsed time.
  useEffect(() => {
    if (isTimerRunning && sessionTime > 0) {
      // Record wall-clock start point whenever the timer (re)starts
      timerStartWallRef.current = Date.now();
      timerStartSessionRef.current = sessionTime;

      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStartWallRef.current) / 1000);
        const remaining = timerStartSessionRef.current - elapsed;
        if (remaining <= 0) {
          setSessionTime(0);
          endSession(true, null, null, 0); // pass actualRemaining=0 to avoid stale closure
        } else {
          setSessionTime(remaining);
        }
      }, 500); // poll every 500ms for responsiveness; wall-clock keeps it accurate

      return () => clearInterval(interval);
    } else if (sessionTime === 0 && isTimerRunning) {
      endSession(true);
    }
  }, [isTimerRunning]); // only re-run when timer starts/stops, NOT on every tick

  // When tab becomes visible again after being hidden, snap sessionTime to
  // the true wall-clock-based remaining time so any throttle gap is corrected instantly.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isTimerRunning && timerStartWallRef.current !== null) {
        const elapsed = Math.floor((Date.now() - timerStartWallRef.current) / 1000);
        const remaining = Math.max(0, timerStartSessionRef.current - elapsed);
        setSessionTime(remaining);
        if (remaining === 0) endSession(true, null, null, 0);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTimerRunning]);

  const completeTask = async () => {
    if (!currentSession) return;
  
    setMarkingComplete(true);
  
    try {
      const task = currentSession.tasks[currentTaskIndex];
      const currentSessionTime = Math.round((taskStartTime - sessionTime) / 60);
    
      // ✅ Get accumulated time from task (from database)
      const previousPartialTime = task.accumulatedTime || 0;
    
      console.log('=== Completing Task ===');
      console.log('Task ID:', task.id);
      console.log('Current session time:', currentSessionTime, 'min');
      console.log('Previous accumulated time:', previousPartialTime, 'min');
    
      // Calculate total time
      const totalTimeSpent = currentSessionTime + previousPartialTime;
      console.log('Total time spent:', totalTimeSpent, 'min');
      
      // Complete the task with total time
      await apiCall(`/tasks/${task.id}/complete`, 'POST', {
        timeSpent: totalTimeSpent
      });
      
      // Add to completions
      setSessionCompletions(prev => [...prev, { 
        task, 
        timeSpent: totalTimeSpent 
      }]);
      
      // Update local state
      const updatedTasks = tasks.map(t => 
        t.id === task.id ? { ...t, completed: true } : t
      );
      setTasks(updatedTasks);
      
      console.log('Task completed successfully');
      
      // Move to next task or end session
      if (currentTaskIndex < currentSession.tasks.length - 1) {
        setCurrentTaskIndex(prev => prev + 1);
        setTaskStartTime(sessionTime);
      } else {
        // Pass the completed task data directly to avoid state timing issues
        await endSession(true, task.id, { task, timeSpent: totalTimeSpent });
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
      alert('Failed to complete task: ' + error.message);
    } finally {
      setMarkingComplete(false);
    }
  };

  const endSessionCalledRef = React.useRef(false);
  const endSession = async (natural = false, justCompletedTaskId = null, justCompletedTaskData = null, actualRemaining = null) => {
    // Prevent double-call when both interval and useEffect fire at timer=0
    if (natural && endSessionCalledRef.current) return;
    if (natural) endSessionCalledRef.current = true;
    if (!natural) {
      setEndingSession(true);
    }
  
    try {
      const currentTask = currentSession.tasks[currentTaskIndex];
      // Use actualRemaining if provided (avoids stale sessionTime closure in wall-clock timer)
      const effectiveRemaining = actualRemaining !== null ? actualRemaining : sessionTime;
      const currentTaskTimeSpent = currentTask ? Math.round((taskStartTime - effectiveRemaining) / 60) : 0;
    
      // ✅ Save partial time if any time spent on current task (non-blocking)
      // BUT: Don't save if this task was just completed OR is in session completions
      const wasJustCompleted = currentTask && (currentTask.id === justCompletedTaskId);
      const isInCompletions = currentTask && sessionCompletions.find(c => c.task.id === currentTask.id);
      
      if (currentTask && currentTaskTimeSpent > 0 && !wasJustCompleted && !isInCompletions) {
        const previousAccumulatedTime = currentTask.accumulatedTime || 0;
        const newAccumulatedTime = previousAccumulatedTime + currentTaskTimeSpent;
      
        console.log('=== Saving Partial Time on End Session ===');
        console.log('Task ID:', currentTask.id);
        console.log('Time spent this session:', currentTaskTimeSpent, 'min');
        console.log('Previous accumulated:', previousAccumulatedTime, 'min');
        console.log('New total accumulated:', newAccumulatedTime, 'min');
      
        try {
          await apiCall(`/tasks/${currentTask.id}/partial`, 'PATCH', {
            accumulatedTime: newAccumulatedTime
          });
        } catch (partialError) {
          console.error('Failed to save partial time (non-critical):', partialError);
          // Continue anyway
        }
      }
    
      // Delete saved session
      try {
        await apiCall('/sessions/saved-state', 'DELETE');
        setSavedSessionState(null);
      } catch (deleteError) {
        console.error('Failed to delete saved state (non-critical):', deleteError);
        // Continue anyway
      }
    
      // Determine missed tasks
      // Start from current task index, but skip if current task was completed or partially worked on
      let missedTaskStartIndex = currentTaskIndex;
      
      // If current task was just completed OR is in completions, skip it
      if (wasJustCompleted || isInCompletions) {
        missedTaskStartIndex = currentTaskIndex + 1;
      } 
      // If current task has partial time but wasn't completed, it stays in the list (shown as partial)
      else if (currentTask && currentTaskTimeSpent > 0) {
        missedTaskStartIndex = currentTaskIndex + 1;
      }
    
      const missedTasks = currentSession.tasks.slice(missedTaskStartIndex);
    
      // Build completions list - include just-completed task if provided
      let completionsList = [...sessionCompletions];
      if (justCompletedTaskData) {
        completionsList.push(justCompletedTaskData);
      }
    
      setSessionSummary({
        isSaveAndExit: false,
        day: currentSession.day,
        period: currentSession.period,
        completions: completionsList,
        partialTask: currentTask && currentTaskTimeSpent > 0 && !wasJustCompleted && !isInCompletions ? {
          ...currentTask,
          partialTime: currentTaskTimeSpent
        } : null,
        missedTasks: missedTasks,
        totalTime: Math.round((3600 - sessionTime) / 60),
        remainingTime: Math.round(sessionTime / 60)
      });
    
      setShowSessionSummary(true);
      setIsTimerRunning(false);
    
      // Mark session complete
      setSessions(prev => prev.filter(s => s.id !== currentSession.id));
      setCompletedSessionIds(prev => [...prev, currentSession.id]);
    } catch (error) {
      console.error('Failed to end session:', error);
      alert('Failed to end session: ' + error.message);
    } finally {
      if (!natural) {
        setEndingSession(false);
      }
    }
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
          newSchedule[day][period] = accountSetup.schedule[day]?.[period] || 'Study';
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
            <button onClick={() => !isSavingPlan && currentPage !== 'session-active' && setCurrentPage('hub')} disabled={currentPage === 'session-active' || isSavingPlan} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'hub' ? 'bg-purple-100 text-purple-700' : (currentPage === 'session-active' || isSavingPlan) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Home className="w-5 h-5" />
              <span className="font-medium">Hub</span>
            </button>
            <button onClick={() => !isSavingPlan && currentPage !== 'session-active' && setCurrentPage('tasks')} disabled={currentPage === 'session-active' || isSavingPlan} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'tasks' ? 'bg-purple-100 text-purple-700' : (currentPage === 'session-active' || isSavingPlan) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <List className="w-5 h-5" />
              <span className="font-medium">Tasks</span>
              {hasUnsavedChanges && currentPage !== 'session-active' && <span className="w-2 h-2 bg-orange-500 rounded-full"></span>}
            </button>
            <button onClick={() => !isSavingPlan && !isLoadingTasks && currentPage !== 'session-active' && setCurrentPage('sessions')} disabled={currentPage === 'session-active' || isSavingPlan || isLoadingTasks} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'sessions' ? 'bg-purple-100 text-purple-700' : (currentPage === 'session-active' || isSavingPlan || isLoadingTasks) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Play className="w-5 h-5" />
              <span className="font-medium">Sessions</span>
            </button>
            <button onClick={() => !isSavingPlan && currentPage !== 'session-active' && setCurrentPage('calendar')} disabled={currentPage === 'session-active' || isSavingPlan} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'calendar' ? 'bg-purple-100 text-purple-700' : (currentPage === 'session-active' || isSavingPlan) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Calendar</span>
            </button>
            <button onClick={() => !isSavingPlan && currentPage !== 'session-active' && setCurrentPage('marks')} disabled={currentPage === 'session-active' || isSavingPlan} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'marks' ? 'bg-purple-100 text-purple-700' : (currentPage === 'session-active' || isSavingPlan) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Marks</span>
            </button>
            <button onClick={() => !isSavingPlan && !isLoadingTasks && setCurrentPage('settings')} disabled={currentPage === 'session-active' || isSavingPlan || isLoadingTasks} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'settings' ? 'bg-purple-100 text-purple-700' : (currentPage === 'session-active' || isSavingPlan || isLoadingTasks) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Settings className="w-5 h-5" />
            </button>
            {isLoadingTasks && currentPage !== 'tasks' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
                <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Syncing
              </div>
            )}
            <button onClick={handleLogout} disabled={currentPage === 'session-active' || isSavingPlan || isLoadingTasks} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${(currentPage === 'session-active' || isSavingPlan || isLoadingTasks) ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}>
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          onClick={fetchCanvasTasks} 
                          disabled={isLoadingTasks} 
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2 disabled:opacity-50 transition-all"
                        >
                          {isLoadingTasks ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span className="hidden sm:inline">Sync</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span className="hidden sm:inline">Sync</span>
                            </>
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
                        const incompleteTasks = tasks.filter(t => !t.deleted && !t.completed);
                        
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
                                  
                                  {/* Checkbox */}
                                  <input
                                    type="checkbox"
                                    checked={task.completed || false}
                                    onChange={() => toggleTaskCompletion(task.id)}
                                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer flex-shrink-0"
                                  />
                                  
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
                    <p className="text-yellow-800">Drag each task to its priority position in your main list, or click "Add All" to append them to the end.</p>
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
        {currentPage === 'sessions' && (
          <div className="max-w-5xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Study Sessions</h2>
                  <p className="text-gray-600">Your scheduled study periods</p>
                </div>
                <button
                  onClick={() => setShowAddSessionModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 flex items-center gap-2"
                >
                  <span className="text-lg font-bold">+</span> Add Session
                </button>
              </div>
              <div className="space-y-4">
                {sessions.map(session => {
                  const hasSavedState = savedSessionState && savedSessionState.sessionId === session.id;
                  return (
                    <div key={session.id} className={`border-2 rounded-lg p-6 hover:border-purple-300 transition-colors ${session.isExtra ? 'border-purple-200 bg-purple-50' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              {session.day} - Period {session.period}
                            </h3>
                            {session.isExtra && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 border border-purple-300">
                                Added
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {session.tasks.length} tasks · {session.totalTime} min
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => deleteSession(session.id)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Remove this session"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          {hasSavedState ? (
                            <button onClick={resumeSession} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2">
                              <Play className="w-4 h-4" /> Resume
                            </button>
                          ) : (
                            <button onClick={() => startSession(session)} className="bg-green-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-600 flex items-center gap-2">
                              <Play className="w-4 h-4" /> Start
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {session.tasks.map((task, idx) => {
                          const tagColors = {
                            'Get it Done': 'bg-green-100 text-green-800 border-green-300',
                            'Make a Start': 'bg-blue-100 text-blue-800 border-blue-300',
                            'Wrap it Up': 'bg-amber-100 text-amber-800 border-amber-300'
                          };
                          const tagColor = tagColors[task.sessionTag] || 'bg-gray-100 text-gray-800 border-gray-300';
                          return (
                            <div key={task.id || idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                {idx + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <a href={task.url} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 truncate hover:text-purple-600 hover:underline transition-colors">{cleanTaskTitle(task)}</a>
                                  {task.sessionTag && (
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border flex-shrink-0 ${tagColor}`}>
                                      {task.sessionTag}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{task.userEstimate || task.estimatedTime} min</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              {sessions.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Sessions Scheduled</h3>
                  <p className="text-gray-600">Add tasks and set up your schedule to generate sessions, or add a custom session above.</p>
                </div>
              )}
            </div>

            {/* Add Session Modal */}
            {showAddSessionModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-gray-900">Add Study Session</h3>
                    <button onClick={() => setShowAddSessionModal(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                      <select
                        value={addSessionForm.day}
                        onChange={e => setAddSessionForm(f => ({ ...f, day: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {['Monday','Tuesday','Wednesday','Thursday','Friday'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                      <select
                        value={addSessionForm.period}
                        onChange={e => setAddSessionForm(f => ({ ...f, period: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {selectedPeriods.map(p => (
                          <option key={p} value={String(p)}>Period {p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowAddSessionModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addSession}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                    >
                      Add Session
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {currentPage === 'session-active' && currentSession && (
          showSessionSummary ? (
            <div className="max-w-4xl mx-auto p-6">
              <div className="bg-gradient-to-br from-green-500 to-blue-600 text-white rounded-xl p-8 text-center mb-6">
                <Check className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">
                  {sessionSummary.isSaveAndExit ? 'Session Saved!' : 'Session Complete!'}
                </h2>
                <p className="text-lg">
                  {sessionSummary.day} - Period {sessionSummary.period}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">Summary</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-600">{sessionSummary.completions.length}</div>
                    <div className="text-sm text-gray-600">Tasks Completed</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-purple-600">{sessionSummary.totalTime} min</div>
                    <div className="text-sm text-gray-600">Time Used</div>
                  </div>
                </div>
                
                {/* Completed Tasks */}
                {sessionSummary.completions.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <h4 className="font-semibold text-gray-700">Completed Tasks</h4>
                    {sessionSummary.completions.map((comp, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="font-medium text-gray-900">{cleanTaskTitle(comp.task)}</span>
                        <span className="text-sm text-gray-600">{comp.timeSpent} min</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Partially Completed Task */}
                {sessionSummary.partialTask && (
                  <div className="space-y-2 mb-4">
                    <h4 className="font-semibold text-gray-700">Partially Completed</h4>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="font-medium text-gray-900">{cleanTaskTitle(sessionSummary.partialTask)}</span>
                      <span className="text-sm text-orange-600">{sessionSummary.partialTask.partialTime} min progress</span>
                    </div>
                  </div>
                )}
                
                {/* Missed Tasks */}
                {sessionSummary.missedTasks && sessionSummary.missedTasks.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <h4 className="font-semibold text-gray-700">
                      {sessionSummary.isSaveAndExit ? 'Remaining Tasks' : 'Missed Tasks (Rescheduled)'}
                    </h4>
                    {sessionSummary.missedTasks.map((task, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">{cleanTaskTitle(task)}</span>
                        <span className="text-sm text-gray-600">
                          {sessionSummary.isSaveAndExit ? 'Saved for later' : 'Rescheduled'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Save and Exit info */}
                {sessionSummary.isSaveAndExit && sessionSummary.remainingTime > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>{sessionSummary.remainingTime} minutes</strong> saved for when you resume this session.
                    </p>
                  </div>
                )}
              </div>
              <button onClick={() => {
                setShowSessionSummary(false);
                setCurrentSession(null);
                setCurrentPage('hub');
                loadUserData(token);
              }} className="w-full bg-gradient-to-r from-yellow-400 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700">
                Back to Hub
              </button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-6">
              <div className="bg-gradient-to-br from-purple-500 to-blue-600 text-white rounded-xl p-8 mb-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">
                    {currentSession.day} - Period {currentSession.period}
                  </h2>
                  <div className="text-6xl font-bold mb-2">{formatTime(sessionTime)}</div>
                  <p className="text-purple-100">Time Remaining</p>
                </div>
                <div className="flex gap-4 justify-center">
                  <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 flex items-center gap-2">
                    {isTimerRunning ? (
                      <>
                        <Pause className="w-5 h-5" />
                        Pause Timer
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Resume Timer
                      </>
                    )}
                  </button>
                  <button onClick={pauseSession} disabled={savingSession} className="bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-800 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {savingSession ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Please Wait...
                      </>
                    ) : (
                      <>
                        <X className="w-5 h-5" />
                        Save & Exit
                      </>
                    )}
                  </button>
                  <button onClick={() => endSession(false)} disabled={endingSession} className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {endingSession ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Please Wait...
                      </>
                    ) : (
                      'End Session'
                    )}
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Current Task</h3>
                  <span className="text-sm text-gray-600">
                    Task {currentTaskIndex + 1} of {currentSession.tasks.length}
                  </span>
                </div>
                {currentSession.tasks[currentTaskIndex] && (
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-6">
                    <a href={currentSession.tasks[currentTaskIndex].url} target="_blank" rel="noopener noreferrer" className="block text-xl font-bold text-gray-900 mb-4 hover:text-purple-600 hover:underline transition-colors">{cleanTaskTitle(currentSession.tasks[currentTaskIndex])}</a>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Est. {currentSession.tasks[currentTaskIndex].userEstimate || currentSession.tasks[currentTaskIndex].estimatedTime} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due {currentSession.tasks[currentTaskIndex].dueDate.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mb-4 text-sm text-gray-600">
                      {(() => {
                        const currentTask = currentSession.tasks[currentTaskIndex];
                        const currentSessionTime = Math.round((taskStartTime - sessionTime) / 60);
                        const taskId = currentTask.id; // Use parent if exists
                        const previousTime = partialTaskTimes[taskId] || 0;
                        const totalTime = currentSessionTime + previousTime;
                        
                        if (previousTime > 0) {
                          return (
                            <>
                              Time on this task: {currentSessionTime} min <span className="text-blue-600">(+{previousTime} min from previous session = {totalTime} min total)</span>
                              {currentTask.segment && (
                                <span className="text-xs text-gray-500 ml-2">
                                  (this is a task segment)
                                </span>
                              )}
                            </>
                          );
                        }
                        return `Time on this task: ${currentSessionTime} min`;
                      })()}
                    </div>
                    <button onClick={completeTask} disabled={markingComplete} className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {markingComplete ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Please Wait...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Mark Complete
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => openWorkspace(currentSession.tasks[currentTaskIndex])} 
                      className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 flex items-center justify-center gap-2 mt-3"
                    >
                      <BookOpen className="w-5 h-5" />
                      Open Workspace
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700 text-sm mb-3">Upcoming in This Session</h4>
                  {currentSession.tasks.slice(currentTaskIndex + 1).map((task, idx) => {
                    const taskId = task.id;
                    const hasPartialTime = partialTaskTimes[taskId] > 0;
                    return (
                      <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-60">
                        <span className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm">
                          {currentTaskIndex + idx + 2}
                        </span>
                        <div className="flex-1">
                          <a href={task.url} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-purple-600 hover:underline transition-colors">{cleanTaskTitle(task)}</a>
                          {hasPartialTime && (
                            <span className="ml-2 text-xs text-blue-600">
                              ({partialTaskTimes[taskId]} min in progress)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )
        )}
        {currentPage === 'calendar' && (() => {
          const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
          const today = new Date();

          // Build 7-day window
          const todayIdx = today.getDay();
          const dayOffsets = accountSetup.calendarTodayCentered
            ? [-3,-2,-1,0,1,2,3]
            : Array.from({length:7}, (_,i) => i - todayIdx);

          const days = dayOffsets.map(offset => {
            const d = new Date(today);
            d.setDate(today.getDate() + offset);
            return d;
          });

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
                    {accountSetup.calendarTodayCentered ? 'Today-centered view' : 'Weekly view (Sun – Sat)'}
                    {' · '}
                    {days[0].toLocaleDateString('en-US',{month:'short',day:'numeric'})} – {days[6].toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  </p>
                </div>
                <button
                  onClick={() => setCurrentPage('settings')}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Calendar Settings
                </button>
              </div>

              {/* 7-day grid */}
              <div className="flex-1 overflow-hidden px-4 py-4">
                <div className="grid grid-cols-7 gap-2 h-full">
                  {days.map((day, colIdx) => {
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
              </div>
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
                      {courses.filter(c => c.current_score).length > 0
                        ? (courses.filter(c => c.current_score).reduce((sum, c) => sum + parseFloat(c.current_score), 0) / courses.filter(c => c.current_score).length).toFixed(1) + '%'
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-blue-100">Overall Average</div>
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
                    const aScore = a.current_score != null ? parseFloat(a.current_score) : null;
                    const bScore = b.current_score != null ? parseFloat(b.current_score) : null;
                    if (aScore === null && bScore === null) return 0;
                    if (aScore === null) return 1;  // no grade → bottom
                    if (bScore === null) return -1;
                    return aScore - bScore; // lowest score first
                  }).map((course, index) => {
                    const avgData = courseAverages[course.course_id];
                    const classAverage = avgData?.averageScore ?? null;
                    const studentCount = avgData?.studentCount ?? 0;
                    const hasScore = course.current_score != null && parseFloat(course.current_score) > 0;
                    const userScore = hasScore ? parseFloat(course.current_score) : null;
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
                            <h3 className="font-bold text-gray-900 text-base leading-tight">{course.name}</h3>
                            {course.course_code && <p className="text-xs text-gray-500 mt-0.5">{course.course_code}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className={`text-4xl font-black ${perfColor}`}>
                              {course.current_grade || (hasScore ? `${userScore.toFixed(0)}%` : '—')}
                            </div>
                            {hasScore && course.current_grade && (
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
                            {course.final_grade && course.final_grade !== course.current_grade && (
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
        {currentPage === 'settings' && (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Setup</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input type="text" value={accountSetup.name || ''} className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50" disabled />
                  <p className="text-xs text-gray-500 mt-1">Extracted from your email</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                  <select 
                    value={accountSetup.grade} 
                    onChange={(e) => setAccountSetup(prev => ({ ...prev, grade: e.target.value }))} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select your grade...</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Canvas API Token</label>
                  <input 
                    type="password" 
                    value={accountSetup.canvasApiToken} 
                    onChange={(e) => setAccountSetup(prev => ({ ...prev, canvasApiToken: e.target.value }))} 
                    placeholder="Paste your Canvas API token here..." 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm" 
                  />
                  <div className="mt-2 text-xs space-y-1">
                    <p className="text-gray-600">
                      <strong>How to get your Canvas API token:</strong>
                    </p>
                    <ol className="list-decimal ml-5 space-y-1 text-gray-600">
                      <li>Go to Canvas → Account (top left) → Settings</li>
                      <li>Scroll to "Approved Integrations"</li>
                      <li>Click "+ New Access Token"</li>
                      <li>Set Purpose: "PlanAssist Integration"</li>
                      <li>Leave Expires field blank (or set far future date)</li>
                      <li>Click "Generate Token"</li>
                      <li>Copy the token and paste it above</li>
                    </ol>
                    <p className="text-blue-600 font-medium mt-2">
                      🔒 Your token is encrypted and stored securely
                    </p>
                    <p className="text-amber-600">
                      ⚠️ Never share your API token with anyone else
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Present Periods (Time Zone)</label>
                  <select value={accountSetup.presentPeriods} onChange={(e) => setAccountSetup(prev => ({ ...prev, presentPeriods: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="1-5">Periods 1-5</option>
                    <option value="2-6">Periods 2-6</option>
                    <option value="3-7">Periods 3-7</option>
                    <option value="4-8">Periods 4-8</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Weekly Schedule
                  </label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Day</th>
                          {selectedPeriods.map(period => (
                            <th key={period} className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                              P{period}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                          <tr key={day} className="border-t">
                            <td className="px-4 py-3 font-medium text-gray-900">{day}</td>
                            {selectedPeriods.map(period => (
                              <td key={period} className="px-4 py-3 text-center">
                                <select
                                  value={accountSetup.schedule[day]?.[period] || 'Study'}
                                  onChange={(e) => {
                                    const newSchedule = { ...accountSetup.schedule };
                                    if (!newSchedule[day]) newSchedule[day] = {};
                                    newSchedule[day][period] = e.target.value;
                                    setAccountSetup(prev => ({ ...prev, schedule: newSchedule }));
                                  }}
                                  className={`px-3 py-2 rounded-lg font-medium ${
                                    accountSetup.schedule[day]?.[period] === 'Study'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
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

                {tasks.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Class Colors (Optional)
                    </label>
                    <p className="text-xs text-gray-500 mb-3">Customize colors for your classes. Changes save automatically.</p>
                    <div className="space-y-2">
                      {Array.from(new Set(
                        tasks
                          .filter(t => t && (t.title || t.class)) // Filter out invalid tasks
                          .map(t => extractClassName(t))
                      )).map(className => (
                        <div key={className} className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
                          <input 
                            type="color" 
                            value={accountSetup.classColors[className] || getClassColor(className)}
                            onChange={(e) => {
                              const newColors = { ...accountSetup.classColors };
                              newColors[className] = e.target.value;
                              setAccountSetup(prev => ({ ...prev, classColors: newColors }));
                              // Save immediately to localStorage
                              localStorage.setItem('classColors', JSON.stringify(newColors));
                            }}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <span className="flex-1 font-medium text-gray-700">{className}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Calendar Settings */}
                {isAuthenticated && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Calendar Settings
                    </label>
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                      {[
                        {
                          key: 'calendarTodayCentered',
                          label: 'Today-Centered View',
                          desc: 'When on, today always appears in the middle column of the calendar. When off, the week runs Sun → Sat.'
                        },
                        {
                          key: 'calendarShowHomeroom',
                          label: 'Show Homeroom Tasks',
                          desc: 'When on, Homeroom tasks appear on the calendar.'
                        },
                        {
                          key: 'calendarShowCompleted',
                          label: 'Show Completed Tasks',
                          desc: 'When on, submitted and completed tasks appear with a strikethrough. When off, they are hidden.'
                        }
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-start gap-3 p-4">
                          <input
                            type="checkbox"
                            checked={accountSetup[key] || false}
                            onChange={(e) => setAccountSetup(prev => ({ ...prev, [key]: e.target.checked }))}
                            className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completion Feed Preference - Only shown after initial setup */}
                {isAuthenticated && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Privacy Settings
                    </label>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <input 
                          type="checkbox"
                          checked={user?.showInFeed !== false}
                          onChange={async (e) => {
                            try {
                              await apiCall('/user/feed-preference', 'PUT', { 
                                showInFeed: e.target.checked 
                              });
                              setUser(prev => ({ ...prev, showInFeed: e.target.checked }));
                            } catch (error) {
                              console.error('Failed to update feed preference:', error);
                            }
                          }}
                          className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Show my task completions in Live Activity feed</p>
                          <p className="text-xs text-gray-500 mt-1">
                            When enabled, other students will see when you complete tasks on the Hub page. 
                            Only your name and grade are shown.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-6">
                  <button
                    onClick={() => setShowFeedbackForm(true)}
                    className="w-full bg-blue-100 text-blue-700 py-3 rounded-lg font-semibold hover:bg-blue-200 flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Submit Feedback or Bug Report
                  </button>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setCurrentPage('hub')}
                    className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveAccountSetup}
                    disabled={settingsSaving}
                    className="flex-1 bg-gradient-to-r from-yellow-400 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {settingsSaving ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Please Wait...
                      </span>
                    ) : (
                      'Save Settings'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
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
      {showWorkspace && workspaceTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-xl flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold">{cleanTaskTitle(workspaceTask)}</h2>
                <p className="text-sm text-purple-100">
                  <span className="mr-3">{extractClassName(workspaceTask)}</span>
                  <span>Due: {workspaceTask.dueDate.toLocaleDateString()}</span>
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
                  <button
                    onClick={() => switchWorkspaceTab('canvas')}
                    className={`flex-shrink-0 py-3 px-4 font-semibold text-sm ${
                      workspaceTab === 'canvas'
                        ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    🎓 Canvas Task
                  </button>
                  <button
                    onClick={() => switchWorkspaceTab('notes')}
                    className={`flex-shrink-0 py-3 px-4 font-semibold text-sm ${
                      workspaceTab === 'notes'
                        ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    📝 Notes
                  </button>
                  <button
                    onClick={() => switchWorkspaceTab('whiteboard')}
                    className={`flex-shrink-0 py-3 px-4 font-semibold text-sm ${
                      workspaceTab === 'whiteboard'
                        ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    🎨 Whiteboard
                  </button>
                  <button
                    onClick={() => switchWorkspaceTab('calculator')}
                    className={`flex-shrink-0 py-3 px-4 font-semibold text-sm ${
                      workspaceTab === 'calculator'
                        ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    🔢 Calculator
                  </button>
                  <button
                    onClick={() => switchWorkspaceTab('whitenoise')}
                    className={`flex-shrink-0 py-3 px-4 font-semibold text-sm ${
                      workspaceTab === 'whitenoise'
                        ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    🎵 Focus Sounds
                  </button>
                  <button
                    onClick={() => switchWorkspaceTab('pomodoro')}
                    className={`flex-shrink-0 py-3 px-4 font-semibold text-sm ${
                      workspaceTab === 'pomodoro'
                        ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    ⏱️ Pomodoro
                  </button>
                </div>
                  
                {/* Tab content */}
                <div className="flex-1 overflow-hidden">
                  {workspaceTab === 'canvas' ? (
                    <div className="h-full w-full bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
                      <div className="text-center max-w-md w-full">
                        {/* Canvas Logo/Icon */}
                        <div className="mb-4">
                          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                            <BookOpen className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                          Open Canvas Task
                        </h2>
                        
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                          Canvas requires authentication and cannot be embedded. Click below to open this task in a split-screen view.
                        </p>
                        
                        {/* Task Info Card */}
                        <div className="bg-white rounded-lg p-3 mb-4 text-left shadow-sm border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">Current Task:</div>
                          <div className="font-semibold text-gray-800 text-sm">{workspaceTask.title}</div>
                          <div className="text-xs text-purple-600 mt-1">{workspaceTask.class}</div>
                        </div>
                        
                        {workspaceTask.url ? (
                          <>
                            {/* Primary Split-Screen Button */}
                            <button
                              onClick={() => openSplitScreen(workspaceTask.url)}
                              className="w-full bg-purple-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl mb-2 text-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12m-12 5h12M3 7h.01M3 12h.01M3 17h.01" />
                              </svg>
                              Open in Split-Screen
                            </button>
                            
                            {/* Secondary New Tab Button */}
                            <button
                              onClick={() => window.open(workspaceTask.url, '_blank')}
                              className="w-full bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Open in New Tab
                            </button>
                            
                            {/* Help Text */}
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
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save
                            </>
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
                          <input
                            type="color"
                            value={drawColor}
                            onChange={(e) => setDrawColor(e.target.value)}
                            className="w-10 h-8 rounded cursor-pointer border border-gray-300"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Size:</label>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            value={drawWidth}
                            onChange={(e) => setDrawWidth(parseInt(e.target.value))}
                            className="w-24"
                          />
                          <span className="text-sm text-gray-600 w-6">{drawWidth}</span>
                        </div>
                        <button
                          onClick={clearWhiteboard}
                          className="ml-auto bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-red-700"
                        >
                          Clear
                        </button>
                      </div>
                      <canvas
                        ref={whiteboardRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="flex-1 w-full border-2 border-gray-300 rounded-lg cursor-crosshair bg-white"
                        style={{ touchAction: 'none', minHeight: '400px' }}
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center">Draw directly on the canvas • Great for diagrams, math problems, and brainstorming</p>
                    </div>
                  ) : workspaceTab === 'calculator' ? (
                    <div className="h-full flex flex-col items-center justify-center p-4">
                      <iframe
                        src="https://ti84calculator.us/"
                        height="100%"
                        width="100%"
                        frameBorder="0"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                        className="rounded-lg"
                        title="TI-84 Calculator"
                      />
                    </div>
                  ) : workspaceTab === 'whitenoise' ? (
                    <div className="h-full flex flex-col p-6 items-center justify-center">
                      <div className="max-w-md w-full space-y-6">
                        <div className="text-center mb-6">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">Focus Sounds</h3>
                          <p className="text-sm text-gray-600">Play ambient sounds to help you concentrate</p>
                        </div>

                        {/* Sound Selection */}
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

                        {/* Controls */}
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
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={whiteNoiseVolume}
                                onChange={(e) => changeWhiteNoiseVolume(parseFloat(e.target.value))}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : workspaceTab === 'pomodoro' ? (
                    <div className="h-full flex flex-col p-6 items-center justify-center">
                      <div className="max-w-md w-full space-y-6">
                        <div className="text-center mb-6">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">Pomodoro Timer</h3>
                          <p className="text-sm text-gray-600">Focus for 25 minutes, then take a break</p>
                        </div>

                        {/* Mode Selector */}
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => switchPomodoroMode('work')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              pomodoroMode === 'work'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Work (25m)
                          </button>
                          <button
                            onClick={() => switchPomodoroMode('shortBreak')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              pomodoroMode === 'shortBreak'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Short Break (5m)
                          </button>
                          <button
                            onClick={() => switchPomodoroMode('longBreak')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              pomodoroMode === 'longBreak'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Long Break (15m)
                          </button>
                        </div>

                        {/* Timer Display */}
                        <div className="text-center">
                          <div className={`text-7xl font-bold mb-4 ${
                            pomodoroMode === 'work' ? 'text-purple-600' :
                            pomodoroMode === 'shortBreak' ? 'text-green-600' :
                            'text-blue-600'
                          }`}>
                            {formatPomodoroTime(pomodoroTime)}
                          </div>
                          <div className="text-sm text-gray-600 mb-6">
                            Sessions completed today: {pomodoroSessions}
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex gap-3">
                          <button
                            onClick={isPomodoroRunning ? pausePomodoro : startPomodoro}
                            className={`flex-1 py-4 rounded-lg font-semibold text-lg transition-all ${
                              isPomodoroRunning
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : pomodoroMode === 'work' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                                  pomodoroMode === 'shortBreak' ? 'bg-green-600 hover:bg-green-700 text-white' :
                                  'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {isPomodoroRunning ? '⏸ Pause' : '▶ Start'}
                          </button>
                          <button
                            onClick={resetPomodoro}
                            className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold text-lg transition-all"
                          >
                            🔄 Reset
                          </button>
                        </div>

                        <div className="text-xs text-gray-500 text-center pt-4 border-t">
                          💡 Tip: After 4 work sessions, take a long break to recharge
                        </div>
                      </div>
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
