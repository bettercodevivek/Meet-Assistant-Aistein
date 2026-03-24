'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Conversation {
  id: string;
  title: string;
  avatarId: string;
  status: string;
  createdAt: string;
  lastMessageAt: string;
  lastMessage: {
    role: string;
    content: string;
    timestamp: string;
  } | null;
}

export default function DashboardPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStartChatModal, setShowStartChatModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      
      if (data.success) {
        setConversations(data.conversations.slice(0, 5)); // Show only 5 recent
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-black mb-2">AI Avatar Studio</h1>
        <p className="text-gray-600">Start a new conversation or continue from where you left off</p>
      </div>

      {/* Start New Chat Button */}
      <div className="mb-12">
        <button
          onClick={() => setShowStartChatModal(true)}
          className="w-full max-w-md mx-auto block bg-gradient-to-r from-blue-500 to-blue-600 text-white py-6 px-8 rounded-2xl text-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
        >
          ✨ Start New Chat
        </button>
      </div>

      {/* Recent Conversations */}
      {!loading && conversations.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-black mb-4">Recent Conversations</h2>
          <div className="space-y-3">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="border-[1.5px] border-gray-300 p-4 hover:border-black transition-colors cursor-pointer"
                onClick={() => router.push(`/dashboard/chats/${conv.id}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-black">{conv.title}</h3>
                  <span className="text-xs text-gray-600">
                    {new Date(conv.lastMessageAt).toLocaleDateString()}
                  </span>
                </div>
                {conv.lastMessage && (
                  <p className="text-sm text-gray-600 truncate">
                    {conv.lastMessage.role === 'user' ? 'You: ' : 'Avatar: '}
                    {conv.lastMessage.content}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link
              href="/dashboard/chats"
              className="text-black hover:underline font-medium"
            >
              View all conversations →
            </Link>
          </div>
        </div>
      )}

      {!loading && conversations.length === 0 && (
        <div className="text-center text-gray-600 py-12">
          <p>No conversations yet. Start your first chat!</p>
        </div>
      )}

      {/* Start Chat Modal */}
      {showStartChatModal && (
        <StartChatModal onClose={() => setShowStartChatModal(false)} />
      )}
    </div>
  );
}

// Import Link
import Link from 'next/link';

// Import AVATARS from constants
import { AVATARS, STT_LANGUAGE_LIST } from '@/app/lib/constants';

// Start Chat Modal Component
function StartChatModal({ onClose }: { onClose: () => void }) {
  const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    avatarId: '',
    voiceId: '',
    language: 'en',
    knowledgeBaseId: '',
    quality: 'medium',
    emotion: 'neutral',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  const fetchKnowledgeBases = async () => {
    try {
      const response = await fetch('/api/knowledge-bases');
      const data = await response.json();
      
      if (data.success) {
        setKnowledgeBases(data.knowledgeBases);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge bases:', error);
    }
  };

  const handleStartChat = async () => {
    if (!formData.avatarId || !formData.knowledgeBaseId) {
      alert('Please select an avatar and knowledge base');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarId: formData.avatarId,
          voiceId: formData.voiceId,
          language: formData.language,
          knowledgeBaseId: formData.knowledgeBaseId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/dashboard/chat/${data.conversation.id}`);
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
      alert('Failed to start chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Start New Chat</h2>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-all">
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {knowledgeBases.length === 0 && (
            <div className="p-4 border-[1.5px] border-black bg-gray-50">
              <p className="text-black">
                No knowledge bases found.{' '}
                <Link href="/dashboard/knowledge-bases" className="underline font-medium">
                  Create one first
                </Link>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Select Avatar <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.avatarId}
              onChange={(e) => setFormData({ ...formData, avatarId: e.target.value })}
              className="w-full px-4 py-3 border-[1.5px] border-gray-300 focus:border-black focus:outline-none text-black"
            >
              <option value="">Select an avatar</option>
              {AVATARS.map((avatar) => (
                <option key={avatar.avatar_id} value={avatar.avatar_id}>
                  {avatar.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Voice ID (Optional)
            </label>
            <input
              type="text"
              placeholder="Enter Voice ID"
              value={formData.voiceId}
              onChange={(e) => setFormData({ ...formData, voiceId: e.target.value })}
              className="w-full px-4 py-3 border-[1.5px] border-gray-300 focus:border-black focus:outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Language
            </label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full px-4 py-3 border-[1.5px] border-gray-300 focus:border-black focus:outline-none text-black"
            >
              {STT_LANGUAGE_LIST.map((lang) => (
                <option key={lang.key} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Select Knowledge Base <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.knowledgeBaseId}
              onChange={(e) => setFormData({ ...formData, knowledgeBaseId: e.target.value })}
              className="w-full px-4 py-3 border-[1.5px] border-gray-300 focus:border-black focus:outline-none text-black"
            >
              <option value="">Select a knowledge base</option>
              {knowledgeBases.map((kb) => (
                <option key={kb.id} value={kb.id}>
                  {kb.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Quality
              </label>
              <select
                value={formData.quality}
                onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                className="w-full px-4 py-3 border-[1.5px] border-gray-300 focus:border-black focus:outline-none text-black"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Emotion
              </label>
              <select
                value={formData.emotion}
                onChange={(e) => setFormData({ ...formData, emotion: e.target.value })}
                className="w-full px-4 py-3 border-[1.5px] border-gray-300 focus:border-black focus:outline-none text-black"
              >
                <option value="neutral">Neutral</option>
                <option value="happy">Happy</option>
                <option value="excited">Excited</option>
                <option value="serious">Serious</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border-t-[1.5px] border-gray-200 flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleStartChat}
            disabled={loading || !formData.avatarId || !formData.knowledgeBaseId}
            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Starting...' : '✨ Start Chat'}
          </button>
        </div>
      </div>
    </div>
  );
}

