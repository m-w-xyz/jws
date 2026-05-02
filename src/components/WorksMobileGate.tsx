"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

const MOBILE_MAX = "(max-width: 767px)";

type Props = {
  children: ReactNode;
};

/** `/works` listing is omitted on narrow viewports — bounce home before paint when possible. */
export default function WorksMobileGate({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [suppressListingFlash, setSuppressListingFlash] = useState(false);

  useLayoutEffect(() => {
    if (pathname !== "/works") {
      setSuppressListingFlash(false);
      return;
    }
    const mq = window.matchMedia(MOBILE_MAX);
    const sync = () => {
      if (!mq.matches) {
        setSuppressListingFlash(false);
        return;
      }
      setSuppressListingFlash(true);
      router.replace("/");
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [pathname, router]);

  if (pathname === "/works" && suppressListingFlash) return null;

  return children;
}
