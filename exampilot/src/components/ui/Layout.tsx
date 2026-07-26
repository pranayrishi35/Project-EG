import type { ReactNode, HTMLAttributes } from "react";

/**
 * Section — full-width page section with consistent vertical rhythm.
 * Server-safe. Use `dark` for navy/canvas sections, default for paper.
 */
export interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  dark?: boolean;
  as?: "section" | "div" | "article";
}

export function Section({
  children,
  dark = false,
  as: Tag = "section",
  className = "",
  ...rest
}: SectionProps) {
  return (
    <Tag
      className={[
        "w-full py-16 md:py-24",
        dark
          ? "bg-brand-bg-canvas text-brand-ink-inverse"
          : "bg-brand-bg-paper text-brand-ink-primary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Container — centered max-width wrapper with horizontal padding.
 * Server-safe. Compose inside Section.
 */
export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  narrow?: boolean; // max-w-3xl for text-heavy content
}

export function Container({
  children,
  narrow = false,
  className = "",
  ...rest
}: ContainerProps) {
  return (
    <div
      className={[
        "mx-auto w-full px-4 sm:px-6",
        narrow ? "max-w-3xl" : "max-w-6xl",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
