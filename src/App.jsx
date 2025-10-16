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

      // Clear saved session state
      await apiCall('/sessions/saved-state', 'DELETE');
      
      console.log('📚 Session complete! Applying learnings and rescheduling...');
      
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
      
      // Re-estimate all incomplete tasks
      const reestimatedTasks = [...loadedTasks];
      for (let i = 0; i < reestimatedTasks.length; i++) {
        if (!reestimatedTasks[i].completed) {
          const newEstimate = await estimateTaskTime(reestimatedTasks[i].title);
          console.log(`📊 Reestimated "${reestimatedTasks[i].title}": ${reestimatedTasks[i].estimatedTime}min → ${newEstimate}min`);
          reestimatedTasks[i].estimatedTime = newEstimate;
        }
      }
      
      setTasks(reestimatedTasks);
      generateSessions(reestimatedTasks, accountSetup.schedule);
      
      console.log('✅ Rescheduling complete!');
    } catch (error) {
      console.error('Failed to save session:', error);
    }

    setSessions(prev => prev.filter(s => s.id !== currentSession.id));
    
    // Mark this session as completed so it doesn't regenerate
    setCompletedSessionIds(prev => [...prev, currentSession.id]);
    
    setShowSessionSummary(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize schedule based on present periods
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

  // RENDER: Auth Page
  const renderAuth = () => (
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
          <button
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-2 rounded-md font-medium transition-colors ${
              authMode === 'login' ? 'bg-white text-purple-600 shadow' : 'text-gray-600'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-2 rounded-md font-medium transition-colors ${
              authMode === 'register' ? 'bg-white text-purple-600 shadow' : 'text-gray-600'
            }`}
          >
            Sign Up
          </button>
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {authError}
          </div>
        )}

        <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OneSchool Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="first.last##@na.oneschoolglobal.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-gradient-to-r from-yellow-400 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Login' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );

  // RENDER: Navigation
  const renderNav = () => (
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
          <button
            onClick={() => currentPage !== 'session-active' && setCurrentPage('hub')}
            disabled={currentPage === 'session-active'}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              currentPage === 'hub' ? 'bg-purple-100 text-purple-700' : 
              currentPage === 'session-active' ? 'text-gray-400 cursor-not-allowed' :
              'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Hub</span>
          </button>
          <button
            onClick={() => currentPage !== 'session-active' && setCurrentPage('tasks')}
            disabled={currentPage === 'session-active'}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              currentPage === 'tasks' ? 'bg-purple-100 text-purple-700' : 
              currentPage === 'session-active' ? 'text-gray-400 cursor-not-allowed' :
              'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <List className="w-5 h-5" />
            <span className="font-medium">Tasks</span>
            {hasUnsavedChanges && currentPage !== 'session-active' && <span className="w-2 h-2 bg-orange-500 rounded-full"></span>}
          </button>
          <button
            onClick={() => currentPage !== 'session-active' && setCurrentPage('sessions')}
            disabled={currentPage === 'session-active'}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              currentPage === 'sessions' ? 'bg-purple-100 text-purple-700' : 
              currentPage === 'session-active' ? 'text-gray-400 cursor-not-allowed' :
              'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Play className="w-5 h-5" />
            <span className="font-medium">Sessions</span>
          </button>
          <button
            onClick={() => currentPage !== 'session-active' && setCurrentPage('settings')}
            disabled={currentPage === 'session-active'}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              currentPage === 'settings' ? 'bg-purple-100 text-purple-700' : 
              currentPage === 'session-active' ? 'text-gray-400 cursor-not-allowed' :
              'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            disabled={currentPage === 'session-active'}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              currentPage === 'session-active' ? 'text-gray-400 cursor-not-allowed' :
              'text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );

  // RENDER: Study Hub
  const renderHub = () => (
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
                  <button
                    onClick={() => setCurrentPage('tasks')}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setCurrentPage('sessions')}
          className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow text-left"
        >
          <Play className="w-12 h-12 text-green-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Start Study Session</h3>
          <p className="text-gray-600">Begin your scheduled study period</p>
        </button>

        <button
          onClick={() => setCurrentPage('tasks')}
          className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow text-left"
        >
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
          <button
            onClick={() => setCurrentPage('settings')}
            className="bg-gradient-to-r from-yellow-400 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700"
          >
            Set Up Canvas
          </button>
        </div>
      )}
    </div>
  );

  const renderTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const visibleTasks = tasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return !t.completed && dueDate >= today;
    });

    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Task List</h2>
              <p className="text-gray-600">Manage your upcoming tasks</p>
            </div>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".ics"
                onChange={handleICSUpload}
                className="hidden"
                id="ics-upload"
              />
              <label
                htmlFor="ics-upload"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Upload ICS File
              </label>
              <button
                onClick={fetchCanvasTasks}
                disabled={isLoadingTasks}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {isLoadingTasks ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Sync from URL
                  </>
                )}
              </button>
            </div>
          </div>

          {accountSetup.canvasUrl && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="text-blue-800">
                <strong>Tip:</strong> If Sync from URL does not work, download your Canvas calendar as an ICS file and use Upload ICS File instead.
              </p>
            </div>
          )}

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

          <div className="space-y-3">
            {visibleTasks.map(task => {
              const isHomeroom = task.title.toLowerCase().includes('homeroom');
              return (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => setShowCompleteConfirm(task.id)}
                      className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{task.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Due: {task.dueDate.toLocaleDateString()}</span>
                        {task.estimatedTime > 0 && (
                          <span className="flex items-center gap-1">
                            <Brain className="w-4 h-4" />
                            AI: {task.estimatedTime} min
                          </span>
                        )}
                        {isHomeroom && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                            Not Scheduled
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isHomeroom && (
                        <>
                          <input
                            type="number"
                            value={task.userEstimate || ''}
                            onChange={(e) => {
                              const val = e.target.value ? parseInt(e.target.value) : null;
                              updateTaskEstimate(task.id, val);
                            }}
                            placeholder={task.estimatedTime > 0 ? task.estimatedTime.toString() : '0'}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <span className="text-sm text-gray-500">min</span>
                          <button
                            onClick={() => {
                              setShowSplitTask(task.id);
                              setSplitSegments([{ name: 'Part 1' }, { name: 'Part 2' }]);
                            }}
                            className="ml-2 text-purple-600 hover:text-purple-800 text-sm font-medium"
                            title="Split into segments"
                          >
                            Split
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {visibleTasks.length === 0 && (
            <div className="text-center py-12">
              <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">No pending tasks</p>
            </div>
          )}
        </div>

        {/* Confirmation Dialog for Manual Completion */}
        {showCompleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Complete Task?</h3>
              <p className="text-gray-600 mb-6">
                Mark this task as complete? This will remove it from your sessions.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCompleteConfirm(null)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleManualComplete(showCompleteConfirm)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Complete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Split Task Dialog */}
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
                      <button
                        onClick={() => setSplitSegments(splitSegments.filter((_, i) => i !== idx))}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSplitSegments([...splitSegments, { name: `Part ${splitSegments.length + 1}` }])}
                className="w-full mb-4 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 font-medium"
              >
                + Add Segment
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSplitTask(null);
                    setSplitSegments([{ name: 'Part 1' }]);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSplitTask(showSplitTask)}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium"
                >
                  Split Task
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // RENDER: Sessions (FIXED: not async anymore)
  const renderSessions = () => {
    return (
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
                <button
                  onClick={resumeSession}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
                >
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
                      {session.tasks.length} tasks • ~{session.totalTime} minutes
                    </p>
                  </div>
                  <button
                    onClick={() => startSession(session)}
                    className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 flex items-center gap-2"
                  >
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
    );
  };

  // RENDER: Active Session (ENHANCED with pause button)
  const renderActiveSession = () => {
    if (!currentSession) return null;
    const currentTask = currentSession.tasks[currentTaskIndex];

    if (showSessionSummary) {
      return (
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

          <button
            onClick={() => {
              setShowSessionSummary(false);
              setCurrentSession(null);
              setCurrentPage('hub');
              loadUserData(token);
            }}
            className="w-full bg-gradient-to-r from-yellow-400 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-purple-700"
          >
            Back to Hub
          </button>
        </div>
      );
    }

    return (
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
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 flex items-center gap-2"
            >
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
            <button
              onClick={pauseSession}
              className="bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-800 flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Save & Exit
            </button>
            <button
              onClick={() => endSession(false)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700"
            >
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

          {currentTask && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4">{currentTask.title}</h4>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Est. {currentTask.userEstimate || currentTask.estimatedTime} min
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Due {currentTask.dueDate.toLocaleDateString()}
                </span>
              </div>
              <div className="mb-4 text-sm text-gray-600">
                Time on this task: {Math.round((taskStartTime - sessionTime) / 60)} min
              </div>
              <button
                onClick={completeTask}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 flex items-center justify-center gap-2"
              >
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
    );
  };

  // RENDER: Settings
  const renderSettings = () => {
    const periodOptions = {
      '1-5': [1, 2, 3, 4, 5],
      '2-6': [2, 3, 4, 5, 6],
      '3-7': [3, 4, 5, 6, 7],
      '4-8': [4, 5, 6, 7, 8]
    };

    const selectedPeriods = periodOptions[accountSetup.presentPeriods] || [];

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Setup</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={accountSetup.name}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Extracted from your email</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
              <input
                type="text"
                value={accountSetup.grade}
                onChange={(e) => setAccountSetup(prev => ({ ...prev, grade: e.target.value }))}
                placeholder="e.g., 10"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Canvas Calendar ICS URL
              </label>
              <input
                type="url"
                value={accountSetup.canvasUrl}
                onChange={(e) => setAccountSetup(prev => ({ ...prev, canvasUrl: e.target.value }))}
                placeholder="https://canvas.oneschoolglobal.com/feeds/calendars/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find this in Canvas: Calendar → Calendar Feed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Present Periods (Time Zone)
              </label>
              <select
                value={accountSetup.presentPeriods}
                onChange={(e) => setAccountSetup(prev => ({ ...prev, presentPeriods: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
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
    );
  };

  // Main Render
  if (!isAuthenticated) {
    return renderAuth();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {renderNav()}
      <div className="py-6">
        {currentPage === 'hub' && renderHub()}
        {currentPage === 'tasks' && renderTasks()}
        {currentPage === 'sessions' && renderSessions()}
        {currentPage === 'session-active' && renderActiveSession()}
        {currentPage === 'settings' && renderSettings()}
      </div>
    </div>
  );

export default PlanAssist; // PlanAssist - OneSchool Global Study Planner Frontend (ENHANCED)
// App.jsx

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Play, Check, Settings, BarChart3, List, Home, LogOut, BookOpen, Brain, TrendingUp, AlertCircle, Upload, Save, Pause, X } from 'lucide-react';

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
    schedule: {}
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

  // API call helper
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

  // Extract name from email
  const extractNameFromEmail = (email) => {
    const username = email.split('@')[0];
    const [first, last] = username.split('.');
    const firstName = first.charAt(0).toUpperCase() + first.slice(1);
    const lastName = last?.replace(/\d+/g, '').charAt(0).toUpperCase() + last?.replace(/\d+/g, '').slice(1) || '';
    return `${firstName} ${lastName}`.trim();
  };

  // Check for existing session
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      loadUserData(savedToken);
    }
  }, []);

  // Load user data from backend
  const loadUserData = async (authToken) => {
    try {
      // Load account setup
      const setupData = await fetch(`${API_URL}/account/setup`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).then(r => r.json());

      if (setupData.grade) {
        setAccountSetup({
          name: JSON.parse(localStorage.getItem('user')).name,
          grade: setupData.grade || '',
          canvasUrl: setupData.canvasUrl || '',
          presentPeriods: setupData.presentPeriods || '2-6',
          schedule: setupData.schedule || {}
        });
      }

      // Load tasks
      const tasksData = await fetch(`${API_URL}/tasks`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).then(r => r.json());

      if (tasksData.length > 0) {
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
        setTasks(loadedTasks);
        generateSessions(loadedTasks, setupData.schedule || accountSetup.schedule);
      }

      // Load completion history
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

      // Check for saved session state
      const sessionStateData = await fetch(`${API_URL}/sessions/saved-state`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).then(r => r.json());

      if (sessionStateData.sessionId) {
        // Check if the saved session is from today
        const savedDate = new Date(sessionStateData.savedAt);
        const today = new Date();
        const isToday = savedDate.toDateString() === today.toDateString();

        if (isToday) {
          // Store saved session state
          setSavedSessionState(sessionStateData);
          console.log('Found saved session state:', sessionStateData);
        } else {
          // Clear old session state
          await fetch(`${API_URL}/sessions/saved-state`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          setSavedSessionState(null);
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

  // Save account setup
  const saveAccountSetup = async () => {
    try {
      await apiCall('/account/setup', 'POST', {
        grade: accountSetup.grade,
        canvasUrl: accountSetup.canvasUrl,
        presentPeriods: accountSetup.presentPeriods,
        schedule: accountSetup.schedule
      });
      
      if (accountSetup.canvasUrl) {
        await fetchCanvasTasks();
      }
      
      setCurrentPage('hub');
    } catch (error) {
      alert('Failed to save settings: ' + error.message);
    }
  };

  // Parse ICS file manually
  const parseICSFile = (icsText) => {
    const tasks = [];
    const lines = icsText.split('\n');
    let currentEvent = {};
    
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
        tasks.push({
          title: currentEvent.title,
          description: currentEvent.description || '',
          dueDate: currentEvent.dueDate || new Date(),
        });
      }
    }
    
    return tasks;
  };

  // Handle ICS file upload
  const handleICSUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoadingTasks(true);
    try {
      const text = await file.text();
      const parsedTasks = parseICSFile(text);

      // Create tasks with temporary estimates, then update them
      const newTasks = parsedTasks.map((t, idx) => ({
        id: Date.now() + idx,
        title: t.title,
        description: t.description,
        dueDate: new Date(t.dueDate),
        estimatedTime: 20, // Temporary default
        userEstimate: null,
        completed: false,
        type: detectTaskType(t.title)
      }));

      // Estimate times for all tasks
      for (let i = 0; i < newTasks.length; i++) {
        newTasks[i].estimatedTime = await estimateTaskTime(newTasks[i].title);
      }

      // Save to backend (preserves manual overrides)
      const saveResult = await apiCall('/tasks', 'POST', { tasks: newTasks });
      
      const tasksWithIds = saveResult.tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: new Date(t.due_date),
        estimatedTime: t.estimated_time,
        userEstimate: t.user_estimate,
        completed: t.completed,
        type: t.task_type
      }));

      setTasks(tasksWithIds);
      setHasUnsavedChanges(false);
      alert(`Loaded ${tasksWithIds.length} tasks from file!`);
    } catch (error) {
      alert('Failed to parse calendar file: ' + error.message);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Fetch tasks from Canvas
  const fetchCanvasTasks = async () => {
    if (!accountSetup.canvasUrl) {
      alert('Please enter your Canvas Calendar URL first');
      return;
    }

    setIsLoadingTasks(true);
    try {
      const data = await apiCall('/calendar/fetch', 'POST', { 
        canvasUrl: accountSetup.canvasUrl 
      });

      // Create tasks with temporary estimates
      const newTasks = data.tasks.map((t, idx) => ({
        id: Date.now() + idx,
        title: t.title,
        description: t.description,
        dueDate: new Date(t.dueDate),
        estimatedTime: 20, // Temporary default
        userEstimate: null,
        completed: false,
        type: detectTaskType(t.title)
      }));

      // Estimate times for all tasks
      for (let i = 0; i < newTasks.length; i++) {
        newTasks[i].estimatedTime = await estimateTaskTime(newTasks[i].title);
      }

      const saveResult = await apiCall('/tasks', 'POST', { tasks: newTasks });
      
      const tasksWithIds = saveResult.tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: new Date(t.due_date),
        estimatedTime: t.estimated_time,
        userEstimate: t.user_estimate,
        completed: t.completed,
        type: t.task_type
      }));

      setTasks(tasksWithIds);
      setHasUnsavedChanges(false);
      alert(`Loaded ${tasksWithIds.length} tasks from Canvas!`);
    } catch (error) {
      alert('Failed to fetch Canvas calendar: ' + error.message);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Task type detection
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

  // Extract keywords from task title
  const extractKeywords = (title) => {
    const lower = title.toLowerCase();
    const keywords = new Set();
    
    const subjects = ['math', 'science', 'history', 'english', 'physics', 'chemistry', 'biology', 'geography', 'literature', 'spanish', 'french', 'german'];
    subjects.forEach(subject => {
      if (lower.includes(subject)) keywords.add(subject);
    });
    
    const types = ['homework', 'assignment', 'essay', 'lab', 'project', 'reading', 'study', 'review', 'quiz', 'test', 'exam'];
    types.forEach(type => {
      if (lower.includes(type)) keywords.add(type);
    });
    
    const chapterMatch = lower.match(/chapter\s*(\d+)/);
    if (chapterMatch) keywords.add('chapter');
    
    const unitMatch = lower.match(/unit\s*(\d+)/);
    if (unitMatch) keywords.add('unit');
    
    const actions = ['complete', 'write', 'read', 'finish', 'prepare', 'practice', 'solve'];
    actions.forEach(action => {
      if (lower.includes(action)) keywords.add(action);
    });
    
    return Array.from(keywords);
  };

  // NEW AI ESTIMATION ALGORITHM (skips Homeroom tasks)
  const estimateTaskTime = async (title) => {
    const lower = title.toLowerCase();

    // Skip estimation for Homeroom tasks
    if (lower.includes('homeroom')) {
      console.log(`🏠 Homeroom task detected: "${title}" → No estimation needed`);
      return 0;
    }

    // Step 1: Check for global data (≥3 completions)
    try {
      const globalData = await apiCall(`/tasks/global-estimate/${encodeURIComponent(title)}`, 'GET');
      if (globalData.estimate) {
        console.log(`✅ Global estimate for "${title}": ${globalData.estimate} min (${globalData.completionCount} completions)`);
        return globalData.estimate;
      }
    } catch (error) {
      console.log('No global data available');
    }

    // Step 2: Check for 'Lab'
    if (lower.includes('lab')) {
      console.log(`🔬 Lab detected: "${title}" → 60 min`);
      return 60;
    }

    // Step 3: Check for 'Summative', 'Assessment', or 'Project'
    if (lower.includes('summative') || lower.includes('assessment') || lower.includes('project')) {
      console.log(`📝 Major task detected: "${title}" → 60 min`);
      return 60;
    }

    // Step 4: Check for '[OSG Accelerate]'
    if (lower.includes('[osg accelerate]')) {
      console.log(`⚡ OSG Accelerate detected: "${title}" → 5 min`);
      return 5;
    }

    // Step 5: Check for Quiz/Exam/Test (use user's personal average)
    if (lower.includes('quiz') || lower.includes('exam') || lower.includes('test')) {
      const testHistory = completionHistory.filter(h => {
        const hLower = h.taskTitle.toLowerCase();
        return hLower.includes('quiz') || hLower.includes('exam') || hLower.includes('test');
      });

      if (testHistory.length > 0) {
        const avgTime = Math.round(
          testHistory.reduce((sum, h) => sum + h.actualTime, 0) / testHistory.length
        );
        console.log(`📊 Test average from user history: "${title}" → ${avgTime} min`);
        return avgTime;
      }
    }

    // Step 6: Check for keyword matches (user's personal history)
    const keywords = extractKeywords(title);
    if (keywords.length > 0) {
      const matchingHistory = completionHistory.filter(h => {
        const hKeywords = extractKeywords(h.taskTitle);
        return keywords.some(k => hKeywords.includes(k));
      });

      if (matchingHistory.length > 0) {
        const avgTime = Math.round(
          matchingHistory.reduce((sum, h) => sum + h.actualTime, 0) / matchingHistory.length
        );
        console.log(`🔑 Keyword match from user history: "${title}" → ${avgTime} min`);
        return avgTime;
      }
    }

    // Step 7: Default to 20 minutes
    console.log(`⏱️ Default estimate: "${title}" → 20 min`);
    return 20;
  };

  // Generate sessions (ENHANCED: excludes Homeroom tasks, past due tasks, and completed sessions)
  const generateSessions = (taskList, scheduleData) => {
    console.log('Generating sessions with:', { taskList, scheduleData });
    
    if (!scheduleData || Object.keys(scheduleData).length === 0) {
      console.warn('No schedule data available');
      return;
    }

    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter out completed tasks, Homeroom tasks, and past due tasks
    const incompleteTasks = taskList
      .filter(t => {
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return !t.completed && 
               !t.title.toLowerCase().includes('homeroom') &&
               dueDate >= today; // Only today or future tasks
      })
      .sort((a, b) => a.dueDate - b.dueDate);
    
    if (incompleteTasks.length === 0) {
      console.log('No incomplete tasks to schedule');
      setSessions([]);
      return;
    }

    const newSessions = [];
    let taskIndex = 0;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Get current day to filter out old sessions
    const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentDayName = days[currentDayIndex - 1]; // Adjust for Monday = 0
    
    for (const day of days) {
      // Skip days before today
      const dayIndex = days.indexOf(day);
      const todayIndex = days.indexOf(currentDayName);
      if (todayIndex !== -1 && dayIndex < todayIndex) {
        continue;
      }

      if (!scheduleData[day]) continue;
      
      const periods = Object.keys(scheduleData[day]).sort((a, b) => parseInt(a) - parseInt(b));
      
      for (const period of periods) {
        const sessionId = `${day}-${period}`;
        
        // Skip if this session was already completed
        if (completedSessionIds.includes(sessionId)) {
          continue;
        }

        if (scheduleData[day][period] === 'Study') {
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
      
      if (taskIndex >= incompleteTasks.length) break;
    }

    console.log('Generated sessions:', newSessions);
    setSessions(newSessions);
  };

  // Update task estimate (NO AUTO-RESCHEDULE)
  const updateTaskEstimate = async (taskId, estimate) => {
    try {
      await apiCall(`/tasks/${taskId}/estimate`, 'PATCH', { userEstimate: estimate });
      
      const updatedTasks = tasks.map(t => 
        t.id === taskId ? { ...t, userEstimate: estimate } : t
      );
      
      setTasks(updatedTasks);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Failed to update estimate:', error);
    }
  };

  // NEW: Manual task completion with confirmation
  const handleManualComplete = async (taskId) => {
    try {
      await apiCall(`/tasks/${taskId}/complete`, 'PATCH');
      
      const updatedTasks = tasks.map(t => 
        t.id === taskId ? { ...t, completed: true } : t
      );
      
      setTasks(updatedTasks);
      setShowCompleteConfirm(null);
      
      // Auto-reschedule after manual completion
      console.log('🔄 Rescheduling after manual completion...');
      generateSessions(updatedTasks, accountSetup.schedule);
    } catch (error) {
      console.error('Failed to complete task:', error);
      alert('Failed to complete task');
    }
  };

  // NEW: Split task into segments
  const handleSplitTask = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const totalTime = task.userEstimate || task.estimatedTime;
      const timePerSegment = Math.round(totalTime / splitSegments.length);

      // Create new task objects for each segment
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

      // Remove original task and add segments
      const updatedTasks = tasks.filter(t => t.id !== taskId).concat(newTasks);
      
      // Save to backend
      await apiCall('/tasks', 'POST', { tasks: updatedTasks.filter(t => !t.completed) });
      
      setTasks(updatedTasks);
      setShowSplitTask(null);
      setSplitSegments([{ name: 'Part 1' }]);
      setHasUnsavedChanges(true);
      
      alert(`Split "${task.title}" into ${splitSegments.length} segments`);
    } catch (error) {
      console.error('Failed to split task:', error);
      alert('Failed to split task');
    }
  };

  // NEW: Save and Adjust Plan button handler
  const handleSaveAndAdjustPlan = () => {
    console.log('💾 Saving and adjusting plan...');
    generateSessions(tasks, accountSetup.schedule);
    setHasUnsavedChanges(false);
    setCurrentPage('hub');
  };

  // Session management
  const startSession = (session) => {
    setCurrentSession(session);
    setCurrentTaskIndex(0);
    setSessionTime(3600);
    setTaskStartTime(3600);
    setIsTimerRunning(true);
    setSessionCompletions([]);
    setCurrentPage('session-active');
  };

  // NEW: Resume session
  const resumeSession = async () => {
    try {
      if (!savedSessionState) {
        alert('No saved session found');
        return;
      }

      // Find the session
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

      console.log('▶️ Resumed session:', savedSessionState);
    } catch (error) {
      console.error('Failed to resume session:', error);
      alert('Failed to resume session');
    }
  };

  // NEW: Save session state and pause
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

      console.log('⏸️ Session paused and saved');
      setCurrentPage('sessions');
    } catch (error) {
      console.error('Failed to save session state:', error);
      alert('Failed to pause session');
    }
  };

  useEffect(() => {
    let interval;
    if (isTimerRunning && sessionTime > 0) {
      interval = setInterval(() => {
        setSessionTime(prev => prev - 1);
      }, 1000);
    } else if (sessionTime === 0 && isTimerRunning) {
      endSession(true);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, sessionTime]);

  const completeTask = () => {
    if (!currentSession) return;

    const task = currentSession.tasks[currentTaskIndex];
    const timeSpent = Math.round((taskStartTime - sessionTime) / 60);

    const completion = {
      task,
      timeSpent,
      timestamp: new Date()
    };

    setSessionCompletions(prev => [...prev, completion]);
    setCompletionHistory(prev => [...prev, {
      taskTitle: task.title,
      type: task.type,
      estimatedTime: task.userEstimate || task.estimatedTime,
      actualTime: timeSpent,
      date: new Date()
    }]);

    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, completed: true } : t
    ));

    if (currentTaskIndex < currentSession.tasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
      setTaskStartTime(sessionTime);
    } else {
      endSession(false);
    }
  };

  const endSession = async (timeExpired)
};
