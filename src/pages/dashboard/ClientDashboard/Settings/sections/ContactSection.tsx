import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { UseFormReturn } from 'react-hook-form';
import type { ClientSettingsForm } from '@/lib/schemas/client-settings';

interface ContactSectionProps {
  form: UseFormReturn<ClientSettingsForm>;
}

export function ContactSection({ form }: ContactSectionProps) {
  const inputClasses = "form-input border-[#3F0052] focus:ring-[#3F0052]/20 focus:border-[#3F0052]";

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-light text-[#3F0052]">Contact Information</h2>
        <p className="text-sm text-gray-500">
          Keep your contact details up to date
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
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
            control={form.control}
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

        <FormField
          control={form.control}
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
              control={form.control}
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
              control={form.control}
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
      </CardContent>
    </Card>
  );
}