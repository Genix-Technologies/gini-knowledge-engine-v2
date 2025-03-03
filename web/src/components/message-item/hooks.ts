import { useDeleteMessage, useFeedback } from '@/hooks/chat-hooks';
import { useSetModalState } from '@/hooks/common-hooks';
import { IRemoveMessageById, useSpeechWithSse } from '@/hooks/logic-hooks';
import { IFeedbackRequestBody } from '@/interfaces/request/chat';
import { hexStringToUint8Array } from '@/utils/common-util';
import { SpeechPlayer } from 'openai-speech-stream-player';
import { useCallback, useEffect, useRef, useState } from 'react';

// ✅ Detect supported audio format dynamically
const getSupportedMimeType = () => {
  if (MediaSource.isTypeSupported("audio/webm; codecs=opus")) return "audio/webm; codecs=opus";
  if (MediaSource.isTypeSupported("audio/ogg; codecs=vorbis")) return "audio/ogg; codecs=vorbis";
  if (MediaSource.isTypeSupported("audio/mp3")) return "audio/mp3";
  if (MediaSource.isTypeSupported("audio/mpeg")) return "audio/mpeg"; // Last resort
  return null; // No supported types
};

// ✅ Ensure Chrome allows autoplay by unlocking audio
const unlockAudio = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  audioContext.resume().then(() => console.log("🔊 AudioContext unlocked!"));
};

export const useSendFeedback = (messageId: string) => {
  const { visible, hideModal, showModal } = useSetModalState();
  const { feedback, loading } = useFeedback();

  const onFeedbackOk = useCallback(
    async (params: IFeedbackRequestBody) => {
      const ret = await feedback({ ...params, messageId });

      if (ret === 0) {
        hideModal();
      }
    },
    [feedback, hideModal, messageId],
  );

  return { loading, onFeedbackOk, visible, hideModal, showModal };
};

export const useRemoveMessage = (
  messageId: string,
  removeMessageById?: IRemoveMessageById['removeMessageById'],
) => {
  const { deleteMessage, loading } = useDeleteMessage();

  const onRemoveMessage = useCallback(async () => {
    if (messageId) {
      const code = await deleteMessage(messageId);
      if (code === 0) {
        removeMessageById?.(messageId);
      }
    }
  }, [deleteMessage, messageId, removeMessageById]);

  return { onRemoveMessage, loading };
};

export const useSpeech = (content: string, audioBinary?: string) => {
  const ref = useRef<HTMLAudioElement>(null);
  const { read } = useSpeechWithSse();
  const player = useRef<SpeechPlayer>();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // ✅ Initialize speech player with supported MIME type
  const initialize = useCallback(async () => {
    unlockAudio(); // Make sure Chrome allows audio

    const supportedMimeType = getSupportedMimeType();
    
    if (!supportedMimeType) {
      console.error("❌ No supported audio MIME type found!");
      return;
    }

    player.current = new SpeechPlayer({
      audio: ref.current!,
      onPlaying: () => setIsPlaying(true),
      onPause: () => setIsPlaying(false),
      onChunkEnd: () => {},
      mimeType: supportedMimeType, // ✅ Use detected supported type
    });

    try {
      await player.current.init();
      console.log(`✅ SpeechPlayer initialized with MIME type: ${supportedMimeType}`);
    } catch (error) {
      console.error("❌ SpeechPlayer initialization failed:", error);
    }
  }, []);

  const pause = useCallback(() => {
    player.current?.pause();
  }, []);

  const speech = useCallback(async () => {
    const response = await read({ text: content });
    if (response) {
      try {
        player.current?.feedWithResponse(response);
      } catch (error) {
        console.error("❌ Error feeding speech response:", error);
      }
    }
  }, [read, content]);

  const handleRead = useCallback(async () => {
    if (isPlaying) {
      setIsPlaying(false);
      pause();
    } else {
      setIsPlaying(true);
      speech();
    }
  }, [setIsPlaying, speech, isPlaying, pause]);

  useEffect(() => {
    if (audioBinary) {
      const units = hexStringToUint8Array(audioBinary);
      if (units) {
        try {
          player.current?.feed(units);
        } catch (error) {
          console.warn("⚠️ Audio feed error:", error);
        }
      }
    }
  }, [audioBinary]);

  useEffect(() => {
    if (ref.current) {
      initialize();
    }
  }, [initialize, ref]);

  return { ref, handleRead, isPlaying };
};
