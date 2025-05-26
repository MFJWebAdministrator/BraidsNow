import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { ClientSettingsForm } from '@/lib/schemas/client-settings';

interface PersonalSectionProps {
  control: Control<ClientSettingsForm>;
}

export function PersonalSection({ control }: PersonalSectionProps) {
  const inputClasses = "form-input border-[#3F0052] focus:ring-[#3F0052]/20 focus:border-[#3F0052]";

  return (
    <div className="border-t pt-8">
      <h3 className="text-lg font-light text-[#3F0052] mb-4">Personal Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
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
          control={control}
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
    </div>
  );
}