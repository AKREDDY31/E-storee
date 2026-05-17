import { AdminUsersClient } from "@/components/admin/admin-users-client";
import { getUsers } from "@/lib/queries";

export default async function AdminUsersPage() {
  const users = await getUsers();
  return <AdminUsersClient users={users} />;
}
