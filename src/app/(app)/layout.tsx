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
  const name = session?.user?.name ?? "";

  return (
    <div className="flex flex-col min-h-full">
      <Header
        userMenu={<UserMenu name={name} />}
        mobileUserMenu={<UserMenu name={name} variant="stacked" />}
      />
      <main className="mx-auto w-full max-w-[1024px] flex-1 px-4 py-4">
        {children}
      </main>
      <Footer />
    </div>
  );
}
