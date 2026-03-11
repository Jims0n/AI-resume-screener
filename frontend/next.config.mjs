/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        // Only proxy /api in local development (when no production API URL is set)
        if (process.env.NEXT_PUBLIC_API_URL) {
            return [];
        }
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:8000/api/:path*',
            },
        ];
    },
};

export default nextConfig;
