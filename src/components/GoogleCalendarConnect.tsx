import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Link2, Unlink, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/use-google-calendar';
import { useAppointments } from '@/hooks/use-appointments';

interface GoogleCalendarConnectProps {
  className?: string;
}

export function GoogleCalendarConnect({ className }: GoogleCalendarConnectProps) {
  const {
    isConnected,
    isConnecting,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncAllAppointments
  } = useGoogleCalendar();
  
  const { getStylistAppointments } = useAppointments();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const appointments = getStylistAppointments();
      await syncAllAppointments(appointments);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnect = async () => {
    try {
      await connectGoogleCalendar();
    } catch (error) {
      console.error('Failed to connect Google Calendar:', error);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect your Google Calendar? This will remove all sync connections.')) {
      await disconnectGoogleCalendar();
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-[#3F0052]" />
            <CardTitle className="text-lg">Google Calendar Integration</CardTitle>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
        <CardDescription>
          Sync your appointments with Google Calendar to manage your schedule in one place.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Connect your Google Calendar to automatically sync appointments</span>
            </div>
            
            <Button 
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Connect Google Calendar
                </>
              )}
            </Button>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Appointments will be automatically synced to your Google Calendar</p>
              <p>• You'll receive notifications and reminders from Google Calendar</p>
              <p>• Changes in BraidsNow will update your Google Calendar</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Your Google Calendar is connected and ready to sync</span>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <Button 
                onClick={handleSyncAll}
                disabled={isSyncing}
                variant="outline"
                className="w-full"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync All Appointments
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleDisconnect}
                variant="destructive"
                className="w-full"
              >
                <Unlink className="mr-2 h-4 w-4" />
                Disconnect Google Calendar
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• New appointments will be automatically synced</p>
              <p>• Use "Sync All" to sync existing appointments</p>
              <p>• Disconnect anytime to stop syncing</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 