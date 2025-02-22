import React from 'react';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ProfileSection } from './ProfileSection';
import { PersonalSection } from './PersonalSection';
import { ContactSection } from './ContactSection';
import { useClientSettings } from '@/hooks/use-client-settings';

export function SettingsForm() {
  const { 
    form,
    isLoading,
    hasChanges,
    handleSubmit,
    handleImageChange 
  } = useClientSettings();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#3F0052]" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-light text-[#3F0052]">Profile Settings</h2>
                <p className="text-sm text-gray-500">Update your account information</p>
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={!hasChanges || isLoading}
                className="rounded-full font-light px-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <ProfileSection onImageChange={handleImageChange} />
            <PersonalSection control={form.control} />
            <ContactSection control={form.control} />
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}