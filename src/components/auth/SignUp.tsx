import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProxCard, ProxCardHeader, ProxCardTitle, ProxCardContent } from '@/components/ProxCard';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  zipCode: z.string().regex(/^\d{5}$/, 'Zip code must be 5 digits'),
  birthday: z.date({
    message: 'A valid birthday is required',
  }).refine(date => date < new Date(), 'Birthday must be in the past'),
  householdSize: z.number().min(1).max(12),
  grocer1: z.string().trim().min(1, "Grocer 1 is required"),
  grocer2: z.string().trim().min(1, "Grocer 2 is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpForm = z.infer<typeof signUpSchema>;

interface SignUpProps {
  onSuccess: () => void;
  onSwitchToSignIn: () => void;
}

export function SignUp({ onSuccess, onSwitchToSignIn }: SignUpProps) {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      householdSize: 1,
    }
  });

  const selectedDate = watch('birthday');

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(data.email, data.password, {
        first_name: data.firstName,
        last_name: data.lastName,
        zip_code: data.zipCode,
        birthday: data.birthday.toISOString().split('T')[0],
        household_size: data.householdSize,
        grocer_1: data.grocer1,
        grocer_2: data.grocer2,
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        reset();
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProxCard className="w-full max-w-md mx-auto">
      <ProxCardHeader>
        <ProxCardTitle className="text-center text-2xl font-primary font-semibold text-black">Create Account</ProxCardTitle>
      </ProxCardHeader>
      <ProxCardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="font-secondary text-black">First Name</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                className="h-12"
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="font-secondary text-black">Last Name</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                className="h-12"
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="font-secondary text-black">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              className="h-12"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-secondary text-black">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register('password')}
                className="h-12 pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="font-secondary text-black">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                {...register('confirmPassword')}
                className="h-12 pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode" className="font-secondary text-black">Zip Code</Label>
              <Input
                id="zipCode"
                {...register('zipCode')}
                className="h-12"
                placeholder="12345"
              />
              {errors.zipCode && (
                <p className="text-sm text-destructive">{errors.zipCode.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="householdSize" className="font-secondary text-black">Household Size</Label>
              <Input
                id="householdSize"
                type="number"
                min="1"
                max="12"
                {...register('householdSize', { valueAsNumber: true })}
                className="h-12"
              />
              {errors.householdSize && (
                <p className="text-sm text-destructive">{errors.householdSize.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-secondary text-black">Birthday</Label>
            <div className="flex gap-2">
              <Select
                value={selectedDate ? selectedDate.getFullYear().toString() : ""}
                onValueChange={(year) => {
                  const selectedYear = parseInt(year);
                  const newDate = new Date(selectedYear, 0, 1); // January 1st of selected year
                  setValue('birthday', newDate);
                }}
              >
                <SelectTrigger className="h-12 flex-1">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "h-12 px-3",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setValue('birthday', date)}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                    defaultMonth={selectedDate || new Date(2000, 0)}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {selectedDate ? (
              <p className="text-sm text-muted-foreground">
                {format(selectedDate, "MMMM d, yyyy")}
              </p>
            ) : null}
            {errors.birthday && (
              <p className="text-sm text-destructive">{errors.birthday.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="grocer1" className="font-secondary text-black">Most Visited Grocer 1 </Label>
            <Input
              id="grocer1"
              {...register('grocer1')}
              className="h-12"
              placeholder="e.g., Whole Foods Market"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grocer2" className="font-secondary text-black">Most Visited Grocer 2 </Label>
            <Input
              id="grocer2"
              {...register('grocer2')}
              className="h-12"
              placeholder="e.g., Trader Joe's"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-primary font-medium"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToSignIn}
              className="text-sm text-accent hover:underline font-secondary"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </ProxCardContent>
    </ProxCard>
  );
}