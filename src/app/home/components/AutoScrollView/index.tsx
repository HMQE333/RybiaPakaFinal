"use client";

import React, { useState, useEffect } from "react";

interface AutoScrollViewProps {
  count: number;
  children?: React.ReactNode;
}

export default function AutoScrollView({
  count,
  children,
}: AutoScrollViewProps) {
  const [index, setIndex] = useState(0);

  const array = React.Children.toArray(children);
  const length = array.length;

  const visible = Array.from(
    { length: count },
    (_, i) => array[(index + i) % length]
  );

  useEffect(() => {
    if (length <= count) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % length);
    }, 4000);

    return () => clearInterval(interval);
  }, [length, count]);

  return (
    <div className="flex items-center justify-center gap-[30px]">{visible}</div>
  );
}
