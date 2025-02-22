import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { UrlPreview } from '../UrlPreview';
import type { UseFormReturn } from 'react-hook-form';
import type { StylistRegistrationForm } from '@/lib/schemas/stylist-registration';

interface BasicInformationProps {
  form: UseFormReturn<StylistRegistrationForm>;
}

export function BasicInformation({ form }: BasicInformationProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputClasses = "form-input border-[#3F0052] focus:ring-[#3F0052]/20 focus:border-[#3F0052]";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">Username</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter A Username"
                  className={inputClasses}
                  {...field}
                />
              </FormControl>
              <UrlPreview username={field.value} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Create A Password"
                    className={inputClasses}
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3F0052] hover:text-[#DFA801] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">First Name</FormLabel>
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
              <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">Last Name</FormLabel>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">Email</FormLabel>
              <FormControl>
                <Input 
                  type="email"
                  placeholder="Enter Your Email Address"
                  className={inputClasses}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">Phone Number</FormLabel>
              <FormControl>
                <Input 
                  type="tel"
                  placeholder="Enter 10-digit Phone Number"
                  className={inputClasses}
                  maxLength={10}
                  value={field.value}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}