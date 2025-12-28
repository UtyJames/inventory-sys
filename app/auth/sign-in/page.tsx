import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignInForm from "./sign-in-form";

export default async function SignInPage() {
    const session = await auth();
    if (session) redirect("/");

    return <SignInForm />;
}
