import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { UseFormReturn } from 'react-hook-form';
import type { StylistRegistrationForm } from '@/lib/schemas/stylist-registration';

interface AddressInformationProps {
  form: UseFormReturn<StylistRegistrationForm>;
}

export function AddressInformation({ form }: AddressInformationProps) {
  const inputClasses = "form-input border-[#3F0052] focus:ring-[#3F0052]/20 focus:border-[#3F0052]";

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="businessAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">Business Address (Optional)</FormLabel>
            <FormControl>
              <Input 
                placeholder="Enter Your Business Address"
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