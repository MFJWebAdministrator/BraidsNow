import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { ClientSettingsForm } from '@/lib/schemas/client-settings';

interface ContactSectionProps {
  control: Control<ClientSettingsForm>;
}

export function ContactSection({ control }: ContactSectionProps) {
  const inputClasses = "form-input border-[#3F0052] focus:ring-[#3F0052]/20 focus:border-[#3F0052]";

  return (
    <div className="border-t pt-8">
      <h3 className="text-lg font-light text-[#3F0052] mb-4">Contact Information</h3>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-md text-[#3F0052] font-light">Email</FormLabel>
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
            control={control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-md text-[#3F0052] font-light">Phone Number</FormLabel>
                <FormControl>
                  <Input 
                    type="tel"
                    placeholder="Enter 10-digit Phone Number"
                    className={inputClasses}
                    maxLength={10}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="streetAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-md text-[#3F0052] font-light">Street Address</FormLabel>
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
              control={control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md text-[#3F0052] font-light">City</FormLabel>
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
              control={control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md text-[#3F0052] font-light">State</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="CA"
                      className={`${inputClasses} uppercase`}
                      maxLength={2}
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
              control={control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md text-[#3F0052] font-light">ZIP Code</FormLabel>
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
    </div>
  );
}