import { useState, useCallback, useRef, useEffect } from 'react';
import { useScribe, CommitStrategy } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseElevenLabsScribeOptions {
  onTranscript: (text: string) => void;
}

export function useElevenLabsScribe({ onTranscript }: UseElevenLabsScribeOptions) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const accumulatedTextRef = useRef('');

  const scribe = useScribe({
    modelId: 'scribe_v2_realtime',
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data) => {
      // Show partial transcripts as they come in
      if (data.text) {
        onTranscript(accumulatedTextRef.current + data.text);
      }
    },
    onCommittedTranscript: (data) => {
      // When VAD commits, add to accumulated text
      if (data.text) {
        accumulatedTextRef.current += (accumulatedTextRef.current ? ' ' : '') + data.text.trim();
        onTranscript(accumulatedTextRef.current);
      }
    },
  });

  const startListening = useCallback(async () => {
    if (scribe.isConnected) {
      return;
    }

    setIsConnecting(true);
    accumulatedTextRef.current = '';

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get token from edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-scribe-token');

      if (error || !data?.token) {
        throw new Error(error?.message || 'Failed to get transcription token');
      }

      // Connect to ElevenLabs
      await scribe.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } catch (error) {
      console.error('Failed to start voice dictation:', error);
      
      let errorMessage = 'Failed to start voice dictation. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Permission denied') || error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access was denied. Please allow microphone access in your browser settings.';
        } else if (error.message.includes('not configured')) {
          errorMessage = 'Voice dictation is not configured. Please contact support.';
        }
      }
      
      toast({
        title: 'Voice input error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  }, [scribe, toast]);

  const stopListening = useCallback(() => {
    if (scribe.isConnected) {
      scribe.disconnect();
    }
    accumulatedTextRef.current = '';
  }, [scribe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scribe.isConnected) {
        scribe.disconnect();
      }
    };
  }, [scribe]);

  return {
    isListening: scribe.isConnected,
    isConnecting,
    startListening,
    stopListening,
    partialTranscript: scribe.partialTranscript,
  };
}
