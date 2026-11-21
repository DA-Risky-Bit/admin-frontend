import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

// Global client loader to enforce admin role and redirect to app subdomain if unauthorized
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  if (typeof window === "undefined") return null;

  const url = new URL(request.url);

  // Prevent infinite loops if we are already on the app subdomain
  if (url.hostname.startsWith("app.")) {
    return null;
  }

  const token = localStorage.getItem("token");
  let isAdmin = false;

  if (token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      if (payload.role === 1) {
        isAdmin = true;
      }
    } catch (error) {
      // Token parsing failed, treat as unauthenticated
      localStorage.removeItem("token");
    }
  }

  // If not logged in or not an admin (role !== 1), redirect to app.{domain}
  if (!isAdmin) {
    const hostParts = url.hostname.split('.');

    // Swap or insert 'app' as the subdomain
    if (hostParts.length > 1) {
      hostParts[0] = 'app';
    } else {
      hostParts.unshift('app');
    }

    const newHost = hostParts.join('.') + (url.port ? `:${url.port}` : '');
    const targetUrl = `${url.protocol}//${newHost}${url.pathname}${url.search}`;

    window.location.href = targetUrl;
    return null;
  }

  return { authorized: true };
}

clientLoader.hydrate = true;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
