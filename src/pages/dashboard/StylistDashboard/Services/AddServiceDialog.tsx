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
import { uploadServiceImage } from '@/lib/firebase/stylist/portfolio';
import { useAuth } from '@/hooks/use-auth';
import { Upload, X } from 'lucide-react';

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
      imageUrl: undefined,
    }
  });

  const [serviceImage, setServiceImage] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(initialData?.imageUrl || null);
  const [isUploading, setIsUploading] = React.useState(false);
  const { user } = useAuth();

  React.useEffect(() => {
    if (open) {
      form.reset(initialData || {
        name: '',
        duration: { hours: 0, minutes: 0 },
        description: '',
        price: 0,
        imageUrl: undefined,
      });
      setPreviewUrl(initialData?.imageUrl || null);
      setServiceImage(null);
    }
  }, [open, initialData, form]);

  const onSubmit = async (data: StylistService) => {
    let imageUrl = data.imageUrl;
    if (serviceImage && user) {
      setIsUploading(true);
      try {
        imageUrl = await uploadServiceImage(user.uid, data.name, serviceImage);
      } catch (e) {
        setIsUploading(false);
        alert('Failed to upload image');
        return;
      }
      setIsUploading(false);
    }
    // If imageUrl is an empty string, set it to undefined for validation
    if (!imageUrl) imageUrl = undefined;

    console.log()
    onSave({ ...data, imageUrl });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        alert('Only PNG, JPG, or WebP files are allowed');
        return;
      }
      setServiceImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setServiceImage(null);
    setPreviewUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[700px] overflow-auto">
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
            <div className="flex flex-col space-y-2">
              <label className="text-md font-light text-[#3F0052]">Service Image</label>
              <div className="flex  w-full">
                <label htmlFor="service-image-upload" className="relative group cursor-pointer h-28 flex items-center justify-center border-2 border-dashed border-[#3F0052] rounded-xl bg-gray-50 w-full  hover:bg-[#FFF7E6] transition-all shadow-sm">
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Service preview" className="w-28 h-28 object-cover rounded-lg shadow border" />
                      <button type="button" onClick={handleRemoveImage} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-red-100 transition z-10">
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#3F0052] w-full">
                      <Upload className="w-8 h-8 mb-2 text-[#3F0052] group-hover:text-[#3F0052] transition" />
                      <span className="text-xs font-medium">Click to upload</span>
                      <span className="text-[10px] text-gray-400">PNG, JPG, or WebP up to 5MB</span>
                    </div>
                  )}
                  <input
                    id="service-image-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    tabIndex={-1}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 text-center">Only one image allowed per service.</p>
            </div>
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
                {isEdit ? 'Save Changes' : isUploading ? 'Creating Service...' : 'Add Service'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}