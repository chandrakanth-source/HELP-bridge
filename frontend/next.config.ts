import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/user/:userId(\\d+)/:path*",
        destination: "/user/:path*",
      },
      {
        source: "/user/:userId(\\d+)",
        destination: "/user/dashboard",
      },
      {
        source: "/manager/:managerId(\\d+)/:path*",
        destination: "/manager/:path*",
      },
      {
        source: "/manager/:managerId(\\d+)",
        destination: "/manager/dashboard",
      },
      {
        source: "/provider/:providerId(\\d+)/:path*",
        destination: "/provider/:path*",
      },
      {
        source: "/provider/:providerId(\\d+)",
        destination: "/provider/dashboard",
      },
      {
        source: "/admin/:adminId(\\d+)/:path*",
        destination: "/admin/:path*",
      },
      {
        source: "/admin/:adminId(\\d+)",
        destination: "/admin/dashboard",
      },
    ];
  },
};

export default nextConfig;
