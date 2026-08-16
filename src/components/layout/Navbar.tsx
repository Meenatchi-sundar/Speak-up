import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useVoice } from '../../contexts/VoiceContext';
import { Mic, MicOff, LogOut, Settings, BarChart2, Home, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const Navbar: React.FC = () => {
  const { user, profile } = useAuth();
  const { isMuted, toggleMute } = useVoice();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-secondary px-4 py-3 flex flex-wrap items-center justify-between sticky top-0 z-10">
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <Link to={user ? "/dashboard" : "/"} className="text-xl font-bold text-primary flex items-center gap-2 truncate">
          <BookOpen className="h-6 w-6" />
          <span className="truncate">SpeakUp Practice</span>
        </Link>
        {user && profile?.goal && (
          <div className="hidden md:flex space-x-4 ml-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-primary flex items-center gap-1 font-medium"><Home size={18}/> Dashboard</Link>
            <Link to="/progress" className="text-gray-600 hover:text-primary flex items-center gap-1 font-medium"><BarChart2 size={18}/> Progress</Link>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3 mt-2 md:mt-0">
        {user && (
          <button 
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-secondary text-gray-600 transition-colors"
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} className="text-primary" />}
          </button>
        )}
        
        {user ? (
          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
            <span className="text-sm font-medium text-dark hidden md:block">
              {profile?.name || user.email}
            </span>
            <Link to="/settings" className="p-2 rounded-full hover:bg-secondary text-gray-600">
              <Settings size={20} />
            </Link>
            <button onClick={handleLogout} className="p-2 rounded-full hover:bg-red-50 text-red-500">
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-primary font-medium hover:underline">Login</Link>
            <Link to="/register" className="bg-primary text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition">Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  );
};
