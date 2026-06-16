import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cikisYap } from "@/app/(auth)/login/actions";
import { panelYolu } from "@/lib/roller";
import { GridMark } from "@/components/GridMark";

/** Emlakçı havuzu — yalnız 'emlakci' rolüne. Diğer roller kendi paneline yönlenir. */
export default async function HavuzLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profil } = await supabase
    .from("profiles")
    .select("ad, rol")
    .eq("id", user.id)
    .single();

  if (!profil || profil.rol !== "emlakci") {
    redirect(profil ? panelYolu(profil.rol) : "/");
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-hair bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link
            href="/havuz"
            className="flex items-center gap-2 font-display text-lg font-semibold text-navy"
          >
            <GridMark />
            ProjePazar
            <span className="text-sm font-normal text-gray">· Havuz</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-gray sm:inline">{profil.ad ?? user.email}</span>
            <form action={cikisYap}>
              <button className="rounded-lg border border-hair px-3 py-1.5 font-medium text-navy transition-colors hover:border-teal">
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-paper">{children}</main>
    </div>
  );
}
