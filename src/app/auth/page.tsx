"use client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { useState } from "react";
import { auth, signInWithGoogle, signInWithEmail, signUpWithEmail } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  async function registerUser(user) {
    const token = await user.getIdToken();
    await fetch(`${API_URL}/api/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        uid: user.uid,
        name: user.displayName || user.email,
        email: user.email,
        avatar: user.photoURL || "",
      }),
    });
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithGoogle();
      await registerUser(result.user);
      router.push("/");
    } catch (err) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSignIn(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      const result = await signInWithEmail(email, password);
      await registerUser(result.user);
      router.push("/");
    } catch (err) {
      setError(err.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSignUp(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const email = e.target["signup-email"].value;
    const password = e.target["signup-password"].value;
    try {
      const result = await signUpWithEmail(email, password);
      await registerUser(result.user);
      router.push("/");
    } catch (err) {
      setError(err.message || "Sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-background">
      <Tabs defaultValue="signin" className="w-full max-w-sm">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Sign in to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleEmailSignIn}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              <div className="flex items-center my-4">
                <div className="flex-grow h-px bg-muted" />
                <span className="mx-2 text-xs text-muted-foreground">or</span>
                <div className="flex-grow h-px bg-muted" />
              </div>
              <Button variant="outline" className="w-full flex items-center justify-center gap-2" type="button" disabled={loading} onClick={handleGoogleSignIn}>
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_17_40)"><path d="M47.532 24.552c0-1.636-.146-3.2-.418-4.704H24.48v9.02h13.02c-.56 3.02-2.24 5.58-4.78 7.3v6.06h7.74c4.54-4.18 7.07-10.34 7.07-17.676z" fill="#4285F4"/><path d="M24.48 48c6.48 0 11.92-2.14 15.89-5.82l-7.74-6.06c-2.14 1.44-4.88 2.3-8.15 2.3-6.26 0-11.56-4.22-13.46-9.9H2.5v6.22C6.46 43.34 14.7 48 24.48 48z" fill="#34A853"/><path d="M11.02 28.52c-.48-1.44-.76-2.98-.76-4.52s.28-3.08.76-4.52v-6.22H2.5A23.98 23.98 0 000 24c0 3.98.96 7.76 2.5 11.22l8.52-6.7z" fill="#FBBC05"/><path d="M24.48 9.54c3.52 0 6.64 1.22 9.12 3.62l6.82-6.82C36.4 2.14 30.96 0 24.48 0 14.7 0 6.46 4.66 2.5 12.28l8.52 6.22c1.9-5.68 7.2-9.9 13.46-9.9z" fill="#EA4335"/></g><defs><clipPath id="clip0_17_40"><path fill="#fff" d="M0 0h48v48H0z"/></clipPath></defs></svg>
                Continue with Google
              </Button>
              {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Create a new account</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleEmailSignUp}>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" name="signup-email" type="email" placeholder="m@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" name="signup-password" type="password" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing up..." : "Sign Up"}
                </Button>
              </form>
              <div className="flex items-center my-4">
                <div className="flex-grow h-px bg-muted" />
                <span className="mx-2 text-xs text-muted-foreground">or</span>
                <div className="flex-grow h-px bg-muted" />
              </div>
              <Button variant="outline" className="w-full flex items-center justify-center gap-2" type="button" disabled={loading} onClick={handleGoogleSignIn}>
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_17_40)"><path d="M47.532 24.552c0-1.636-.146-3.2-.418-4.704H24.48v9.02h13.02c-.56 3.02-2.24 5.58-4.78 7.3v6.06h7.74c4.54-4.18 7.07-10.34 7.07-17.676z" fill="#4285F4"/><path d="M24.48 48c6.48 0 11.92-2.14 15.89-5.82l-7.74-6.06c-2.14 1.44-4.88 2.3-8.15 2.3-6.26 0-11.56-4.22-13.46-9.9H2.5v6.22C6.46 43.34 14.7 48 24.48 48z" fill="#34A853"/><path d="M11.02 28.52c-.48-1.44-.76-2.98-.76-4.52s.28-3.08.76-4.52v-6.22H2.5A23.98 23.98 0 000 24c0 3.98.96 7.76 2.5 11.22l8.52-6.7z" fill="#FBBC05"/><path d="M24.48 9.54c3.52 0 6.64 1.22 9.12 3.62l6.82-6.82C36.4 2.14 30.96 0 24.48 0 14.7 0 6.46 4.66 2.5 12.28l8.52 6.22c1.9-5.68 7.2-9.9 13.46-9.9z" fill="#EA4335"/></g><defs><clipPath id="clip0_17_40"><path fill="#fff" d="M0 0h48v48H0z"/></clipPath></defs></svg>
                Continue with Google
              </Button>
              {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 