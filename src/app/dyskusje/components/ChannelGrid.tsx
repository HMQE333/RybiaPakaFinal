import { CHANNELS } from "@/const/channels";

import ChatButton from "./ChatButton";

type ChannelGridProps = {
  isAdmin?: boolean;
};

export default function ChannelGrid({ isAdmin = false }: ChannelGridProps) {
  const visibleChannels = CHANNELS.filter(
    (channel) => !channel.adminOnly || isAdmin
  );

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {visibleChannels.map((channel) => {
        return <ChatButton key={channel.id} {...channel} />;
      })}
    </section>
  );
}
