/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    serverComponentsExternalPackages: ["sequelize", "mysql2"],
  },
};

module.exports = nextConfig;
