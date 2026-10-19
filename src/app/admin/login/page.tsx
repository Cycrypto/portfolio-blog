import { redirect } from "next/navigation";
import { isOwner, localLoginHint } from "@/lib/auth";
import { Login } from "@/components/login";
export const dynamic = "force-dynamic";
export default async function LoginPage() {
  if (await isOwner()) redirect("/admin");
  return <Login localHint={await localLoginHint()} />;
}
