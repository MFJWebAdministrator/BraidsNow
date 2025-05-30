import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import type { UseFormReturn } from 'react-hook-form';
import type { StylistRegistrationForm } from '@/lib/schemas/stylist-registration';

interface ServicesSectionProps {
  form: UseFormReturn<StylistRegistrationForm>;
}

export function ServicesSection({ form }: ServicesSectionProps) {
  const inputClasses = "form-input border-[#3F0052] focus:ring-[#3F0052]/20 focus:border-[#3F0052]";

  const additionalServices = [
    { name: 'washesHair', label: 'Do You Wash Hair' },
    { name: 'providesHair', label: 'Do You Provide Hair' },
    { name: 'stylesMensHair', label: "Do You Style Men's Hair" },
    { name: 'stylesChildrensHair', label: "Do You Style Children's Hair" }
  ] as const;

  return (
    <div className="space-y-8">
      {/* Service Preference */}
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
                value={field.value}
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

      {/* Additional Services */}
      <div className="space-y-4">
        <h3 className="text-md text-[#3F0052] font-light tracking-normal">
          Additional Services
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {additionalServices.map((service) => (
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
                      value={field.value ? 'yes' : field.value === false ? 'no' : undefined}
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
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>

      {/* Deposit Amount and Coupon Code */}
      <div className="space-y-8">
        <FormField
          control={form.control}
          name="depositAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">Deposit Amount</FormLabel>
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

        <FormField
          control={form.control}
          name="couponCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">BraidsNow Coupon Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter Coupon Code (Optional)"
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