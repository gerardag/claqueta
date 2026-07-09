import { Header } from "@/components/header";
import { UserMenu } from "@/components/user-menu";
import { Footer } from "@/components/footer";
import { auth } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex flex-col min-h-full">
      <Header userMenu={<UserMenu name={session?.user?.name ?? ""} />} />
      <main className="mx-auto w-full max-w-[1024px] flex-1 px-4 py-4">
        {children}
      </main>
      <Footer />
    </div>
  );
}
