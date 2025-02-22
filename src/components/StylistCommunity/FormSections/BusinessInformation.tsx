import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { UseFormReturn } from 'react-hook-form';
import type { StylistRegistrationForm } from '@/lib/schemas/stylist-registration';

interface BusinessInformationProps {
  form: UseFormReturn<StylistRegistrationForm>;
}

export function BusinessInformation({ form }: BusinessInformationProps) {
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
        name="depositAmount"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">Desired Deposit Amount</FormLabel>
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input 
                  type="number"
                  placeholder="Enter Amount"
                  className={`${inputClasses} pl-7`}
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}