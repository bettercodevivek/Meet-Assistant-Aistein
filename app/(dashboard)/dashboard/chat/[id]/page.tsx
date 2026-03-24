'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  AvatarQuality,
  StreamingEvents,
  VoiceChatTransport,
  VoiceEmotion,
  StartAvatarRequest,
  STTProvider,
  ElevenLabsModel,
} from "@heygen/streaming-avatar";
import { useMemoizedFn, useUnmount } from "ahooks";
import { StreamingAvatarProvider, StreamingAvatarSessionState } from '@/components/logic';
import { useStreamingAvatarSession } from '@/components/logic/useStreamingAvatarSession';
import { useVoiceChat } from '@/components/logic/useVoiceChat';
import { AvatarVideo } from '@/components/AvatarSession/AvatarVideo';
import { AvatarControls } from '@/components/AvatarSession/AvatarControls';
import { LoadingIcon } from '@/components/Icons';
import { Button } from '@/components/Button';

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
  voiceId?: string;
  language?: string;
  knowledgeBase: {
    id: string;
    name: string;
    prompt: string;
  };
  status: string;
  sessionContext?: string;
  conversationSummary?: string;
  createdAt: string;
  lastMessageAt: string;
  messages: Message[];
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEndChatConfirm, setShowEndChatConfirm] = useState(false);
  const [endingChat, setEndingChat] = useState(false);
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
      continueConversation();
    }
  }, [conversationId]);

  const continueConversation = async () => {
    try {
      // Call the continue API endpoint to get enhanced session context
      const response = await fetch(`/api/conversations/${conversationId}/continue`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        // Set conversation with enhanced session context
        setConversation({
          ...data.conversation,
          messages: data.messages || [],
        });
      } else {
        console.error('Failed to continue conversation:', data.message);
      }
    } catch (error) {
      console.error('Failed to continue conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndChat = async () => {
    setEndingChat(true);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/end`, {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to end chat');
      }
    } catch (error) {
      console.error('Failed to end chat:', error);
      alert('An error occurred');
    } finally {
      setEndingChat(false);
      setShowEndChatConfirm(false);
    }
  };

  const handleMessageSent = async (message: string, role: 'user' | 'assistant') => {
    // Save message to database
    try {
      console.log(`Saving message to DB - Role: ${role}, Content: ${message.substring(0, 50)}...`);
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content: message }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Message saved successfully:', data.message.id);
      } else {
        console.error('Failed to save message:', data.message);
      }
      
      // Messages are added in real-time via the onMessageReceived/onUserMessage callbacks
      // No need to refresh the entire conversation
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-black text-xl mb-2">Loading chat...</p>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-black text-xl mb-4">Conversation not found</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-black text-white font-medium hover:bg-gray-800"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 z-10 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{conversation.title}</h1>
            <p className="text-sm text-gray-500">{conversation.knowledgeBase.name}</p>
          </div>
        </div>
        <button
          onClick={() => setShowEndChatConfirm(true)}
          className="px-6 py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-all shadow-sm hover:shadow-md"
        >
          End Session
        </button>
      </div>

      {/* Chat Interface */}
      <div className="pt-20 h-full">
        <ChatInterface
          conversation={conversation}
          onMessageSent={handleMessageSent}
        />
      </div>

      {/* End Chat Confirmation Modal */}
      {showEndChatConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">End Session?</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              This will end the current session and save a summary for future conversations.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowEndChatConfirm(false)}
                disabled={endingChat}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEndChat}
                disabled={endingChat}
                className="flex-1 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-all disabled:bg-gray-400 shadow-sm"
              >
                {endingChat ? 'Ending...' : 'End Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Chat Interface Component
function ChatInterface({
  conversation,
  onMessageSent,
}: {
  conversation: Conversation;
  onMessageSent: (message: string, role: 'user' | 'assistant') => void;
}) {
  const [messages, setMessages] = useState(conversation.messages);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setMessages(conversation.messages);
    scrollToBottom();
  }, [conversation.messages]);

  return (
    <div className="h-full flex">
      {/* Avatar Video Section - Left Side */}
      <div className={`${isFullScreen ? 'w-full' : 'w-2/3'} bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center relative transition-all duration-300`}>
        <InteractiveAvatarWrapper
          conversation={conversation}
          onMessageReceived={(message) => {
            onMessageSent(message, 'assistant');
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: message,
                timestamp: new Date().toISOString(),
              },
            ]);
          }}
          onUserMessage={(message) => {
            onMessageSent(message, 'user');
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'user',
                content: message,
                timestamp: new Date().toISOString(),
              },
            ]);
          }}
        />
        
        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 rounded-lg transition-all shadow-lg z-10"
          title={isFullScreen ? 'Show Chat' : 'Hide Chat'}
        >
          {isFullScreen ? (
            // Collapse icon (show chat)
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          ) : (
            // Expand icon (hide chat)
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
      </div>

      {/* Messages History Section - Right Side */}
      <div className={`${isFullScreen ? 'hidden' : 'w-1/3'} bg-white flex flex-col border-l border-gray-200 shadow-xl transition-all duration-300`}>
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Conversation</h3>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(conversation.createdAt).toLocaleDateString()} at {new Date(conversation.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Previous Messages */}
            {conversation.messages && conversation.messages.length > 0 && (
              <>
                <div className="flex items-center my-4">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="px-3 text-xs font-medium text-gray-400">
                    Previous Messages
                  </span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>

                {conversation.messages.map((message, index) => (
                  <div
                    key={`prev-${message.id || index}`}
                    className={`p-4 rounded-lg opacity-60 ${
                      message.role === 'user'
                        ? 'bg-blue-50 ml-4'
                        : 'bg-gray-50 mr-4'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-700 text-xs">
                        {message.role === 'user' ? 'You' : conversation.avatarId}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{message.content}</p>
                  </div>
                ))}

                <div className="flex items-center my-6">
                  <div className="flex-1 border-t-2 border-blue-500"></div>
                  <span className="px-3 text-xs font-semibold text-blue-600">
                    Live Session
                  </span>
                  <div className="flex-1 border-t-2 border-blue-500"></div>
                </div>
              </>
            )}

            {/* New Messages */}
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`p-4 rounded-lg shadow-sm ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white ml-4'
                    : 'bg-white border border-gray-200 mr-4'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-medium text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-700'}`}>
                    {message.role === 'user' ? 'You' : conversation.avatarId}
                  </span>
                  <span className={`text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                  {message.content}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Actual Avatar Implementation Component
function ChatInteractiveAvatar({
  conversation,
  onMessageReceived,
  onUserMessage,
}: {
  conversation: Conversation;
  onMessageReceived: (message: string) => void;
  onUserMessage: (message: string) => void;
}) {
  const { initAvatar, startAvatar, stopAvatar, sessionState, stream } =
    useStreamingAvatarSession();
  const { startVoiceChat } = useVoiceChat();
  
  const mediaStream = useRef<HTMLVideoElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  
  // Accumulate messages from streaming events
  const currentUserMessage = useRef<string>('');
  const currentAvatarMessage = useRef<string>('');

  // Fetch access token
  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", {
        method: "POST",
      });
      const token = await response.text();
      console.log("Access Token fetched");
      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      throw error;
    }
  }

  // Start avatar session
  const startSession = useMemoizedFn(async () => {
    try {
      setIsInitializing(true);
      const newToken = await fetchAccessToken();
      const avatar = initAvatar(newToken);

      // Set up event listeners
      avatar.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
        console.log("Avatar started talking", e);
      });
      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
        console.log("Avatar stopped talking", e);
      });
      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log("Stream disconnected");
      });
      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        console.log(">>>>> Stream ready:", event.detail);
      });
      avatar.on(StreamingEvents.USER_START, (event) => {
        console.log(">>>>> User started talking:", event);
      });
      avatar.on(StreamingEvents.USER_STOP, (event) => {
        console.log(">>>>> User stopped talking:", event);
      });
      // User message events - accumulate text as it comes in
      avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (event: any) => {
        console.log(">>>>> User talking message:", event);
        if (event.detail && event.detail.message) {
          currentUserMessage.current += event.detail.message;
          console.log("Accumulated user message:", currentUserMessage.current);
        }
      });
      
      avatar.on(StreamingEvents.USER_END_MESSAGE, (event: any) => {
        console.log(">>>>> User end message - Final message:", currentUserMessage.current);
        if (currentUserMessage.current) {
          onUserMessage(currentUserMessage.current);
          currentUserMessage.current = ''; // Reset for next message
        }
      });
      
      // Avatar message events - accumulate text as it comes in
      avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (event: any) => {
        console.log(">>>>> Avatar talking message:", event);
        if (event.detail && event.detail.message) {
          currentAvatarMessage.current += event.detail.message;
          console.log("Accumulated avatar message:", currentAvatarMessage.current);
        }
      });
      
      avatar.on(StreamingEvents.AVATAR_END_MESSAGE, (event: any) => {
        console.log(">>>>> Avatar end message - Final message:", currentAvatarMessage.current);
        if (currentAvatarMessage.current) {
          onMessageReceived(currentAvatarMessage.current);
          currentAvatarMessage.current = ''; // Reset for next message
        }
      });

      // Configure avatar with conversation settings
      // Use sessionContext if available, otherwise use knowledge base ID
      const config: StartAvatarRequest = {
        quality: AvatarQuality.Low,
        avatarName: conversation.avatarId,
        // If we have a sessionContext, don't use knowledgeId (we'll use custom prompt)
        knowledgeId: conversation.sessionContext ? undefined : conversation.knowledgeBase.id,
        // Use the enhanced session context for continuing conversations
        knowledgeBase: conversation.sessionContext || conversation.knowledgeBase.prompt,
        voice: {
          rate: 1.5,
          emotion: VoiceEmotion.EXCITED,
          model: ElevenLabsModel.eleven_flash_v2_5,
        },
        language: conversation.language || "en",
        voiceChatTransport: VoiceChatTransport.WEBSOCKET,
        sttSettings: {
          provider: STTProvider.DEEPGRAM,
        },
      };

      console.log('Avatar configuration:', {
        avatarName: config.avatarName,
        hasKnowledgeId: !!config.knowledgeId,
        hasKnowledgeBase: !!config.knowledgeBase,
        language: config.language,
        voiceModel: config.voice?.model,
        transport: config.voiceChatTransport,
      });

      console.log('Starting avatar...');
      await startAvatar(config);
      console.log('✅ Avatar started successfully');
      
      // Start voice chat with microphone initially unmuted
      console.log('Starting voice chat with audio enabled...');
      try {
        await startVoiceChat(false); // false = microphone NOT muted
        console.log('✅ Voice chat started successfully - Avatar should be speaking now');
      } catch (voiceError) {
        console.error('❌ Failed to start voice chat:', voiceError);
        throw voiceError;
      }
      
      setIsInitializing(false);
    } catch (error) {
      console.error("Error starting avatar session:", error);
      setIsInitializing(false);
    }
  });

  // Auto-start avatar on mount
  useEffect(() => {
    if (sessionState === StreamingAvatarSessionState.INACTIVE) {
      startSession();
    }
  }, [sessionState, startSession]);

  // Enable user's front camera for video call effect
  useEffect(() => {
    const startUserCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false // Audio is handled by voice chat
        });
        
        const videoElement = document.getElementById('userCamera') as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
          setCameraEnabled(true);
          console.log('✅ User camera enabled');
        }
      } catch (error) {
        console.error('Failed to enable user camera:', error);
        setCameraEnabled(false);
      }
    };

    if (sessionState === StreamingAvatarSessionState.CONNECTED) {
      startUserCamera();
    }

    // Cleanup camera on unmount
    return () => {
      const videoElement = document.getElementById('userCamera') as HTMLVideoElement;
      if (videoElement && videoElement.srcObject) {
        const tracks = (videoElement.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [sessionState]);

  // Clean up on unmount
  useUnmount(() => {
    // Only try to stop if we have an active session
    if (sessionState === StreamingAvatarSessionState.CONNECTED) {
      stopAvatar().catch(error => {
        console.error('Error stopping avatar on unmount:', error);
        // Ignore errors on unmount - session may have already ended
      });
    }
  });

  // Set up video stream with audio
  useEffect(() => {
    if (stream && mediaStream.current) {
      console.log('Setting up media stream...');
      
      // Check if stream has audio tracks
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      console.log('Audio tracks:', audioTracks.length, audioTracks);
      console.log('Video tracks:', videoTracks.length, videoTracks);
      
      if (audioTracks.length === 0) {
        console.warn('⚠️ No audio tracks in stream!');
      } else {
        audioTracks.forEach(track => {
          console.log('Audio track:', track.label, 'enabled:', track.enabled, 'muted:', track.muted);
          track.enabled = true; // Ensure audio track is enabled
        });
      }
      
      mediaStream.current.srcObject = stream;
      // Ensure audio is enabled
      mediaStream.current.muted = false;
      mediaStream.current.volume = 1.0;
      
      mediaStream.current.onloadedmetadata = () => {
        console.log('Media loaded, attempting to play...');
        mediaStream.current!.play()
          .then(() => {
            console.log('✅ Video/audio playing successfully');
            setAudioEnabled(true);
          })
          .catch(error => {
            console.error('❌ Error playing video/audio:', error);
            console.log('Audio may be blocked by browser - user interaction needed');
            setAudioEnabled(false);
          });
      };
      
      console.log('Video stream set up with audio enabled');
    }
  }, [mediaStream, stream]);

  // Manual audio enable function (for browser autoplay restrictions)
  const enableAudio = () => {
    if (mediaStream.current) {
      mediaStream.current.muted = false;
      mediaStream.current.volume = 1.0;
      mediaStream.current.play()
        .then(() => {
          console.log('Audio manually enabled');
          setAudioEnabled(true);
        })
        .catch(error => {
          console.error('Failed to enable audio:', error);
        });
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="flex-1 relative">
        {/* Main Avatar Video */}
        <div className="absolute inset-0 flex items-center justify-center">
          {sessionState === StreamingAvatarSessionState.CONNECTED ? (
            <>
              <div className="relative w-full h-full">
                <AvatarVideo ref={mediaStream} />
                
                {/* User Camera Preview - Picture in Picture */}
                <div className="absolute bottom-6 right-6 w-48 h-36 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700">
                  <video
                    id="userCamera"
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-medium">
                    You
                  </div>
                </div>
                
                {/* Audio Enable Button - shows if audio blocked by browser */}
                {!audioEnabled && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    <button
                      onClick={enableAudio}
                      className="px-8 py-4 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 shadow-2xl transition-all transform hover:scale-105"
                    >
                      Enable Audio
                    </button>
                    <p className="text-white text-sm text-center mt-3 bg-black/80 px-4 py-2 rounded-lg">
                      Click to hear the avatar speak
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-white text-center">
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto">
                  <LoadingIcon />
                </div>
              </div>
              <p className="text-xl font-semibold mb-2">{conversation.avatarId}</p>
              <p className="text-sm text-gray-400">
                {isInitializing ? 'Initializing session...' : 'Connecting...'}
              </p>
            </div>
          )}
        </div>

        {/* Controls Overlay */}
        {sessionState === StreamingAvatarSessionState.CONNECTED && (
          <div className="absolute bottom-4 left-0 right-0 px-6">
            <div className="flex items-center justify-center space-x-3">
              {/* Audio Status */}
              <div className={`px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${audioEnabled ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {audioEnabled ? '🎤 Audio Active' : '🔇 Audio Disabled'}
              </div>
              <AvatarControls />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper component for InteractiveAvatar
function InteractiveAvatarWrapper({
  conversation,
  onMessageReceived,
  onUserMessage,
}: {
  conversation: Conversation;
  onMessageReceived: (message: string) => void;
  onUserMessage: (message: string) => void;
}) {
  return (
    <StreamingAvatarProvider basePath={process.env.NEXT_PUBLIC_BASE_API_URL}>
      <ChatInteractiveAvatar
        conversation={conversation}
        onMessageReceived={onMessageReceived}
        onUserMessage={onUserMessage}
      />
    </StreamingAvatarProvider>
  );
}

