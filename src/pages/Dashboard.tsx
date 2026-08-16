import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useVoice } from '../contexts/VoiceContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Mic, Users, BookOpen, TrendingUp, Sparkles } from 'lucide-react';
import { startOfDay } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const { speak } = useVoice();
  const [effort, setEffort] = useState(0);
  const [streak, setStreak] = useState(0);
  const [motivation, setMotivation] = useState('');
  const [loadingMotiv, setLoadingMotiv] = useState(false);
  const [query, setQuery] = useState('');
  const [askResult, setAskResult] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Fetch today's effort
    const today = startOfDay(new Date()).toISOString().split('T')[0];
    const { data: logs } = await supabase
      .from('activity_logs')
      .select('effort_percent, log_date')
      .order('log_date', { ascending: false });
    
    if (logs) {
      const todayLog = logs.find(l => l.log_date === today);
      if (todayLog) setEffort(todayLog.effort_percent);

      // Calculate streak
      let currentStreak = 0;
      let d = new Date();
      for (let i = 0; i < 365; i++) {
        const dateStr = startOfDay(d).toISOString().split('T')[0];
        const dayLog = logs.find(l => l.log_date === dateStr);
        if (dayLog && dayLog.effort_percent > 0) {
          currentStreak++;
          d.setDate(d.getDate() - 1);
        } else {
          // If checking today and no effort yet, allow checking yesterday before breaking
          if (i === 0) {
             d.setDate(d.getDate() - 1);
          } else {
             break;
          }
        }
      }
      setStreak(currentStreak);
    }
  };

  const handleMotivateMe = async () => {
    setLoadingMotiv(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: "You are a motivational coach. Give this user specific, encouraging motivation based on their actual recent practice pattern—not generic quotes. Be brief, punchy, and highly encouraging.",
          prompt: `User goal: ${profile?.goal}. Streak: ${streak} days. Today's effort: ${effort}%. Motivate me!`
        })
      });
      const data = await res.json();
      if (data.text) {
        setMotivation(data.text);
        speak(data.text);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingMotiv(false);
  };

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query || query.trim().length === 0) return;
    setAskLoading(true);
    setAskError('');
    setAskResult('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: "You are an expert English language tutor. Answer the user's question clearly with a simple explanation, the grammar rule or structure if relevant, 2–3 example sentences, and common mistakes to avoid. Keep the answer well-organized and easy to understand for a non-native English learner.",
          prompt: query
        })
      });
      const data = await res.json();
      if (data?.text) {
        setAskResult(data.text);
        speak(data.text);
      } else if (data?.error) {
        setAskError(data.error || 'No response');
      }
    } catch (err: any) {
      console.error(err);
      setAskError(err?.message || 'Request failed');
    }
    setAskLoading(false);
  };

  // Circular progress SVG
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (effort / 100) * circumference;

  return (
    <div className="space-y-8">
      <form onSubmit={handleAsk} className="bg-white p-4 rounded-2xl shadow-sm border border-secondary flex items-center gap-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ask Anything You Want — grammar, vocab, speaking, interview, writing..."
          className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button type="submit" disabled={askLoading}>{askLoading ? 'Thinking...' : 'Ask'}</Button>
      </form>
      {askError && <p className="text-sm text-red-500">{askError}</p>}
      {askResult && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-bold mb-2">Answer</h4>
            <div className="text-gray-800 whitespace-pre-wrap">{askResult}</div>
          </CardContent>
        </Card>
      )}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-secondary">
        <div>
          <h1 className="text-3xl font-bold text-dark">Welcome back, {profile?.name?.split(' ')[0] || 'User'}!</h1>
          <p className="text-gray-600 mt-2">Goal: {profile?.goal}</p>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">Current Streak</p>
            <p className="text-3xl font-bold text-orange-500 flex items-center justify-center gap-1">
              {streak} <span className="text-xl">🔥</span>
            </p>
          </div>
          
          <div className="relative w-24 h-24 flex flex-col items-center justify-center">
            <svg className="transform -rotate-90 w-24 h-24 absolute">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                className="text-primary transition-all duration-1000 ease-in-out" />
            </svg>
            <div className="flex flex-col items-center justify-center absolute">
              <span className="text-xl font-bold text-dark">{Math.round(effort)}%</span>
            </div>
            <p className="text-xs font-medium text-gray-500 absolute -bottom-6">Today's Effort</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/interview">
          <Card className="h-full hover:border-primary transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                <Mic size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Mock Interview</h3>
                <p className="text-gray-600">Practice domain-specific questions with AI and get instant feedback on your answers.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/gd">
          <Card className="h-full hover:border-primary transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Group Discussion</h3>
                <p className="text-gray-600">Join a virtual GD. Practice taking a stance, agreeing, or disagreeing constructively.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/practice">
          <Card className="h-full hover:border-primary transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Grammar & Vocab</h3>
                <p className="text-gray-600">Sharpen your basics with quick 10-question quizzes and instant explanations.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/progress">
          <Card className="h-full hover:border-primary transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Progress History</h3>
                <p className="text-gray-600">View your 30-day activity logs, effort charts, and past session transcripts.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-secondary flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-dark flex items-center gap-2">
            <Sparkles className="text-primary" /> Need a boost?
          </h3>
          <p className="text-gray-600">Get an AI-generated motivational message based on your recent activity.</p>
          {motivation && <p className="mt-3 text-dark italic border-l-4 border-primary pl-3">"{motivation}"</p>}
        </div>
        <Button onClick={handleMotivateMe} disabled={loadingMotiv}>
          {loadingMotiv ? 'Thinking...' : 'Motivate me'}
        </Button>
      </div>
    </div>
  );
};
