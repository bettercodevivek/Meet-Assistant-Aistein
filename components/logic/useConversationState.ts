import { useCallback } from "react";

import { useStreamingAvatarContext } from "./context";
import { StreamingAvatarSessionState } from "./context";

export const useConversationState = () => {
  const { avatarRef, isAvatarTalking, isUserTalking, isListening, sessionState } =
    useStreamingAvatarContext();

  const startListening = useCallback(() => {
    if (!avatarRef.current) return;
    if (sessionState !== StreamingAvatarSessionState.CONNECTED) return;
    try {
      avatarRef.current.startListening();
    } catch (error) {
      console.error("Error starting listening:", error);
    }
  }, [avatarRef, sessionState]);

  const stopListening = useCallback(() => {
    if (!avatarRef.current) return;
    if (sessionState !== StreamingAvatarSessionState.CONNECTED) return;
    try {
      avatarRef.current.stopListening();
    } catch (error) {
      console.error("Error stopping listening:", error);
    }
  }, [avatarRef, sessionState]);

  return {
    isAvatarListening: isListening,
    startListening,
    stopListening,
    isUserTalking,
    isAvatarTalking,
  };
};
