import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { RegisterForm } from "@/components/register-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Create account</CardTitle>
          <CardDescription>
            Sign up to start writing local-first documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RegisterForm />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-foreground underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
