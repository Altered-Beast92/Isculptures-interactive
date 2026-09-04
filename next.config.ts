import type { NextConfig } from 'next';
const nextConfig: NextConfig = { output: 'export', experimental: { optimizePackageImports: ['three', '@react-three/drei'] } };
export default nextConfig;
