"use client";

import { useState } from "react";
import { Star } from "lucide-react";

type DisplayProps = {
  rating: number;
  count?: number;
  size?: "xs" | "sm" | "md" | "lg";
  interactive?: false;
};

type InteractiveProps = {
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive: true;
  onChange: (r: number) => void;
};

type Props = DisplayProps | InteractiveProps;

const SIZES = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export default function StarRating(props: Props) {
  const [hovered, setHovered] = useState(0);
  const { rating, size = "sm" } = props;
  const isInteractive = props.interactive === true;
  const display = isInteractive ? (hovered || rating) : rating;

  return (
    <div className={`flex items-center gap-0.5 ${isInteractive ? "cursor-pointer" : ""}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${SIZES[size]} transition-colors ${
            s <= display
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-muted-foreground/30"
          }`}
          onMouseEnter={() => isInteractive && setHovered(s)}
          onMouseLeave={() => isInteractive && setHovered(0)}
          onClick={() => isInteractive && (props as InteractiveProps).onChange(s)}
        />
      ))}
      {!isInteractive && (props as DisplayProps).count != null && (props as DisplayProps).count! > 0 && (
        <>
          <span className={`ml-1 font-semibold ${size === "xs" ? "text-[11px]" : "text-xs"} text-foreground`}>
            {rating.toFixed(1)}
          </span>
          <span className={`${size === "xs" ? "text-[11px]" : "text-xs"} text-muted-foreground`}>
            ({(props as DisplayProps).count})
          </span>
        </>
      )}
      {!isInteractive && (props as DisplayProps).count == null && rating > 0 && (
        <span className={`ml-1 font-semibold ${size === "xs" ? "text-[11px]" : "text-xs"} text-foreground`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
