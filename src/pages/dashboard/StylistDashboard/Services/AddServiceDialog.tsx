import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { stylistServiceSchema, type StylistService } from '@/lib/schemas/stylist-service';

interface AddServiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (service: StylistService) => void;
  isEdit: boolean;
  initialData: StylistService | null;
}

export function AddServiceDialog({ 
  open, 
  onClose, 
  onSave, 
  isEdit,
  initialData 
}: AddServiceDialogProps) {
  const form = useForm<StylistService>({
    resolver: zodResolver(stylistServiceSchema),
    defaultValues: initialData || {
      name: '',
      duration: { hours: 0, minutes: 0 },
      description: '',
      price: 0,
    }
  });

  // Reset form when dialog opens/closes or initialData changes
  React.useEffect(() => {
    if (open) {
      form.reset(initialData || {
        name: '',
        duration: { hours: 0, minutes: 0 },
        description: '',
        price: 0,
      });
    }
  }, [open, initialData, form]);

  const onSubmit = (data: StylistService) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-normal block mt-2 bg-gradient-to-r from-[#3F0052] to-[#DFA801] bg-clip-text text-transparent">
            {isEdit ? 'Edit Service' : 'Add New Service'}
          </DialogTitle>
          <DialogDescription className="text-md tracking-normal">
            Add details about your hairstyling service
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">
                    Service Name
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Box Braids"
                      className="form-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration.hours"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">
                      Hours
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        max="12"
                        className="form-input"
                        {...field}
                        value={value?.toString() || '0'}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          onChange(isNaN(val) ? 0 : val);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration.minutes"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">
                      Minutes
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        max="59"
                        className="form-input"
                        {...field}
                        value={value?.toString() || '0'}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          onChange(isNaN(val) ? 0 : val);
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">
                    Description (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your service..."
                      className="min-h-[100px] border-[#3F0052] focus:ring-[#3F0052]/20 focus:border-[#3F0052] rounded-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">
                    Price
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input 
                        type="number"
                        className="form-input pl-7"
                        {...field}
                        value={value?.toString() || '0'}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          onChange(isNaN(val) ? 0 : val);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-full font-light tracking-normal"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-full font-light tracking-normal"
              >
                {isEdit ? 'Save Changes' : 'Add Service'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}