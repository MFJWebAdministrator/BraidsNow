import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { UseFormReturn } from 'react-hook-form';
import type { ClientSettingsForm } from '@/lib/schemas/client-settings';

interface PersonalSectionProps {
  form: UseFormReturn<ClientSettingsForm>;
}

export function PersonalSection({ form }: PersonalSectionProps) {
  const inputClasses = "form-input border-[#3F0052] focus:ring-[#3F0052]/20 focus:border-[#3F0052]";

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-light text-[#3F0052]">Personal Information</h2>
        <p className="text-sm text-gray-500">
          Update your personal details
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-md text-[#3F0052] font-light">First Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter Your First Name"
                    className={`${inputClasses} capitalize`}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-md text-[#3F0052] font-light">Last Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter Your Last Name"
                    className={`${inputClasses} capitalize`}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}