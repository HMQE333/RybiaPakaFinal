"use client";
import { useEffect, useRef, useState } from "react";
import { UserPlus, Check, Clock, UserCheck, UserX, Loader2 } from "lucide-react";
import GenericButton from "./GenericButton";

type FriendStatus = "loading" | "none" | "pending_sent" | "pending_received" | "friends";

interface AddFriendButtonProps {
  targetUsername?: string;
  targetId?: number;
  onClick?: () => void;
}

export default function AddFriendButton({ targetUsername, targetId, onClick }: AddFriendButtonProps) {
  const [status, setStatus] = useState<FriendStatus>(targetUsername ? "loading" : "none");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [burst, setBurst] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!targetUsername) return;
    fetch(`/api/znajomi/status/${encodeURIComponent(targetUsername)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted.current) return;
        setStatus(data.status ?? "none");
        setRequestId(data.requestId ?? null);
        setFriendshipId(data.friendshipId ?? null);
      })
      .catch(() => { if (mounted.current) setStatus("none"); });
  }, [targetUsername]);

  async function handleSendRequest() {
    if (!targetUsername) return;
    setBurst(true);
    setTimeout(() => setBurst(false), 650);
    try {
      const res = await fetch("/api/znajomi/zaproszenia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: targetUsername }),
      });
      const data = await res.json();
      if (mounted.current) {
        if (res.ok) {
          setStatus("pending_sent");
          setRequestId(data.request?.id ?? null);
        }
      }
    } catch {}
    onClick?.();
  }

  async function handleCancelRequest() {
    if (!requestId) return;
    try {
      await fetch(`/api/znajomi/zaproszenia/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (mounted.current) {
        setStatus("none");
        setRequestId(null);
      }
    } catch {}
  }

  async function handleAccept() {
    if (!requestId) return;
    try {
      const res = await fetch(`/api/znajomi/zaproszenia/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (res.ok && mounted.current) {
        setStatus("friends");
        setRequestId(null);
      }
    } catch {}
  }

  async function handleReject() {
    if (!requestId) return;
    try {
      await fetch(`/api/znajomi/zaproszenia/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      if (mounted.current) {
        setStatus("none");
        setRequestId(null);
      }
    } catch {}
  }

  async function handleRemoveFriend() {
    if (!friendshipId) return;
    try {
      await fetch(`/api/znajomi/${friendshipId}`, { method: "DELETE" });
      if (mounted.current) {
        setStatus("none");
        setFriendshipId(null);
      }
    } catch {}
  }

  if (status === "loading") {
    return (
      <div className="h-10 px-4 flex items-center gap-2 rounded-full border border-white/10 text-foreground-2 text-sm">
        <Loader2 size={14} className="animate-spin" />
      </div>
    );
  }

  if (status === "friends") {
    return (
      <div className="relative">
        <GenericButton
          icon={<UserCheck size={16} />}
          label="Znajomy"
          variant="default"
          onClick={handleRemoveFriend}
          title="Kliknij aby usunąć ze znajomych"
        />
      </div>
    );
  }

  if (status === "pending_received") {
    return (
      <div className="flex items-center gap-2">
        <GenericButton
          icon={<Check size={16} />}
          label="Przyjmij"
          variant="success"
          onClick={handleAccept}
        />
        <GenericButton
          icon={<UserX size={16} />}
          label="Odrzuć"
          variant="danger"
          onClick={handleReject}
        />
      </div>
    );
  }

  if (status === "pending_sent") {
    return (
      <GenericButton
        icon={<Clock size={16} />}
        label="Zaproszono"
        variant="default"
        onClick={handleCancelRequest}
        title="Kliknij aby anulować zaproszenie"
      />
    );
  }

  return (
    <div className="relative">
      <GenericButton
        icon={<UserPlus size={16} />}
        label="Dodaj znajomego"
        variant="success"
        onClick={handleSendRequest}
      />
      {burst && (
        <div className="pointer-events-none absolute inset-0">
          {[
            { tx: "-18px", ty: "-24px" }, { tx: "22px", ty: "-16px" },
            { tx: "-20px", ty: "14px" }, { tx: "16px", ty: "20px" },
            { tx: "0px", ty: "-28px" }, { tx: "0px", ty: "26px" },
          ].map((p, i) => (
            <span
              key={i}
              className="particle"
              style={{ left: "50%", top: "50%", ["--tx" as any]: p.tx, ["--ty" as any]: p.ty }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
