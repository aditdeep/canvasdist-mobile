import useSWR from "swr";
import { fetcher } from "./api";

type Branding = { app_name: string; logo_path: string | null };

const FALLBACK: Branding = { app_name: "Super OEY", logo_path: null };

export function useBranding(): Branding {
  const { data } = useSWR<Branding>("/public/settings", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  return data ?? FALLBACK;
}
