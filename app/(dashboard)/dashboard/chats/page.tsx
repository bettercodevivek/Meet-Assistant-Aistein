'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Conversation {
  id: string;
  title: string;
  avatarId: string;
  knowledgeBase: {
    id: string;
    name: string;
  };
  status: string;
  createdAt: string;
  lastMessageAt: string;
  lastMessage: {
    role: string;
    content: string;
    timestamp: string;
  } | null;
}

export default function ChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async (id: string) => {
    // Navigate to chat page - the chat page will call the continue API
    router.push(`/dashboard/chat/${id}`);
  };

  const handleViewDetails = (id: string) => {
    router.push(`/dashboard/chats/${id}`);
  };

  const filteredConversations = conversations.filter((conv) => {
    if (filter === 'all') return true;
    return conv.status === filter;
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Sessions</h1>
        <p className="text-gray-600">View and continue your conversations</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-8">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            filter === 'all'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          All Sessions
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            filter === 'active'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            filter === 'completed'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Conversations List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-4">Loading sessions...</p>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
          <p className="text-gray-600 mb-4 text-lg">No sessions found</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-all"
          >
            Start New Session
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-2xl font-semibold text-gray-900">{conv.title}</h3>
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
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">{conv.avatarId}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>{conv.knowledgeBase.name}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{new Date(conv.lastMessageAt).toLocaleDateString()}</p>
                  <p className="text-xs">{new Date(conv.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>

              {conv.lastMessage && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-xs text-gray-500 mb-1">Last message</p>
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">
                      {conv.lastMessage.role === 'user' ? 'You' : conv.avatarId}:
                    </span>{' '}
                    {conv.lastMessage.content.length > 150 
                      ? conv.lastMessage.content.substring(0, 150) + '...' 
                      : conv.lastMessage.content}
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => handleContinue(conv.id)}
                  className="flex-1 px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-all shadow-sm"
                >
                  Continue Session
                </button>
                <button
                  onClick={() => handleViewDetails(conv.id)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

