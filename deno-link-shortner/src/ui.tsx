import type { ShortLink } from "./db.ts";
import type { ComponentChildren } from "npm:preact";

interface PageProps {
  shortLink?: ShortLink | null;
  shortLinkList?: (ShortLink | null)[];
}

const BASE_URL = Deno.env.get("DENO_ENV") === "dev"
  ? "http://localhost:8000"
  : "https://redirection-method.vercel.app";

export function Layout({ children }: { children: ComponentChildren }) {
  return (
    <html data-theme="light">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://cdn.jsdelivr.net/npm/daisyui@4.12.13/dist/full.min.css"
          rel="stylesheet"
          type="text/css"
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="icon" type="image/png" href="/static/logo.png" />
      </head>
      <body className="min-h-screen flex flex-col bg-base-100">
        <header className="navbar bg-primary text-primary-content shadow-lg">
          <div className="navbar-start">
            <div className="dropdown">
              <label tabIndex={0} className="btn btn-ghost lg:hidden">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h8m-8 6h16"
                  />
                </svg>
              </label>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 text-primary"
              >
                <li><a href="/">Home</a></li>
                <li><a href="/links">All Links</a></li>
                <li><a href="/links/new">Create Link</a></li>
              </ul>
            </div>
            <a href="/" className="btn btn-ghost normal-case text-xl">
              Link Shortner
            </a>
          </div>
          <div className="navbar-end hidden lg:flex">
            <ul className="menu menu-horizontal px-1">
              <li><a href="/">Home</a></li>
              <li><a href="/links">All Links</a></li>
              <li><a href="/links/new">Create Link</a></li>
            </ul>
          </div>
        </header>

        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}

export function HomePage() {
  return (
    <Layout>
      <div className="hero min-h-[500px] bg-base-200 rounded-box">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Welcome to link.fireship.app</h1>
            <p className="py-6">
              link.fireship.app is a Deno-powered URL shortening service.
              Create, manage, and track your links with enterprise-grade tools.
            </p>
            <a href="/links/new" className="btn btn-primary">
              Create a Short Link
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export function LinksPage({ shortLinkList }: PageProps) {
  return (
    <Layout>
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-6">Shortlinks</h2>
          <div className="space-y-4">
            {shortLinkList?.map((link) => (
              <div
                key={link.shortCode}
                className="card bg-base-200 hover:bg-base-300 transition-colors"
              >
                <div className="card-body">
                  <h3 className="card-title text-primary hover:text-primary-focus">
                    <a href={`/links/${link.shortCode}`}>{link.shortCode}</a>
                  </h3>
                  <p className="text-base-content/70 truncate">
                    {link.longUrl}
                  </p>
                  <div className="flex gap-4 text-sm text-base-content/60">
                    <span>
                      Created: {new Date(link.createdAt).toLocaleDateString()}
                    </span>
                    <div className="badge badge-primary">
                      {link.clickCount} clicks
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export function CreateShortlinkPage() {
  return (
    <Layout>
      <div className="card bg-base-100 shadow-xl max-w-2xl mx-auto">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-6">Create a New Shortlink</h2>
          <form action="/links" method="POST" className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Long URL</span>
              </label>
              <input
                type="url"
                name="longUrl"
                required
                placeholder="https://example.com/your-long-url"
                className="input input-bordered w-full"
              />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Create Shortlink
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
export function ShortlinkViewPage({ shortLink }: PageProps) {
  return (
    <Layout>
      <div className="space-y-8">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Clicks</div>
            <div className="stat-value">{shortLink?.clickCount}</div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Shortlink Details</h2>
            <div className="divider"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Short URL</span>
                </label>
                <a href={`/${shortLink?.shortCode}`} className="link link-primary">
                  {`${BASE_URL}/${shortLink?.shortCode}`}
                </a>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Long URL</span>
                </label>
                <a href={shortLink?.longUrl} className="link link-primary">
                  {shortLink?.longUrl}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Form to update the Long URL */}
        <div className="card bg-base-100 shadow-xl max-w-2xl mx-auto">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-6">Edit Long URL</h2>
            <form action={`/links/${shortLink?.shortCode}`} method="POST" className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">New Long URL</span>
                </label>
                <input
                  type="url"
                  name="longUrl"
                  required
                  placeholder="https://example.com/your-new-url"
                  className="input input-bordered w-full"
                  defaultValue={shortLink?.longUrl}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                Update Long URL
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}


export function NotFoundPage({ shortCode }: { shortCode: string }) {
  return (
    <Layout>
      <div className="hero min-h-[400px]">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">404</h1>
            <p className="py-6">
              Sorry, the shortlink "{shortCode}" doesn't exist.
            </p>
            <a href="/" className="btn btn-primary">Go to Homepage</a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
