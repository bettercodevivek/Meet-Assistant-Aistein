'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  avatarId: string;
  knowledgeBase: {
    id: string;
    name: string;
    prompt: string;
  };
  status: string;
  createdAt: string;
  lastMessageAt: string;
  messages: Message[];
}

export default function ChatDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const loadParams = async () => {
      const { id } = await params;
      setConversationId(id);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId]);

  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      const data = await response.json();
      
      if (data.success) {
        setConversation(data.conversation);
      }
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12 text-gray-600">
        Loading...
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-600 mb-4">Conversation not found</p>
        <button
          onClick={() => router.push('/dashboard/chats')}
          className="px-6 py-2 bg-black text-white font-medium hover:bg-gray-800"
        >
          Back to Chats
        </button>
      </div>
    );
  }

  const handleExport = () => {
    // Create a text file with the conversation
    const conversationText = `
Conversation: ${conversation.title}
Date: ${new Date(conversation.createdAt).toLocaleString()}
Avatar: ${conversation.avatarId}
Knowledge Base: ${conversation.knowledgeBase.name}
Status: ${conversation.status}

Messages:
${conversation.messages.map((msg, i) => `
${i + 1}. ${msg.role === 'user' ? 'You' : 'Avatar'} (${new Date(msg.timestamp).toLocaleTimeString()}):
${msg.content}
`).join('\n')}
    `.trim();

    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${conversation.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleContinueChat = () => {
    router.push(`/dashboard/chat/${conversation.id}`);
  };

  // Calculate duration
  const duration = Math.round(
    (new Date(conversation.lastMessageAt).getTime() - new Date(conversation.createdAt).getTime()) / 60000
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/chats')}
          className="text-gray-600 hover:text-gray-900 mb-6 inline-flex items-center space-x-2 font-medium"
        >
          <span>←</span><span>Back to Chats</span>
        </button>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-3">{conversation.title}</h1>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                conversation.status === 'active'
                  ? 'bg-green-50 text-green-600 border border-green-200'
                  : 'bg-gray-50 text-gray-600 border border-gray-200'
              }`}>
                {conversation.status}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium text-gray-900">{new Date(conversation.createdAt).toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium text-gray-900">{duration} minutes</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Avatar</p>
              <p className="font-medium text-gray-900">{conversation.avatarId}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Messages</p>
              <p className="font-medium text-gray-900">{conversation.messages.length}</p>
            </div>
          </div>

          <div className="mb-6 pb-6 border-b border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Knowledge Base</p>
            <p className="font-medium text-gray-900">{conversation.knowledgeBase.name}</p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleContinueChat}
              className="flex-1 px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-all shadow-sm"
            >
              Continue Chat
            </button>
            <button
              onClick={handleExport}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Messages History */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">Conversation History</h2>
          <p className="text-sm text-gray-500 mt-1">
            {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
          {conversation.messages.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No messages yet</p>
          ) : (
            conversation.messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white ml-8'
                    : 'bg-gray-50 border border-gray-200 mr-8'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`font-medium text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-700'}`}>
                    {message.role === 'user' ? 'You' : 'Avatar'}
                  </span>
                  <span className={`text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                  {message.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Knowledge Base Info */}
      <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Knowledge Base Details</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">System Prompt</p>
            <pre className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap font-mono">
              {conversation.knowledgeBase.prompt}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

