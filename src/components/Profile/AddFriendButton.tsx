"use client";
import { useMemo, useState } from "react";
import { UserPlus, Check } from "lucide-react";
import GenericButton from "./GenericButton";

interface AddFriendButtonProps {
  onClick?: () => void;
}

export default function AddFriendButton({ onClick }: AddFriendButtonProps) {
  const [invited, setInvited] = useState(false);
  const [burst, setBurst] = useState(false);

  const icon = useMemo(
    () => (invited ? <Check size={16} /> : <UserPlus size={16} />),
    [invited]
  );
  const label = invited ? "Zaproszono" : "Dodaj znajomego";
  const variant = invited ? "default" : ("success" as const);

  function handleClick() {
    if (!invited) {
      setBurst(true);
      setTimeout(() => setBurst(false), 650);
    }
    setInvited((v) => !v);
    onClick?.();
  }

  return (
    <div className="relative">
      <GenericButton
        icon={icon}
        label={label}
        expandedOnlyOnHover={false}
        variant={variant}
        onClick={handleClick}
      />
      {burst && (
        <div className="pointer-events-none absolute inset-0">
          {/* particles */}
          <span
            className="particle"
            style={
              {
                left: "50%",
                top: "50%",
                ["--tx" as any]: "-18px",
                ["--ty" as any]: "-24px",
              } as any
            }
          />
          <span
            className="particle"
            style={
              {
                left: "50%",
                top: "50%",
                ["--tx" as any]: "22px",
                ["--ty" as any]: "-16px",
              } as any
            }
          />
          <span
            className="particle"
            style={
              {
                left: "50%",
                top: "50%",
                ["--tx" as any]: "-20px",
                ["--ty" as any]: "14px",
              } as any
            }
          />
          <span
            className="particle"
            style={
              {
                left: "50%",
                top: "50%",
                ["--tx" as any]: "16px",
                ["--ty" as any]: "20px",
              } as any
            }
          />
          <span
            className="particle"
            style={
              {
                left: "50%",
                top: "50%",
                ["--tx" as any]: "0px",
                ["--ty" as any]: "-28px",
              } as any
            }
          />
          <span
            className="particle"
            style={
              {
                left: "50%",
                top: "50%",
                ["--tx" as any]: "0px",
                ["--ty" as any]: "26px",
              } as any
            }
          />
        </div>
      )}
    </div>
  );
}
