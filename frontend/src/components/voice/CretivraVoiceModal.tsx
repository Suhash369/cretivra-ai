import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  ChevronDown,
  MessageSquare,
  Square,
  Radio,
  Check,
  Sparkles,
  Zap,
  Cpu,
  Eye,
} from 'lucide-react';
import { sendVoiceChatApi } from '../../services/api';

interface CretivraVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string | null;
  onNewMessageSynced?: (userMsg: string, assistantReply: string) => void;
}

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'paused';

export interface VoiceAssistantEngine {
  id: string;
  name: string;
  badge: string;
  desc: string;
  provider: 'groq' | 'gemini' | 'openrouter' | 'hybrid';
  icon: React.ComponentType<{ className?: string }>;
}

export const VOICE_ASSISTANT_ENGINES: VoiceAssistantEngine[] = [
  {
    id: 'asura-neural',
    name: 'Asura Neural Voice',
    badge: 'Flagship',
    desc: 'Adaptive intelligence with live temporal awareness & smart routing',
    provider: 'hybrid',
    icon: Sparkles,
  },
  {
    id: 'asura-turbo',
    name: 'Asura Fast Voice',
    badge: 'Ultra-Fast',
    desc: 'Lightning-fast voice latency powered by high-speed neural hardware',
    provider: 'groq',
    icon: Zap,
  },
  {
    id: 'asura-vision',
    name: 'Asura Multimodal Voice',
    badge: 'Multimodal',
    desc: 'Deep multimodal voice perception and contextual reasoning',
    provider: 'gemini',
    icon: Eye,
  },
  {
    id: 'asura-frontier',
    name: 'Asura Reasoning Voice',
    badge: 'Reasoning',
    desc: 'Frontier-grade knowledge, complex analysis & philosophical dialogue',
    provider: 'openrouter',
    icon: Cpu,
  },
];

export const VOICE_PERSONAS = [
  { id: 'Breeze', name: 'Breeze', desc: 'Warm, natural, and conversational', rate: 1.02, pitch: 1.0 },
  { id: 'Ember', name: 'Ember', desc: 'Confident, articulate, and direct', rate: 1.08, pitch: 0.95 },
  { id: 'Cove', name: 'Cove', desc: 'Calm, thoughtful, and analytical', rate: 0.95, pitch: 0.88 },
  { id: 'Juniper', name: 'Juniper', desc: 'Bright, energetic, and expressive', rate: 1.12, pitch: 1.15 },
];

