import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

interface VoiceContextType {
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  speed: number;
  setSpeed: (speed: number) => void;
  isSpeaking: boolean;
  startListening: (onResult: (text: string) => void, onEnd: () => void) => void;
  stopListening: () => void;
  isListening: boolean;
}

const VoiceContext = createContext<VoiceContextType>({
  speak: () => {},
  stopSpeaking: () => {},
  isMuted: false,
  toggleMute: () => {},
  speed: 1,
  setSpeed: () => {},
  isSpeaking: false,
  startListening: () => {},
  stopListening: () => {},
  isListening: false,
});

// ---------------------------------------------------------------------------
// Utility: pick the best available voice for a gender preference.
// Strategy (in priority order):
//  1. Voice whose name contains explicit gender keyword (female / male)
//  2. Well-known female voices: Zira, Samantha, Google UK English Female,
//     Microsoft Aria, Moira, Tessa, Karen, Veena, Fiona
//  3. Well-known male voices: David, Daniel, Google UK English Male,
//     Microsoft Mark, Alex, Fred, Bruce, Junior, Ralph
//  4. Any English voice (fallback)
// ---------------------------------------------------------------------------
const FEMALE_VOICE_NAMES = [
  'zira', 'samantha', 'google uk english female', 'aria', 'jenny',
  'moira', 'tessa', 'karen', 'veena', 'fiona', 'eva', 'victoria',
  'google us english', 'heera',
];

const MALE_VOICE_NAMES = [
  'david', 'daniel', 'google uk english male', 'mark', 'alex',
  'fred', 'bruce', 'junior', 'ralph', 'rishi', 'jorge', 'diego',
];

function pickVoice(gender: 'male' | 'female', voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const enVoices = voices.filter(v => v.lang.startsWith('en'));
  if (enVoices.length === 0) return voices[0] ?? null;

  const nameLower = (v: SpeechSynthesisVoice) => v.name.toLowerCase();

  // 1. Explicit keyword in name
  const explicitKeyword = gender === 'female' ? 'female' : 'male';
  const explicit = enVoices.find(v => nameLower(v).includes(explicitKeyword));
  if (explicit) return explicit;

  // 2. Named list lookup
  const nameList = gender === 'female' ? FEMALE_VOICE_NAMES : MALE_VOICE_NAMES;
  for (const keyword of nameList) {
    const found = enVoices.find(v => nameLower(v).includes(keyword));
    if (found) return found;
  }

  // 3. Fallback: any English voice
  return enVoices[0] ?? null;
}

export const VoiceProvider: React.FC<{
  children: React.ReactNode;
  preferredGender?: 'male' | 'female';
}> = ({ children, preferredGender = 'female' }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Load voices — browser fires onvoiceschanged once they are ready
  useEffect(() => {
    const load = () => setVoicesLoaded(true);
    if (window.speechSynthesis.getVoices().length > 0) {
      setVoicesLoaded(true);
    }
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  // Init SpeechRecognition once
  useEffect(() => {
    // @ts-ignore
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      recognitionRef.current = rec;
    }
  }, []);

  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    return pickVoice(preferredGender, voices);
  }, [preferredGender, voicesLoaded]); // eslint-disable-line

  const speak = useCallback((text: string) => {
    if (isMuted || !text) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = speed;
    utterance.lang = 'en-US';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isMuted, speed, getVoice]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return !prev;
    });
  }, []);

  const startListening = useCallback((
    onResult: (text: string) => void,
    onEnd: () => void
  ) => {
    const rec = recognitionRef.current;
    if (!rec) {
      alert('Speech recognition is not supported in your browser. Please type your response.');
      onEnd();
      return;
    }

    rec.onstart = () => setIsListening(true);
    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
    rec.onerror = (event: any) => {
      console.error('SpeechRecognition error:', event.error);
      setIsListening(false);
      onEnd();
    };
    rec.onend = () => {
      setIsListening(false);
      onEnd();
    };

    try {
      rec.start();
    } catch (e) {
      console.error('SpeechRecognition start error:', e);
      setIsListening(false);
      onEnd();
    }
  }, []);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec && isListening) {
      try { rec.stop(); } catch (_) {}
      setIsListening(false);
    }
  }, [isListening]);

  return (
    <VoiceContext.Provider value={{
      speak, stopSpeaking, isMuted, toggleMute,
      speed, setSpeed, isSpeaking,
      startListening, stopListening, isListening,
    }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => useContext(VoiceContext);
