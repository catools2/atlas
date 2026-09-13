import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { rememberTitle } from "./titleCache";

/**
 * Lets a detail page name itself in the breadcrumb.
 *
 * <p>The crumb for `/apis/specs/4821` starts as "4821" — always available, never blank — and
 * becomes "Payments v3" once the page has fetched enough to know. The page is the only thing
 * that knows, and it already made the request, so it publishes rather than the bar fetching
 * again.
 *
 * <p>Written from an effect, never during render: a page pushing state upward while rendering
 * is how this shape becomes an update loop.
 */
export function usePublishedTitle(title: string | null | undefined): void {
  const { pathname } = useLocation();

  useEffect(() => {
    rememberTitle(pathname, title);
  }, [pathname, title]);
}
