"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User, LogIn, UserPlus, Key, Loader2, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { SigninRequest, SigninResponse } from "@/lib/types/auth";
import { ApiErrorResponse, ApiResponse } from "@/lib/types/api";

const formSchema = z.object({
  username: z.string().min(3, {
    message: "Username or email must be at least 3 characters.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

export default function SigninPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const mutation = useMutation<
    ApiResponse<SigninResponse>,
    ApiErrorResponse,
    SigninRequest
  >({
    mutationFn: async (data) => {
      const res = await fetch("/api/auth/signin", {
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
      // Redirect to dashboard or home page on success
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push("/");
      }
      router.refresh();
    },
    onError: (error) => {
      console.error("Login error:", error);
      if (error.details && error.details.length > 0) {
        error.details.forEach((detail) => {
          // Map backend field names to form field names if necessary
          // Assuming direct mapping for now
          const fieldName = detail.field as keyof z.infer<typeof formSchema>;
          form.setError(fieldName, {
            type: "server",
            message: detail.message,
          });
        });
      } else {
        form.setError("root", {
          type: "server",
          message: error.message || "Authentication failed",
        });
      }
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-border bg-card shadow-2xl py-4 sm:py-6">
        <CardHeader className="space-y-1 text-center px-4 sm:px-6">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Sign in to HeapDog
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm sm:text-base">
            Welcome back! Enter your credentials to continue.
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
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/90">
                      Username or Email
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" size={16} />
                        <Input
                          placeholder="engineer@heapdog.io"
                          className="pl-10 h-11 sm:h-10 text-base sm:text-sm bg-background border-input focus-visible:ring-primary transition-all duration-200"
                          {...field}
                          disabled={mutation.isPending}
                        />
                      </div>
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
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-foreground/90">
                        Password
                      </FormLabel>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href="#"
                            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            Forgot password?
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click here to reset your password securely.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" size={16} />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 h-11 sm:h-10 text-base sm:text-sm bg-background border-input focus-visible:ring-primary transition-all duration-200"
                          {...field}
                          disabled={mutation.isPending}
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
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" /> Sign In
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-0 text-center px-4 sm:px-6">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground whitespace-nowrap">
                Or continue with
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            asChild
            className="w-full h-11 sm:h-10 text-base sm:text-sm border-border hover:bg-accent hover:text-accent-foreground active:scale-[0.98] transition-all duration-200 ease-in-out cursor-pointer text-foreground"
          >
            <Link href="/signup">
              <UserPlus className="mr-2 h-4 w-4" size={16} /> Sign Up
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
