import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-muted mb-4">404</p>
      <h1 className="font-display text-4xl mb-4">Page not found</h1>
      <p className="text-muted mb-8">The page you are looking for does not exist or has been moved.</p>
      <Link href="/" className="btn btn-primary">
        Back to home
      </Link>
    </div>
  );
}
