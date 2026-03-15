import { StaticImageData } from "next/image";

interface ImageProps {
  image: StaticImageData;
}

export default function Image({ image }: ImageProps) {
  return <img src={image.src} alt="Image" loading="lazy" decoding="async" />;
}
