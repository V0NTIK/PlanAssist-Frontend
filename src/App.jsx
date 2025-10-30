// PlanAssist - OneSchool Global Study Planner Frontend (ENHANCED)
// App.jsx - PART 1: Imports and State

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Play, Check, Settings, BarChart3, List, Home, LogOut, BookOpen, Brain, TrendingUp, AlertCircle, Upload, Save, Pause, X, Send, GripVertical, Lock, Unlock, Info, Edit2 } from 'lucide-react';

const API_URL = 'https://planassist.onrender.com/api';

const PlanAssist = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
    canvasUrl: '',
    presentPeriods: '2-6',
    schedule: {},
    classColors: {}
  });
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionTime, setSessionTime] = useState(3600);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
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
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [priorityLocked, setPriorityLocked] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null);
  const [newTasks, setNewTasks] = useState([]);
  const [showTaskDescription, setShowTaskDescription] = useState(null);
  const [newTasksSidebarOpen, setNewTasksSidebarOpen] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [editingTimeTaskId, setEditingTimeTaskId] = useState(null);
  const [tempTimeValue, setTempTimeValue] = useState('');
  const [markingComplete, setMarkingComplete] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [partialTaskTimes, setPartialTaskTimes] = useState({}); // Track accumulated time for partially completed tasks

  // Calculate selected periods based on presentPeriods
  const selectedPeriods = React.useMemo(() => {
    const [start, end] = accountSetup.presentPeriods.split('-').map(Number);
    const periods = [];
    for (let i = start; i <= end; i++) {
      periods.push(i);
    }
    return periods;
  }, [accountSetup.presentPeriods]);

  // Transform task from frontend format to backend format
  const taskToBackendFormat = (task) => ({
    title: task.title,
    segment: task.segment || null,
    class: task.className || extractClassName(task.title),
    description: task.description || '',
    url: task.url || '',
    deadline: task.dueDate,
    estimated_time: task.estimatedTime, // FIXED: Use estimated_time (database column name)
    user_estimated_time: task.userEstimate || null // FIXED: Use user_estimated_time (database column name)
  });

  // Extract class name from task title
  const extractClassName = (title) => {
    const match = title.match(/\[([^\]]+)\]/);
    return match ? match[1] : 'No Class';
  };

  // Remove bracketed class name from title for display
  const cleanTaskTitle = (title) => {
    return title.replace(/\s*\[([^\]]+)\]\s*/, '').trim();
  };

  // Get color for a class
  const getClassColor = (className) => {
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    taskList.forEach(task => {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      if (!task.completed && dueDate >= today) {
        const dayKey = dueDate.toDateString();
        if (!grouped[dayKey]) {
          grouped[dayKey] = [];
        }
        grouped[dayKey].push(task);
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
      if (savedColors) {
        setAccountSetup(prev => ({ ...prev, classColors: JSON.parse(savedColors) }));
      }
      loadUserData(savedToken);
    }
  }, []);

  // Load user data
  const loadUserData = async (authToken) => {
    try {
      const setupData = await fetch(`${API_URL}/account/setup`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).then(r => r.json());

      const savedColors = localStorage.getItem('classColors');
      if (setupData.grade) {
        setAccountSetup({
          name: JSON.parse(localStorage.getItem('user')).name,
          grade: setupData.grade || '',
          canvasUrl: setupData.canvasUrl || '',
          presentPeriods: setupData.presentPeriods || '2-6',
          schedule: setupData.schedule || {},
          classColors: savedColors ? JSON.parse(savedColors) : {}
        });
      }

      const tasksData = await fetch(`${API_URL}/tasks`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).then(r => r.json());

      if (tasksData.length > 0) {
        // FIXED: Corrected field mapping from backend to frontend
        const loadedTasks = tasksData.filter(t => !t.is_new).map(t => ({
          id: t.id,
          title: t.title,
          segment: t.segment,
          className: t.class,
          description: t.description,
          url: t.url,
          dueDate: new Date(t.deadline),
          estimatedTime: t.estimated_time, // FIXED: was estimatedTime
          userEstimate: t.user_estimated_time, // FIXED: was user_estimated_timed_time (typo)
          priorityOrder: t.priority_order,
          completed: t.completed,
          accumulatedTime: t.accumulated_time || 0
        }));
        
        const loadedNewTasks = tasksData.filter(t => t.is_new).map(t => ({
          id: t.id,
          title: t.title,
          segment: t.segment,
          className: t.class,
          description: t.description,
          url: t.url,
          dueDate: new Date(t.deadline),
          estimatedTime: t.estimated_time, // FIXED: was estimatedTime
          userEstimate: t.user_estimated_time, // FIXED: was user_estimated_timed_time (typo)
          priorityOrder: t.priority_order,
          completed: t.completed,
          accumulatedTime: t.accumulated_time || 0
        }));
        
        setTasks(loadedTasks);
        setNewTasks(loadedNewTasks);
        generateSessions(loadedTasks, setupData.schedule || {});
      }

      // Fetch priority lock status
      const priorityLockData = await fetch(`${API_URL}/user/priority-lock`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).then(r => r.json());
      setPriorityLocked(priorityLockData.locked || false);

      const historyData = await fetch(`${API_URL}/learning`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).then(r => r.json());

      setCompletionHistory(historyData.map(h => ({
        taskTitle: h.task_title || h.title,
        type: h.class,
        estimatedTime: h.estimated_time,
        actualTime: h.actual_time,
        date: new Date(h.completed_at)
      })));

      // Note: accumulated_time is now directly in tasks table, loaded above

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
      loadUserData(data.token);
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
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters');
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
      setCurrentPage('setup');
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
    setAccountSetup({
      name: '',
      grade: '',
      canvasUrl: '',
      presentPeriods: '2-6',
      schedule: {},
      classColors: {}
    });
    setTasks([]);
    setSessions([]);
    setCurrentPage('hub');
  };

  // Load tasks from Canvas
  const loadTasksFromCanvas = async () => {
    setIsLoadingTasks(true);
    try {
      const data = await apiCall('/canvas/import', 'POST', { calendarUrl: accountSetup.canvasUrl });
      const importedTasks = data.tasks.map(t => ({
        id: t.id,
        title: t.title,
        segment: t.segment,
        className: t.class,
        description: t.description,
        url: t.url,
        dueDate: new Date(t.deadline),
        estimatedTime: t.estimated_time, // FIXED: Use estimated_time
        userEstimate: t.user_estimated_time, // FIXED: Use user_estimated_time
        completed: t.completed,
        priorityOrder: t.priority_order,
        accumulatedTime: t.accumulated_time || 0
      }));
      setNewTasks(importedTasks.filter(t => t.is_new));
      setTasks(prev => [...prev, ...importedTasks.filter(t => !t.is_new)]);
      generateSessions([...tasks, ...importedTasks.filter(t => !t.is_new)], accountSetup.schedule);
      if (importedTasks.length > 0) {
        setNewTasksSidebarOpen(true);
      }
    } catch (error) {
      alert('Failed to load tasks from Canvas. Please check your calendar URL and try again.');
      console.error('Canvas import error:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Accept new tasks
  const acceptNewTasks = async () => {
    try {
      await apiCall('/tasks/accept-new', 'POST');
      setTasks(prev => [...prev, ...newTasks]);
      setNewTasks([]);
      setNewTasksSidebarOpen(false);
      generateSessions([...tasks, ...newTasks], accountSetup.schedule);
    } catch (error) {
      alert('Failed to accept new tasks');
      console.error('Accept new tasks error:', error);
    }
  };

  // Dismiss new tasks
  const dismissNewTasks = async () => {
    try {
      await apiCall('/tasks/dismiss-new', 'DELETE');
      setNewTasks([]);
      setNewTasksSidebarOpen(false);
    } catch (error) {
      alert('Failed to dismiss new tasks');
      console.error('Dismiss new tasks error:', error);
    }
  };

  // Save account setup
  const saveAccountSetup = async () => {
    setSettingsSaving(true);
    try {
      await apiCall('/account/setup', 'POST', {
        grade: accountSetup.grade,
        canvasUrl: accountSetup.canvasUrl,
        presentPeriods: accountSetup.presentPeriods,
        schedule: accountSetup.schedule
      });
      // Save class colors to localStorage
      localStorage.setItem('classColors', JSON.stringify(accountSetup.classColors));
      generateSessions(tasks, accountSetup.schedule);
      setCurrentPage('hub');
    } catch (error) {
      alert('Failed to save settings');
      console.error('Save setup error:', error);
    } finally {
      setSettingsSaving(false);
    }
  };

  // Generate sessions
  const generateSessions = (taskList, schedule) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const newSessions = [];
    
    days.forEach((day) => {
      selectedPeriods.forEach((period) => {
        if (schedule[day]?.[period] === 'Study') {
          newSessions.push({
            day,
            period,
            duration: 3600,
            tasks: []
          });
        }
      });
    });

    setSessions(newSessions);
  };

  // Start session
  const startSession = (sessionIndex) => {
    const session = sessions[sessionIndex];
    setCurrentSession(session);
    setSessionTime(session.duration);
    setTaskStartTime(session.duration);
    setCurrentTaskIndex(0);
    setSessionCompletions([]);
    setIsTimerRunning(true);
    setCurrentPage('session');
  };

  // Timer effect
  useEffect(() => {
    if (!isTimerRunning || !currentSession) return;
    const interval = setInterval(() => {
      setSessionTime(prev => {
        if (prev <= 1) {
          handleEndSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, currentSession]);

  // Mark task complete
  const handleCompleteTask = async (taskId) => {
    setMarkingComplete(true);
    try {
      const currentTask = tasks.find(t => t.id === taskId);
      if (!currentTask) return;

      const timeSpent = taskStartTime - sessionTime;
      
      // FIXED: Call complete endpoint - backend handles accumulated_time + new time
      await apiCall(`/tasks/${taskId}/complete`, 'POST', { 
        timeSpent: Math.round(timeSpent / 60) // Convert seconds to minutes
      });

      // Remove from tasks list
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setSessionCompletions(prev => [...prev, { ...currentTask, actualTime: Math.round(timeSpent / 60) }]);
      
      // Move to next task
      if (currentTaskIndex < tasks.length - 1) {
        setCurrentTaskIndex(prev => prev + 1);
        setTaskStartTime(sessionTime);
      } else {
        handleEndSession();
      }
      
      setHasUnsavedChanges(false);
      setShowCompleteConfirm(null);
    } catch (error) {
      alert('Failed to complete task');
      console.error('Complete task error:', error);
    } finally {
      setMarkingComplete(false);
    }
  };

  // Skip task
  const handleSkipTask = async () => {
    const currentTask = tasks[currentTaskIndex];
    if (!currentTask) return;

    const timeSpent = taskStartTime - sessionTime;
    
    if (timeSpent > 60) { // Only log if more than 1 minute spent
      try {
        // FIXED: Use /partial endpoint to ADD time to accumulated_time
        await apiCall(`/tasks/${currentTask.id}/partial`, 'POST', { 
          timeSpent: Math.round(timeSpent / 60) // Convert seconds to minutes
        });
        
        // Update local state
        setTasks(prev => prev.map(t => 
          t.id === currentTask.id 
            ? { ...t, accumulatedTime: (t.accumulatedTime || 0) + Math.round(timeSpent / 60) }
            : t
        ));
      } catch (error) {
        console.error('Failed to save partial completion:', error);
      }
    }

    // Move to next task
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
      setTaskStartTime(sessionTime);
      setHasUnsavedChanges(false);
    } else {
      handleEndSession();
    }
  };

  // Save session state
  const handleSaveSession = async () => {
    setSavingSession(true);
    try {
      const currentTask = tasks[currentTaskIndex];
      if (!currentTask) return;

      const timeSpent = taskStartTime - sessionTime;
      
      // Save partial time if any
      if (timeSpent > 60) {
        await apiCall(`/tasks/${currentTask.id}/partial`, 'POST', { 
          timeSpent: Math.round(timeSpent / 60)
        });
      }

      // Save session state
      await apiCall('/sessions/save-state', 'POST', {
        day: currentSession.day,
        period: currentSession.period,
        remainingTime: sessionTime,
        currentTaskIndex: currentTask.id, // FIXED: Use task ID not index
        taskStartTime: taskStartTime,
        completedTaskIds: sessionCompletions.map(c => c.id)
      });

      setHasUnsavedChanges(false);
      setIsTimerRunning(false);
      setCurrentPage('hub');
    } catch (error) {
      alert('Failed to save session');
      console.error('Save session error:', error);
    } finally {
      setSavingSession(false);
    }
  };

  // Resume saved session
  const resumeSavedSession = async () => {
    try {
      const sessionStateData = await apiCall('/sessions/saved-state');
      if (!sessionStateData.sessionId) return;

      const session = sessions.find(s => 
        s.day === sessionStateData.day && 
        s.period === sessionStateData.period
      );

      if (session) {
        setCurrentSession(session);
        setSessionTime(sessionStateData.remainingTime);
        setTaskStartTime(sessionStateData.taskStartTime);
        
        // FIXED: Find task by ID not index
        const taskIndex = tasks.findIndex(t => t.id === sessionStateData.currentTaskIndex);
        setCurrentTaskIndex(taskIndex >= 0 ? taskIndex : 0);
        
        setSessionCompletions(tasks.filter(t => 
          sessionStateData.completedTaskIds.includes(t.id)
        ));
        setCurrentPage('session');
        
        // Delete saved state after resuming
        await apiCall('/sessions/saved-state', 'DELETE');
        setSavedSessionState(null);
      }
    } catch (error) {
      console.error('Resume session error:', error);
    }
  };

  // End session
  const handleEndSession = () => {
    setEndingSession(true);
    const summary = {
      day: currentSession.day,
      period: currentSession.period,
      completions: sessionCompletions,
      timeUsed: currentSession.duration - sessionTime
    };
    setSessionSummary(summary);
    setShowSessionSummary(true);
    setIsTimerRunning(false);
    setCurrentSession(null);
    setHasUnsavedChanges(false);
    loadUserData(token);
    setEndingSession(false);
  };

  // Close session summary
  const closeSessionSummary = () => {
    setShowSessionSummary(false);
    setSessionSummary(null);
    setCurrentPage('hub');
  };

  // Update task time estimate
  const handleUpdateTaskTime = async (taskId, newTime) => {
    try {
      await apiCall(`/tasks/${taskId}/estimate`, 'PATCH', { 
        userEstimate: parseInt(newTime) 
      });
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, userEstimate: parseInt(newTime) } : t
      ));
      setEditingTimeTaskId(null);
      setTempTimeValue('');
    } catch (error) {
      alert('Failed to update time estimate');
      console.error('Update time error:', error);
    }
  };

  // Split task
  const handleSplitTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setShowSplitTask(task);
    setSplitSegments([{ name: 'Part 1' }]);
  };

  const addSegment = () => {
    setSplitSegments(prev => [...prev, { name: `Part ${prev.length + 1}` }]);
  };

  const removeSegment = (index) => {
    if (splitSegments.length > 1) {
      setSplitSegments(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateSegmentName = (index, name) => {
    setSplitSegments(prev => prev.map((seg, i) => i === index ? { name } : seg));
  };

  const confirmSplitTask = async () => {
    const task = showSplitTask;
    const taskIndex = tasks.findIndex(t => t.id === task.id);
    if (taskIndex === -1) return;

    try {
      const timePerSegment = Math.ceil((task.userEstimate || task.estimatedTime) / splitSegments.length);
      
      // Generate unique split_task_ids for each segment
      const baseId = Date.now();
      
      const newTasks = splitSegments.map((seg, idx) => ({
        id: baseId + idx, // Temporary ID, will be replaced by backend
        title: `${task.title} - ${seg.name}`,
        description: task.description,
        dueDate: task.dueDate,
        estimatedTime: timePerSegment,
        userEstimate: timePerSegment,
        completed: false,
        segment: seg.name,
        className: task.className, // FIXED: Added missing comma
        url: task.url,
        accumulatedTime: 0
      }));
      
      // Remove the original task and add segments in its place
      const updatedTasks = [...tasks];
      updatedTasks.splice(taskIndex, 1, ...newTasks);
      
      // Save to backend to get real database IDs
      try {
        const saveResult = await apiCall('/tasks', 'POST', { tasks: updatedTasks.map(taskToBackendFormat) });
        
        // Reload tasks from backend to get correct IDs
        const tasksData = await apiCall('/tasks');
        const loadedTasks = tasksData.filter(t => !t.is_new).map(t => ({
          id: t.id,
          title: t.title,
          segment: t.segment,
          className: t.class,
          description: t.description,
          url: t.url,
          dueDate: new Date(t.deadline),
          estimatedTime: t.estimated_time,
          userEstimate: t.user_estimated_time,
          priorityOrder: t.priority_order,
          completed: t.completed,
          accumulatedTime: t.accumulated_time || 0
        }));
        
        setTasks(loadedTasks);
        generateSessions(loadedTasks, accountSetup.schedule);
      } catch (error) {
        console.error('Failed to save split tasks:', error);
        // Fallback: use local state
        setTasks(updatedTasks);
        generateSessions(updatedTasks, accountSetup.schedule);
      }
      
      setShowSplitTask(null);
      setSplitSegments([{ name: 'Part 1' }]);
    } catch (error) {
      alert('Failed to split task');
      console.error('Split task error:', error);
    }
  };

  // Priority management
  const handleTogglePriorityLock = async () => {
    try {
      const newLocked = !priorityLocked;
      await apiCall('/user/priority-lock', 'POST', { locked: newLocked });
      setPriorityLocked(newLocked);
    } catch (error) {
      alert('Failed to update priority lock');
      console.error('Priority lock error:', error);
    }
  };

  const handleDragStart = (task) => {
    if (!priorityLocked) {
      setDraggedTask(task);
    }
  };

  const handleDragOver = (e, task) => {
    e.preventDefault();
    if (!priorityLocked && draggedTask && draggedTask.id !== task.id) {
      setDragOverTask(task);
    }
  };

  const handleDrop = async (task) => {
    if (!priorityLocked && draggedTask && draggedTask.id !== task.id) {
      const draggedIndex = tasks.findIndex(t => t.id === draggedTask.id);
      const droppedIndex = tasks.findIndex(t => t.id === task.id);
      
      const newTasks = [...tasks];
      newTasks.splice(draggedIndex, 1);
      newTasks.splice(droppedIndex, 0, draggedTask);
      
      // Update priority orders
      const updatedTasks = newTasks.map((t, idx) => ({
        ...t,
        priorityOrder: idx + 1
      }));
      
      setTasks(updatedTasks);
      
      // Save to backend
      try {
        await apiCall('/tasks/priority', 'PATCH', {
          priorities: updatedTasks.map(t => ({ id: t.id, priorityOrder: t.priorityOrder }))
        });
      } catch (error) {
        console.error('Failed to update priorities:', error);
      }
      
      setDraggedTask(null);
      setDragOverTask(null);
    }
  };

  // Feedback
  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return;
    setFeedbackSending(true);
    try {
      await apiCall('/feedback', 'POST', {
        feedback: feedbackText,
        userEmail: user.email,
        userName: user.name
      });
      alert('Thank you for your feedback!');
      setShowFeedbackForm(false);
      setFeedbackText('');
    } catch (error) {
      alert('Failed to send feedback. Please try again.');
      console.error('Feedback error:', error);
    } finally {
      setFeedbackSending(false);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Sort tasks
  const sortedTasks = React.useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      // First by priority order if set
      if (a.priorityOrder !== null && b.priorityOrder !== null) {
        return a.priorityOrder - b.priorityOrder;
      }
      if (a.priorityOrder !== null) return -1;
      if (b.priorityOrder !== null) return 1;
      
      // Then by due date
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
    return sorted;
  }, [tasks]);

  // Get current task being worked on
  const getCurrentTask = () => {
    if (!currentSession || !tasks.length) return null;
    return sortedTasks[currentTaskIndex];
  };

  // Render auth screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-purple-600 bg-clip-text text-transparent">
              PlanAssist
            </h1>
            <p className="text-gray-600 mt-2">OneSchool Global Study Planner</p>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="first.last##@na.oneschoolglobal.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              {authError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {authError}
                </div>
              )}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-yellow-400 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {authLoading ? 'Logging in...' : 'Log In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
                className="w-full text-purple-600 hover:text-purple-700 font-medium"
              >
                Don't have an account? Sign up
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="first.last##@na.oneschoolglobal.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
              </div>
              {authError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {authError}
                </div>
              )}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-yellow-400 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {authLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
                className="w-full text-purple-600 hover:text-purple-700 font-medium"
              >
                Already have an account? Log in
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Main app render
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-purple-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-purple-600 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-500 to-purple-600 bg-clip-text text-transparent">
                  PlanAssist
                </h1>
                <p className="text-xs text-gray-600">Welcome, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage('hub')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 'hub'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Home className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage('tasks')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 'tasks'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage('learning')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 'learning'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Brain className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage('setup')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 'setup'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* New Tasks Sidebar */}
      {newTasks.length > 0 && newTasksSidebarOpen && (
        <div className="fixed right-0 top-16 h-full w-96 bg-white shadow-2xl z-50 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">New Tasks ({newTasks.length})</h3>
            <button
              onClick={() => setNewTasksSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            These tasks were just imported from Canvas. Review and accept them to add to your task list.
          </p>
          <div className="space-y-3 mb-4">
            {newTasks.map(task => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: getClassColor(task.className) }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{cleanTaskTitle(task.title)}</h4>
                    <p className="text-xs text-gray-500 mt-1">{task.className}</p>
                    <p className="text-xs text-gray-500">
                      Due: {task.dueDate.toLocaleDateString()}
                    </p>
                    <p className="text-xs text-purple-600 font-medium mt-1">
                      Est: {formatDuration(task.estimatedTime)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={dismissNewTasks}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 font-medium"
            >
              Dismiss
            </button>
            <button
              onClick={acceptNewTasks}
              className="flex-1 bg-gradient-to-r from-yellow-400 to-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700"
            >
              Accept All
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Hub Page */}
        {currentPage === 'hub' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Study Hub</h2>
              
              {savedSessionState && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-yellow-900">Resume Your Session</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        You have a saved session from {savedSessionState.day}, Period {savedSessionState.period}
                      </p>
                      <button
                        onClick={resumeSavedSession}
                        className="mt-3 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 font-medium"
                      >
                        Resume Session
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.length > 0 ? (
                  sessions.map((session, idx) => (
                    <button
                      key={idx}
                      onClick={() => startSession(idx)}
                      className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all text-left"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Calendar className="w-8 h-8 text-purple-600" />
                        <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-semibold">
                          P{session.period}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">{session.day}</h3>
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(session.duration / 60)}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No study sessions available</p>
                    <p className="text-sm text-gray-500 mt-2">Configure your schedule in Settings</p>
                  </div>
                )}
              </div>
            </div>

            {tasks.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Tasks</h2>
                <div className="space-y-4">
                  {sortedTasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getClassColor(task.className) }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{cleanTaskTitle(task.title)}</h4>
                        {task.segment && (
                          <p className="text-sm text-purple-600">• {task.segment}</p>
                        )}
                        <p className="text-sm text-gray-500">{task.className}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-gray-900">
                          {task.dueDate.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-purple-600">
                          {formatDuration(task.userEstimate || task.estimatedTime)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tasks Page */}
        {currentPage === 'tasks' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">All Tasks</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTogglePriorityLock}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                    priorityLocked
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {priorityLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  {priorityLocked ? 'Locked' : 'Unlocked'}
                </button>
                {newTasks.length > 0 && (
                  <button
                    onClick={() => setNewTasksSidebarOpen(true)}
                    className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 font-medium"
                  >
                    {newTasks.length} New Tasks
                  </button>
                )}
              </div>
            </div>

            {!priorityLocked && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Priority Mode</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Drag and drop tasks to reorder them. Your custom order will be used during study sessions. Lock priorities when you're done.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {sortedTasks.length > 0 ? (
              <div className="space-y-3">
                {sortedTasks.map((task, idx) => (
                  <div
                    key={task.id}
                    draggable={!priorityLocked}
                    onDragStart={() => handleDragStart(task)}
                    onDragOver={(e) => handleDragOver(e, task)}
                    onDrop={() => handleDrop(task)}
                    className={`border-2 rounded-xl p-4 transition-all ${
                      !priorityLocked ? 'cursor-move' : 'cursor-default'
                    } ${
                      dragOverTask?.id === task.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {!priorityLocked && (
                        <GripVertical className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      )}
                      <div
                        className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: getClassColor(task.className) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{cleanTaskTitle(task.title)}</h4>
                            {task.segment && (
                              <p className="text-sm text-purple-600 font-medium">• {task.segment}</p>
                            )}
                            <p className="text-sm text-gray-600 mt-1">{task.className}</p>
                          </div>
                          {task.description && (
                            <button
                              onClick={() => setShowTaskDescription(showTaskDescription === task.id ? null : task.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View description"
                            >
                              <Info className="w-4 h-4 text-gray-500" />
                            </button>
                          )}
                        </div>
                        {showTaskDescription === task.id && task.description && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{task.description}</p>
                            {task.url && (
                              <a
                                href={task.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-purple-600 hover:text-purple-700 mt-2 inline-block"
                              >
                                View in Canvas →
                              </a>
                            )}
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            Due: {task.dueDate.toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-2">
                            {editingTimeTaskId === task.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={tempTimeValue}
                                  onChange={(e) => setTempTimeValue(e.target.value)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                                  placeholder="mins"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleUpdateTaskTime(task.id, tempTimeValue)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingTimeTaskId(null);
                                    setTempTimeValue('');
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="text-purple-600 font-medium">
                                  Est: {formatDuration(task.userEstimate || task.estimatedTime)}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingTimeTaskId(task.id);
                                    setTempTimeValue(String(task.userEstimate || task.estimatedTime));
                                  }}
                                  className="text-gray-500 hover:text-gray-700"
                                  title="Edit time estimate"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                          {task.accumulatedTime > 0 && (
                            <span className="text-orange-600 font-medium">
                              Spent: {formatDuration(task.accumulatedTime)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleSplitTask(task.id)}
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                        >
                          Split
                        </button>
                        {task.url && (
                          <a
                            href={task.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium text-center"
                          >
                            Canvas
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <List className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No tasks yet</p>
                <p className="text-sm text-gray-500 mt-2">Import tasks from Canvas in Settings</p>
              </div>
            )}
          </div>
        )}

        {/* Learning Page */}
        {currentPage === 'learning' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Analytics</h2>
            
            {completionHistory.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                      <h3 className="font-semibold text-gray-900">Total Completed</h3>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{completionHistory.length}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-6 h-6 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Total Time</h3>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatDuration(completionHistory.reduce((sum, h) => sum + h.actualTime, 0))}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Brain className="w-6 h-6 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">Accuracy</h3>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">
                      {Math.round(
                        (completionHistory.reduce((sum, h) => sum + (h.estimatedTime / h.actualTime), 0) /
                          completionHistory.length) * 100
                      )}%
                    </p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Completion History</h3>
                  <div className="space-y-3">
                    {completionHistory.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{entry.taskTitle}</h4>
                          <p className="text-sm text-gray-500">{entry.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {entry.date.toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              Est: {formatDuration(entry.estimatedTime)}
                            </span>
                            <span className="text-xs text-gray-400">→</span>
                            <span className="text-xs font-medium text-purple-600">
                              Actual: {formatDuration(entry.actualTime)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No completion history yet</p>
                <p className="text-sm text-gray-500 mt-2">Complete some tasks to see your progress</p>
              </div>
            )}
          </div>
        )}

        {/* Session Page */}
        {currentPage === 'session' && currentSession && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-2xl p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{currentSession.day}</h2>
                  <p className="text-gray-600 mt-1">Period {currentSession.period}</p>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold ${sessionTime < 300 ? 'text-red-600' : 'text-purple-600'}`}>
                    {formatTime(sessionTime)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Time Remaining</p>
                </div>
              </div>

              {getCurrentTask() ? (
                <div className="mb-8">
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-6 h-6 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: getClassColor(getCurrentTask().className) }}
                      />
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {cleanTaskTitle(getCurrentTask().title)}
                        </h3>
                        {getCurrentTask().segment && (
                          <p className="text-lg text-purple-600 font-medium mb-2">
                            • {getCurrentTask().segment}
                          </p>
                        )}
                        <p className="text-gray-700 mb-3">{getCurrentTask().className}</p>
                        {getCurrentTask().description && (
                          <p className="text-gray-600 text-sm mb-3">{getCurrentTask().description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            Due: {getCurrentTask().dueDate.toLocaleDateString()}
                          </span>
                          <span className="text-purple-600 font-medium">
                            Estimated: {formatDuration(getCurrentTask().userEstimate || getCurrentTask().estimatedTime)}
                          </span>
                          {getCurrentTask().accumulatedTime > 0 && (
                            <span className="text-orange-600 font-medium">
                              Previous time: {formatDuration(getCurrentTask().accumulatedTime)}
                            </span>
                          )}
                        </div>
                        {getCurrentTask().url && (
                          <a
                            href={getCurrentTask().url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                          >
                            Open in Canvas
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-4 rounded-xl font-bold hover:from-yellow-500 hover:to-orange-600 flex items-center justify-center gap-2 text-lg"
                    >
                      {isTimerRunning ? (
                        <>
                          <Pause className="w-6 h-6" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-6 h-6" />
                          Resume
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowCompleteConfirm(getCurrentTask().id)}
                      disabled={markingComplete}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                    >
                      {markingComplete ? (
                        <>
                          <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                          Completing...
                        </>
                      ) : (
                        <>
                          <Check className="w-6 h-6" />
                          Complete
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleSkipTask}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300"
                    >
                      Skip Task
                    </button>
                    <button
                      onClick={handleSaveSession}
                      disabled={savingSession}
                      className="flex-1 bg-blue-100 text-blue-700 py-3 rounded-xl font-semibold hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {savingSession ? (
                        <>
                          <div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save & Exit
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">All Tasks Complete!</h3>
                  <p className="text-gray-600 mb-6">Great work! You've finished all your tasks for this session.</p>
                  <button
                    onClick={handleEndSession}
                    disabled={endingSession}
                    className="bg-gradient-to-r from-yellow-400 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:from-yellow-500 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {endingSession ? 'Ending Session...' : 'End Session'}
                  </button>
                </div>
              )}

              {sessionCompletions.length > 0 && (
                <div className="mt-8 border-t pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Completed This Session ({sessionCompletions.length})</h4>
                  <div className="space-y-2">
                    {sessionCompletions.map((completion, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{cleanTaskTitle(completion.title)}</p>
                          <p className="text-sm text-gray-600">{completion.className}</p>
                        </div>
                        <span className="text-sm text-green-600 font-medium">
                          {formatDuration(completion.actualTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings/Setup Page */}
        {currentPage === 'setup' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                  <select value={accountSetup.grade} onChange={(e) => setAccountSetup(prev => ({ ...prev, grade: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="">Select Grade</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Canvas Calendar Feed URL
                  </label>
                  <input
                    type="url"
                    value={accountSetup.canvasUrl}
                    onChange={(e) => setAccountSetup(prev => ({ ...prev, canvasUrl: e.target.value }))}
                    placeholder="https://canvas.oneschoolglobal.com/feeds/calendars/..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 mb-2"
                  />
                  <div className="flex gap-3 mb-3">
                    <button
                      onClick={loadTasksFromCanvas}
                      disabled={isLoadingTasks || !accountSetup.canvasUrl}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoadingTasks ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Import Tasks from Canvas
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Find this in Canvas: Calendar → Calendar Feed → Copy the URL</p>
                  <p className="text-xs text-blue-600 mt-1">💡 The URL should contain "/feeds/calendars/"</p>
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
                      {Array.from(new Set(tasks.map(t => extractClassName(t.title)))).map(className => (
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
      
      {/* Complete Task Confirmation Modal */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Mark Task as Complete?</h3>
            <p className="text-gray-600 mb-6">
              This will mark the task as complete and record the time you spent on it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteConfirm(null)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCompleteTask(showCompleteConfirm)}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700"
              >
                Complete Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Task Modal */}
      {showSplitTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Split Task into Segments</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-1">{cleanTaskTitle(showSplitTask.title)}</h4>
              <p className="text-sm text-gray-600">{showSplitTask.className}</p>
            </div>
            <p className="text-gray-600 mb-6">
              Break this task into smaller parts. Each segment will become a separate task with its own time estimate.
            </p>
            
            <div className="space-y-3 mb-6">
              {splitSegments.map((segment, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={segment.name}
                    onChange={(e) => updateSegmentName(idx, e.target.value)}
                    placeholder={`Segment ${idx + 1} name`}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  {splitSegments.length > 1 && (
                    <button
                      onClick={() => removeSegment(idx)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button
              onClick={addSegment}
              className="w-full bg-purple-100 text-purple-700 py-3 rounded-lg font-semibold hover:bg-purple-200 mb-4"
            >
              + Add Segment
            </button>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700">
                The time estimate will be divided equally among {splitSegments.length} segment{splitSegments.length > 1 ? 's' : ''} 
                ({formatDuration(Math.ceil((showSplitTask.userEstimate || showSplitTask.estimatedTime) / splitSegments.length))} each)
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSplitTask(null);
                  setSplitSegments([{ name: 'Part 1' }]);
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmSplitTask}
                className="flex-1 bg-gradient-to-r from-yellow-400 to-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700"
              >
                Split Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Summary Modal */}
      {showSessionSummary && sessionSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Session Complete!</h2>
              <p className="text-gray-600">{sessionSummary.day}, Period {sessionSummary.period}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-1">Tasks Completed</p>
                  <p className="text-4xl font-bold text-purple-600">{sessionSummary.completions.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-1">Time Studied</p>
                  <p className="text-4xl font-bold text-purple-600">{formatDuration(Math.floor(sessionSummary.timeUsed / 60))}</p>
                </div>
              </div>
            </div>

            {sessionSummary.completions.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Completed Tasks:</h3>
                <div className="space-y-2">
                  {sessionSummary.completions.map((completion, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{cleanTaskTitle(completion.title)}</p>
                        <p className="text-sm text-gray-600">{completion.className}</p>
                      </div>
                      <span className="text-sm text-green-600 font-medium">
                        {formatDuration(completion.actualTime)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={closeSessionSummary}
              className="w-full bg-gradient-to-r from-yellow-400 to-purple-600 text-white py-4 rounded-xl font-bold hover:from-yellow-500 hover:to-purple-700 text-lg"
            >
              Return to Hub
            </button>
          </div>
        </div>
      )}

      {/* Feedback Form Modal */}
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
    </div>
  );
};

export default PlanAssist;
