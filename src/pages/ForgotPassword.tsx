import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Link } from 'react-router-dom';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      // Always show generic confirmation
      setSent(true);
    } catch (err: any) {
      console.error(err);
      setError('Unable to send reset link. Please try again later.');
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Reset your password</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
            {sent ? (
              <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">If this email is registered, a password reset link has been sent.</div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-dark">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-4">
            {!sent && (
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</Button>
            )}
            <p className="text-sm text-center text-gray-600">
              Remembered? <Link to="/login" className="text-primary hover:underline">Back to login</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ForgotPassword;
