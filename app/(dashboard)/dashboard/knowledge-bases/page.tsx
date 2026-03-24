'use client';

import { useState, useEffect } from 'react';

interface KnowledgeBase {
  id: string;
  name: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
}

export default function KnowledgeBasesPage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingKb, setEditingKb] = useState<KnowledgeBase | null>(null);

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
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge base?')) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-bases/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchKnowledgeBases();
      }
    } catch (error) {
      console.error('Failed to delete knowledge base:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Knowledge Bases</h1>
          <p className="text-gray-600">Manage your avatar knowledge bases and system prompts</p>
        </div>
        <button
          onClick={() => {
            setEditingKb(null);
            setShowModal(true);
          }}
          className="px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
        >
          + Create New
        </button>
      </div>

      {/* Knowledge Bases Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-600">Loading...</div>
      ) : knowledgeBases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No knowledge bases yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {knowledgeBases.map((kb) => (
            <div
              key={kb.id}
              className="border-[1.5px] border-gray-300 p-6 hover:border-black transition-colors"
            >
              <h3 className="text-xl font-bold text-black mb-2">{kb.name}</h3>
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">System Prompt Preview:</p>
                <p className="text-sm text-black line-clamp-3">{kb.prompt}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingKb(kb);
                    setShowModal(true);
                  }}
                  className="flex-1 py-2 border-[1.5px] border-black text-black font-medium hover:bg-gray-100 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(kb.id)}
                  className="flex-1 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <KnowledgeBaseModal
          knowledgeBase={editingKb}
          onClose={() => {
            setShowModal(false);
            setEditingKb(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingKb(null);
            fetchKnowledgeBases();
          }}
        />
      )}
    </div>
  );
}

// Modal Component
function KnowledgeBaseModal({
  knowledgeBase,
  onClose,
  onSuccess,
}: {
  knowledgeBase: KnowledgeBase | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: knowledgeBase?.name || '',
    prompt: knowledgeBase?.prompt || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.prompt) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const url = knowledgeBase
        ? `/api/knowledge-bases/${knowledgeBase.id}`
        : '/api/knowledge-bases';
      
      const method = knowledgeBase ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert('Failed to save knowledge base');
      }
    } catch (error) {
      console.error('Failed to save knowledge base:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-[1.5px] border-black max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b-[1.5px] border-black flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black">
            {knowledgeBase ? 'Edit Knowledge Base' : 'Create Knowledge Base'}
          </h2>
          <button onClick={onClose} className="text-2xl hover:text-gray-600">
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Knowledge Base Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Business Advisor"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border-[1.5px] border-gray-300 focus:border-black focus:outline-none text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              System Prompt <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="e.g., You are a helpful business advisor..."
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              rows={10}
              className="w-full px-4 py-3 border-[1.5px] border-gray-300 focus:border-black focus:outline-none text-black font-mono text-sm"
            />
            <p className="text-xs text-gray-600 mt-1">
              This prompt defines the avatar's behavior. Previous conversation summaries will be automatically appended here.
            </p>
          </div>
        </div>

        <div className="p-6 border-t-[1.5px] border-black flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-[1.5px] border-black text-black font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

