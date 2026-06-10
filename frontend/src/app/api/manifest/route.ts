import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get('tenant');

  let name = "RestoBuddy";
  let shortName = "RestoBuddy";
  let iconUrl = "/icon.svg";

  if (tenantSlug) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      // We can fetch from the public storefront API to get the tenant settings
      const res = await fetch(`${apiUrl}/api/storefront/${tenantSlug}/settings`, {
        // Don't cache this aggressively so changes reflect
        next: { revalidate: 60 }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.restaurantName) {
          name = data.restaurantName;
          shortName = data.restaurantName;
        }
        if (data.logoUrl) {
          iconUrl = data.logoUrl;
        }
      }
    } catch (e) {
      console.error("Failed to fetch tenant settings for manifest:", e);
    }
  }

  let icons = [];
  
  if (iconUrl.startsWith('data:image')) {
    // If it's a base64 image (like the one we implemented in settings)
    const mimeType = iconUrl.split(';')[0].split(':')[1];
    icons = [
      {
        src: iconUrl,
        sizes: "192x192 512x512",
        type: mimeType,
        purpose: "any maskable"
      }
    ];
  } else if (iconUrl.startsWith('http') || iconUrl.startsWith('/')) {
    // If it's a direct URL or the default SVG
    icons = [
      {
        src: iconUrl,
        sizes: "192x192 512x512",
        type: iconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
        purpose: "any maskable"
      }
    ];
  } else {
    // Fallback if somehow logoUrl is weird
    icons = [
      {
        src: "/icon.svg",
        sizes: "192x192 512x512",
        type: "image/svg+xml",
        purpose: "any maskable"
      }
    ];
  }

  const manifest = {
    name: name,
    short_name: shortName,
    description: `Order delicious food from ${name}`,
    start_url: tenantSlug ? `/${tenantSlug}` : `/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ea580c",
    icons: icons
  };

  return NextResponse.json(manifest);
}
