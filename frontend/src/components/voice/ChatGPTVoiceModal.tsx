import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  MessageSquare,
  RotateCcw,
  Square,
  Radio,
  Sliders,
  Check,
} from 'lucide-react';
import { sendVoiceChatApi, transcribeAudioApi } from '../../services/api';

interface ChatGPTVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string | null;
  onNewMessageSynced?: (userMsg: string, assistantReply: string) => void;
  activeModelName?: string;
}

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'paused';

const VOICE_PERSONAS = [
  { id: 'Breeze', name: 'Breeze', desc: 'Warm, natural, and conversational' },
  { id: 'Ember', name: 'Ember', desc: 'Confident, articulate, and direct' },
  { id: 'Cove', name: 'Cove', desc: 'Calm, thoughtful, and analytical' },
  { id: 'Juniper', name: 'Juniper', desc: 'Bright, energetic, and expressive' },
];

export const ChatGPTVoiceModal: React.FC<ChatGPTVoiceModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  onNewMessageSynced,
  activeModelName = 'Cretivra Voice (Gemini 3.1)',
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [currentVoice, setCurrentVoice] = useState('Breeze');
  const [showVoiceSelect, setShowVoiceSelect] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptHistory, setTranscriptHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [liveUserTranscript, setLiveUserTranscript] = useState('');
  const [liveAssistantTranscript, setLiveAssistantTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  // Audio Context & Analysis Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Audio Playback
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentActiveRef = useRef(false);

  // MediaRecorder Fallback
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Stop currently playing audio
  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Cleanup media & recognition
  const cleanupMedia = useCallback(() => {
    stopAudio();
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, [stopAudio]);

  // Submit voice prompt to Gemini
  const submitVoiceMessage = useCallback(
    async (spokenText: string) => {
      if (!spokenText.trim() || !isComponentActiveRef.current) return;

      stopAudio();
      setVoiceState('thinking');
      setLiveUserTranscript('');
      setLiveAssistantTranscript('');

      setTranscriptHistory((prev) => [...prev, { role: 'user', text: spokenText }]);

      try {
        const historyPayload = transcriptHistory.slice(-4).map((item) => ({
          role: item.role,
          content: item.text,
        }));

        const data = await sendVoiceChatApi({
          message: spokenText,
          conversation_id: conversationId || undefined,
          voice: currentVoice,
          history: historyPayload,
        });

        if (!isComponentActiveRef.current) return;

        const reply = data.text || 'I am listening.';
        setLiveAssistantTranscript(reply);
        setTranscriptHistory((prev) => [...prev, { role: 'assistant', text: reply }]);

        if (onNewMessageSynced) {
          onNewMessageSynced(spokenText, reply);
        }

        // Play native Gemini Audio
        if (data.audio_url) {
          setVoiceState('speaking');
          const audio = new Audio(data.audio_url);
          currentAudioRef.current = audio;

          // Connect audio to visualizer if AudioContext is available
          try {
            if (audioContextRef.current && analyserRef.current) {
              const source = audioContextRef.current.createMediaElementSource(audio);
              source.connect(analyserRef.current);
              analyserRef.current.connect(audioContextRef.current.destination);
            }
          } catch {}

          audio.onended = () => {
            if (!isComponentActiveRef.current) return;
            setVoiceState('listening');
            startListening();
          };

          audio.onerror = () => {
            // Fallback to browser Web Speech API
            playBrowserSpeech(reply);
          };

          await audio.play();
        } else {
          // Fallback to Web Speech API
          playBrowserSpeech(reply);
        }
      } catch (err: any) {
        console.error('Voice chat error:', err);
        if (!isComponentActiveRef.current) return;
        setVoiceState('idle');
      }
    },
    [conversationId, currentVoice, transcriptHistory, onNewMessageSynced, stopAudio]
  );

  // Web Speech API fallback player
  const playBrowserSpeech = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setVoiceState('speaking');
      const clean = text.replace(/[*_#`~]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Pick preferred natural voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Ava')
      );
      if (preferred) utterance.voice = preferred;

      utterance.onend = () => {
        if (!isComponentActiveRef.current) return;
        setVoiceState('listening');
        startListening();
      };
      utterance.onerror = () => {
        if (!isComponentActiveRef.current) return;
        setVoiceState('listening');
        startListening();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setVoiceState('listening');
      startListening();
    }
  };

  // Start speech recognition listening loop
  const startListening = useCallback(() => {
    if (!isComponentActiveRef.current || isMuted) return;

    stopAudio();
    setVoiceState('listening');

    // Use Web Speech API if supported
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += trans;
          } else {
            interim += trans;
          }
        }

        const currentText = (final || interim).trim();
        if (currentText) {
          setLiveUserTranscript(currentText);

          // Reset silence timer
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (currentText) {
              try {
                recognition.stop();
              } catch {}
              submitVoiceMessage(currentText);
            }
          }, 1400); // 1.4s silence triggers submission
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition status:', e?.error);
        if (e?.error !== 'no-speech' && isComponentActiveRef.current) {
          // Restart after short delay
          setTimeout(() => {
            if (isComponentActiveRef.current && voiceState === 'listening') {
              startListening();
            }
          }, 500);
        }
      };

      recognition.onend = () => {
        // If still in listening state and no pending submit
        if (isComponentActiveRef.current && voiceState === 'listening' && !silenceTimerRef.current) {
          // Loop restart
          setTimeout(() => {
            if (isComponentActiveRef.current && voiceState === 'listening') {
              try {
                recognition.start();
              } catch {}
            }
          }, 200);
        }
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Could not start SpeechRecognition:', err);
      }
    }
  }, [isMuted, stopAudio, submitVoiceMessage, voiceState]);

  // Setup Audio Analysis for Reactive Wave Visualizer
  const setupAudioContext = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const micSource = ctx.createMediaStreamSource(stream);
      micSource.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!isComponentActiveRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(avg / 128, 1);
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('Microphone permission / AudioContext not available:', err);
    }
  };

  // Open / Close Lifecycle
  useEffect(() => {
    if (isOpen) {
      isComponentActiveRef.current = true;
      setVoiceState('listening');
      setLiveUserTranscript('');
      setLiveAssistantTranscript('');

      setupAudioContext().then(() => {
        startListening();
      });
    } else {
      isComponentActiveRef.current = false;
      cleanupMedia();
      setVoiceState('idle');
    }

    return () => {
      isComponentActiveRef.current = false;
      cleanupMedia();
    };
  }, [isOpen]);

  // Handle User Interrupt
  const handleOrbClick = () => {
    if (voiceState === 'speaking') {
      // Interrupt model speech immediately
      stopAudio();
      setVoiceState('listening');
      startListening();
    } else if (voiceState === 'listening') {
      // Force submit current transcript if available
      if (liveUserTranscript.trim()) {
        submitVoiceMessage(liveUserTranscript);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#060911]/95 backdrop-blur-2xl text-white select-none transition-all duration-300">
      {/* Dynamic Background Mesh Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] transition-all duration-700 ${
            voiceState === 'speaking'
              ? 'w-[520px] h-[520px] bg-gradient-to-tr from-cyan-500/25 to-blue-600/30 opacity-100 scale-110'
              : voiceState === 'thinking'
              ? 'w-[480px] h-[480px] bg-gradient-to-tr from-purple-600/30 to-amber-500/20 opacity-90 animate-spin-slow'
              : voiceState === 'listening'
              ? 'w-[460px] h-[460px] bg-gradient-to-tr from-cyan-500/20 to-teal-400/20 opacity-80'
              : 'w-[400px] h-[400px] bg-cyan-500/10 opacity-50'
          }`}
        />
      </div>

      {/* Top Header Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between px-6 pt-6 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900/80 border border-gray-800 shadow-inner">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold text-gray-200 tracking-wide">
              {activeModelName}
            </span>
          </div>

          {/* Voice Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setShowVoiceSelect(!showVoiceSelect)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900/80 border border-gray-800 hover:border-cyan-500/50 text-xs font-medium text-gray-300 hover:text-white transition-all shadow-sm"
            >
              <Volume2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Voice: {currentVoice}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {showVoiceSelect && (
              <div className="absolute top-full left-0 mt-2 w-56 rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl p-2 z-20 animate-scale">
                <div className="text-[11px] font-semibold text-gray-400 px-3 py-1">Select Persona</div>
                {VOICE_PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCurrentVoice(p.id);
                      setShowVoiceSelect(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                      currentVoice === p.id
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <div>
                      <div>{p.name}</div>
                      <div className="text-[10px] text-gray-500 font-normal">{p.desc}</div>
                    </div>
                    {currentVoice === p.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-gray-900/80 border border-gray-800 hover:bg-gray-800 text-gray-400 hover:text-white transition-all shadow-md"
          title="Exit Voice Mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Centerpiece: The Iconic ChatGPT Voice Orb */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-lg px-4">
        {/* Pulsing Concentric Ripple Rings */}
        <div className="relative flex items-center justify-center">
          {/* Ring 3 (Outer) */}
          <div
            className={`absolute rounded-full border border-cyan-500/20 transition-all duration-300 ${
              voiceState === 'listening'
                ? 'w-72 h-72 opacity-40 scale-100'
                : voiceState === 'speaking'
                ? 'w-80 h-80 opacity-60 scale-105'
                : 'w-64 h-64 opacity-20'
            }`}
            style={{
              transform: `scale(${1 + audioLevel * 0.4})`,
            }}
          />

          {/* Ring 2 (Middle) */}
          <div
            className={`absolute rounded-full border border-purple-500/30 transition-all duration-200 ${
              voiceState === 'thinking'
                ? 'w-64 h-64 opacity-70 animate-pulse'
                : voiceState === 'speaking'
                ? 'w-68 h-68 opacity-50'
                : 'w-56 h-56 opacity-30'
            }`}
            style={{
              transform: `scale(${1 + audioLevel * 0.25})`,
            }}
          />

          {/* The Glowing ChatGPT Voice Orb */}
          <button
            onClick={handleOrbClick}
            className={`relative w-40 h-40 md:w-48 md:h-48 rounded-full cursor-pointer focus:outline-none transition-all duration-300 flex items-center justify-center group ${
              voiceState === 'speaking'
                ? 'shadow-[0_0_80px_rgba(6,182,212,0.6)]'
                : voiceState === 'thinking'
                ? 'shadow-[0_0_80px_rgba(168,85,247,0.5)]'
                : voiceState === 'listening'
                ? 'shadow-[0_0_70px_rgba(45,212,191,0.5)]'
                : 'shadow-[0_0_40px_rgba(255,255,255,0.2)]'
            }`}
            style={{
              transform: `scale(${1 + audioLevel * 0.35})`,
            }}
            title={
              voiceState === 'speaking'
                ? 'Tap to interrupt'
                : voiceState === 'listening'
                ? 'Listening to you... Tap to finish'
                : 'Thinking...'
            }
          >
            {/* Core Gradient Orb Interior */}
            <div
              className={`w-full h-full rounded-full transition-all duration-500 overflow-hidden relative ${
                voiceState === 'speaking'
                  ? 'bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-500 animate-pulse'
                  : voiceState === 'thinking'
                  ? 'bg-gradient-to-tr from-violet-600 via-purple-500 to-amber-400 animate-spin-slow'
                  : voiceState === 'listening'
                  ? 'bg-gradient-to-tr from-cyan-500 via-teal-400 to-sky-600'
                  : 'bg-gradient-to-tr from-gray-700 via-gray-600 to-gray-800'
              }`}
            >
              {/* Inner Light Reflection Sphere */}
              <div className="absolute inset-0 bg-radial from-white/40 via-transparent to-black/30 opacity-80" />
              <div className="absolute top-2 left-4 w-12 h-6 bg-white/30 rounded-full blur-[4px] -rotate-12" />
            </div>

            {/* Tap to Interrupt Indicator on Hover */}
            {voiceState === 'speaking' && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                <Square className="w-8 h-8 text-white fill-current" />
              </div>
            )}
          </button>
        </div>

        {/* State Label & Subtext */}
        <div className="mt-8 text-center flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                voiceState === 'listening'
                  ? 'bg-emerald-400 animate-ping'
                  : voiceState === 'thinking'
                  ? 'bg-purple-400 animate-pulse'
                  : voiceState === 'speaking'
                  ? 'bg-cyan-400 animate-bounce'
                  : 'bg-gray-500'
              }`}
            />
            <span className="text-sm font-semibold tracking-wide text-gray-200 uppercase">
              {voiceState === 'listening'
                ? 'Listening...'
                : voiceState === 'thinking'
                ? 'Thinking...'
                : voiceState === 'speaking'
                ? 'Speaking (Tap to interrupt)'
                : 'Ready'}
            </span>
          </div>

          {/* Live Dynamic Speech Text Preview */}
          <div className="mt-3 min-h-[44px] max-w-md px-4">
            {voiceState === 'listening' && liveUserTranscript && (
              <p className="text-sm text-cyan-200/90 italic animate-fade leading-relaxed">
                "{liveUserTranscript}"
              </p>
            )}
            {voiceState === 'speaking' && liveAssistantTranscript && (
              <p className="text-sm text-gray-300 font-medium leading-relaxed animate-fade line-clamp-3">
                {liveAssistantTranscript}
              </p>
            )}
            {voiceState === 'listening' && !liveUserTranscript && (
              <p className="text-xs text-gray-400">Speak naturally. Asura will answer automatically.</p>
            )}
          </div>
        </div>
      </div>

      {/* Transcript Drawer Overlay */}
      {showTranscript && (
        <div className="w-full max-w-xl max-h-48 overflow-y-auto px-6 py-3 my-2 rounded-2xl bg-gray-900/90 border border-gray-800 text-xs text-gray-300 space-y-2 z-20 shadow-xl backdrop-blur-md animate-fade">
          <div className="flex items-center justify-between pb-1 border-b border-gray-800 text-[11px] font-semibold text-gray-400">
            <span>Voice Transcript</span>
            <button
              onClick={() => setShowTranscript(false)}
              className="hover:text-white"
            >
              Hide
            </button>
          </div>
          {transcriptHistory.length === 0 ? (
            <div className="text-gray-500 text-center py-2">No voice interactions yet.</div>
          ) : (
            transcriptHistory.map((item, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg ${
                  item.role === 'user' ? 'bg-cyan-950/40 text-cyan-200' : 'bg-gray-800/60 text-gray-200'
                }`}
              >
                <span className="font-semibold mr-1">
                  {item.role === 'user' ? 'You:' : 'Asura:'}
                </span>
                {item.text}
              </div>
            ))
          )}
        </div>
      )}

      {/* Bottom Control Bar */}
      <div className="w-full max-w-md flex items-center justify-around px-8 pb-8 z-10">
        {/* Transcript Toggle */}
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className={`p-3.5 rounded-full border transition-all ${
            showTranscript
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md'
              : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          title="Toggle conversation transcript"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Microphone Mute / Unmute */}
        <button
          onClick={() => {
            if (isMuted) {
              setIsMuted(false);
              startListening();
            } else {
              setIsMuted(true);
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.stop();
                } catch {}
              }
              setVoiceState('paused');
            }
          }}
          className={`p-5 rounded-full border shadow-xl transition-all ${
            isMuted
              ? 'bg-rose-600 border-rose-500 text-white'
              : 'bg-cyan-500 hover:bg-cyan-400 border-cyan-400 text-gray-950 shadow-cyan-500/25'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Stop / Interrupt Action */}
        <button
          onClick={() => {
            stopAudio();
            if (voiceState === 'speaking') {
              setVoiceState('listening');
              startListening();
            } else {
              onClose();
            }
          }}
          className="p-3.5 rounded-full bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-400 hover:text-white transition-all"
          title={voiceState === 'speaking' ? 'Interrupt response' : 'End voice session'}
        >
          <Square className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
