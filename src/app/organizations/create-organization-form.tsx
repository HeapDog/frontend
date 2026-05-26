"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMutation } from "@tanstack/react-query"
import { OrganizationForm, OrganizationFormValues } from "./components/organization-form"
import { UseFormReturn } from "react-hook-form"
import { Code, Laptop, Users, Trophy } from "lucide-react"
import { motion, useAnimation } from "framer-motion"

export function CreateOrganizationForm() {
  const router = useRouter()
  const [form, setForm] = useState<UseFormReturn<OrganizationFormValues> | null>(null)

  const { mutate: createOrg, isPending } = useMutation({
    mutationFn: async (values: OrganizationFormValues) => {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        throw { status: response.status, data }
      }

      return data
    },
    onSuccess: (data) => {
      toast.success("Organization created successfully!")
      if (data?.data?.slug) {
        router.refresh()
        router.push(`/organizations/${data.data.slug}/dashboard/basic-info`)
      } else {
        // Fallback if no slug found
        router.refresh()
        router.push("/organizations")
      }
    },
    onError: (error: any) => {
      console.error("Error creating organization:", error)
      const { status, data } = error

      if (!form) return;

      if (status === 409) {
        // Handle specific duplicate resource error
        if (data?.details) {
          data.details.forEach((detail: any) => {
            form.setError(detail.field as any, {
              type: "manual",
              message: detail.message,
            })
          })
          toast.error("Organization already exists. Please check the errors.")
        } else {
          toast.error(data?.message || "Organization already exists.")
        }
      } else if (status === 400 && data?.details) {
        // Handle validation errors from Spring Boot
        data.details.forEach((detail: any) => {
           form.setError(detail.field as any, {
             type: "manual",
             message: detail.message,
           })
        })
        toast.error("Validation failed. Please check the highlighted fields.")
      } else {
        toast.error(data?.message || "Something went wrong. Please try again.")
      }
    },
  })

  const checkSlugAvailability = useCallback(async (slug: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/organizations/check-slug?slug=${encodeURIComponent(slug)}`, {
        method: "GET",
      });
      
      if (!response.ok) {
        // If request fails, we can't determine availability, maybe assume available or throw
        // But for UI, it's better to treat as unknown or error.
        // If 401, etc.
        console.error("Slug check failed", response.status);
        return false; // Safe default to prevent submission? Or allow and let submit fail?
      }

      const json = await response.json();
      // Expected: { data: { isAvailable: boolean } }
      // Note: BackendClient wraps response in `data`, and our route returns that wrapper.
      // So json is { data: { isAvailable: true }, path: "...", ... }
      return json?.data?.isAvailable ?? false;
    } catch (error) {
      console.error("Slug check error", error);
      return false;
    }
  }, [])

  function onSubmit(values: OrganizationFormValues) {
    createOrg(values)
  }

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <div className="grid w-full gap-8 lg:grid-cols-2 lg:gap-16">
        {/* Left Column: Branding & Features */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative flex flex-col justify-center space-y-8 min-h-[500px] overflow-hidden rounded-2xl p-10 lg:p-16"
        >
          {/* Animated Background */}
          <motion.div 
              className="absolute inset-0 z-0 bg-gradient-to-br from-background via-muted/40 to-primary/10 dark:from-background dark:via-muted/20 dark:to-primary/20 bg-[length:400%_400%]"
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          >
              <motion.div 
                  className="absolute -top-[20%] -left-[10%] h-[60%] w-[60%] rounded-full bg-primary/20 blur-[100px]"
                  animate={{ 
                      x: [0, 50, 0], 
                      y: [0, 30, 0],
                      scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div 
                  className="absolute top-[40%] -right-[10%] h-[50%] w-[50%] rounded-full bg-blue-500/10 blur-[120px]"
                  animate={{ 
                      x: [0, -30, 0], 
                      y: [0, -20, 0],
                      scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              />
          </motion.div>

          <div className="relative z-10 space-y-8">
              <div className="space-y-4">
              <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground"
              >
                  Bring your organization to Heapdog
              </motion.h1>
              <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-xl text-muted-foreground"
              >
                  The all-in-one platform for technical hiring, team management, and coding contests.
              </motion.p>
              </div>

              <div className="space-y-8">
                  <FeatureItem 
                      icon={Users} 
                      title="Manage Members" 
                      description="Invite team members, assign roles, and collaborate seamlessly."
                      delay={0.2}
                  />
                  
                  <FeatureItem 
                      icon={Code} 
                      title="Problem Library" 
                      description="Create and curate a library of coding problems to challenge your candidates."
                      delay={0.3}
                  />

                  <FeatureItem 
                      icon={Trophy} 
                      title="Host Contests" 
                      description="Organize engaging coding competitions for your community or internal teams."
                      delay={0.4}
                  />

                  <FeatureItem 
                      icon={Laptop} 
                      title="Assessments" 
                      description="Conduct professional online assessments with powerful proctoring tools."
                      delay={0.5}
                  />
              </div>
          </div>
        </motion.div>

        {/* Right Column: The Form */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="lg:mt-0"
        >
          <Card className="border-muted/60 shadow-xl bg-card">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl">Create Organization</CardTitle>
              <CardDescription>
                Enter the details below to create your new organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationForm 
                  onSubmit={onSubmit} 
                  isPending={isPending} 
                  mode="create"
                  formRef={setForm}
                  checkSlugAvailability={checkSlugAvailability}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer: running corgi only */}
      <RunningCorgiFooter />
    </div>
  )
}

function FeatureItem({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) {
    return (
        <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay }}
            className="flex gap-4 group"
        >
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                <Icon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                    {description}
                </p>
            </div>
        </motion.div>
    )
}

const CORGI_SRC = "/corgi.gif"

function RunningCorgiFooter() {
  return (
    <footer
      className="fixed bottom-0 left-0 w-full h-28 overflow-hidden pointer-events-none z-50"
      aria-hidden
    >
      {/* Simple ground strip: subtle gradient, no water */}
      <div
        className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-muted/50 to-muted/20 border-t border-border/50"
        aria-hidden
      />
      <CorgiRunner direction="left" />
      <CorgiRunner direction="right" />
    </footer>
  )
}

function CorgiRunner({ direction = "left" }: { direction?: "left" | "right" }) {
  const controls = useAnimation()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    let isMounted = true

    const run = async () => {
      const startDelay = Math.random() * 6000
      await new Promise((r) => setTimeout(r, startDelay))
      if (!isMounted) return

      while (isMounted) {
        const startX = direction === "left" ? -220 : window.innerWidth + 220
        const endX = direction === "left" ? window.innerWidth + 220 : -220

        controls.set({ x: startX })

        const duration = 14 + Math.random() * 8
        await controls.start({
          x: endX,
          transition: { duration, ease: "linear" },
        })
        if (!isMounted) return

        const pause = 4000 + Math.random() * 12000
        await new Promise((r) => setTimeout(r, pause))
      }
    }

    run()
    return () => {
      isMounted = false
    }
  }, [controls, direction, isClient])

  if (!isClient) return null

  return (
    <motion.div
      animate={controls}
      initial={{ x: direction === "left" ? -220 : window.innerWidth + 220 }}
      className="absolute bottom-5 w-20 h-20"
    >
      <div className={direction === "right" ? "scale-x-[-1]" : ""}>
        <motion.img
          src={CORGI_SRC}
          alt="Heapdog mascot"
          className="relative z-10 w-full h-full object-contain drop-shadow-md"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Soft shadow only (no water/blue) */}
        <div
          className="absolute top-[70%] left-1/2 -translate-x-1/2 w-14 h-3 rounded-full bg-foreground/10 blur-md"
          aria-hidden
        />
      </div>
    </motion.div>
  )
}