export const CretivraVoiceModal: React.FC<CretivraVoiceModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  onNewMessageSynced,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [currentVoice, setCurrentVoice] = useState('Breeze');
  const [activeEngine, setActiveEngine] = useState<VoiceAssistantEngine>(VOICE_ASSISTANT_ENGINES[0]);
  const [showVoiceSelect, setShowVoiceSelect] = useState(false);
  const [showEngineSelect, setShowEngineSelect] = useState(false);
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
  const synthAnimRef = useRef<number | null>(null);

  // Audio Playback
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentActiveRef = useRef(false);
  const isProcessingRef = useRef(false);
  const lastProcessedTextRef = useRef('');
  const lastProcessedTimeRef = useRef(0);

  // Stop currently playing audio or speech
  const stopAudio = useCallback(() => {
    if (synthAnimRef.current) {
      cancelAnimationFrame(synthAnimRef.current);
      synthAnimRef.current = null;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setAudioLevel(0);
  }, []);

  // Stop speech recognition and clear any scheduled silence timers
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  }, []);

  // Cleanup media & recognition
  const cleanupMedia = useCallback(() => {
    stopAudio();
    stopListening();
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (synthAnimRef.current) {
      cancelAnimationFrame(synthAnimRef.current);
      synthAnimRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, [stopAudio, stopListening]);

  // Animate audio level during synthetic speech
  const startSyntheticSpeechAnimation = useCallback(() => {
    if (synthAnimRef.current) cancelAnimationFrame(synthAnimRef.current);
    let step = 0;
    const animate = () => {
      step += 0.12;
      // Organic speech wave cadence
      const pulse = Math.abs(Math.sin(step) * 0.45 + Math.cos(step * 1.7) * 0.25);
      setAudioLevel(Math.min(1, Math.max(0.1, pulse)));
      synthAnimRef.current = requestAnimationFrame(animate);
    };
    synthAnimRef.current = requestAnimationFrame(animate);
  }, []);

  // Start speech recognition listening loop
  const startListening = useCallback(() => {
    if (!isComponentActiveRef.current || isMuted || isProcessingRef.current) return;

    stopAudio();
    setVoiceState('listening');

    // Use Web Speech API if supported
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.stop();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        if (!isComponentActiveRef.current || isProcessingRef.current) return;
        setVoiceState('listening');
      };

      recognition.onresult = (event: any) => {
        if (!isComponentActiveRef.current || isProcessingRef.current) return;

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentText = (final || interim).trim();
        setLiveUserTranscript(currentText);

        // Reset silence timer whenever user speaks
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        if (final) {
          silenceTimerRef.current = setTimeout(() => {
            submitVoiceMessage(final);
          }, 1100);
        } else if (interim && interim.length > 5) {
          silenceTimerRef.current = setTimeout(() => {
            submitVoiceMessage(interim);
          }, 2400);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Restart listening loop seamlessly
          if (isComponentActiveRef.current && !isProcessingRef.current && !isMuted) {
            try {
              recognition.start();
            } catch {}
          }
        }
      };

      recognition.onend = () => {
        if (isComponentActiveRef.current && !isProcessingRef.current && !isMuted) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (err) {
        console.warn('SpeechRecognition start failed:', err);
      }
    }
  }, [isMuted, stopAudio]);

  // Web Speech API fallback player with persona-tailored pitch and rate
  const playBrowserSpeech = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setVoiceState('speaking');
      startSyntheticSpeechAnimation();

      const clean = text.replace(/[*_#`~]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);

      // Find current persona settings
      const persona = VOICE_PERSONAS.find((p) => p.id === currentVoice) || VOICE_PERSONAS[0];
      utterance.rate = persona.rate;
      utterance.pitch = persona.pitch;

      // Pick preferred natural voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Ava') ||
          v.name.includes('Jenny')
      );
      if (preferred) utterance.voice = preferred;

      utterance.onend = () => {
        stopAudio();
        isProcessingRef.current = false;
        if (!isComponentActiveRef.current) return;
        setVoiceState('listening');
        startListening();
      };
      utterance.onerror = () => {
        stopAudio();
        isProcessingRef.current = false;
        if (!isComponentActiveRef.current) return;
        setVoiceState('listening');
        startListening();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      isProcessingRef.current = false;
      setVoiceState('listening');
      startListening();
    }
  }, [currentVoice, startSyntheticSpeechAnimation, stopAudio, startListening]);

  // Submit voice prompt to Multi-Provider Voice Service
  const submitVoiceMessage = useCallback(
    async (spokenText: string) => {
      const clean = spokenText.trim();
      if (!clean || !isComponentActiveRef.current || isProcessingRef.current) return;

      const now = Date.now();
      if (clean.toLowerCase() === lastProcessedTextRef.current.toLowerCase() && now - lastProcessedTimeRef.current < 2500) {
        return; // Prevent duplicate rapid submission
      }
      lastProcessedTextRef.current = clean;
      lastProcessedTimeRef.current = now;
      isProcessingRef.current = true;

      // Stop audio and immediately stop recognition so mic does not capture speaker or echo
      stopAudio();
      stopListening();

      setVoiceState('thinking');
      setLiveUserTranscript('');
      setLiveAssistantTranscript('');

      setTranscriptHistory((prev) => [...prev, { role: 'user', text: clean }]);

      try {
        const historyPayload = transcriptHistory.slice(-4).map((item) => ({
          role: item.role,
          content: item.text,
        }));

        const data = await sendVoiceChatApi({
          message: clean,
          conversation_id: conversationId || undefined,
          voice: currentVoice,
          voice_model: activeEngine.id,
          history: historyPayload,
        });

        if (!isComponentActiveRef.current) return;

        const reply = data.text || 'I am listening clearly.';
        setLiveAssistantTranscript(reply);
        setTranscriptHistory((prev) => [...prev, { role: 'assistant', text: reply }]);

        if (onNewMessageSynced) {
          onNewMessageSynced(clean, reply);
        }

        // Play native high-fidelity audio if returned
        if (data.audio_url) {
          setVoiceState('speaking');
          startSyntheticSpeechAnimation();
          const audio = new Audio(data.audio_url);
          currentAudioRef.current = audio;

          audio.onended = () => {
            stopAudio();
            isProcessingRef.current = false;
            if (!isComponentActiveRef.current) return;
            setVoiceState('listening');
            startListening();
          };

          audio.onerror = () => {
            stopAudio();
            playBrowserSpeech(reply);
          };

          await audio.play();
        } else {
          // Play via Web Speech API with tailored persona voices
          playBrowserSpeech(reply);
        }
      } catch (err: any) {
        console.error('Voice chat error:', err);
        isProcessingRef.current = false;
        if (!isComponentActiveRef.current) return;
        setVoiceState('idle');
        startListening();
      }
    },
    [conversationId, currentVoice, activeEngine, transcriptHistory, onNewMessageSynced, stopAudio, stopListening, playBrowserSpeech, startListening, startSyntheticSpeechAnimation]
  );

  // Setup AudioContext for microphone level visualizer
  const setupAudioContext = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      // Connect mic source ONLY to the analyser for visual level metering
      // CRITICAL: NEVER connect analyser to ctx.destination, as that replays the user's microphone audio to the speakers!
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!isComponentActiveRef.current) return;

        if (voiceState === 'listening') {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(1, avg / 85));
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('Microphone permission or AudioContext unavailable:', err);
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

  // Handle User Orb Click (Interrupt or Force Submit)
  const handleOrbClick = () => {
    if (voiceState === 'speaking') {
      stopAudio();
      setVoiceState('listening');
      startListening();
    } else if (voiceState === 'listening') {
      if (liveUserTranscript.trim()) {
        submitVoiceMessage(liveUserTranscript);
      }
    }
  };

  if (!isOpen) return null;

  const ActiveIcon = activeEngine.icon;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#040711]/95 backdrop-blur-3xl text-white select-none transition-all duration-300 overflow-hidden">
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] transition-all duration-700 ${
            voiceState === 'speaking'
              ? 'w-[520px] h-[520px] bg-gradient-to-tr from-cyan-500/30 to-blue-600/35 opacity-100 scale-110'
              : voiceState === 'thinking'
              ? 'w-[480px] h-[480px] bg-gradient-to-tr from-purple-600/35 to-amber-500/25 opacity-90 animate-spin-slow'
              : voiceState === 'listening'
              ? 'w-[460px] h-[460px] bg-gradient-to-tr from-cyan-500/25 to-teal-400/25 opacity-80'
              : 'w-[400px] h-[400px] bg-cyan-500/10 opacity-50'
          }`}
        />
      </div>

      {/* Backdrop for Popovers to close when clicking outside */}
      {(showEngineSelect || showVoiceSelect) && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => {
            setShowEngineSelect(false);
            setShowVoiceSelect(false);
          }}
        />
      )}

      {/* Top Header Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between px-6 pt-6 z-50">
        <div className="flex items-center gap-3 relative">
          {/* Shift Voice Assistant Selector Pill */}
          <div className="relative">
            <button
              onClick={() => {
                setShowEngineSelect(!showEngineSelect);
                setShowVoiceSelect(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition-all shadow-md ${
                showEngineSelect
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                  : 'bg-gray-900/90 border-gray-800 hover:border-cyan-500/50 text-gray-200 hover:text-white'
              }`}
              title="Shift Voice Assistant Engine"
            >
              <ActiveIcon className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>{activeEngine.name}</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {activeEngine.badge}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showEngineSelect ? 'rotate-180 text-cyan-400' : ''}`} />
            </button>

            {/* Assistant Engine Dropdown Popover */}
            {showEngineSelect && (
              <div className="absolute top-full left-0 mt-2.5 w-80 rounded-2xl bg-[#0c1222]/95 border border-cyan-500/30 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] backdrop-blur-2xl p-2 z-50 animate-scale">
                <div className="text-[11px] font-semibold text-gray-400 px-3 py-1.5 uppercase tracking-wider flex items-center justify-between border-b border-gray-800/80 mb-1">
                  <span>Shift Voice Assistant</span>
                  <span className="text-[10px] text-cyan-400">Live 2026 Engine</span>
                </div>
                <div className="space-y-1">
                  {VOICE_ASSISTANT_ENGINES.map((engine) => {
                    const Icon = engine.icon;
                    const isSelected = activeEngine.id === engine.id;
                    return (
                      <button
                        key={engine.id}
                        onClick={() => {
                          setActiveEngine(engine);
                          setShowEngineSelect(false);
                        }}
                        className={`w-full flex items-start justify-between p-2.5 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-500/40 text-cyan-200'
                            : 'text-gray-300 hover:bg-gray-800/70 hover:text-white'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`p-1.5 rounded-lg mt-0.5 ${isSelected ? 'bg-cyan-500/30 text-cyan-300' : 'bg-gray-800 text-gray-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold flex items-center gap-1.5">
                              {engine.name}
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-cyan-400 text-gray-950' : 'bg-gray-800 text-gray-400'}`}>
                                {engine.badge}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{engine.desc}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Voice Persona Selector Pill */}
          <div className="relative">
            <button
              onClick={() => {
                setShowVoiceSelect(!showVoiceSelect);
                setShowEngineSelect(false);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all shadow-md ${
                showVoiceSelect
                  ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                  : 'bg-gray-900/90 border-gray-800 hover:border-purple-500/50 text-gray-300 hover:text-white'
              }`}
              title="Change Voice Persona"
            >
              <Volume2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Voice: {currentVoice}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showVoiceSelect ? 'rotate-180 text-purple-400' : ''}`} />
            </button>

            {/* Persona Dropdown Popover */}
            {showVoiceSelect && (
              <div className="absolute top-full left-0 mt-2.5 w-64 rounded-2xl bg-[#0c1222]/95 border border-purple-500/30 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] backdrop-blur-2xl p-2 z-50 animate-scale">
                <div className="text-[11px] font-semibold text-gray-400 px-3 py-1.5 uppercase tracking-wider border-b border-gray-800/80 mb-1">
                  Select Persona
                </div>
                <div className="space-y-1">
                  {VOICE_PERSONAS.map((p) => {
                    const isSelected = currentVoice === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setCurrentVoice(p.id);
                          setShowVoiceSelect(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-purple-500/20 text-purple-200 font-semibold border border-purple-500/30'
                            : 'text-gray-300 hover:bg-gray-800/70 hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-gray-200">{p.name}</div>
                          <div className="text-[10px] text-gray-400 font-normal">{p.desc}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-purple-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-gray-900/90 border border-gray-800 hover:bg-gray-800 text-gray-400 hover:text-white transition-all shadow-md hover:scale-105 active:scale-95"
          title="Exit Voice Mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Centerpiece: Cretivra 3D Voice Orb with Generous Clearance */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-lg px-4 my-auto pt-8 pb-4">
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

          {/* The Glowing Cretivra Voice Orb */}
          <button
            onClick={handleOrbClick}
            className={`relative w-40 h-40 md:w-52 md:h-52 rounded-full cursor-pointer focus:outline-none transition-all duration-300 flex items-center justify-center group ${
              voiceState === 'speaking'
                ? 'shadow-[0_0_90px_rgba(6,182,212,0.65)] ring-4 ring-cyan-400/40'
                : voiceState === 'thinking'
                ? 'shadow-[0_0_90px_rgba(168,85,247,0.55)] ring-4 ring-purple-400/40'
                : voiceState === 'listening'
                ? 'shadow-[0_0_80px_rgba(45,212,191,0.55)] ring-4 ring-teal-400/40'
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
              <div className="absolute inset-0 bg-radial from-white/40 via-transparent to-black/35 opacity-90" />
              <div className="absolute top-3 left-5 w-14 h-7 bg-white/35 rounded-full blur-[5px] -rotate-12" />
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
                ? 'Asura is thinking...'
                : voiceState === 'speaking'
                ? 'Speaking (Tap orb to interrupt)'
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
              <p className="text-sm text-gray-200 font-medium leading-relaxed animate-fade line-clamp-3">
                {liveAssistantTranscript}
              </p>
            )}
            {voiceState === 'listening' && !liveUserTranscript && (
              <p className="text-xs text-gray-400">Speak naturally. Asura AI will answer automatically.</p>
            )}
          </div>
        </div>
      </div>

      {/* Transcript Drawer Overlay */}
      {showTranscript && (
        <div className="w-full max-w-xl max-h-48 overflow-y-auto px-6 py-3 my-2 rounded-2xl bg-gray-900/95 border border-gray-800 text-xs text-gray-300 space-y-2 z-30 shadow-2xl backdrop-blur-md animate-fade">
          <div className="flex items-center justify-between pb-1 border-b border-gray-800 text-[11px] font-semibold text-gray-400">
            <span>Voice Dialogue Transcript</span>
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
                  {item.role === 'user' ? 'You:' : 'Asura AI:'}
                </span>
                {item.text}
              </div>
            ))
          )}
        </div>
      )}

      {/* Bottom Control Bar */}
      <div className="w-full max-w-md flex items-center justify-around px-8 pb-8 z-30">
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
