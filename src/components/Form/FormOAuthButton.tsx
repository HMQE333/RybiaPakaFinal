import IconImage from "@/components/IconImage";
import { SOCIAL_ICON_URLS, type SocialIconKey } from "@/lib/iconAssets";

interface FormOAuthButtonProps {
  icon: SocialIconKey;
  onClick: () => void;
}

export default function FormOAuthButton({
  icon,
  onClick,
}: FormOAuthButtonProps) {
  const src = SOCIAL_ICON_URLS[icon];
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-[50px] flex items-center justify-center bg-background-4 rounded-lg hover:shadow-2xl hover:cursor-pointer"
    >
      <IconImage src={src} alt={`${icon} icon`} width={25} height={25} />
    </button>
  );
}
