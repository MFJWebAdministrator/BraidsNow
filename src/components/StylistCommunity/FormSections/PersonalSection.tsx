import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { UseFormReturn } from 'react-hook-form';
import type { StylistRegistrationForm } from '@/lib/schemas/stylist-registration';

interface PersonalSectionProps {
  form: UseFormReturn<StylistRegistrationForm>;
}

export function PersonalSection({ form }: PersonalSectionProps) {
  const inputClasses = "form-input border-[#3F0052] focus:ring-[#3F0052]/20 focus:border-[#3F0052]";

  return (
    <div className="space-y-6">
      {/* First Name, Last Name (2 columns) */}
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

      {/* Email, Phone, Business Name (3 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">Business Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter Your Business Name"
                  className={inputClasses}
                  {...field}
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