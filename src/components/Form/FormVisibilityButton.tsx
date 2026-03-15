import { LucideEye, LucideEyeOff } from "lucide-react";

interface FormVisibilityButtonProps {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function FormVisibilityButton({
  visible,
  setVisible,
}: FormVisibilityButtonProps) {
  return (
    <button
      type="button"
      onClick={() => setVisible(!visible)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-2 hover:text-accent hover:cursor-pointer"
    >
      {visible ? <LucideEye size={20} /> : <LucideEyeOff size={20} />}
    </button>
  );
}
