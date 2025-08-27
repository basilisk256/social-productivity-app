import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { enhancedLeaderboardService } from '../firebase/services';
import './EnhancedLeaderboard.css';

const EnhancedLeaderboard = () => {
  const { currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('global');
  const [userRank, setUserRank] = useState(null);

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await enhancedLeaderboardService.getGlobalLeaderboard(100);
      setLeaderboard(data);
      
      // Find current user's rank
      if (currentUser) {
        const userIndex = data.findIndex(user => user.uid === currentUser.uid);
        setUserRank(userIndex >= 0 ? userIndex + 1 : null);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadLeaderboard();
  }, [filter, loadLeaderboard]);

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return '';
  };

  const formatScore = (score) => {
    if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M`;
    if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
    return score.toString();
  };

  const renderLeaderboardItem = (user, index) => {
    const rank = index + 1;
    const isCurrentUser = currentUser && user.uid === currentUser.uid;
    
    return (
      <div 
        key={user.uid} 
        className={`leaderboard-item ${getRankClass(rank)} ${isCurrentUser ? 'current-user' : ''}`}
      >
        <div className="rank-section">
          <span className="rank-badge">{getRankBadge(rank)}</span>
        </div>
        
        <div className="user-section">
          <div className="user-avatar">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.realName} />
            ) : (
              <div className="avatar-placeholder">
                {user.realName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          
          <div className="user-info">
            <h3 className="user-name">
              {user.realName || 'Unknown User'}
              {isCurrentUser && <span className="you-badge">YOU</span>}
            </h3>
            <p className="user-handle">@{user.handle || user.uid.slice(0, 6)}</p>
          </div>
        </div>
        
        <div className="stats-section">
          <div className="stat-item">
            <span className="stat-label">Score</span>
            <span className="stat-value">{formatScore(user.score || 0)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Streak</span>
            <span className="stat-value">{user.streak || 0} days</span>
          </div>
        </div>
        
        <div className="verification-section">
          {user.verification?.email === 'verified' && (
            <span className="verification-badge email">✓ Email</span>
          )}
          {user.verification?.idCheck === 'verified' && (
            <span className="verification-badge id">✓ ID Verified</span>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="leaderboard-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>Global Leaderboard</h1>
        <p>Top performers across the ACME community</p>
        
        {userRank && (
          <div className="user-rank-info">
            <span className="rank-label">Your Rank:</span>
            <span className="rank-value">#{userRank}</span>
          </div>
        )}
      </div>

      <div className="leaderboard-filters">
        <button
          className={`filter-btn ${filter === 'global' ? 'active' : ''}`}
          onClick={() => setFilter('global')}
        >
          Global
        </button>
        <button
          className={`filter-btn ${filter === 'friends' ? 'active' : ''}`}
          onClick={() => setFilter('friends')}
        >
          Friends
        </button>
        <button
          className={`filter-btn ${filter === 'weekly' ? 'active' : ''}`}
          onClick={() => setFilter('weekly')}
        >
          This Week
        </button>
      </div>

      <div className="leaderboard-content">
        {leaderboard.length > 0 ? (
          <div className="leaderboard-list">
            {leaderboard.map(renderLeaderboardItem)}
          </div>
        ) : (
          <div className="empty-state">
            <p>No leaderboard data available</p>
            <p>Complete tasks and builds to start climbing the ranks!</p>
          </div>
        )}
      </div>

      <div className="leaderboard-footer">
        <p className="last-updated">
          Last updated: {new Date().toLocaleString()}
        </p>
        <button 
          onClick={loadLeaderboard}
          className="refresh-btn"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default EnhancedLeaderboard;
