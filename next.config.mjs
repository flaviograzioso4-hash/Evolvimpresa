/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',           // abilita export statico
  images: { unoptimized: true }, // se usi <Image/>
  trailingSlash: true         // opzionale ma utile su hosting statici
};

export default nextConfig;

