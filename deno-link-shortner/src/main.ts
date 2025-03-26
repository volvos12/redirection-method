import {
  updateShortLinkUrl,
  generateShortCode,
  getClickEvent,
  getShortLink,
  getUserLinks,
  incrementClickCount,
  storeShortLink,
  watchShortLink,
} from "./db.ts";
import { Router } from "./router.ts";
import { render } from "npm:preact-render-to-string";
import {
  CreateShortlinkPage,
  HomePage,
  LinksPage,
  NotFoundPage,
  ShortlinkViewPage,
} from "./ui.tsx";
import { serveDir } from "@std/http";

const app = new Router();

// Home route
app.get("/", () => {
  return new Response(render(HomePage()), {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  });
});

// Create new short link route
app.get("/links/new", () => {
  return new Response(render(CreateShortlinkPage()), {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  });
});

// View a short link route
app.get("/links/:id", async (_req, _info, params) => {
  const shortCode = params.pathname.groups["id"];
  const shortLink = await getShortLink(shortCode);

  if (!shortLink) {
    return new Response(render(NotFoundPage({ shortCode })), {
      status: 404,
      headers: {
        "content-type": "text/html",
      },
    });
  }

  return new Response(render(ShortlinkViewPage({ shortLink })), {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  });
});

// List all user links route
app.get("/links", async () => {
  const shortLinks = await getUserLinks("public");

  return new Response(render(LinksPage({ shortLinkList: shortLinks })), {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  });
});

// Create a new short link (POST route)
app.post("/links", async (req) => {
  const formData = await req.formData();
  const longUrl = formData.get("longUrl") as string;

  if (!longUrl) {
    return new Response("Missing longUrl", { status: 400 });
  }

  const shortCode = await generateShortCode(longUrl);
  await storeShortLink(longUrl, shortCode, "public");

  return new Response(null, {
    status: 303,
    headers: {
      "Location": "/links",
    },
  });
});

// Realtime link analytics stream route
app.get("/realtime/:id", (_req, _info, params) => {
  const shortCode = params?.pathname.groups["id"];
  const stream = watchShortLink(shortCode!);

  const body = new ReadableStream({
    async start(controller) {
      while (true) {
        const { done } = await stream.read();
        if (done) {
          return;
        }

        const shortLink = await getShortLink(shortCode);
        const clickAnalytics = shortLink.clickCount > 0 &&
          await getClickEvent(shortCode, shortLink.clickCount);

        controller.enqueue(
          new TextEncoder().encode(
            `data: ${
              JSON.stringify({
                clickCount: shortLink.clickCount,
                clickAnalytics,
              })
            }\n\n`
          )
        );
        console.log("Stream updated");
      }
    },
    cancel() {
      stream.cancel();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});

// Redirect to the original long URL for short links
app.get("/:id", async (req, _info, params) => {
  const shortCode = params.pathname.groups["id"];
  const shortLink = await getShortLink(shortCode);

  if (shortLink) {
    const ipAddress = req.headers.get("x-forwarded-for") ||
      req.headers.get("cf-connecting-ip") || "Unknown";
    const userAgent = req.headers.get("user-agent") || "Unknown";
    const country = req.headers.get("cf-ipcountry") || "Unknown";

    await incrementClickCount(shortCode, {
      ipAddress,
      userAgent,
      country,
    });

    return new Response(null, {
      status: 303,
      headers: {
        "Location": shortLink.longUrl,
      },
    });
  } else {
    return new Response(render(NotFoundPage({ shortCode })), {
      status: 404,
      headers: {
        "Content-Type": "text/html",
      },
    });
  }
});

// Static Assets
app.get("/static/*", (req) => serveDir(req));

export default {
  fetch(req) {
    return app.handler(req);
  },
} satisfies Deno.ServeDefaultExport;


// In main.ts
app.post("/links/:id", async (req, _info, params) => {
  const shortCode = params.pathname.groups["id"];
  const formData = await req.formData();
  const newLongUrl = formData.get("longUrl") as string;

  if (!newLongUrl) {
    return new Response("Missing longUrl", { status: 400 });
  }

  const shortLink = await getShortLink(shortCode);

  if (!shortLink) {
    return new Response("Shortlink not found", { status: 404 });
  }

  const updatedShortLink = await updateShortLinkUrl(shortCode, newLongUrl);

  // Return the updated page instead of redirecting
  return new Response(render(ShortlinkViewPage({ shortLink: updatedShortLink })), {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  });
});
