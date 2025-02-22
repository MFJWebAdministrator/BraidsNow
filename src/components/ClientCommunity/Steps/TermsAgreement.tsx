import React, { useState } from 'react';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { TermsModal } from './TermsModal';
import { PrivacyModal } from './PrivacyModal';
import type { UseFormReturn } from 'react-hook-form';
import type { ClientRegistrationForm } from '@/lib/schemas/client-registration';

interface TermsAgreementProps {
  form: UseFormReturn<ClientRegistrationForm>;
}

export function TermsAgreement({ form }: TermsAgreementProps) {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  return (
    <>
      <FormField
        control={form.control}
        name="agreeToTerms"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <p className="text-sm text-black tracking-normal font-light">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(true)}
                  className="text-[#3F0052] hover:text-[#DFA801] underline"
                >
                  Terms and Conditions
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  onClick={() => setIsPrivacyModalOpen(true)}
                  className="text-[#3F0052] hover:text-[#DFA801] underline"
                >
                  Privacy Policy
                </button>
              </p>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      <TermsModal 
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />

      <PrivacyModal 
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </>
  );
}