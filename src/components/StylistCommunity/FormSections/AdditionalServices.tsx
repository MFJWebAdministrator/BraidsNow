import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { UseFormReturn } from 'react-hook-form';
import type { StylistRegistrationForm } from '@/lib/schemas/stylist-registration';

interface AdditionalServicesProps {
  form: UseFormReturn<StylistRegistrationForm>;
}

export function AdditionalServices({ form }: AdditionalServicesProps) {
  const services = [
    { name: 'washesHair', label: 'Do You Wash Hair' },
    { name: 'providesHair', label: 'Do You Provide Hair' },
    { name: 'stylesMensHair', label: 'Do You Style Men\'s Hair' },
    { name: 'stylesChildrensHair', label: 'Do You Style Children\'s Hair' }
  ] as const;

  return (
      <div className="space-y-4">
        {services.map((service) => (
          <FormField
            key={service.name}
            control={form.control}
            name={service.name}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-light">
                    {service.label}
                  </FormLabel>
                </div>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === 'yes')}
                    defaultValue={field.value ? 'yes' : 'no'}
                  >
                    <div className="flex space-x-4">
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="yes" />
                        </FormControl>
                        <FormLabel className="font-light">Yes</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="no" />
                        </FormControl>
                        <FormLabel className="font-light">No</FormLabel>
                      </FormItem>
                    </div>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
        ))}
      </div>
  );
}