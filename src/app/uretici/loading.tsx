import { LogoLoader } from "@/components/ui/LogoLoader";

export default function Loading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <LogoLoader />
    </div>
  );
}
