import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>
            Welcome back. Enter your credentials to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm />

          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">
              Demo accounts (password: <code>password</code>)
            </p>
            <ul className="mt-1 space-y-0.5">
              <li>alice@demo.dev — Owner</li>
              <li>bob@demo.dev — Editor</li>
              <li>carol@demo.dev — Viewer</li>
            </ul>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link
              href="/register"
              className="text-foreground underline underline-offset-4"
            >
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
