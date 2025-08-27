import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthGate from './components/AuthGate';
import CompletionAnimation from './components/CompletionAnimation';
import UserSearch from './components/UserSearch';
import EnhancedLeaderboard from './components/EnhancedLeaderboard';
import OnboardingDiagnostics from './components/OnboardingDiagnostics';
import {
  buildService,
  taskService,
  activityService
} from './firebase/services';

import FirebaseTest from './components/FirebaseTest';
import './App.css';

// Build Categories
const BUILD_CATEGORIES = {
  FITNESS: 'Fitness',
  HABITS: 'Habits',
  SKILLS: 'Skills',
  HEALTH: 'Health',
  CAREER: 'Career',
  PERSONAL: 'Personal'
};

function App() {
  const { currentUser, userProfile, logout, updateUserProfile } = useAuth();
  const [currentView, setCurrentView] = useState('profile');
  const [builds, setBuilds] = useState([]);
  const [activity, setActivity] = useState([]);
  const [showAddBuildModal, setShowAddBuildModal] = useState(false);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newBuild, setNewBuild] = useState({
    name: '',
    category: BUILD_CATEGORIES.HABITS,
    target: '',
    description: '',
    isPublic: false
  });

  // Load user data from Firebase
  const loadUserData = useCallback(async () => {
    try {
      // Load user's builds
      const userBuilds = await buildService.getUserBuilds(currentUser.uid);
      setBuilds(userBuilds);

      // Load user's activity
      const userActivity = await activityService.getUserActivityFeed(currentUser.uid);
      setActivity(userActivity);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && userProfile) {
      loadUserData();
    }
  }, [currentUser, userProfile, loadUserData]);

  // Navigation
  const navItems = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'search', label: 'Find Users', icon: '🔍' },
    { id: 'feed', label: 'Feed', icon: '📱' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { id: 'public-builds', label: 'Public Builds', icon: '🌐' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'firebase-test', label: 'Firebase Test', icon: '🔥' },
    { id: 'diagnostics', label: 'Onboarding Debug', icon: '🐛' }
  ];

  // Check if task can be completed today
  const canCompleteTaskToday = (task) => {
    const today = new Date().toISOString().split('T')[0];
    return !task.completedDates.includes(today);
  };

  // Get task status for today
  const getTaskStatus = (task) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (task.completedDates.includes(today)) {
      return 'completed'; // Green - completed today
    } else {
      return 'available'; // White - available to complete
    }
  };

  // Handle completing a daily task
  const handleCompleteDailyTask = async (buildId, taskId) => {
    try {
      // Update task completion
      await taskService.completeDailyTask(buildId, taskId);
      
      // Show completion animation
      setShowCompletionAnimation(true);
      
      // Reload user data
      await loadUserData();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  // Handle animation completion
  const handleAnimationComplete = () => {
    setShowCompletionAnimation(false);
  };

  // Handle creating a new build
  const handleCreateBuild = async () => {
    try {
      if (!newBuild.name.trim()) {
        alert('Please enter a build name');
        return;
      }

      const buildData = {
        ...newBuild,
        ownerId: currentUser.uid,
        currentStreak: 0,
        target: parseInt(newBuild.target) || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: []
      };

      await buildService.createBuild(buildData);
      
      // Create activity entry
      await activityService.createActivity({
        type: 'build_created',
        userId: currentUser.uid,
        buildId: buildData.id,
        description: `Created new build: ${newBuild.name}`,
        timestamp: new Date()
      });

      // Reset form and close modal
      setNewBuild({
        name: '',
        category: BUILD_CATEGORIES.HABITS,
        target: '',
        description: '',
        isPublic: false
      });
      setShowAddBuildModal(false);

      // Reload builds
      await loadUserData();
    } catch (error) {
      console.error('Failed to create build:', error);
      alert('Failed to create build. Please try again.');
    }
  };

  // Render Profile Page
  const renderProfile = () => (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Track your progress and manage your builds</p>
      </div>

      {/* Profile Header */}
      <div className="profile-header">
        <img 
          src={userProfile?.photoURL || userProfile?.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${userProfile?.realName || userProfile?.displayName || 'User'}&backgroundColor=dc2626&textColor=ffffff`} 
          alt={userProfile?.realName || userProfile?.displayName || 'User'} 
          className="profile-avatar"
        />
        <div className="profile-info">
          <h1>{userProfile?.realName || userProfile?.displayName || 'User'}</h1>
          <p className="profile-meta">{userProfile?.email} • Joined {userProfile?.createdAt ? new Date(userProfile.createdAt.toDate()).toLocaleDateString() : 'Recently'}</p>
          <p className="profile-meta">Total Streak Days: {userProfile?.stats?.streak || userProfile?.totalStreakDays || 0}</p>
          <div className="verification-badges">
            {userProfile?.verification?.email === 'verified' && (
              <span className="verification-badge email">✓ Email Verified</span>
            )}
            {userProfile?.verification?.idCheck === 'verified' && (
              <span className="verification-badge id">✓ ID Verified</span>
            )}
            {userProfile?.verification?.idCheck === 'submitted' && (
              <span className="verification-badge pending">🔄 ID Pending Verification</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-number">{builds.length}</div>
          <div className="stat-label">Active Builds</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{userProfile?.completedBuilds || 0}</div>
          <div className="stat-label">Completed Builds</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{userProfile?.level || 1}</div>
          <div className="stat-label">Current Level</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{userProfile?.stats?.score || userProfile?.totalPoints || 0}</div>
          <div className="stat-label">Total Points</div>
        </div>
      </div>

      {/* Active Builds Section */}
      <div className="builds-section">
        <div className="section-header">
          <h2 className="section-title">Active Builds</h2>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddBuildModal(true)}
          >
            Add New Build
          </button>
        </div>

        {builds.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <div className="empty-state-text">No active builds yet</div>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddBuildModal(true)}
            >
              Start Your First Build
            </button>
          </div>
        ) : (
          builds.map(build => (
            <div key={build.id} className="build-card">
              <div className="build-header">
                <div className="build-info">
                  <h3>{build.name}</h3>
                  <span className="build-category">{build.category}</span>
                </div>
                <div className="build-meta">
                  <div className="build-streak">{build.currentStreak}</div>
                  <div className="build-target">/ {build.target}</div>
                </div>
              </div>
              
              <p className="build-description">{build.description}</p>
              
              {/* Daily Tasks */}
              <div className="daily-tasks-section">
                <h4>Daily Tasks</h4>
                {build.tasks && build.tasks.length > 0 ? (
                  build.tasks.map(task => (
                    <div key={task.id} className="daily-task">
                      <label className="task-checkbox">
                        <input
                          type="checkbox"
                          checked={getTaskStatus(task) === 'completed'}
                          onChange={() => handleCompleteDailyTask(build.id, task.id)}
                          disabled={getTaskStatus(task) === 'completed'}
                        />
                        <span className="checkmark"></span>
                        <span className="task-text">{task.name}</span>
                      </label>
                      <span className="task-status">
                        {getTaskStatus(task) === 'completed' ? '✅' : '⭕'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="no-tasks">No daily tasks configured</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Render Feed Page
  const renderFeed = () => (
    <div className="feed-page">
      <div className="page-header">
        <h1 className="page-title">Activity Feed</h1>
        <p className="page-subtitle">Recent activity from you and your friends</p>
      </div>
      
      <div className="activity-feed">
        {activity.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📱</div>
            <div className="empty-state-text">No activity yet</div>
            <p>Complete tasks and create builds to see activity here!</p>
          </div>
        ) : (
          activity.map(item => (
            <div key={item.id} className="activity-item">
              <div className="activity-icon">🎯</div>
              <div className="activity-content">
                <p className="activity-text">{item.description}</p>
                <span className="activity-time">
                  {new Date(item.timestamp.toDate()).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Render Settings Page
  const renderSettings = () => (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>
      
      <div className="settings-content">
        <div className="setting-group">
          <h3>Account</h3>
          <button className="btn btn-secondary" onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  // Render Add Build Modal
  const renderAddBuildModal = () => (
    showAddBuildModal && (
      <div className="modal-overlay" onClick={() => setShowAddBuildModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Create New Build</h2>
            <button 
              className="modal-close"
              onClick={() => setShowAddBuildModal(false)}
            >
              ×
            </button>
          </div>
          
          <div className="modal-body">
            <div className="form-group">
              <label>Build Name</label>
              <input
                type="text"
                value={newBuild.name}
                onChange={e => setNewBuild(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter build name"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Category</label>
              <select
                value={newBuild.category}
                onChange={e => setNewBuild(prev => ({ ...prev, category: e.target.value }))}
                className="form-input"
              >
                {Object.values(BUILD_CATEGORIES).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Target (days)</label>
              <input
                type="number"
                value={newBuild.target}
                onChange={e => setNewBuild(prev => ({ ...prev, target: e.target.value }))}
                placeholder="Enter target days"
                className="form-input"
                min="1"
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newBuild.description}
                onChange={e => setNewBuild(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your build"
                className="form-input"
                rows="3"
              />
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newBuild.isPublic}
                  onChange={e => setNewBuild(prev => ({ ...prev, isPublic: e.target.checked }))}
                />
                Make this build public
              </label>
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowAddBuildModal(false)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleCreateBuild}
            >
              Create Build
            </button>
          </div>
        </div>
      </div>
    )
  );

  // Render Public Builds Page
  const renderPublicBuilds = () => (
    <div className="public-builds-page">
      <div className="page-header">
        <h1 className="page-title">Public Builds</h1>
        <p className="page-subtitle">Discover inspiring builds from the community</p>
      </div>

      <div className="public-builds-content">
        <div className="builds-grid">
          {builds.filter(build => build.isPublic).map(build => (
            <div key={build.id} className="public-build-card">
              <div className="build-header">
                <h3>{build.name}</h3>
                <span className="build-category">{build.category}</span>
              </div>
              <p>{build.description}</p>
              <div className="build-stats">
                <span className="stat">Streak: {build.currentStreak}</span>
                <span className="stat">Target: {build.target}</span>
                <span className="stat">Popularity: {build.popularity || 0}</span>
              </div>
            </div>
          ))}
        </div>
        
        {builds.filter(build => build.isPublic).length === 0 && (
          <div className="empty-state">
            <p>No public builds available yet</p>
            <p>Create a public build to share with the community!</p>
          </div>
        )}
      </div>
    </div>
  );

  // Main render
  return (
    <AuthGate>
      <div className="app">
        {/* Navigation */}
        <nav className="navbar">
          <button className="nav-logo">ACME</button>
          
          <div className="nav-links">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`nav-link ${currentView === item.id ? 'active' : ''}`}
                onClick={() => setCurrentView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button 
            className="nav-mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            ☰
          </button>
        </nav>

        {/* Main Content */}
        <main className="main-content">
          {currentView === 'profile' && renderProfile()}
          {currentView === 'search' && <UserSearch />}
          {currentView === 'feed' && renderFeed()}
          {currentView === 'leaderboard' && <EnhancedLeaderboard />}
          {currentView === 'public-builds' && renderPublicBuilds()}
          {currentView === 'settings' && renderSettings()}
          {currentView === 'firebase-test' && <FirebaseTest />}
          {currentView === 'diagnostics' && <OnboardingDiagnostics />}
        </main>

        {/* Modals */}
        {renderAddBuildModal()}

        {/* Completion Animation */}
        <CompletionAnimation 
          isVisible={showCompletionAnimation}
          onAnimationComplete={handleAnimationComplete}
        />
      </div>
    </AuthGate>
  );
}

export default App;
