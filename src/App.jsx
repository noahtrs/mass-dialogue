import React, { useState, useEffect, useCallback } from 'react';
import ReportPage from './ReportGenerate';
import AgentsPage from './components/AgentsPage.jsx';
import './App.css';

const MAX_POST_LENGTH = 5000;
const MAX_COMMENT_LENGTH = 2000;
const MAX_SEARCH_LENGTH = 200;

// Generate or retrieve a stable session ID for the browser
const getSessionId = () => {
  let id = localStorage.getItem('mass-dialogue-session-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('mass-dialogue-session-id', id);
  }
  return id;
};

const SESSION_ID = getSessionId();
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

async function apiCall(path, options = {}) {
  const url = `${API_BASE}${path}`;
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error || 'Request failed');
    }
    return data;
  } catch (err) {
    console.error(`API call to ${path} failed:`, err);
    throw err;
  }
}

function App() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [activeTab, setActiveTab] = useState('forum');
  const [userUpvotedPosts, setUserUpvotedPosts] = useState({});
  const [filterKeyword, setFilterKeyword] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Fetch Posts from API
  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const data = await apiCall('/api/posts');
      let filteredData = data;

      if (filterKeyword) {
        filteredData = data.filter((post) =>
          post.text.toLowerCase().includes(filterKeyword.toLowerCase())
        );
      }

      if (sortBy === 'created_at') {
        filteredData = filteredData.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
      } else if (sortBy === 'upvotes') {
        filteredData = filteredData.sort((a, b) => b.upvotes - a.upvotes);
      }

      setPosts(filteredData);

      // Fetch vote status for all posts
      const voteStatuses = await Promise.all(
        filteredData.map((post) =>
          apiCall(`/api/posts/${post.id}/vote-status?sessionId=${SESSION_ID}`)
            .then((res) => ({ [post.id]: res.voted }))
            .catch(() => ({ [post.id]: false }))
        )
      );
      const merged = Object.assign({}, ...voteStatuses);
      setUserUpvotedPosts(merged);
    } catch (err) {
      console.error('Error fetching posts:', err);
      alert('Failed to load posts. Please refresh the page.');
    } finally {
      setLoadingPosts(false);
    }
  }, [filterKeyword, sortBy]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Submit a New Post
  const handleSubmitPost = async (e) => {
    e.preventDefault();
    const trimmed = newPost.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_POST_LENGTH) {
      alert(`Post must be under ${MAX_POST_LENGTH} characters.`);
      return;
    }
    try {
      await apiCall('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ text: trimmed }),
      });
      setNewPost('');
      fetchPosts();
    } catch (err) {
      alert('Failed to create post. Please try again.');
    }
  };

  // Handle Upvote Toggle — now goes through server with session tracking
  const handleVote = async (postId) => {
    if (userUpvotedPosts[postId]) return; // Already voted, can't unvote

    try {
      await apiCall(`/api/posts/${postId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ sessionId: SESSION_ID }),
      });

      setUserUpvotedPosts((prev) => ({ ...prev, [postId]: true }));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, upvotes: post.upvotes + 1 } : post
        )
      );
    } catch (err) {
      if (err.message === 'Already voted on this post.') {
        setUserUpvotedPosts((prev) => ({ ...prev, [postId]: true }));
      } else {
        alert('Failed to record vote. Please try again.');
      }
    }
  };

  return (
    <div className="App">
      <header className="forum-header">
        <h1>Mass Dialogue Forum</h1>
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'forum' ? 'active' : ''}`}
            onClick={() => setActiveTab('forum')}
          >
            Forum
          </button>
          <button
            className={`tab-button ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            Generate Report
          </button>
          <button
            className={`tab-button ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            Agents
          </button>
        </div>

        {activeTab === 'forum' && (
          <div className="search-filter-container">
            <input
              type="text"
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value.slice(0, MAX_SEARCH_LENGTH))}
              placeholder="Search posts by keyword..."
              className="search-bar"
              maxLength={MAX_SEARCH_LENGTH}
            />
            <div className="sorting-dropdown">
              <label htmlFor="sortBy">Sort by: </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="created_at">Date</option>
                <option value="upvotes">Upvotes</option>
              </select>
            </div>
          </div>
        )}
      </header>

      <main className="forum-content">
        {activeTab === 'forum' ? (
          <>
            <div className="post-form">
              <form onSubmit={handleSubmitPost}>
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={4}
                  maxLength={MAX_POST_LENGTH}
                />
                <span className={`char-counter ${newPost.length >= MAX_POST_LENGTH * 0.9 ? 'char-counter-warning' : ''}`}>
                  {newPost.length}/{MAX_POST_LENGTH}
                </span>
                <div className="post-form-buttons">
                  <button type="submit" disabled={loadingPosts}>Post Message</button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('agents')}
                    className="agent-analysis-button"
                  >
                    Get Agent Analysis
                  </button>
                </div>
              </form>
            </div>

            <div className="posts-list">
              {posts.map((post) => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <span className="post-author">Anonymous User</span>
                    <span className="post-timestamp">
                      {new Date(post.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="post-content">{post.text}</div>
                  <div className="post-actions">
                    <div className="vote-buttons">
                      <button
                        onClick={() => handleVote(post.id)}
                        className={`vote-button upvote-button ${userUpvotedPosts[post.id] ? 'active' : ''}`}
                        title={userUpvotedPosts[post.id] ? 'Already voted' : 'Toggle Upvote'}
                        disabled={userUpvotedPosts[post.id]}
                        style={{
                          color: userUpvotedPosts[post.id] ? '#2ecc71' : '#888',
                        }}
                      >
                        ↑
                      </button>
                      <span
                        className="vote-count upvote-count"
                        style={{
                          color: userUpvotedPosts[post.id] ? '#2ecc71' : '#888',
                        }}
                      >
                        {post.upvotes}
                      </span>
                    </div>
                  </div>
                  <CommentSection postId={post.id} />
                </div>
              ))}
            </div>
          </>
        ) : activeTab === 'report' ? (
          <ReportPage />
        ) : activeTab === 'agents' ? (
          <AgentsPage />
        ) : null}
      </main>
    </div>
  );
}

// Comment System
function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchComments = async () => {
    const data = await apiCall(`/api/posts/${postId}/comments`);
    setComments(data || []);
  };

  useEffect(() => {
    if (isExpanded) {
      fetchComments();
    }
  }, [isExpanded, postId]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      alert(`Comment must be under ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }
    try {
      await apiCall(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: trimmed }),
      });
      setNewComment('');
      fetchComments();
    } catch (err) {
      alert('Failed to post comment. Please try again.');
    }
  };

  return (
    <div className="comments-section">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="toggle-comments"
      >
        {comments.length} Comments
      </button>

      {isExpanded && (
        <>
          <div className="comments-list">
            {comments.map((comment) => (
              <div key={comment.id} className="comment">
                <div className="comment-header">
                  <span className="comment-author">Anonymous User</span>
                  <span className="comment-timestamp">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="comment-content">{comment.text}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmitComment} className="comment-form">
            <div className="comment-input-wrapper">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                maxLength={MAX_COMMENT_LENGTH}
              />
              <span className={`char-counter ${newComment.length >= MAX_COMMENT_LENGTH * 0.9 ? 'char-counter-warning' : ''}`}>
                {newComment.length}/{MAX_COMMENT_LENGTH}
              </span>
            </div>
            <button type="submit">Comment</button>
          </form>
        </>
      )}
    </div>
  );
}

export default App;
