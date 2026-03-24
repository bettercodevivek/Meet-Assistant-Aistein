'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  overview: {
    totalUsers: number;
    totalConversations: number;
    totalMessages: number;
    totalKnowledgeBases: number;
    activeUsers: number;
    avgMessagesPerConversation: number;
  };
  conversations: {
    active: number;
    completed: number;
  };
  recentActivity: {
    conversationsLast30Days: number;
    messagesLast30Days: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeySet, setApiKeySet] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [updatingApiKey, setUpdatingApiKey] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchStats();
    fetchApiKey();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else if (response.status === 403) {
        alert('Admin access required');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKey = async () => {
    try {
      const response = await fetch('/api/admin/api-key');
      const data = await response.json();
      
      if (data.success) {
        setApiKey(data.apiKey);
        setApiKeySet(data.isSet);
      }
    } catch (error) {
      console.error('Failed to fetch API key:', error);
    }
  };

  const handleUpdateApiKey = async () => {
    if (!newApiKey.trim()) {
      alert('Please enter an API key');
      return;
    }

    setUpdatingApiKey(true);
    try {
      const response = await fetch('/api/admin/api-key', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: newApiKey }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setShowApiKeyModal(false);
        setNewApiKey('');
        fetchApiKey();
      } else {
        alert(data.message || 'Failed to update API key');
      }
    } catch (error) {
      console.error('Failed to update API key:', error);
      alert('An error occurred while updating API key');
    } finally {
      setUpdatingApiKey(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600">Failed to load statistics</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">System overview and statistics</p>
      </div>

      {/* API Key Management */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">HeyGen API Key</h2>
            <p className="text-sm text-gray-600 mt-1">Manage your HeyGen API key for avatar streaming</p>
          </div>
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-sm"
          >
            Update API Key
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-sm">
              {apiKeySet ? apiKey : 'No API key set'}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            apiKeySet 
              ? 'bg-green-50 text-green-600 border border-green-200'
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {apiKeySet ? 'Active' : 'Not Set'}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => router.push('/dashboard/admin/users')}
          className="p-6 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg text-left"
        >
          <div className="text-3xl font-bold">{stats.overview.totalUsers}</div>
          <div className="text-blue-100 mt-2">Manage Users</div>
        </button>
        <button
          onClick={() => router.push('/dashboard/admin/conversations')}
          className="p-6 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all shadow-lg text-left"
        >
          <div className="text-3xl font-bold">{stats.overview.totalConversations}</div>
          <div className="text-green-100 mt-2">View All Chats</div>
        </button>
        <button
          onClick={() => router.push('/dashboard/knowledge-bases')}
          className="p-6 bg-purple-500 text-white rounded-2xl hover:bg-purple-600 transition-all shadow-lg text-left"
        >
          <div className="text-3xl font-bold">{stats.overview.totalKnowledgeBases}</div>
          <div className="text-purple-100 mt-2">Knowledge Bases</div>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">System Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <div className="text-gray-600 text-sm mb-1">Total Users</div>
            <div className="text-3xl font-bold text-gray-900">{stats.overview.totalUsers}</div>
          </div>
          <div>
            <div className="text-gray-600 text-sm mb-1">Active Users (7d)</div>
            <div className="text-3xl font-bold text-green-600">{stats.overview.activeUsers}</div>
          </div>
          <div>
            <div className="text-gray-600 text-sm mb-1">Total Conversations</div>
            <div className="text-3xl font-bold text-gray-900">{stats.overview.totalConversations}</div>
          </div>
          <div>
            <div className="text-gray-600 text-sm mb-1">Total Messages</div>
            <div className="text-3xl font-bold text-gray-900">{stats.overview.totalMessages}</div>
          </div>
          <div>
            <div className="text-gray-600 text-sm mb-1">Avg Messages/Chat</div>
            <div className="text-3xl font-bold text-blue-600">{stats.overview.avgMessagesPerConversation}</div>
          </div>
          <div>
            <div className="text-gray-600 text-sm mb-1">Knowledge Bases</div>
            <div className="text-3xl font-bold text-gray-900">{stats.overview.totalKnowledgeBases}</div>
          </div>
        </div>
      </div>

      {/* Conversation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Conversations</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active</span>
              <span className="text-2xl font-bold text-green-600">{stats.conversations.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed</span>
              <span className="text-2xl font-bold text-gray-900">{stats.conversations.completed}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity (30 Days)</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Conversations</span>
              <span className="text-2xl font-bold text-blue-600">{stats.recentActivity.conversationsLast30Days}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Messages Sent</span>
              <span className="text-2xl font-bold text-purple-600">{stats.recentActivity.messagesLast30Days}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Update API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Update HeyGen API Key</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Enter your new HeyGen API key. The server will need to be restarted for changes to take effect.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Enter your HeyGen API key"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowApiKeyModal(false);
                  setNewApiKey('');
                }}
                disabled={updatingApiKey}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateApiKey}
                disabled={updatingApiKey}
                className="flex-1 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-all disabled:bg-gray-400 shadow-sm"
              >
                {updatingApiKey ? 'Updating...' : 'Update API Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

