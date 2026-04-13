import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import crypto from "crypto";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function login(formData: FormData) {
  "use server";
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) {
    throw new Error("ADMIN_USERNAME / ADMIN_PASSWORD not configured");
  }
  if (username !== expectedUser || password !== expectedPass) {
    redirect("/admin/login?error=1");
  }
  const token = crypto.randomUUID();
  const cookieStore = await cookies();
  // Store the hashed token in a second cookie so middleware can validate
  cookieStore.set("admin_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  cookieStore.set("admin_session_hash", hashToken(token), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/admin");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <form
        action={login}
        className="bg-white rounded-3xl shadow-card ring-1 ring-outline-variant/40 p-10 lg:p-12 max-w-md w-full mx-4 relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-primary-container to-primary" />
        <h1 className="text-3xl font-black tracking-tighter uppercase mb-8">
          ZED ADMIN
        </h1>
        <div className="mb-4">
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" type="text" required autoFocus />
        </div>
        <div className="mb-6">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        {sp.error && (
          <p className="text-error text-sm mb-4">Invalid credentials</p>
        )}
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
    </div>
  );
}
