import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { UseFormReturn } from 'react-hook-form';
import type { StylistRegistrationForm } from '@/lib/schemas/stylist-registration';

interface BusinessSectionProps {
  form: UseFormReturn<StylistRegistrationForm>;
}

export function BusinessSection({ form }: BusinessSectionProps) {
  const inputClasses = "form-input border-[#3F0052] focus:ring-[#3F0052]/20 focus:border-[#3F0052]";
  const textareaClasses = "min-h-[100px] border-[#3F0052] focus:ring-[#3F0052]/20 focus:border-[#3F0052] rounded-lg";

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="introduction"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">Introduction</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Tell potential clients about yourself and your experience..."
                className={textareaClasses}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="specialInstructions"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">Special Instructions</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Any specific instructions or requirements for your clients..."
                className={textareaClasses}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="policyAndProcedures"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">Policy and Procedures</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Your business policies, cancellation policy, etc..."
                className={textareaClasses}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}