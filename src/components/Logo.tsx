import Image from "next/image";

interface LogoProps {
  size: number;
}

export default function Logo({ size }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="RybiaPaka.pl logo"
      width={size}
      height={size}
      data-critical-logo
      unoptimized
    />
  );
}
