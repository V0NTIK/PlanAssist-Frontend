// PlanAssist - OneSchool Global Study Planner Frontend (ENHANCED)
// App.jsx - PART 1: Imports and State

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Play, Check, Settings, BarChart3, List, Home, LogOut, BookOpen, Brain, TrendingUp, AlertCircle, Upload, Save, Pause, X, Send, GripVertical, Lock, Unlock, Info } from 'lucide-react';

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
        const loadedTasks = tasksData.filter(t => !t.is_new).map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          dueDate: new Date(t.due_date),
          estimatedTime: t.estimated_time,
          userEstimate: t.user_estimate,
          priorityOrder: t.priority_order,
          completed: t.completed,
          type: t.task_type
        }));
        
        const loadedNewTasks = tasksData.filter(t => t.is_new).map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          dueDate: new Date(t.due_date),
          estimatedTime: t.estimated_time,
          userEstimate: t.user_estimate,
          priorityOrder: t.priority_order,
          completed: t.completed,
          type: t.task_type
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
        taskTitle: h.task_title,
        type: h.task_type,
        estimatedTime: h.estimated_time,
        actualTime: h.actual_time,
        date: new Date(h.completed_at)
      })));

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
    try {
      await apiCall('/account/setup', 'POST', {
        grade: accountSetup.grade,
        canvasUrl: accountSetup.canvasUrl,
        presentPeriods: accountSetup.presentPeriods,
        schedule: accountSetup.schedule
      });
      localStorage.setItem('classColors', JSON.stringify(accountSetup.classColors));
      
      // Fetch tasks and generate sessions if Canvas URL is provided
      if (accountSetup.canvasUrl) {
        await fetchCanvasTasks();
        // Generate sessions after tasks are loaded
        // Note: fetchCanvasTasks updates the tasks state, but we need to use the result
        // Sessions will be generated in fetchCanvasTasks
      }
      
      setCurrentPage('hub');
    } catch (error) {
      alert('Failed to save settings: ' + error.message);
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
      const existingSplitTasks = tasks.filter(t => t.title.includes(' - Part ') || t.title.includes(' - Segment '));
      
      const newTasks = parsedTasks.map((t, idx) => ({
        id: Date.now() + idx,
        title: t.title,
        description: t.description,
        dueDate: new Date(t.dueDate),
        estimatedTime: 20,
        userEstimate: null,
        completed: false,
        type: detectTaskType(t.title)
      }));
      
      const filteredNewTasks = newTasks.filter(newTask => {
        return !existingSplitTasks.some(splitTask => {
          const baseTitle = splitTask.title.split(' - Part ')[0].split(' - Segment ')[0];
          return newTask.title === baseTitle;
        });
      });
      
      for (let i = 0; i < filteredNewTasks.length; i++) {
        filteredNewTasks[i].estimatedTime = await estimateTaskTime(filteredNewTasks[i].title);
      }
      
      const allTasks = [...existingCompletedTasks, ...existingSplitTasks, ...filteredNewTasks];
      const saveResult = await apiCall('/tasks', 'POST', { tasks: allTasks });
      
      // Separate new and existing tasks based on is_new flag
      const updatedTasks = saveResult.tasks.filter(t => !t.is_new).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: new Date(t.due_date),
        estimatedTime: t.estimated_time,
        userEstimate: t.user_estimate,
        priorityOrder: t.priority_order,
        completed: t.completed,
        type: t.task_type
      }));
      
      const updatedNewTasks = saveResult.tasks.filter(t => t.is_new).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: new Date(t.due_date),
        estimatedTime: t.estimated_time,
        userEstimate: t.user_estimate,
        priorityOrder: t.priority_order,
        completed: t.completed,
        type: t.task_type
      }));
      
      setTasks(updatedTasks);
      setNewTasks(updatedNewTasks);
      setHasUnsavedChanges(false);
      
      // Generate sessions with the newly loaded tasks
      generateSessions(updatedTasks, accountSetup.schedule);
      
      if (updatedNewTasks.length > 0 && priorityLocked) {
        alert(`Loaded ${filteredNewTasks.length} tasks. ${updatedNewTasks.length} new tasks are in the sidebar.`);
      } else {
        alert(`Loaded ${filteredNewTasks.length} new tasks from file!`);
      }
    } catch (error) {
      alert('Failed to parse calendar file: ' + error.message);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const fetchCanvasTasks = async () => {
    if (!accountSetup.canvasUrl) {
      alert('Please enter your Canvas Calendar URL first');
      return;
    }
    setIsLoadingTasks(true);
    try {
      const data = await apiCall('/calendar/fetch', 'POST', { canvasUrl: accountSetup.canvasUrl });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const filteredTasks = data.tasks.filter(t => {
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today;
      });

      const existingCompletedTasks = tasks.filter(t => t.completed);
      const existingSplitTasks = tasks.filter(t => t.title.includes(' - Part ') || t.title.includes(' - Segment '));

      const newTasks = filteredTasks.map((t, idx) => ({
        id: Date.now() + idx,
        title: t.title,
        description: t.description,
        dueDate: new Date(t.dueDate),
        estimatedTime: 20,
        userEstimate: null,
        completed: false,
        type: detectTaskType(t.title)
      }));
      
      const filteredNewTasks = newTasks.filter(newTask => {
        return !existingSplitTasks.some(splitTask => {
          const baseTitle = splitTask.title.split(' - Part ')[0].split(' - Segment ')[0];
          return newTask.title === baseTitle;
        });
      });
      
      for (let i = 0; i < filteredNewTasks.length; i++) {
        filteredNewTasks[i].estimatedTime = await estimateTaskTime(filteredNewTasks[i].title);
      }
      
      const allTasks = [...existingCompletedTasks, ...existingSplitTasks, ...filteredNewTasks];
      const saveResult = await apiCall('/tasks', 'POST', { tasks: allTasks });
      
      // Separate new and existing tasks based on is_new flag
      const updatedTasks = saveResult.tasks.filter(t => !t.is_new).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: new Date(t.due_date),
        estimatedTime: t.estimated_time,
        userEstimate: t.user_estimate,
        priorityOrder: t.priority_order,
        completed: t.completed,
        type: t.task_type
      }));
      
      const updatedNewTasks = saveResult.tasks.filter(t => t.is_new).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: new Date(t.due_date),
        estimatedTime: t.estimated_time,
        userEstimate: t.user_estimate,
        priorityOrder: t.priority_order,
        completed: t.completed,
        type: t.task_type
      }));
      
      setTasks(updatedTasks);
      setNewTasks(updatedNewTasks);
      setHasUnsavedChanges(false);
      
      // Generate sessions with the newly loaded tasks
      generateSessions(updatedTasks, accountSetup.schedule);
      
      if (updatedNewTasks.length > 0 && priorityLocked) {
        // Open sidebar when new tasks are detected with priority lock on
        setNewTasksSidebarOpen(true);
        setHasUnsavedChanges(true); // Mark as unsaved so user must save before changes apply
        alert(`Loaded ${filteredNewTasks.length} tasks. ${updatedNewTasks.length} new tasks are in the sidebar. Drag them to your list or click "Add All".`);
      } else {
        alert(`Loaded ${filteredNewTasks.length} new tasks from Canvas!`);
      }
    } catch (error) {
      alert('Failed to fetch Canvas calendar: ' + error.message);
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

  const generateSessions = (taskList, scheduleData) => {
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
    return !t.completed && !t.title.toLowerCase().includes('homeroom');
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
  
  // Convert to our day array index (0 = Monday)
  const currentDayArrayIndex = currentDayIndex === 0 ? -1 : currentDayIndex - 1;
  
  console.log('Today is:', days[currentDayArrayIndex] || 'Sunday', 'Day index:', currentDayArrayIndex);
  
  for (const day of days) {
    const dayIndex = days.indexOf(day);
    
    // Skip days that have already passed this week
    if (currentDayArrayIndex !== -1 && dayIndex < currentDayArrayIndex) {
      console.log(`Skipping ${day} - already passed this week`);
      continue;
    }
    
    if (!scheduleData[day]) {
      console.log(`No schedule for ${day}`);
      continue;
    }
    
    const periods = Object.keys(scheduleData[day]).sort((a, b) => parseInt(a) - parseInt(b));
    console.log(`${day} has periods:`, periods);
    
    for (const period of periods) {
      const sessionId = `${day}-${period}`;
      
      if (completedSessionIds.includes(sessionId)) {
        console.log(`Session ${sessionId} already completed, skipping`);
        continue;
      }
      
      const periodType = scheduleData[day][period];
      console.log(`${sessionId} is type: ${periodType}`);
      
      if (periodType === 'Study') {
        const sessionTasks = [];
        let totalTime = 0;
        
        while (taskIndex < incompleteTasks.length && totalTime < 60) {
          const task = incompleteTasks[taskIndex];
          const taskTime = task.userEstimate || task.estimatedTime;
          
          if (totalTime + taskTime <= 60) {
            sessionTasks.push(task);
            totalTime += taskTime;
            taskIndex++;
          } else {
            break;
          }
        }
        
        if (sessionTasks.length > 0) {
          console.log(`Created session ${sessionId} with ${sessionTasks.length} tasks (${totalTime} min)`);
          newSessions.push({ 
            id: sessionId, 
            day, 
            period: parseInt(period), 
            tasks: sessionTasks, 
            totalTime 
          });
        }
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
      generateSessions(updatedTasks, accountSetup.schedule);
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
      generateSessions(updatedTasks, accountSetup.schedule);
    } catch (error) {
      console.error('Failed to complete task:', error);
      alert('Failed to complete task');
    }
  };

  const toggleTaskCompletion = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      if (task.completed) {
        // Uncomplete the task
        await apiCall(`/tasks/${taskId}/uncomplete`, 'PATCH');
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, completed: false } : t);
        setTasks(updatedTasks);
      } else {
        // Complete the task
        await apiCall(`/tasks/${taskId}/complete`, 'PATCH');
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, completed: true } : t);
        setTasks(updatedTasks);
      }
      generateSessions(tasks, accountSetup.schedule);
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      alert('Failed to update task');
    }
  };

  const handleSplitTask = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      const totalTime = task.userEstimate || task.estimatedTime;
      const timePerSegment = Math.round(totalTime / splitSegments.length);
      
      const newTasks = splitSegments.map((seg, idx) => ({
        id: Date.now() + idx,
        title: `${task.title} - ${seg.name}`,
        description: task.description,
        dueDate: task.dueDate,
        estimatedTime: timePerSegment,
        userEstimate: timePerSegment,
        completed: false,
        type: task.type
      }));
      
      const updatedTasks = [...tasks];
      updatedTasks.splice(taskIndex, 1, ...newTasks);
      
      // DON'T save immediately - just update local state
      setTasks(updatedTasks);
      setShowSplitTask(null);
      setSplitSegments([{ name: 'Part 1' }]);
      setHasUnsavedChanges(true);
      alert(`Split "${task.title}" into ${splitSegments.length} segments. Click "Save and Adjust Plan" to apply changes.`);
    } catch (error) {
      console.error('Failed to split task:', error);
      alert('Failed to split task');
    }
  };

  // Priority lock and drag-and-drop functions
  const togglePriorityLock = async () => {
    try {
      const newLockedState = !priorityLocked;
      await apiCall('/user/priority-lock', 'PATCH', { locked: newLockedState });
      setPriorityLocked(newLockedState);
      
      if (!newLockedState) {
        // If unlocking, merge new tasks into main list and regenerate
        setTasks([...tasks, ...newTasks]);
        setNewTasks([]);
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error('Failed to toggle priority lock:', error);
      alert('Failed to toggle priority lock');
    }
  };

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

  const closeSidebarWithoutSaving = () => {
    if (newTasks.length > 0) {
      const confirmClose = window.confirm(
        `You have ${newTasks.length} new task(s) that haven't been added to your list. If you close this sidebar without adding them, they will be lost. Are you sure?`
      );
      if (!confirmClose) return;
    }
    setNewTasksSidebarOpen(false);
    setNewTasks([]);
    setHasUnsavedChanges(false);
  };

  const handleSaveAndAdjustPlan = () => {
    generateSessions(tasks, accountSetup.schedule);
    setHasUnsavedChanges(false);
    setNewTasksSidebarOpen(false);
    setCurrentPage('hub');
  };

  const startSession = (session) => {
    setCurrentSession(session);
    setCurrentTaskIndex(0);
    setSessionTime(3600);
    setTaskStartTime(3600);
    setIsTimerRunning(true);
    setSessionCompletions([]);
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
      setCurrentSession(session);
      setSessionTime(savedSessionState.remainingTime);
      setCurrentTaskIndex(savedSessionState.currentTaskIndex);
      setTaskStartTime(savedSessionState.taskStartTime);
      setSessionCompletions(savedSessionState.completions);
      setIsTimerRunning(true);
      setCurrentPage('session-active');
    } catch (error) {
      console.error('Failed to resume session:', error);
      alert('Failed to resume session');
    }
  };

  const pauseSession = async () => {
    try {
      setIsTimerRunning(false);
      await apiCall('/sessions/save-state', 'POST', {
        sessionId: currentSession.id,
        day: currentSession.day,
        period: currentSession.period,
        remainingTime: sessionTime,
        currentTaskIndex: currentTaskIndex,
        taskStartTime: taskStartTime,
        completions: sessionCompletions
      });
      setCurrentPage('sessions');
    } catch (error) {
      console.error('Failed to save session state:', error);
      alert('Failed to pause session');
    }
  };

  useEffect(() => {
    let interval;
    if (isTimerRunning && sessionTime > 0) {
      interval = setInterval(() => setSessionTime(prev => prev - 1), 1000);
    } else if (sessionTime === 0 && isTimerRunning) {
      endSession(true);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, sessionTime]);

  const completeTask = () => {
    if (!currentSession) return;
    const task = currentSession.tasks[currentTaskIndex];
    const timeSpent = Math.round((taskStartTime - sessionTime) / 60);
    const completion = { task, timeSpent, timestamp: new Date() };
    setSessionCompletions(prev => [...prev, completion]);
    setCompletionHistory(prev => [...prev, {
      taskTitle: task.title,
      type: task.type,
      estimatedTime: task.userEstimate || task.estimatedTime,
      actualTime: timeSpent,
      date: new Date()
    }]);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: true } : t));
    if (currentTaskIndex < currentSession.tasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
      setTaskStartTime(sessionTime);
    } else {
      endSession(false);
    }
  };

  const endSession = async (timeExpired) => {
    setIsTimerRunning(false);
    const incompleteTasks = currentSession.tasks.slice(currentTaskIndex + (timeExpired ? 0 : 1));
    setSessionSummary({
      day: currentSession.day,
      period: currentSession.period,
      completions: sessionCompletions,
      incompleteTasks,
      timeExpired,
      totalTime: Math.round((3600 - sessionTime) / 60)
    });
    try {
      await apiCall('/sessions/complete', 'POST', {
        completions: sessionCompletions,
        day: currentSession.day,
        period: currentSession.period
      });
      await apiCall('/sessions/saved-state', 'DELETE');
      const tasksData = await apiCall('/tasks', 'GET');
      const loadedTasks = tasksData.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: new Date(t.due_date),
        estimatedTime: t.estimated_time,
        userEstimate: t.user_estimate,
        completed: t.completed,
        type: t.task_type
      }));
      const reestimatedTasks = [...loadedTasks];
      for (let i = 0; i < reestimatedTasks.length; i++) {
        if (!reestimatedTasks[i].completed) {
          reestimatedTasks[i].estimatedTime = await estimateTaskTime(reestimatedTasks[i].title);
        }
      }
      setTasks(reestimatedTasks);
      generateSessions(reestimatedTasks, accountSetup.schedule);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
    setSessions(prev => prev.filter(s => s.id !== currentSession.id));
    setCompletedSessionIds(prev => [...prev, currentSession.id]);
    setShowSessionSummary(true);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
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
            <button onClick={() => currentPage !== 'session-active' && setCurrentPage('hub')} disabled={currentPage === 'session-active'} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'hub' ? 'bg-purple-100 text-purple-700' : currentPage === 'session-active' ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Home className="w-5 h-5" />
              <span className="font-medium">Hub</span>
            </button>
            <button onClick={() => currentPage !== 'session-active' && setCurrentPage('tasks')} disabled={currentPage === 'session-active'} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'tasks' ? 'bg-purple-100 text-purple-700' : currentPage === 'session-active' ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <List className="w-5 h-5" />
              <span className="font-medium">Tasks</span>
              {hasUnsavedChanges && currentPage !== 'session-active' && <span className="w-2 h-2 bg-orange-500 rounded-full"></span>}
            </button>
            <button onClick={() => currentPage !== 'session-active' && setCurrentPage('sessions')} disabled={currentPage === 'session-active'} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'sessions' ? 'bg-purple-100 text-purple-700' : currentPage === 'session-active' ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Play className="w-5 h-5" />
              <span className="font-medium">Sessions</span>
            </button>
            <button onClick={() => currentPage !== 'session-active' && setCurrentPage('settings')} disabled={currentPage === 'session-active'} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'settings' ? 'bg-purple-100 text-purple-700' : currentPage === 'session-active' ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} disabled={currentPage === 'session-active'} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentPage === 'session-active' ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}>
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>
      <div className="py-6">
        {currentPage === 'hub' && (
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-8 h-8" />
                  <span className="text-2xl font-bold">{completionHistory.length}</span>
                </div>
                <p className="text-blue-100 font-medium">Tasks Completed</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8" />
                  <span className="text-2xl font-bold">{tasks.filter(t => !t.completed).length}</span>
                </div>
                <p className="text-purple-100 font-medium">Pending Tasks</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8" />
                  <span className="text-2xl font-bold">{sessions.length}</span>
                </div>
                <p className="text-green-100 font-medium">Upcoming Sessions</p>
              </div>
            </div>
            {tasks.filter(t => !t.completed).length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Next Up</h2>
                {(() => {
                  const nextTask = tasks.filter(t => !t.completed).sort((a, b) => a.dueDate - b.dueDate)[0];
                  return (
                    <div className="bg-gradient-to-r from-yellow-50 to-purple-50 border-2 border-purple-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div>
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
                        <button onClick={() => setCurrentPage('tasks')} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium">
                          View All
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={() => setCurrentPage('sessions')} className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow text-left">
                <Play className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Start Study Session</h3>
                <p className="text-gray-600">Begin your scheduled study period</p>
              </button>
              <button onClick={() => setCurrentPage('tasks')} className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow text-left">
                <List className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Tasks</h3>
                <p className="text-gray-600">View and adjust your task list</p>
              </button>
            </div>
            {tasks.length === 0 && (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Tasks Yet</h3>
                <p className="text-gray-600 mb-6">Connect your Canvas calendar to get started</p>
                <button onClick={() => setCurrentPage('settings')} className="bg-gradient-to-r from-yellow-400 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700">
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
                          onClick={togglePriorityLock}
                          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${priorityLocked ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          title={priorityLocked ? 'Priority Lock ON - New tasks go to sidebar' : 'Priority Lock OFF - Tasks sorted by deadline'}
                        >
                          {priorityLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          <span className="hidden sm:inline">{priorityLocked ? 'Locked' : 'Unlocked'}</span>
                        </button>
                        <input type="file" accept=".ics" onChange={handleICSUpload} className="hidden" id="ics-upload" />
                        <label htmlFor="ics-upload" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 cursor-pointer transition-all">
                          <Upload className="w-4 h-4" />
                          <span className="hidden sm:inline">Upload ICS</span>
                        </label>
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

                    {/* Tip Banner */}
                    {accountSetup.canvasUrl && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                        <p className="text-blue-800">
                          <strong>Tip:</strong> Sync from URL preserves completed tasks and split tasks. Only new tasks will be added.
                        </p>
                      </div>
                    )}

                    {/* Unsaved Changes Warning */}
                    {hasUnsavedChanges && (
                      <div className="mb-4 p-3 bg-orange-50 border-2 border-orange-300 rounded-lg flex items-center justify-between">
                        <p className="text-orange-800 font-medium">
                          WARNING: You have unsaved changes. Click Save and Adjust Plan to apply.
                        </p>
                        <button 
                          onClick={handleSaveAndAdjustPlan} 
                          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 font-semibold flex items-center gap-2 shadow-md"
                        >
                          <Save className="w-5 h-5" />
                          Save and Adjust Plan
                        </button>
                      </div>
                    )}

                    {/* Task List */}
                    <div className="space-y-4">
                      {(() => {
                        if (priorityLocked) {
                          const incompleteTasks = tasks.filter(t => !t.completed);
                          
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
                            const className = extractClassName(task.title);
                            const classColor = getClassColor(className);
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
                                      <h3 className="font-semibold text-gray-900 text-lg">{task.title}</h3>
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
                                        {dayName}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Brain className="w-4 h-4" />
                                        {taskTime} min
                                      </span>
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
                                      onClick={() => setShowSplitTask(task.id)}
                                      className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium transition-all"
                                    >
                                      Split
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        } else {
                          // Unlocked mode - group by day
                          const groupedTasks = groupTasksByDay(tasks.filter(t => !t.completed));
                          const sortedDays = Object.keys(groupedTasks).sort((a, b) => {
                            const dateA = new Date(groupedTasks[a][0].dueDate);
                            const dateB = new Date(groupedTasks[b][0].dueDate);
                            return dateA - dateB;
                          });
                          
                          if (sortedDays.length === 0) {
                            return (
                              <div className="text-center py-12">
                                <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
                                <p className="text-gray-600">No pending tasks</p>
                              </div>
                            );
                          }
                          
                          return sortedDays.map(day => (
                            <div key={day} className="space-y-3">
                              <h3 className="text-lg font-bold text-gray-900 sticky top-0 bg-white py-2 border-b-2 border-gray-200">
                                {day}
                              </h3>
                              {groupedTasks[day].map((task) => {
                                const taskTime = task.userEstimate || task.estimatedTime;
                                const className = extractClassName(task.title);
                                const classColor = getClassColor(className);
                                
                                return (
                                  <div 
                                    key={task.id}
                                    className="border-2 rounded-lg p-4 bg-white hover:shadow-lg transition-all"
                                    style={{ 
                                      borderColor: classColor,
                                      borderLeftWidth: '6px'
                                    }}
                                  >
                                    <div className="flex items-center gap-4">
                                      {/* Checkbox */}
                                      <input
                                        type="checkbox"
                                        checked={task.completed || false}
                                        onChange={() => toggleTaskCompletion(task.id)}
                                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                      />
                                      
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <h3 className="font-semibold text-gray-900 text-lg">{task.title}</h3>
                                          <span 
                                            className="px-2 py-0.5 rounded-full text-xs font-bold text-white flex-shrink-0"
                                            style={{ backgroundColor: classColor }}
                                          >
                                            {className}
                                          </span>
                                        </div>
                                        <div className="text-sm text-gray-600 flex items-center gap-1">
                                          <Brain className="w-4 h-4" />
                                          {taskTime} min
                                        </div>
                                      </div>
                                      
                                      <div className="flex gap-2 flex-shrink-0">
                                        <button 
                                          onClick={() => setShowTaskDescription(task)}
                                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                                        >
                                          Details
                                        </button>
                                        <button 
                                          onClick={() => setShowSplitTask(task.id)}
                                          className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium"
                                        >
                                          Split
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ));
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* New Tasks Sidebar */}
            {newTasksSidebarOpen && priorityLocked && (
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
                      const className = extractClassName(task.title);
                      const classColor = getClassColor(className);
                      const dueDate = new Date(task.dueDate);
                      const dayName = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      
                      return (
                        <div 
                          key={task.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          className="bg-white border-2 border-yellow-300 rounded-lg p-3 cursor-move hover:shadow-md transition-all hover:scale-105"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm mb-1 break-words">{task.title}</h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span 
                                  className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                                  style={{ backgroundColor: classColor }}
                                >
                                  {className}
                                </span>
                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {dayName}
                                </span>
                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                  <Brain className="w-3 h-3" />
                                  {task.estimatedTime} min
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 italic pl-7">
                            Drag to priority list →
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
                      <p className="text-gray-600 whitespace-pre-wrap">{showTaskDescription.description}</p>
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
          </div>
        )}
        {currentPage === 'sessions' && (
          <div className="max-w-5xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Study Sessions</h2>
                <p className="text-gray-600">Your scheduled study periods</p>
              </div>
              {savedSessionState && (
                <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-blue-900 mb-1">Resume Session</h3>
                      <p className="text-sm text-blue-700">
                        {savedSessionState.day} - Period {savedSessionState.period} ({Math.floor(savedSessionState.remainingTime / 60)} min remaining)
                      </p>
                    </div>
                    <button onClick={resumeSession} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Resume
                    </button>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                {sessions.map(session => (
                  <div key={session.id} className="border-2 border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {session.day} - Period {session.period}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {session.tasks.length} tasks - {session.totalTime} minutes
                        </p>
                      </div>
                      <button onClick={() => startSession(session)} className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 flex items-center gap-2">
                        <Play className="w-5 h-5" />
                        Start Session
                      </button>
                    </div>
                    <div className="space-y-2">
                      {session.tasks.map((task, idx) => (
                        <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{task.title}</p>
                            <p className="text-sm text-gray-600">
                              {task.userEstimate || task.estimatedTime} min
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {sessions.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Sessions Scheduled</h3>
                  <p className="text-gray-600">Add tasks and set up your schedule to generate sessions</p>
                </div>
              )}
            </div>
          </div>
        )}
        {currentPage === 'session-active' && currentSession && (
          showSessionSummary ? (
            <div className="max-w-4xl mx-auto p-6">
              <div className="bg-gradient-to-br from-green-500 to-blue-600 text-white rounded-xl p-8 text-center mb-6">
                <Check className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Session Complete!</h2>
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
                    <div className="text-sm text-gray-600">Total Time</div>
                  </div>
                </div>
                {sessionSummary.completions.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <h4 className="font-semibold text-gray-700">Completed Tasks</h4>
                    {sessionSummary.completions.map((comp, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="font-medium text-gray-900">{comp.task.title}</span>
                        <span className="text-sm text-gray-600">{comp.timeSpent} min</span>
                      </div>
                    ))}
                  </div>
                )}
                {sessionSummary.incompleteTasks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-700">Incomplete Tasks (Rescheduled)</h4>
                    {sessionSummary.incompleteTasks.map((task, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <span className="font-medium text-gray-900">{task.title}</span>
                        <span className="text-sm text-orange-600">Moved to next session</span>
                      </div>
                    ))}
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
                  <button onClick={pauseSession} className="bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-800 flex items-center gap-2">
                    <X className="w-5 h-5" />
                    Save & Exit
                  </button>
                  <button onClick={() => endSession(false)} className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700">
                    End Session
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
                    <h4 className="text-xl font-bold text-gray-900 mb-4">{currentSession.tasks[currentTaskIndex].title}</h4>
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
                      Time on this task: {Math.round((taskStartTime - sessionTime) / 60)} min
                    </div>
                    <button onClick={completeTask} className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Mark Complete
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700 text-sm mb-3">Upcoming in This Session</h4>
                  {currentSession.tasks.slice(currentTaskIndex + 1).map((task, idx) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-60">
                      <span className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm">
                        {currentTaskIndex + idx + 2}
                      </span>
                      <span className="text-gray-700">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}
        {currentPage === 'settings' && (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Setup</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input type="text" value={accountSetup.name} className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50" disabled />
                  <p className="text-xs text-gray-500 mt-1">Extracted from your email</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                  <input type="text" value={accountSetup.grade} onChange={(e) => setAccountSetup(prev => ({ ...prev, grade: e.target.value }))} placeholder="e.g., 10" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Canvas Calendar ICS URL</label>
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
                    className="flex-1 bg-gradient-to-r from-yellow-400 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700"
                  >
                    Save Settings
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
    </div>
  );
};

export default PlanAssist;
