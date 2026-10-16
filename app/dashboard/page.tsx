import DashboardClient from "./dashboard-client";
import { requireActiveUser } from "@/lib/user-access";

export default async function DashboardPage() {
  await requireActiveUser();

  return <DashboardClient />;
}