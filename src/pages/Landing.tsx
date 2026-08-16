import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const Landing: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <h1 className="text-5xl md:text-6xl font-bold text-dark mb-6">
        Master Your Communication with <span className="text-primary">SpeakUp Practice</span>
      </h1>
      <p className="text-xl text-gray-600 mb-10 max-w-2xl">
        AI-powered mock interviews, group discussions, and grammar practice to build your confidence and ace your next opportunity.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/register">
          <Button size="lg" className="w-full sm:w-auto">Get Started for Free</Button>
        </Link>
        <Link to="/login">
          <Button variant="outline" size="lg" className="w-full sm:w-auto">Login to your account</Button>
        </Link>
      </div>
      
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-secondary text-left">
          <div className="bg-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-primary text-xl font-bold">1</div>
          <h3 className="text-xl font-semibold mb-2">Mock Interviews</h3>
          <p className="text-gray-600">Practice role-specific interviews with realistic AI-generated questions and instant feedback.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-secondary text-left">
          <div className="bg-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-primary text-xl font-bold">2</div>
          <h3 className="text-xl font-semibold mb-2">Group Discussions</h3>
          <p className="text-gray-600">Engage in dynamic AI-driven group discussions. Build upon arguments and learn to articulate points clearly.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-secondary text-left">
          <div className="bg-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-primary text-xl font-bold">3</div>
          <h3 className="text-xl font-semibold mb-2">Grammar & Vocab</h3>
          <p className="text-gray-600">Sharpen your language skills with tailored quizzes and get instant explanations for mistakes.</p>
        </div>
      </div>
    </div>
  );
};
