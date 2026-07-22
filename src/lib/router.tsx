// Couche d'abstraction routing — implémentation React Router (v7).
// ---------------------------------------------------------------------------
// Le code métier importe { Link, useRouter, usePathname, useParams,
// useSearchParams, Outlet } depuis ce module. Il ne dépend d'aucun framework
// de routing particulier : on peut remplacer cette implémentation sans
// toucher un seul composant.
// ---------------------------------------------------------------------------
import type { ComponentProps, ReactNode } from "react";
import {
  Link as RRLink,
  Outlet,
  useLocation,
  useNavigate,
  useParams as useRRParams,
  useSearchParams as useRRSearchParams,
} from "react-router-dom";

type LinkProps = Omit<ComponentProps<typeof RRLink>, "to"> & {
  href: string;
  children?: ReactNode;
};

export function Link({ href, ...rest }: LinkProps) {
  return <RRLink to={href} {...rest} />;
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (url: string) => navigate(url),
    replace: (url: string) => navigate(url, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => window.location.reload(),
    prefetch: (_url: string) => {},
  };
}

export function usePathname() {
  return useLocation().pathname;
}

export function useParams<
  T extends Record<string, string | undefined> = Record<string, string | undefined>,
>() {
  return useRRParams() as T;
}

// React Router renvoie un tuple [params, setParams] ; on renvoie uniquement
// l'objet URLSearchParams pour rester compatible avec l'API de next/navigation.
export function useSearchParams() {
  const [params] = useRRSearchParams();
  return params;
}

export { Outlet };
