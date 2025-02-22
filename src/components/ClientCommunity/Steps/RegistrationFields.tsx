import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Eye, EyeOff } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { ClientRegistrationForm } from '@/lib/schemas/client-registration';

interface RegistrationFieldsProps {
  form: UseFormReturn<ClientRegistrationForm>;
}

export function RegistrationFields({ form }: RegistrationFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputClasses = "form-input border-[#3F0052] focus:ring-[#3F0052]/20 focus:border-[#3F0052]";

  return (
    <div className="space-y-6">
      {/* Name Fields */}
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

      {/* Username and Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">Username</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Choose A Username"
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

      {/* Email and Phone */}
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

      {/* Address Fields */}
      <FormField
        control={form.control}
        name="streetAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">Street Address (Optional)</FormLabel>
            <FormControl>
              <Input 
                placeholder="Enter Your Street Address"
                className={inputClasses}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-6">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">City</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter Your City"
                    className={inputClasses}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="col-span-6 md:col-span-3">
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">State</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="CA"
                    className={`${inputClasses} uppercase`}
                    maxLength={2}
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="col-span-6 md:col-span-3">
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">ZIP Code</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="12345"
                    className={inputClasses}
                    maxLength={5}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}