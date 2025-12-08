"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VerifyEmailRequest, VerifyEmailResponse } from "@/lib/types/auth";
import { ApiErrorResponse, ApiResponse } from "@/lib/types/api";

const formSchema = z.object({
  otp: z.string().min(1, {
    message: "OTP is required.",
  }),
});

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get("user");
  const userId = userIdParam ? parseInt(userIdParam, 10) : null;
  
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  });

  const mutation = useMutation<
    ApiResponse<VerifyEmailResponse>,
    ApiErrorResponse,
    VerifyEmailRequest
  >({
    mutationFn: async (data) => {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData: ApiErrorResponse = await res.json();
        throw errorData;
      }

      return res.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      // Optional: Redirect after a delay
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    },
    onError: (error) => {
      console.error("Verify error:", error);
      if (error.details && error.details.length > 0) {
         // Usually validation errors on userId or otp
         // If it's a general error like "User not found", it might not be in details
         // But let's check details just in case
         const otpError = error.details.find(d => d.field === 'otp');
         if (otpError) {
             form.setError("otp", { type: "server", message: otpError.message });
         } else {
             // Fallback to root
             form.setError("root", { type: "server", message: error.message });
         }
      } else {
        form.setError("root", {
          type: "server",
          message: error.message || "Verification failed.",
        });
      }
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userId) {
      form.setError("root", {
        type: "manual",
        message: "Invalid verification link. Missing User ID.",
      });
      return;
    }

    mutation.mutate({
      userId,
      otp: values.otp,
    });
  }
  
  // Check if userId is valid on mount
  useEffect(() => {
      if (!userId && !isSuccess) {
          // We could redirect to signup or just show an error state
      }
  }, [userId, isSuccess]);


  if (isSuccess) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md border-border bg-card shadow-2xl py-8 sm:py-10">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
                    <CheckCircle2 className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                    Email Verified!
                </CardTitle>
                <CardDescription className="text-base">
                    Your email has been successfully verified. Redirecting to login...
                </CardDescription>
                <Button 
                    className="mt-4 bg-primary text-primary-foreground hover:brightness-110"
                    onClick={() => router.push('/signin')}
                >
                    Go to Login
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-border bg-card shadow-2xl py-4 sm:py-6">
        <CardHeader className="space-y-1 text-center px-4 sm:px-6">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Verify Email
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm sm:text-base">
            Please enter the verification code sent to your email.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {form.formState.errors.root && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <p>{form.formState.errors.root.message}</p>
                </div>
              )}
              
               {!userId && !form.formState.errors.root && (
                  <div className="bg-yellow-500/15 text-yellow-600 text-sm p-3 rounded-md flex items-center gap-2 mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <p>Invalid verification link. Please check your link.</p>
                  </div>
               )}

              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/90">
                      One-Time Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" size={16} />
                        <Input
                          placeholder="Enter code"
                          className="pl-10 h-11 sm:h-10 text-base sm:text-sm bg-background border-input focus-visible:ring-primary transition-all duration-200"
                          {...field}
                          disabled={mutation.isPending || !userId}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 sm:h-10 text-base sm:text-sm bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all duration-200 ease-in-out font-semibold cursor-pointer shadow-sm"
                disabled={mutation.isPending || !userId}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                     Verify Account
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-0 text-center px-4 sm:px-6">
            <div className="text-sm text-muted-foreground">
                Didn't receive a code? <Button variant="link" className="p-0 h-auto font-normal text-primary">Resend</Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

