import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVoice } from '../contexts/VoiceContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Settings: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const { speed, setSpeed, isMuted, toggleMute, speak } = useVoice();
  const [voicePreference, setVoicePreference] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setVoicePreference(profile.voice_preference);
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    await supabase.from('user_profiles').update({
      voice_preference: voicePreference
    }).eq('id', profile.id);
    await refreshProfile();
    setLoading(false);
    
    // Test the new settings
    speak("Settings saved successfully.");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Voice & Audio Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-dark">Preferred Voice Gender</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white"
              value={voicePreference}
              onChange={e => setVoicePreference(e.target.value)}
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">This preference is saved to your profile and used across devices.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-dark">Speaking Rate (Speed)</label>
              <span className="text-sm font-medium text-primary">{speed}x</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="2" 
              step="0.1" 
              value={speed}
              onChange={e => setSpeed(parseFloat(e.target.value))}
              className="w-full cursor-pointer accent-primary"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-secondary">
            <div>
              <p className="font-medium text-dark">Mute AI Voice</p>
              <p className="text-sm text-gray-500">Temporarily disable all voice output.</p>
            </div>
            <Button variant={isMuted ? 'primary' : 'outline'} onClick={toggleMute}>
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
