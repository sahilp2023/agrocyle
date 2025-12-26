import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to Hindi login by default
  redirect("/hi/login");
}
