import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useVoice } from '../contexts/VoiceContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Mic, Send, Square, Clock } from 'lucide-react';
import { calculateGDEffort } from '../utils/effort';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_TOPICS = [
  "Remote work is better than office work",
  "Artificial Intelligence will create more jobs than it destroys",
  "Social media does more harm than good",
  "College education is overrated in the modern world",
  "Climate change is the biggest threat facing humanity today",
];

async function callChat(payload: { system: string; messages?: Message[]; prompt?: string }) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.text as string;
}

export const GD: React.FC = () => {
  const { user } = useAuth();
  const { speak, startListening, stopListening, isListening } = useVoice();
  const navigate = useNavigate();

  const [topic, setTopic] = useState('');
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionEnded, setSessionEnded] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    speak("Welcome to the Group Discussion. Pick a topic or type your own to start.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live timer
  useEffect(() => {
    if (!started || sessionEnded) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [started, sessionEnded, startTime]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    const now = Date.now();
    setStarted(true);
    setStartTime(now);
    const opener = `Great! Let's talk about: "${topic}". What's your take on this? Do you agree or disagree?`;
    setMessages([{ role: 'assistant', content: opener }]);
    speak(opener);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || sessionEnded || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const updated: Message[] = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const reply = await callChat({
        system: `You are a fellow participant in a live group discussion on: "${topic}". Respond naturally like a real person — short, conversational sentences. Take a clear position: either agree or disagree with the user's last point. If you agree, build on their point with a new angle. If you disagree, give one specific, concrete reason why — and invite them to respond. Never mention that you are an AI.`,
        messages: updated,
      });
      const aiMsg: Message = { role: 'assistant', content: reply };
      setMessages(prev => [...prev, aiMsg]);
      speak(reply);
    } catch (err: any) {
      setError(`AI error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    setSessionEnded(true);
    const durationMinutes = (Date.now() - startTime) / 60000;
    const effort = calculateGDEffort(durationMinutes);

    await supabase.from('gd_sessions').insert({
      user_id: user?.id,
      topic,
      duration_minutes: durationMinutes,
      transcript: messages,
    });

    const logDate = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', user?.id)
      .eq('log_date', logDate)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('activity_logs')
        .update({ effort_percent: Math.min(100, (existing.effort_percent + effort) / 2) })
        .eq('id', existing.id);
    } else {
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        log_date: logDate,
        effort_percent: effort,
        module: 'GD',
      });
    }

    speak(`Group discussion ended. You practiced for ${Math.round(durationMinutes)} minutes. Great job!`);
  };

  const toggleMic = () => {
    if (isListening) stopListening();
    else startListening((text) => setInput(text), () => {});
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── SETUP SCREEN ──
  if (!started) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-lg">
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-2xl font-bold text-center text-dark">Group Discussion</h2>
            <p className="text-center text-gray-500 text-sm mt-1">Pick a topic and debate it with an AI participant</p>
          </div>
          <form onSubmit={handleStart}>
            <CardContent className="space-y-4 mt-2">
              <p className="text-sm font-medium text-gray-600">Suggested topics:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TOPICS.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTopic(t)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors text-left ${
                      topic === t
                        ? 'bg-primary text-white border-primary'
                        : 'bg-secondary text-primary border-secondary hover:bg-blue-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-sm font-medium text-gray-600 mt-2">Or type your own:</p>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                placeholder="Enter any discussion topic..."
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={!topic.trim()}>
                Join Discussion
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // ── CHAT SCREEN ──
  return (
    <div className="flex flex-col h-[84vh]">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark truncate max-w-[65vw]">GD: {topic}</h2>
          <span className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
            <Clock size={14} /> {formatTime(elapsed)}
          </span>
        </div>
        {!sessionEnded && (
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 flex-shrink-0"
            onClick={handleEndSession}
          >
            Leave GD
          </Button>
        )}
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-primary text-white' : 'bg-gray-100 text-dark'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 bg-gray-100 text-dark flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          {error && (
            <div className="text-center">
              <p className="text-red-600 text-sm bg-red-50 rounded-lg p-3">{error}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {sessionEnded ? (
          <div className="p-4 bg-gray-50 border-t border-gray-200 text-center flex-shrink-0">
            <h3 className="font-bold text-dark mb-1">Discussion Ended 🎤</h3>
            <p className="text-gray-600 text-sm mb-4">Duration: {formatTime(elapsed)}</p>
            <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </div>
        ) : (
          <div className="p-4 bg-white border-t border-secondary flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={toggleMic}
              disabled={loading}
              className={`p-3 rounded-full flex-shrink-0 transition-colors ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-secondary text-primary hover:bg-blue-200'
              }`}
              title={isListening ? 'Stop' : 'Speak'}
            >
              {isListening ? <Square size={20} /> : <Mic size={20} />}
            </button>
            <input
              type="text"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              placeholder="Share your opinion..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend(input)}
              disabled={loading}
            />
            <Button onClick={() => handleSend(input)} disabled={loading || !input.trim()}>
              <Send size={18} />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
