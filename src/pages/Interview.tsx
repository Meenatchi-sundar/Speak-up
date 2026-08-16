import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useVoice } from '../contexts/VoiceContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Mic, Send, Square } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = (domain: string) =>
  `You are conducting a mock interview for the role: ${domain}. Ask one relevant question at a time. After the candidate answers, give brief honest feedback (1-2 sentences: what was good, what to improve) BEFORE asking the next question. Keep questions realistic for actual interviews in this domain. Do NOT ask more than 8 questions total — after that, wrap up politely.`;

async function callChat(payload: { system: string; messages?: Message[]; prompt?: string }) {
  // Use the dedicated interview proxy to avoid route/method issues
  const res = await fetch('/api/interview', {
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

export const Interview: React.FC = () => {
  const { user } = useAuth();
  const { speak, startListening, stopListening, isListening } = useVoice();
  const navigate = useNavigate();

  const [domain, setDomain] = useState('');
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionEnded, setSessionEnded] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [questionCount, setQuestionCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Welcome instruction on mount
  useEffect(() => {
    speak('Welcome to the Mock Interview. Enter the role or domain you are preparing for, then click Start Interview.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Step 1: user submits domain → AI sends greeting + Q1 ──
  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setStarted(true);
    setLoading(true);
    setError('');

    try {
      const greeting = await callChat({
        system: SYSTEM_PROMPT(domain),
        prompt: 'The candidate is ready. Greet them briefly and ask your first interview question.',
      });

      const firstMsg: Message = { role: 'assistant', content: greeting };
      setMessages([firstMsg]);
      setQuestionCount(1);
      speak(greeting);
    } catch (err: any) {
      setError(`Could not reach AI: ${err.message}`);
      setStarted(false);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: user sends answer → AI responds ──
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
        system: SYSTEM_PROMPT(domain),
        messages: updated,
      });

      const aiMsg: Message = { role: 'assistant', content: reply };
      setMessages(prev => [...prev, aiMsg]);
      setQuestionCount(c => c + 1);
      speak(reply);

      // Auto-end after 8 questions
      if (questionCount >= 7) {
        setTimeout(() => handleEndSession([...updated, aiMsg]), 1000);
      }
    } catch (err: any) {
      setError(`AI error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: end session → get summary ──
  const handleEndSession = async (finalMessages?: Message[]) => {
    const convo = finalMessages ?? messages;
    setSessionEnded(true);
    setLoading(true);
    setError('');

    try {
      const summary = await callChat({
        system: 'Summarize this mock interview session. Give 2-3 bullet strengths and 2-3 areas to improve. Be specific and encouraging.',
        messages: convo,
      });

      setFeedback(summary);
      speak('Interview complete. ' + summary);

      await supabase.from('interview_sessions').insert({
        user_id: user?.id,
        domain,
        transcript: convo,
        feedback_summary: summary,
      });
    } catch (err: any) {
      setError(`Summary error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(
        (text) => setInput(text),
        () => {}
      );
    }
  };

  // ──────────────────────────────────────────
  // SETUP SCREEN (before start)
  // ──────────────────────────────────────────
  if (!started) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Mock Interview</CardTitle>
          </CardHeader>
          <form onSubmit={handleStart}>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                What role or domain are you preparing for?
              </p>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. React Developer, Data Analyst, Sales Manager..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                value={domain}
                onChange={e => setDomain(e.target.value)}
              />
              {error && <p className="text-red-600 text-sm">{error}</p>}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Starting interview…' : 'Start Interview'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // CHAT SCREEN
  // ──────────────────────────────────────────
  return (
    <div className="flex flex-col h-[84vh]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-dark">Interview: {domain}</h2>
          <p className="text-sm text-gray-500">Question {Math.min(questionCount, 8)} of 8</p>
        </div>
        {!sessionEnded && (
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => handleEndSession()}
            disabled={loading}
          >
            End Session
          </Button>
        )}
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-primary text-white' : 'bg-gray-100 text-dark'
              }`}>
                {m.content}
              </div>
            </div>
          ))}

          {/* Loading dots */}
          {loading && !sessionEnded && (
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

        {/* Summary footer */}
        {sessionEnded ? (
          <div className="p-4 bg-green-50 border-t border-green-200 flex-shrink-0">
            <h3 className="font-bold text-green-800 mb-2">📋 Session Summary</h3>
            <p className="text-green-800 text-sm whitespace-pre-wrap">{feedback}</p>
            <div className="mt-4 text-center">
              <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
            </div>
          </div>
        ) : (
          /* Input area */
          <div className="p-4 bg-white border-t border-secondary flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={toggleMic}
              disabled={loading}
              className={`p-3 rounded-full flex-shrink-0 transition-colors ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-secondary text-primary hover:bg-blue-200'
              }`}
              title={isListening ? 'Stop recording' : 'Speak your answer'}
            >
              {isListening ? <Square size={20} /> : <Mic size={20} />}
            </button>
            <input
              type="text"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              placeholder="Type your answer or use mic…"
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
