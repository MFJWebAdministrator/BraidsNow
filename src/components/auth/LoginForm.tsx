import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { loginSchema } from '@/lib/schemas/login';
import { ForgotPasswordDialog } from './ForgotPasswordDialog';
import type { LoginFormType } from '@/lib/schemas/login';
import { useLogin } from '@/hooks/use-login';

export function LoginForm() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const location = useLocation();
  const { handleLogin, isLoading, error } = useLogin();

  const form = useForm<LoginFormType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
      rememberMe: false
    }
  });

  const onSubmit = async (data: LoginFormType) => {
    await handleLogin(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="usernameOrEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">
                Email Address
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter Email Address"
                  className="form-input border-[#3F0052] focus:ring-[#3F0052]/20 focus:border-[#3F0052] tracking-normal"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-md text-[#3F0052] font-light tracking-normal">
                Password
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Password"
                    className="form-input border-[#3F0052] focus:ring-[#3F0052]/20 focus:border-[#3F0052] tracking-normal"
                    disabled={isLoading}
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3F0052] hover:text-[#DFA801] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-2.5"
                  />
                </FormControl>
                <FormLabel className="text-md font-light cursor-pointer tracking-normal">
                  Remember Me
                </FormLabel>
              </FormItem>
            )}
          />

          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-md text-[#3F0052] hover:text-[#DFA801] font-light tracking-normal"
          >
            Forgot Password?
          </button>
        </div>

        {error && (
          <p className="text-md text-red-600 text-center tracking-normal">{error}</p>
        )}

        <div className="flex justify-center">
          <Button
            type="submit"
            size="lg"
            className="rounded-full font-light tracking-normal px-12"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </div>

        <div className="text-center space-y-2">
          <p className="text-md text-black tracking-normal">
            New to BraidsNow?{' '}
            <Link 
              to="/client-community" 
              state={location.state} 
              className="font-medium text-[#3F0052] tracking-normal hover:text-[#DFA801]"
            >
              Register for Free As A Client
            </Link>
          </p>
          <p className="text-md text-black tracking-normal">
            Are You A Professional Stylist?{' '}
            <Link 
              to="/stylist-community" 
              state={location.state}
              className="font-medium text-[#3F0052] tracking-normal hover:text-[#DFA801]"
            >
              Join BraidsNow Stylist Community
            </Link>
          </p>
        </div>
      </form>

      <ForgotPasswordDialog 
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </Form>
  );
}