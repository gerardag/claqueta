import { Sidebar } from "@/components/sidebar";
import { UserMenu } from "@/components/user-menu";
import { auth } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex flex-col md:flex-row h-full">
      <Sidebar userMenu={<UserMenu name={session?.user?.name ?? ""} />} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
    </div>
  );
}
