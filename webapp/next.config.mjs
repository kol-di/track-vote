// This provides type definitions for Next.js configurations, useful if you're using VSCode or any other TypeScript-enabled editor
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,  // You can enable React's strict mode for catching potential issues in development
  
    // Async function to customize headers
    async headers() {
      return [
        {
          // Apply these headers to all incoming requests
          source: "/(.*)",
          headers: [
            {
              key: "X-Content-Type-Options",
              value: "nosniff"  // Helps prevent MIME type sniffing security vulnerability
            },
          ],
        },
        {
          // Specifically targeting JavaScript files under the _next/static/chunks directory
          source: "/_next/static/chunks/(.*)",
          headers: [
            {
              key: "Content-Type",
              value: "application/javascript"  // Ensuring JavaScript files are served with the correct Content-Type
            },
          ],
        },
      ];
    },
  };
  
  export default nextConfig;
  