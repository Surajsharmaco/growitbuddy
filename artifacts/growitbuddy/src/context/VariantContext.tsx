// Public-side variant context — set by VariantResolver when rendering a
// variant URL. Tells usePublicContent() to read from the namespaced
// `${sourceKey}__v__${slug}` siteContent key instead of the base key.
import { createContext, useContext, type ReactNode } from "react";

export interface VariantInfo {
  slug: string;
  sourceKey: string;
  label: string;
}

const VariantContext = createContext<VariantInfo | null>(null);

export function VariantProvider({ value, children }: { value: VariantInfo; children: ReactNode }) {
  return <VariantContext.Provider value={value}>{children}</VariantContext.Provider>;
}

export function useVariant(): VariantInfo | null {
  return useContext(VariantContext);
}
