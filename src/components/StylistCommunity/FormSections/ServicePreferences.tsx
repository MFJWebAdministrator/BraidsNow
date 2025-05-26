import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { UseFormReturn } from 'react-hook-form';
import type { StylistRegistrationForm } from '@/lib/schemas/stylist-registration';

interface ServicePreferencesProps {
  form: UseFormReturn<StylistRegistrationForm>;
}

export function ServicePreferences({ form }: ServicePreferencesProps) {
  return (
    <div className="space-y-8">
      <FormField
        control={form.control}
        name="servicePreference"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">
              What's Your Style Service Preference
            </FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-2"
              >
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="shop" />
                  </FormControl>
                  <FormLabel className="font-light">
                    I Style Out of A Shop!
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="home" />
                  </FormControl>
                  <FormLabel className="font-light">
                    I Style From Home!
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="mobile" />
                  </FormControl>
                  <FormLabel className="font-light">
                    I Am A Mobile Stylist That Likes To Travel!
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}