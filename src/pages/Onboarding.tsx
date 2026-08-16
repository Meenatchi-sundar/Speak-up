import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export const Onboarding: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState('Male');
  const [voicePreference, setVoicePreference] = useState('female');
  const [goal, setGoal] = useState('Placement Interviews');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    await supabase.from('user_profiles').update({
      age: parseInt(age),
      gender,
      voice_preference: voicePreference,
      goal
    }).eq('id', user.id);
    
    await refreshProfile();
    navigate('/dashboard');
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Complete Your Profile</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-dark">Age</label>
              <input 
                type="number" 
                required 
                min="10"
                max="100"
                className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                value={age}
                onChange={e => setAge(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-dark">Gender</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white"
                value={gender}
                onChange={e => setGender(e.target.value)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-dark">Preferred Practice Voice</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white"
                value={voicePreference}
                onChange={e => setVoicePreference(e.target.value)}
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-dark">Primary Goal</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-white"
                value={goal}
                onChange={e => setGoal(e.target.value)}
              >
                <option value="Placement Interviews">Placement Interviews</option>
                <option value="Daily Confidence">Daily Confidence</option>
                <option value="Group Discussions">Group Discussions</option>
              </select>
            </div>
            
            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? 'Saving...' : 'Finish Setup'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};
