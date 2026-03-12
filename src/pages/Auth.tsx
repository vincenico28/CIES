import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Shield, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[0-9]/, "Password must contain at least 1 number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

// Password rule definitions
const passwordRules = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (pw: string) => pw.length >= 8,
  },
  {
    id: "uppercase",
    label: "1 uppercase letter (A–Z)",
    test: (pw: string) => /[A-Z]/.test(pw),
  },
  {
    id: "number",
    label: "1 number (0–9)",
    test: (pw: string) => /[0-9]/.test(pw),
  },
  {
    id: "symbol",
    label: "1 special character (!@#$...)",
    test: (pw: string) => /[^A-Za-z0-9]/.test(pw),
  },
];

function getStrength(password: string): { score: number; label: string; color: string } {
  const passed = passwordRules.filter((r) => r.test(password)).length;
  if (!password) return { score: 0, label: "", color: "" };
  if (passed <= 1) return { score: 1, label: "Weak", color: "#ef4444" };
  if (passed === 2) return { score: 2, label: "Fair", color: "#f97316" };
  if (passed === 3) return { score: 3, label: "Good", color: "#eab308" };
  return { score: 4, label: "Strong", color: "#22c55e" };
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = getStrength(password);

  if (!password) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="mt-3 space-y-3"
      >
        {/* Strength bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Password strength</span>
            <span className="text-xs font-semibold" style={{ color: strength.color }}>
              {strength.label}
            </span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((level) => (
              <motion.div
                key={level}
                className="h-1.5 flex-1 rounded-full overflow-hidden bg-muted"
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: "0%" }}
                  animate={{
                    width: strength.score >= level ? "100%" : "0%",
                  }}
                  transition={{ duration: 0.3, delay: level * 0.05 }}
                  style={{ backgroundColor: strength.color }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Rule checklist */}
        <div className="grid grid-cols-1 gap-1.5 p-3 bg-muted/50 rounded-lg border border-border/50">
          {passwordRules.map((rule) => {
            const passed = rule.test(password);
            return (
              <motion.div
                key={rule.id}
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div
                  className="flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{
                    backgroundColor: passed ? "#22c55e" : "transparent",
                    border: passed ? "none" : "1.5px solid hsl(var(--muted-foreground))",
                  }}
                >
                  {passed ? (
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                  ) : (
                    <X className="h-2.5 w-2.5 text-muted-foreground" strokeWidth={3} />
                  )}
                </div>
                <span
                  className="text-xs transition-colors duration-200"
                  style={{ color: passed ? "#22c55e" : "hsl(var(--muted-foreground))" }}
                >
                  {rule.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupPassword, setSignupPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        let message = "An error occurred during sign in";
        if (error.message.includes("Invalid login credentials")) {
          message = "Invalid email or password. Please try again.";
        } else if (error.message.includes("Email not confirmed")) {
          message = "Please confirm your email address before signing in.";
        }
        toast({ variant: "destructive", title: "Sign In Failed", description: message });
      } else {
        toast({ title: "Welcome back!", description: "You have successfully signed in." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await signUp(data.email, data.password, data.firstName, data.lastName);

      if (error) {
        let message = "An error occurred during sign up";
        if (error.message.includes("already registered")) {
          message = "This email is already registered. Please sign in instead.";
        } else if (error.message.includes("password")) {
          message = error.message;
        }
        toast({ variant: "destructive", title: "Sign Up Failed", description: message });
      } else {
        toast({
          title: "Account created!",
          description: "Welcome to the Barangay Web System. Please check your email for confirmation.",
        });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-20" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Shield className="h-7 w-7" />
              </div>
              <span className="font-display text-xl font-bold">BarangayConnect</span>
            </div>

            <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight mb-6">
              Your Gateway to
              <br />
              <span className="text-accent">Modern Governance</span>
            </h1>

            <p className="text-lg text-white/80 max-w-md mb-8">
              Access barangay services, submit requests, and stay connected with your community—all in one secure platform.
            </p>

            <div className="space-y-4">
              {[
                "Quick certificate requests",
                "Real-time updates & notifications",
                "Secure & verified profiles",
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-2 w-2 rounded-full bg-accent" />
                  <span className="text-white/90">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">BarangayConnect</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin
                ? "Sign in to access your barangay services"
                : "Register to start using barangay services"}
            </p>
          </div>

          {/* Auth Tabs */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    {...loginForm.register("email")}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    {...loginForm.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign In"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          ) : (
            /* Signup Form */
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="firstName"
                      placeholder="Juan"
                      className="pl-10"
                      {...signupForm.register("firstName")}
                    />
                  </div>
                  {signupForm.formState.errors.firstName && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Dela Cruz"
                    {...signupForm.register("lastName")}
                  />
                  {signupForm.formState.errors.lastName && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    {...signupForm.register("email")}
                  />
                </div>
                {signupForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    {...signupForm.register("password", {
                      onChange: (e) => setSignupPassword(e.target.value),
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {signupForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                )}

                {/* Live password strength + checklist */}
                <PasswordStrengthIndicator password={signupPassword} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    {...signupForm.register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {signupForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Create Account"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            By continuing, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}