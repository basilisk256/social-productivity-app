import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { profileService, enhancedFriendService } from '../firebase/services';
import './UserSearch.css';

const UserSearch = () => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  const loadFriendData = useCallback(async () => {
    try {
      const [requests, friendsList, pending] = await Promise.all([
        enhancedFriendService.getFriendRequests(currentUser.uid),
        enhancedFriendService.getFriendsList(currentUser.uid),
        enhancedFriendService.getFriendRequests(currentUser.uid)
      ]);
      
      setFriendRequests(requests);
      setFriends(friendsList);
      setPendingRequests(pending.filter(r => r.from === currentUser.uid));
    } catch (error) {
      console.error('Failed to load friend data:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadFriendData();
    }
  }, [currentUser, loadFriendData]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await profileService.searchUsers(searchTerm.trim());
      // Filter out current user and existing friends
      const filteredResults = results.filter(user => 
        user.uid !== currentUser.uid && 
        !friends.some(f => f.id === user.uid) &&
        !friendRequests.some(r => r.from === user.uid || r.to === user.uid)
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (targetId) => {
    try {
      await enhancedFriendService.sendFriendRequest(targetId);
      // Update local state
      setSearchResults(prev => prev.filter(user => user.uid !== targetId));
      setPendingRequests(prev => [...prev, { to: targetId, status: 'pending' }]);
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  };

  const handleAcceptRequest = async (fromId) => {
    try {
      await enhancedFriendService.acceptFriendRequest(fromId);
      // Update local state
      setFriendRequests(prev => prev.filter(r => r.from !== fromId));
      setFriends(prev => [...prev, { id: fromId, since: new Date() }]);
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const handleDeclineRequest = async (fromId) => {
    try {
      await enhancedFriendService.declineFriendRequest(fromId);
      // Update local state
      setFriendRequests(prev => prev.filter(r => r.from !== fromId));
    } catch (error) {
      console.error('Failed to decline friend request:', error);
    }
  };

  const getFriendStatus = (userId) => {
    if (friends.some(f => f.id === userId)) return 'friend';
    if (pendingRequests.some(r => r.to === userId)) return 'pending';
    if (friendRequests.some(r => r.from === userId)) return 'incoming';
    return 'none';
  };

  const renderUserCard = (user) => {
    const status = getFriendStatus(user.uid);
    
    return (
      <div key={user.uid} className="user-card">
        <div className="user-avatar">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.realName} />
          ) : (
            <div className="avatar-placeholder">
              {user.realName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="user-info">
          <h3 className="user-name">{user.realName}</h3>
          <p className="user-handle">@{user.handle}</p>
          <div className="user-stats">
            <span className="stat">Score: {user.stats?.score || 0}</span>
            <span className="stat">Streak: {user.stats?.streak || 0}</span>
          </div>
        </div>
        
        <div className="user-actions">
          {status === 'none' && (
            <button
              onClick={() => handleSendFriendRequest(user.uid)}
              className="btn btn-primary btn-sm"
            >
              Add Friend
            </button>
          )}
          {status === 'friend' && (
            <span className="status-badge friend">Friends</span>
          )}
          {status === 'pending' && (
            <span className="status-badge pending">Request Sent</span>
          )}
          {status === 'incoming' && (
            <div className="incoming-actions">
              <button
                onClick={() => handleAcceptRequest(user.uid)}
                className="btn btn-primary btn-sm"
              >
                Accept
              </button>
              <button
                onClick={() => handleDeclineRequest(user.uid)}
                className="btn btn-secondary btn-sm"
              >
                Decline
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="user-search-container">
      <div className="search-section">
        <h2>Find Users</h2>
        <div className="search-form">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by real name..."
            className="search-input"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={!searchTerm.trim() || isSearching}
            className="btn btn-primary"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Search Results ({searchResults.length})</h3>
          <div className="users-grid">
            {searchResults.map(renderUserCard)}
          </div>
        </div>
      )}

      {friendRequests.length > 0 && (
        <div className="friend-requests">
          <h3>Friend Requests ({friendRequests.length})</h3>
          <div className="users-grid">
            {friendRequests.map(request => (
              <div key={request.from} className="user-card">
                <div className="user-avatar">
                  <div className="avatar-placeholder">
                    {request.from.charAt(0).toUpperCase()}
                  </div>
                </div>
                
                <div className="user-info">
                  <h3 className="user-name">User {request.from.slice(0, 6)}</h3>
                  <p className="user-handle">Request received</p>
                </div>
                
                <div className="user-actions">
                  <button
                    onClick={() => handleAcceptRequest(request.from)}
                    className="btn btn-primary btn-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDeclineRequest(request.from)}
                    className="btn btn-secondary btn-sm"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {friends.length > 0 && (
        <div className="friends-list">
          <h3>Your Friends ({friends.length})</h3>
          <div className="users-grid">
            {friends.map(friend => (
              <div key={friend.id} className="user-card">
                <div className="user-avatar">
                  <div className="avatar-placeholder">
                    {friend.id.charAt(0).toUpperCase()}
                  </div>
                </div>
                
                <div className="user-info">
                  <h3 className="user-name">User {friend.id.slice(0, 6)}</h3>
                  <p className="user-handle">Friends since {friend.since?.toDate?.()?.toLocaleDateString() || 'recently'}</p>
                </div>
                
                <div className="user-actions">
                  <span className="status-badge friend">Friends</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {searchResults.length === 0 && friendRequests.length === 0 && friends.length === 0 && searchTerm && !isSearching && (
        <div className="no-results">
          <p>No users found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
