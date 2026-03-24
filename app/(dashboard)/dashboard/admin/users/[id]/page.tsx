'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface UserDetails {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  conversationCount: number;
  knowledgeBaseCount: number;
  messageCount: number;
}

interface KnowledgeBase {
  id: string;
  name: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
}

interface Conversation {
  id: string;
  title: string;
  avatarId: string;
  status: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  knowledgeBase: {
    id: string;
    name: string;
  } | null;
}

export default function UserDetailsPage() {
  const params = useParams();
  const userId = params?.id as string;
  const router = useRouter();

  const [user, setUser] = useState<UserDetails | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'knowledge-bases' | 'conversations'>('overview');

  // Edit KB modal states
  const [showEditKBModal, setShowEditKBModal] = useState(false);
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);
  const [editKBName, setEditKBName] = useState('');
  const [editKBPrompt, setEditKBPrompt] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
      fetchKnowledgeBases();
      fetchConversations();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
      } else if (response.status === 403) {
        alert('Admin access required');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKnowledgeBases = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/knowledge-bases`);
      const data = await response.json();
      
      if (data.success) {
        setKnowledgeBases(data.knowledgeBases);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge bases:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/admin/conversations?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const openEditKBModal = (kb: KnowledgeBase) => {
    setSelectedKB(kb);
    setEditKBName(kb.name);
    setEditKBPrompt(kb.prompt);
    setShowEditKBModal(true);
    setError('');
  };

  const handleEditKB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKB) return;

    setProcessing(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/knowledge-bases/${selectedKB.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editKBName,
          prompt: editKBPrompt,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowEditKBModal(false);
        setSelectedKB(null);
        fetchKnowledgeBases();
        alert('Knowledge base updated successfully');
      } else {
        setError(data.message || 'Failed to update knowledge base');
      }
    } catch (error) {
      setError('An error occurred');
      console.error('Edit KB error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteKB = async (kbId: string, kbName: string) => {
    if (!confirm(`Are you sure you want to delete knowledge base "${kbName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/knowledge-bases/${kbId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchKnowledgeBases();
        fetchUserDetails(); // Refresh to update KB count
        alert('Knowledge base deleted successfully');
      } else {
        alert(data.message || 'Failed to delete knowledge base');
      }
    } catch (error) {
      alert('An error occurred');
      console.error('Delete KB error:', error);
    }
  };

  const viewConversation = (convId: string) => {
    router.push(`/dashboard/chats/${convId}`);
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{user.username}</h1>
          <p className="text-gray-600">{user.email}</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/admin/users')}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
        >
          Back to Users
        </button>
      </div>

      {/* User Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="text-gray-600 text-sm mb-1">Role</div>
          <div className="text-2xl font-bold text-gray-900 capitalize">{user.role}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="text-gray-600 text-sm mb-1">Conversations</div>
          <div className="text-2xl font-bold text-blue-600">{user.conversationCount}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="text-gray-600 text-sm mb-1">Knowledge Bases</div>
          <div className="text-2xl font-bold text-purple-600">{user.knowledgeBaseCount}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="text-gray-600 text-sm mb-1">Total Messages</div>
          <div className="text-2xl font-bold text-green-600">{user.messageCount}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-medium transition-all ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('knowledge-bases')}
              className={`px-6 py-4 font-medium transition-all ${
                activeTab === 'knowledge-bases'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Knowledge Bases ({knowledgeBases.length})
            </button>
            <button
              onClick={() => setActiveTab('conversations')}
              className={`px-6 py-4 font-medium transition-all ${
                activeTab === 'conversations'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Conversations ({conversations.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Username:</span>
                    <span className="ml-2 font-medium text-gray-900">{user.username}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium text-gray-900">{user.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Role:</span>
                    <span className="ml-2 font-medium text-gray-900 capitalize">{user.role}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Joined:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Login:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Conversations</span>
                    <span className="font-semibold text-gray-900">{user.conversationCount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Knowledge Bases Created</span>
                    <span className="font-semibold text-gray-900">{user.knowledgeBaseCount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Messages Sent</span>
                    <span className="font-semibold text-gray-900">{user.messageCount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Avg Messages per Conversation</span>
                    <span className="font-semibold text-gray-900">
                      {user.conversationCount > 0 
                        ? Math.round(user.messageCount / user.conversationCount) 
                        : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Knowledge Bases Tab */}
          {activeTab === 'knowledge-bases' && (
            <div>
              {knowledgeBases.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No knowledge bases found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {knowledgeBases.map((kb) => (
                    <div
                      key={kb.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{kb.name}</h4>
                          <p className="text-gray-600 text-sm">
                            <strong>System Prompt:</strong> {kb.prompt.substring(0, 150)}
                            {kb.prompt.length > 150 && '...'}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => openEditKBModal(kb)}
                            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteKB(kb.id, kb.name)}
                            className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Created: {new Date(kb.createdAt).toLocaleDateString()} | 
                        Last Updated: {new Date(kb.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conversations Tab */}
          {activeTab === 'conversations' && (
            <div>
              {conversations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No conversations found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{conv.title}</h4>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                conv.status === 'active'
                                  ? 'bg-green-50 text-green-600 border border-green-200'
                                  : 'bg-gray-50 text-gray-600 border border-gray-200'
                              }`}
                            >
                              {conv.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                            {conv.knowledgeBase && (
                              <div>
                                <span className="font-medium text-gray-700">KB:</span> {conv.knowledgeBase.name}
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-gray-700">Messages:</span> {conv.messageCount}
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Created:</span>{' '}
                              {new Date(conv.createdAt).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Last Activity:</span>{' '}
                              {new Date(conv.lastMessageAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => viewConversation(conv.id)}
                          className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-all ml-4"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit KB Modal */}
      {showEditKBModal && selectedKB && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Knowledge Base</h2>
            <form onSubmit={handleEditKB}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Knowledge Base Name *
                  </label>
                  <input
                    type="text"
                    value={editKBName}
                    onChange={(e) => setEditKBName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Prompt *
                  </label>
                  <textarea
                    value={editKBPrompt}
                    onChange={(e) => setEditKBPrompt(e.target.value)}
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                {error && (
                  <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
                    {error}
                  </div>
                )}
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditKBModal(false);
                    setSelectedKB(null);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50"
                  disabled={processing}
                >
                  {processing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

