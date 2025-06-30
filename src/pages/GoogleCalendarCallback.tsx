import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import googleCalendarService from '@/lib/google-calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function GoogleCalendarCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  console.log('user', user);
  useEffect(() => {
    const handleCallback = async () => {
      if (!user) {
        setStatus('error');
        setErrorMessage('User not authenticated');
        return;
      }

      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setErrorMessage('Authorization was denied or an error occurred');
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code received');
        return;
      }

      try {
          const tokens = await googleCalendarService.getTokensFromCode(code);
          console.log('tokens', tokens);
        // Exchange code for tokens
        // Store tokens in localStorage for development/testing
        localStorage.setItem('googleCalendarTokens', JSON.stringify(tokens));
        // const userDoc = doc(db, 'users', user.uid);
        // await updateDoc(userDoc, {
        //   googleCalendarTokens: tokens
        // });

        setStatus('success');
        
        toast({
          title: "Google Calendar Connected!",
          description: "Your Google Calendar has been successfully connected. Your appointments will now sync automatically.",
        });

        // Redirect back to calendar page after a short delay
        setTimeout(() => {
          navigate('/dashboard/stylist/calendar');
        }, 2000);

      } catch (error) {
        console.error('Error handling Google Calendar callback:', error);
        setStatus('error');
        setErrorMessage('Failed to connect Google Calendar. Please try again.');
      }
    };

    handleCallback();
  }, [user, searchParams, navigate, toast]);

  const handleRetry = () => {
    navigate('/dashboard/stylist/calendar');
  };

  const handleGoBack = () => {
    navigate('/dashboard/stylist/calendar');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 text-[#3F0052] animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-500" />
            )}
            {status === 'error' && (
              <AlertCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          <CardTitle>
            {status === 'loading' && 'Connecting Google Calendar...'}
            {status === 'success' && 'Google Calendar Connected!'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we connect your Google Calendar...'}
            {status === 'success' && 'Your Google Calendar has been successfully connected. Redirecting...'}
            {status === 'error' && errorMessage}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'error' && (
            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full">
                Try Again
              </Button>
              <Button onClick={handleGoBack} variant="outline" className="w-full">
                Go Back to Calendar
              </Button>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center text-sm text-muted-foreground">
              <p>You will be redirected to your calendar shortly...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 