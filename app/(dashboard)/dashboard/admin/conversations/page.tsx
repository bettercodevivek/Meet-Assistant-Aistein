'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Conversation {
  id: string;
  title: string;
  avatarId: string;
  status: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  user: {
    id: string;
    username: string;
    email: string;
  } | null;
  knowledgeBase: {
    id: string;
    name: string;
  } | null;
}

function AdminConversationsContent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams?.get('userId');

  useEffect(() => {
    fetchConversations();
  }, [userId]);

  const fetchConversations = async () => {
    try {
      const url = userId 
        ? `/api/admin/conversations?userId=${userId}` 
        : '/api/admin/conversations';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setConversations(data.conversations);
      } else if (response.status === 403) {
        alert('Admin access required');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = (id: string) => {
    router.push(`/dashboard/chats/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {userId ? 'User Conversations' : 'All Conversations'}
          </h1>
          <p className="text-gray-600">
            {userId ? 'Conversations for selected user' : 'View all user conversations'}
          </p>
        </div>
        <div className="flex space-x-3">
          {userId && (
            <button
              onClick={() => router.push('/dashboard/admin/users')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
            >
              Back to Users
            </button>
          )}
          <button
            onClick={() => router.push('/dashboard/admin')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
          <p className="text-gray-600 text-lg">No conversations found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{conv.title}</h3>
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
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    {conv.user && (
                      <div>
                        <span className="font-medium text-gray-700">User:</span> {conv.user.username} ({conv.user.email})
                      </div>
                    )}
                    {conv.knowledgeBase && (
                      <div>
                        <span className="font-medium text-gray-700">Knowledge Base:</span> {conv.knowledgeBase.name}
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">Avatar:</span> {conv.avatarId}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Messages:</span> {conv.messageCount}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Created:</span>{' '}
                      {new Date(conv.createdAt).toLocaleDateString()} at{' '}
                      {new Date(conv.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Message:</span>{' '}
                      {new Date(conv.lastMessageAt).toLocaleDateString()} at{' '}
                      {new Date(conv.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => viewDetails(conv.id)}
                  className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-all shadow-sm ml-4"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-center text-gray-600 text-sm">
        Total Conversations: {conversations.length}
      </div>
    </div>
  );
}

export default function AdminConversationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AdminConversationsContent />
    </Suspense>
  );
}

