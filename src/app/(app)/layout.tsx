import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { auth } from "@/lib/auth";
import { getAvatarUrl } from "@/lib/auth-helpers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const avatarUrl = session?.user?.id
    ? await getAvatarUrl(Number(session.user.id))
    : null;

  return (
    <div className="flex flex-col min-h-full">
      <Header avatarUrl={avatarUrl} />
      <main className="mx-auto w-full max-w-[1024px] flex-1 px-4 py-4">
        {children}
      </main>
      <Footer />
    </div>
  );
}
