// PlanAssist - OneSchool Global Study Planner Frontend (ENHANCED)
// App.jsx - PART 1: Imports and State

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Play, Check, Settings, BarChart3, List, Home, LogOut, Brain, TrendingUp, AlertCircle, Upload, Save, Pause, X, Send, GripVertical, Lock, Unlock, Info, Edit2 } from 'lucide-react';

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

  // Calculate selected periods based on presentPeriods
  const selectedPeriods = React.useMemo(() => {
    const [start, end] = accountSetup.presentPeriods.split('-').map(Number);
    const periods = [];
    for (let i = start; i <= end; i++) {
      periods.push(i);
    }
    return periods;
  }, [accountSetup.presentPeriods]);

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
    const colors = ['#3b82f6', '#4a2c7c', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#14b8a6'];
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
        const loadedTasks = tasksData.filter(t => !t.is_new).map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          dueDate: new Date(t.due_date),
          estimatedTime: t.estimated_time,
          userEstimate: t.user_estimate,
          priorityOrder: t.priority_order,
          completed: t.completed,
          parent_task_id: t.parent_task_id,
          segment_name: t.segment_name
        }));
        setTasks(loadedTasks);

        const newTasksData = tasksData.filter(t => t.is_new).map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          dueDate: new Date(t.due_date),
          estimatedTime: t.estimated_time,
          userEstimate: t.user_estimate,
          priorityOrder: t.priority_order,
          completed: t.completed,
          parent_task_id: t.parent_task_id,
          segment_name: t.segment_name
        }));
        setNewTasks(newTasksData);
      }

      const sessionsData = await fetch(`${API_URL}/sessions`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).then(r => r.json());

      if (sessionsData.length > 0) {
        const loadedSessions = sessionsData.map(s => ({
          id: s.id,
          date: new Date(s.date),
          scheduledDuration: s.scheduled_duration,
          actualDuration: s.actual_duration,
          tasksCompleted: s.tasks_completed,
          tasksPlanned: s.tasks_planned
        }));
        setSessions(loadedSessions);
        const completed = sessionsData.filter(s => s.actual_duration).map(s => s.id);
        setCompletedSessionIds(completed);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Auth handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const data = await apiCall('/auth/login', 'POST', { email, password });
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
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
    try {
      const data = await apiCall('/auth/register', 'POST', { 
        email, 
        password, 
        name: email.split('@')[0] 
      });
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentPage('setup');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentPage('hub');
    setTasks([]);
    setSessions([]);
  };

  // Account setup
  const saveAccountSetup = async () => {
    try {
      setSettingsSaving(true);
      await apiCall('/account/setup', 'PUT', {
        grade: accountSetup.grade,
        canvasUrl: accountSetup.canvasUrl,
        presentPeriods: accountSetup.presentPeriods,
        schedule: accountSetup.schedule
      });
      alert('Settings saved successfully!');
      setCurrentPage('hub');
    } catch (error) {
      alert('Error saving settings: ' + error.message);
    } finally {
      setSettingsSaving(false);
    }
  };

  // Task management
  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const data = await apiCall('/tasks/fetch-canvas');
      const loadedTasks = data.tasks.filter(t => !t.is_new).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: new Date(t.due_date),
        estimatedTime: t.estimated_time,
        userEstimate: t.user_estimate,
        priorityOrder: t.priority_order,
        completed: t.completed,
        parent_task_id: t.parent_task_id,
        segment_name: t.segment_name
      }));
      const newTasksData = data.tasks.filter(t => t.is_new).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: new Date(t.due_date),
        estimatedTime: t.estimated_time,
        userEstimate: t.user_estimate,
        priorityOrder: t.priority_order,
        completed: t.completed,
        parent_task_id: t.parent_task_id,
        segment_name: t.segment_name
      }));
      setTasks(loadedTasks);
      setNewTasks(newTasksData);
      if (newTasksData.length > 0) {
        setNewTasksSidebarOpen(true);
      }
    } catch (error) {
      alert('Error fetching tasks: ' + error.message);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const toggleTaskCompletion = async (taskId) => {
    try {
      // Find the task in the current tasks array
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const newCompletedStatus = !task.completed;
      
      // Update local state immediately
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === taskId ? { ...t, completed: newCompletedStatus } : t
        )
      );

      // Update backend
      await apiCall(`/tasks/${taskId}/complete`, 'PUT', { 
        completed: newCompletedStatus 
      });
    } catch (error) {
      console.error('Error toggling task:', error);
      // Revert on error
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === taskId ? { ...t, completed: !t.completed } : t
        )
      );
      alert('Error updating task: ' + error.message);
    }
  };

  const handleDismissNewTask = async (taskId) => {
    try {
      await apiCall(`/tasks/${taskId}`, 'DELETE');
      setNewTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      alert('Error dismissing task: ' + error.message);
    }
  };

  const handleAddNewTask = (taskId) => {
    const task = newTasks.find(t => t.id === taskId);
    if (task) {
      setTasks(prev => [...prev, { ...task }]);
      setNewTasks(prev => prev.filter(t => t.id !== taskId));
      setHasUnsavedChanges(true);
    }
  };

  const handleSplitTask = async (taskId) => {
    try {
      const segments = splitSegments.map(s => s.name).filter(n => n.trim());
      await apiCall(`/tasks/${taskId}/split`, 'POST', { segments });
      
      // Refresh tasks
      const tasksData = await apiCall('/tasks');
      const loadedTasks = tasksData.filter(t => !t.is_new).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: new Date(t.due_date),
        estimatedTime: t.estimated_time,
        userEstimate: t.user_estimate,
        priorityOrder: t.priority_order,
        completed: t.completed,
        parent_task_id: t.parent_task_id,
        segment_name: t.segment_name
      }));
      setTasks(loadedTasks);
      setShowSplitTask(null);
      setSplitSegments([{ name: 'Part 1' }]);
      setHasUnsavedChanges(true);
    } catch (error) {
      alert('Error splitting task: ' + error.message);
    }
  };

  // Priority reordering
  const handleDragStart = (e, task) => {
    if (priorityLocked) return;
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, task) => {
    if (priorityLocked) return;
    e.preventDefault();
    if (draggedTask && draggedTask.id !== task.id) {
      setDragOverTask(task);
    }
  };

  const handleDrop = (e, dropTask) => {
    if (priorityLocked) return;
    e.preventDefault();
    
    if (!draggedTask || draggedTask.id === dropTask.id) {
      setDraggedTask(null);
      setDragOverTask(null);
      return;
    }

    const draggedIndex = tasks.findIndex(t => t.id === draggedTask.id);
    const dropIndex = tasks.findIndex(t => t.id === dropTask.id);

    const newTasks = [...tasks];
    newTasks.splice(draggedIndex, 1);
    newTasks.splice(dropIndex, 0, draggedTask);

    // Update priority order
    const updatedTasks = newTasks.map((task, index) => ({
      ...task,
      priorityOrder: index
    }));

    setTasks(updatedTasks);
    setDraggedTask(null);
    setDragOverTask(null);
    setHasUnsavedChanges(true);
  };

  const savePriorityChanges = async () => {
    try {
      const priorities = tasks.map((task, index) => ({
        id: task.id,
        priorityOrder: index
      }));
      
      await apiCall('/tasks/priorities', 'PUT', { priorities });
      setHasUnsavedChanges(false);
      alert('Priorities saved successfully!');
    } catch (error) {
      alert('Error saving priorities: ' + error.message);
    }
  };

  // Manual time estimation handlers
  const handleStartEditTime = (taskId, currentTime) => {
    setEditingTimeTaskId(taskId);
    setTempTimeValue(currentTime.toString());
  };

  const handleTimeChange = (e) => {
    const value = e.target.value;
    // Only allow numbers
    if (/^\d*$/.test(value)) {
      const numValue = parseInt(value) || 0;
      // Limit to 60 minutes
      if (numValue <= 60) {
        setTempTimeValue(value);
      }
    }
  };

  const handleSaveTimeEstimate = async (taskId) => {
    try {
      const newTime = parseInt(tempTimeValue) || 0;
      if (newTime < 1 || newTime > 60) {
        alert('Please enter a time between 1 and 60 minutes');
        return;
      }

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? { ...t, userEstimate: newTime } : t
        )
      );

      // Update backend
      await apiCall(`/tasks/${taskId}/estimate`, 'PUT', {
        userEstimate: newTime
      });

      setEditingTimeTaskId(null);
      setTempTimeValue('');
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error updating time estimate:', error);
      alert('Error updating time estimate: ' + error.message);
    }
  };

  const handleCancelEditTime = () => {
    setEditingTimeTaskId(null);
    setTempTimeValue('');
  };

  // Session planning
  const generateStudyPlan = async (selectedDay, duration) => {
    try {
      const data = await apiCall('/sessions/plan', 'POST', {
        date: selectedDay.toISOString(),
        duration: duration * 60
      });

      const newSession = {
        id: data.session.id,
        date: new Date(data.session.date),
        scheduledDuration: data.session.scheduled_duration,
        actualDuration: data.session.actual_duration,
        tasksCompleted: data.session.tasks_completed,
        tasksPlanned: data.session.tasks_planned
      };

      setSessions(prev => [...prev, newSession]);
      setCurrentPage('calendar');
    } catch (error) {
      alert('Error generating plan: ' + error.message);
    }
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      await apiCall(`/sessions/${sessionId}`, 'DELETE');
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      alert('Error deleting session: ' + error.message);
    }
  };

  // Session execution
  const startSession = (session) => {
    setCurrentSession(session);
    setSessionTime(session.scheduledDuration);
    setTaskStartTime(session.scheduledDuration);
    setCurrentTaskIndex(0);
    setSessionCompletions([]);
    setCurrentPage('session');
    
    const savedState = {
      sessionId: session.id,
      currentTaskIndex: 0,
      sessionTime: session.scheduledDuration,
      taskStartTime: session.scheduledDuration,
      completions: []
    };
    localStorage.setItem('activeSession', JSON.stringify(savedState));
    setSavedSessionState(savedState);
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const completeCurrentTask = () => {
    const task = currentSession.tasksPlanned[currentTaskIndex];
    const timeSpent = taskStartTime - sessionTime;
    
    const completion = {
      taskId: task.id,
      taskTitle: task.title,
      timeSpent,
      estimatedTime: task.userEstimate || task.estimatedTime,
      timestamp: new Date()
    };

    const newCompletions = [...sessionCompletions, completion];
    setSessionCompletions(newCompletions);
    
    const savedState = {
      sessionId: currentSession.id,
      currentTaskIndex: currentTaskIndex + 1,
      sessionTime,
      taskStartTime: sessionTime,
      completions: newCompletions
    };
    localStorage.setItem('activeSession', JSON.stringify(savedState));
    setSavedSessionState(savedState);

    if (currentTaskIndex < currentSession.tasksPlanned.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
      setTaskStartTime(sessionTime);
    } else {
      endSession(newCompletions);
    }
  };

  const skipCurrentTask = () => {
    if (currentTaskIndex < currentSession.tasksPlanned.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
      setTaskStartTime(sessionTime);
      
      const savedState = {
        sessionId: currentSession.id,
        currentTaskIndex: currentTaskIndex + 1,
        sessionTime,
        taskStartTime: sessionTime,
        completions: sessionCompletions
      };
      localStorage.setItem('activeSession', JSON.stringify(savedState));
      setSavedSessionState(savedState);
    } else {
      endSession(sessionCompletions);
    }
  };

  const endSession = async (completions = sessionCompletions) => {
    setIsTimerRunning(false);
    const actualDuration = currentSession.scheduledDuration - sessionTime;

    try {
      await apiCall(`/sessions/${currentSession.id}/complete`, 'PUT', {
        actualDuration,
        completions: completions.map(c => ({
          taskId: c.taskId,
          timeSpent: c.timeSpent
        }))
      });

      const tasksData = await apiCall('/tasks');
      const loadedTasks = tasksData.filter(t => !t.is_new).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: new Date(t.due_date),
        estimatedTime: t.estimated_time,
        userEstimate: t.user_estimate,
        priorityOrder: t.priority_order,
        completed: t.completed,
        parent_task_id: t.parent_task_id,
        segment_name: t.segment_name
      }));
      setTasks(loadedTasks);

      setCompletedSessionIds(prev => [...prev, currentSession.id]);

      const summary = {
        tasksCompleted: completions.length,
        tasksPlanned: currentSession.tasksPlanned.length,
        timeUsed: actualDuration,
        timeScheduled: currentSession.scheduledDuration,
        completions
      };

      setSessionSummary(summary);
      setShowSessionSummary(true);
      setCurrentSession(null);
      localStorage.removeItem('activeSession');
      setSavedSessionState(null);
    } catch (error) {
      alert('Error ending session: ' + error.message);
    }
  };

  const cancelSession = () => {
    if (window.confirm('Are you sure you want to cancel this session? Your progress will not be saved.')) {
      setIsTimerRunning(false);
      setCurrentSession(null);
      setCurrentPage('calendar');
      localStorage.removeItem('activeSession');
      setSavedSessionState(null);
    }
  };

  useEffect(() => {
    let interval;
    if (isTimerRunning && sessionTime > 0) {
      interval = setInterval(() => {
        setSessionTime(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            endSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, sessionTime]);

  useEffect(() => {
    const saved = localStorage.getItem('activeSession');
    if (saved && isAuthenticated) {
      const state = JSON.parse(saved);
      const session = sessions.find(s => s.id === state.sessionId);
      if (session) {
        setCurrentSession(session);
        setCurrentTaskIndex(state.currentTaskIndex);
        setSessionTime(state.sessionTime);
        setTaskStartTime(state.taskStartTime);
        setSessionCompletions(state.completions);
        setSavedSessionState(state);
        setCurrentPage('session');
      }
    }
  }, [sessions, isAuthenticated]);

  // Feedback handler
  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) {
      alert('Please enter some feedback before sending.');
      return;
    }
    
    setFeedbackSending(true);
    try {
      await apiCall('/feedback', 'POST', { message: feedbackText });
      alert('Thank you for your feedback! We\'ll review it shortly.');
      setShowFeedbackForm(false);
      setFeedbackText('');
    } catch (error) {
      alert('Error sending feedback: ' + error.message);
    } finally {
      setFeedbackSending(false);
    }
  };

  // Format time helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render auth page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-amber-500 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-purple-600 rounded-2xl mb-4">
              <svg viewBox="0 0 240 240" className="w-14 h-14">
                <path d="M120,20 L200,70 L200,170 L120,220 L40,170 L40,70 Z" fill="#FDB813" stroke="#4a2c7c" strokeWidth="8"/>
                <text x="120" y="150" fontSize="120" fontWeight="bold" fill="#4a2c7c" textAnchor="middle" fontFamily="Arial, sans-serif">T</text>
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-purple-700 bg-clip-text text-transparent">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              {authError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {authError}
                </div>
              )}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-yellow-400 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700 disabled:opacity-50"
              >
                {authLoading ? 'Logging in...' : 'Log In'}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="w-full text-purple-600 hover:text-purple-700 font-medium"
              >
                Need an account? Register
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              {authError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {authError}
                </div>
              )}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-yellow-400 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700 disabled:opacity-50"
              >
                {authLoading ? 'Creating account...' : 'Create Account'}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="w-full text-purple-600 hover:text-purple-700 font-medium"
              >
                Already have an account? Log In
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Main app
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-yellow-400 via-amber-500 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 240 240" className="w-10 h-10">
                  <path d="M120,20 L200,70 L200,170 L120,220 L40,170 L40,70 Z" fill="#FDB813" stroke="#4a2c7c" strokeWidth="8"/>
                  <text x="120" y="150" fontSize="120" fontWeight="bold" fill="#4a2c7c" textAnchor="middle" fontFamily="Arial, sans-serif">T</text>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">PlanAssist</h1>
                <p className="text-sm text-yellow-100">Hello, {user?.name || 'Student'}!</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'hub', label: 'Hub', icon: Home },
              { id: 'tasks', label: 'Task List', icon: List },
              { id: 'calendar', label: 'Calendar', icon: Calendar },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentPage(id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                  currentPage === id
                    ? 'text-purple-700 border-b-2 border-purple-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* New Tasks Sidebar */}
      {newTasks.length > 0 && (
        <div
          className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-50 transition-transform duration-300 ${
            newTasksSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ width: '400px' }}
        >
          <div className="h-full flex flex-col">
            <div className="bg-gradient-to-r from-yellow-400 to-purple-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold">New Tasks Detected</h3>
              </div>
              <button
                onClick={() => setNewTasksSidebarOpen(false)}
                className="hover:bg-white/20 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {newTasks.map(task => (
                <div key={task.id} className="bg-gray-50 rounded-lg p-4 border-2 border-yellow-300">
                  <div className="flex items-start gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: getClassColor(extractClassName(task.title)) }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 break-words">
                        {cleanTaskTitle(task.title)}
                      </h4>
                      <p className="text-sm text-gray-600">{extractClassName(task.title)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Calendar className="w-4 h-4" />
                    {task.dueDate.toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddNewTask(task.id)}
                      className="flex-1 bg-gradient-to-r from-yellow-400 to-purple-600 text-white py-2 rounded-lg text-sm font-semibold hover:from-yellow-500 hover:to-purple-700"
                    >
                      Add to List
                    </button>
                    <button
                      onClick={() => handleDismissNewTask(task.id)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {newTasks.length > 0 && !newTasksSidebarOpen && (
        <button
          onClick={() => setNewTasksSidebarOpen(true)}
          className="fixed right-4 top-24 bg-gradient-to-r from-yellow-400 to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl z-40 animate-pulse"
        >
          <AlertCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {newTasks.length}
          </span>
        </button>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'hub' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-yellow-400 via-amber-500 to-purple-700 rounded-2xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Student'}!</h2>
              <p className="text-yellow-100">Let's make today productive.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-yellow-400">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Tasks Due Soon</h3>
                  <List className="w-6 h-6 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {tasks.filter(t => !t.completed).length}
                </p>
                <p className="text-sm text-gray-600 mt-1">incomplete tasks</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-purple-600">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Study Sessions</h3>
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{sessions.length}</p>
                <p className="text-sm text-gray-600 mt-1">planned sessions</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-amber-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Completion Rate</h3>
                  <TrendingUp className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {tasks.length > 0
                    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-gray-600 mt-1">tasks completed</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setCurrentPage('tasks')}
                  className="flex items-center gap-4 p-6 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all group"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                    <List className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Manage Tasks</h4>
                    <p className="text-sm text-gray-600">View and organize your assignments</p>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentPage('calendar')}
                  className="flex items-center gap-4 p-6 border-2 border-gray-200 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-all group"
                >
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200">
                    <Calendar className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Plan Session</h4>
                    <p className="text-sm text-gray-600">Schedule a study session</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'tasks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Task List</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setPriorityLocked(!priorityLocked)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    priorityLocked
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {priorityLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  {priorityLocked ? 'Locked' : 'Unlocked'}
                </button>
                <button
                  onClick={fetchTasks}
                  disabled={isLoadingTasks}
                  className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {isLoadingTasks ? 'Loading...' : 'Fetch from Canvas'}
                </button>
              </div>
            </div>

            {hasUnsavedChanges && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <p className="font-medium text-yellow-900">You have unsaved changes to your task priorities or time estimates</p>
                </div>
                <button
                  onClick={savePriorityChanges}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save and Adjust Plan
                </button>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {tasks.filter(t => !t.completed).length === 0 ? (
                <div className="p-12 text-center">
                  <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h3>
                  <p className="text-gray-600">You have no pending tasks. Great job!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {tasks
                    .filter(t => !t.completed)
                    .sort((a, b) => a.priorityOrder - b.priorityOrder)
                    .map((task, index) => (
                      <div
                        key={task.id}
                        draggable={!priorityLocked}
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragOver={(e) => handleDragOver(e, task)}
                        onDrop={(e) => handleDrop(e, task)}
                        className={`p-6 hover:bg-gray-50 transition-colors ${
                          dragOverTask?.id === task.id ? 'bg-purple-50' : ''
                        } ${priorityLocked ? 'cursor-default' : 'cursor-move'}`}
                      >
                        <div className="flex items-start gap-4">
                          {!priorityLocked && (
                            <GripVertical className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => toggleTaskCompletion(task.id)}
                                className="mt-1 flex-shrink-0"
                              >
                                <div className="w-5 h-5 rounded border-2 border-gray-300 hover:border-purple-500 transition-colors" />
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: getClassColor(extractClassName(task.title)) }}
                                  />
                                  <h3 className="font-semibold text-gray-900 break-words">
                                    {cleanTaskTitle(task.title)}
                                    {task.segment_name && (
                                      <span className="ml-2 text-sm text-purple-600">
                                        ({task.segment_name})
                                      </span>
                                    )}
                                  </h3>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium">{extractClassName(task.title)}</span>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Due {task.dueDate.toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {editingTimeTaskId === task.id ? (
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={tempTimeValue}
                                          onChange={handleTimeChange}
                                          className="w-16 px-2 py-1 border border-purple-400 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                        <span>{task.userEstimate || task.estimatedTime} min</span>
                                        <button
                                          onClick={() => handleStartEditTime(task.id, task.userEstimate || task.estimatedTime)}
                                          className="text-purple-600 hover:text-purple-700"
                                          title="Edit time estimate"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </span>
                                  <span className="text-purple-600 font-medium">
                                    Priority #{index + 1}
                                  </span>
                                </div>
                                {task.description && (
                                  <button
                                    onClick={() => setShowTaskDescription(task.id)}
                                    className="mt-2 text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                                  >
                                    <Info className="w-4 h-4" />
                                    View Description
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          {!task.segment_name && (
                            <button
                              onClick={() => {
                                setShowSplitTask(task.id);
                                setSplitSegments([{ name: 'Part 1' }]);
                              }}
                              className="text-purple-600 hover:text-purple-700 text-sm font-medium whitespace-nowrap flex-shrink-0"
                            >
                              Split Task
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {tasks.filter(t => t.completed).length > 0 && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-green-50 px-6 py-3 border-b">
                  <h3 className="font-semibold text-green-900 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Completed Tasks
                  </h3>
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {tasks
                    .filter(t => t.completed)
                    .map(task => (
                      <div key={task.id} className="p-6 bg-gray-50">
                        <div className="flex items-start gap-4">
                          <button
                            onClick={() => toggleTaskCompletion(task.id)}
                            className="mt-1 flex-shrink-0"
                          >
                            <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: getClassColor(extractClassName(task.title)) }}
                              />
                              <h3 className="font-semibold text-gray-500 line-through break-words">
                                {cleanTaskTitle(task.title)}
                                {task.segment_name && (
                                  <span className="ml-2 text-sm">({task.segment_name})</span>
                                )}
                              </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <span>{extractClassName(task.title)}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {task.dueDate.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentPage === 'calendar' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Study Calendar</h2>
              <button
                onClick={() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const duration = 60;
                  generateStudyPlan(today, duration);
                }}
                className="bg-gradient-to-r from-yellow-400 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700 flex items-center gap-2"
              >
                <Brain className="w-5 h-5" />
                Generate Study Plan
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No sessions planned yet</h3>
                <p className="text-gray-600 mb-6">Click "Generate Study Plan" to create your first session</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions
                  .sort((a, b) => a.date - b.date)
                  .map(session => {
                    const isCompleted = completedSessionIds.includes(session.id);
                    return (
                      <div
                        key={session.id}
                        className={`bg-white rounded-xl shadow-md overflow-hidden border-2 ${
                          isCompleted ? 'border-green-300' : 'border-gray-200'
                        }`}
                      >
                        <div className={`p-4 ${isCompleted ? 'bg-green-50' : 'bg-gradient-to-r from-yellow-400 to-purple-600'}`}>
                          <div className="flex items-center justify-between">
                            <div className={isCompleted ? 'text-green-900' : 'text-white'}>
                              <h3 className="font-bold text-lg">
                                {session.date.toLocaleDateString('en-US', { weekday: 'long' })}
                              </h3>
                              <p className="text-sm opacity-90">
                                {session.date.toLocaleDateString()}
                              </p>
                            </div>
                            {isCompleted && <Check className="w-6 h-6 text-green-600" />}
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Duration</span>
                              <span className="font-semibold text-gray-900">
                                {isCompleted
                                  ? `${Math.round(session.actualDuration / 60)} min`
                                  : `${Math.round(session.scheduledDuration / 60)} min`}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Tasks</span>
                              <span className="font-semibold text-gray-900">
                                {isCompleted
                                  ? `${session.tasksCompleted}/${session.tasksPlanned}`
                                  : session.tasksPlanned}
                              </span>
                            </div>
                          </div>
                          {!isCompleted && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => startSession(session)}
                                className="flex-1 bg-gradient-to-r from-yellow-400 to-purple-600 text-white py-2 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700 flex items-center justify-center gap-2"
                              >
                                <Play className="w-4 h-4" />
                                Start
                              </button>
                              <button
                                onClick={() => deleteSession(session.id)}
                                className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {currentPage === 'session' && currentSession && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-400 to-purple-600 text-white p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold">Study Session</h2>
                  <button
                    onClick={cancelSession}
                    className="bg-white/20 hover:bg-white/30 p-2 rounded-lg"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="text-center">
                  <div className="text-7xl font-bold mb-2">{formatTime(sessionTime)}</div>
                  <p className="text-yellow-100 text-lg">Time Remaining</p>
                </div>
              </div>

              <div className="p-8">
                {currentTaskIndex < currentSession.tasksPlanned.length ? (
                  <>
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          Task {currentTaskIndex + 1} of {currentSession.tasksPlanned.length}
                        </span>
                        <span className="text-sm font-medium text-purple-600">
                          {Math.round(((currentTaskIndex) / currentSession.tasksPlanned.length) * 100)}% Complete
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-400 to-purple-600 transition-all duration-300"
                          style={{
                            width: `${(currentTaskIndex / currentSession.tasksPlanned.length) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-6 mb-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div
                          className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                          style={{
                            backgroundColor: getClassColor(
                              extractClassName(currentSession.tasksPlanned[currentTaskIndex].title)
                            )
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {cleanTaskTitle(currentSession.tasksPlanned[currentTaskIndex].title)}
                          </h3>
                          <p className="text-gray-600 mb-4">
                            {extractClassName(currentSession.tasksPlanned[currentTaskIndex].title)}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Estimated: {currentSession.tasksPlanned[currentTaskIndex].userEstimate || currentSession.tasksPlanned[currentTaskIndex].estimatedTime} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Elapsed: {Math.round((taskStartTime - sessionTime) / 60)} min
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={toggleTimer}
                        className="flex-1 bg-gradient-to-r from-yellow-400 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-yellow-500 hover:to-purple-700 flex items-center justify-center gap-3"
                      >
                        {isTimerRunning ? (
                          <>
                            <Pause className="w-6 h-6" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-6 h-6" />
                            {sessionTime === currentSession.scheduledDuration ? 'Start' : 'Resume'}
                          </>
                        )}
                      </button>
                      <button
                        onClick={completeCurrentTask}
                        className="flex-1 bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 flex items-center justify-center gap-3"
                      >
                        <Check className="w-6 h-6" />
                        Complete Task
                      </button>
                      <button
                        onClick={skipCurrentTask}
                        className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
                      >
                        Skip
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">All Tasks Complete!</h3>
                    <p className="text-gray-600 mb-6">Great work on your study session.</p>
                    <button
                      onClick={() => endSession()}
                      className="bg-gradient-to-r from-yellow-400 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700"
                    >
                      End Session
                    </button>
                  </div>
                )}

                {sessionCompletions.length > 0 && (
                  <div className="mt-8 bg-gray-50 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Completed This Session</h4>
                    <div className="space-y-2">
                      {sessionCompletions.map((completion, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            {cleanTaskTitle(completion.taskTitle)}
                          </span>
                          <span className="text-gray-600">
                            {Math.round(completion.timeSpent / 60)} min
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentPage === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Completion</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Completed</span>
                      <span className="font-semibold text-gray-900">
                        {tasks.filter(t => t.completed).length} tasks
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">In Progress</span>
                      <span className="font-semibold text-gray-900">
                        {tasks.filter(t => !t.completed).length} tasks
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500"
                        style={{
                          width: `${tasks.length > 0 ? (tasks.filter(t => !t.completed).length / tasks.length) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Sessions</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Sessions</span>
                    <span className="font-semibold text-gray-900">{sessions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed Sessions</span>
                    <span className="font-semibold text-gray-900">
                      {completedSessionIds.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Upcoming Sessions</span>
                    <span className="font-semibold text-gray-900">
                      {sessions.length - completedSessionIds.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {sessions.filter(s => completedSessionIds.includes(s.id)).length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Session History</h3>
                <div className="space-y-3">
                  {sessions
                    .filter(s => completedSessionIds.includes(s.id))
                    .sort((a, b) => b.date - a.date)
                    .slice(0, 5)
                    .map(session => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {session.date.toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {session.tasksCompleted} of {session.tasksPlanned} tasks completed
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {Math.round(session.actualDuration / 60)} min
                          </p>
                          <p className="text-sm text-gray-600">study time</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentPage === 'settings' && (
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                  <select value={accountSetup.grade} onChange={(e) => setAccountSetup(prev => ({ ...prev, grade: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="">Select grade...</option>
                    {[7, 8, 9, 10, 11, 12].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Canvas Calendar URL</label>
                  <input type="url" value={accountSetup.canvasUrl} onChange={(e) => setAccountSetup(prev => ({ ...prev, canvasUrl: e.target.value }))} placeholder="https://canvas.oneschoolglobal.com/feeds/calendars/..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  <p className="text-xs text-gray-500 mt-1">Find this in Canvas: Calendar - Calendar Feed</p>
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
      </main>
      
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

      {showTaskDescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Task Description</h3>
              <button
                onClick={() => setShowTaskDescription(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="prose max-w-none">
              {tasks.find(t => t.id === showTaskDescription)?.description || 'No description available'}
            </div>
          </div>
        </div>
      )}

      {showSplitTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Split Task into Segments</h3>
            <p className="text-gray-600 mb-4">
              Break this task into smaller parts. Each segment will appear as a separate task in your list.
            </p>
            <div className="space-y-3 mb-6">
              {splitSegments.map((segment, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={segment.name}
                    onChange={(e) => {
                      const newSegments = [...splitSegments];
                      newSegments[index].name = e.target.value;
                      setSplitSegments(newSegments);
                    }}
                    placeholder={`Segment ${index + 1} name`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  {splitSegments.length > 1 && (
                    <button
                      onClick={() => {
                        setSplitSegments(splitSegments.filter((_, i) => i !== index));
                      }}
                      className="px-3 py-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setSplitSegments([...splitSegments, { name: `Part ${splitSegments.length + 1}` }]);
              }}
              className="w-full mb-4 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
            >
              + Add Segment
            </button>
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
                onClick={() => handleSplitTask(showSplitTask)}
                className="flex-1 bg-gradient-to-r from-yellow-400 to-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700"
              >
                Split Task
              </button>
            </div>
          </div>
        </div>
      )}

      {showSessionSummary && sessionSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Session Complete!</h3>
              <p className="text-gray-600">Great work on your study session</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm text-purple-600 font-medium mb-1">Tasks Completed</p>
                <p className="text-3xl font-bold text-purple-900">
                  {sessionSummary.tasksCompleted}/{sessionSummary.tasksPlanned}
                </p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <p className="text-sm text-yellow-600 font-medium mb-1">Time Spent</p>
                <p className="text-3xl font-bold text-yellow-900">
                  {Math.round(sessionSummary.timeUsed / 60)} min
                </p>
              </div>
            </div>

            {sessionSummary.completions.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Tasks Completed</h4>
                <div className="space-y-2">
                  {sessionSummary.completions.map((completion, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        {cleanTaskTitle(completion.taskTitle)}
                      </span>
                      <span className="text-gray-600">
                        {Math.round(completion.timeSpent / 60)} min
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setShowSessionSummary(false);
                setSessionSummary(null);
                setCurrentPage('hub');
              }}
              className="w-full bg-gradient-to-r from-yellow-400 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700"
            >
              Return to Hub
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanAssist;
