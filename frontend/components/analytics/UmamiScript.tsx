import Script from "next/script"

const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL
const domains = process.env.NEXT_PUBLIC_UMAMI_DOMAINS

const beforeSendScript = `
  window.umamiBeforeSend = function(type, payload) {
    try {
      var pathname = "";
      if (payload && payload.url) {
        pathname = new URL(payload.url, window.location.origin).pathname || "";
      }

      if (!pathname && window.location) {
        pathname = window.location.pathname || "";
      }

      if (pathname === "/admin" || pathname.indexOf("/admin/") === 0) {
        return false;
      }

      return payload;
    } catch (error) {
      return payload;
    }
  };
`

export function UmamiScript() {
  if (!websiteId || !scriptUrl) {
    return null
  }

  return (
    <>
      <Script id="umami-before-send" strategy="beforeInteractive">
        {beforeSendScript}
      </Script>
      <Script
        id="umami-script"
        src={scriptUrl}
        data-website-id={websiteId}
        data-before-send="umamiBeforeSend"
        data-domains={domains}
        strategy="afterInteractive"
      />
    </>
  )
}
