import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';

export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Try to capture the session from the URL (Supabase provides the access token in the redirect)
    (async () => {
      try {
        // First try to read an existing session (Supabase may have stored it after redirect)
        const { data: sessionData, error: getSessionError } = await supabase.auth.getSession();
        if (getSessionError) {
          console.error('Error getting session:', getSessionError);
        }
        if (sessionData?.session) {
          setReady(true);
          return;
        }

        // If no session yet, listen for the PASSWORD_RECOVERY event
        const { data: subData } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'PASSWORD_RECOVERY') {
            setReady(true);
          }
        });

        // cleanup subscription when unmounting
        return () => {
          try {
            subData?.subscription?.unsubscribe?.();
          } catch (e) {
            // ignore
          }
        };
      } catch (err) {
        console.error(err);
        setError('Invalid or expired reset link.');
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // Success — redirect to login with a success message
      navigate('/login', { state: { resetSuccess: true } });
    } catch (err: any) {
      console.error(err);
      setError('Unable to reset password.');
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Set a new password</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
            {!ready ? (
              <div className="text-gray-600">Preparing reset flow. If you were redirected here from your email, please wait a moment. If the link is invalid or expired, request a new reset from the login page.</div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-dark">New password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-dark">Confirm new password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading || !ready}>{loading ? 'Setting...' : 'Set new password'}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
