import * as React from "react";
import { Slot } from "radix-ui";
import { ArrowRight, Copy, Check } from "@tea-ui/icons";
import { cn, cva, type VariantProps } from "@tea-ui/utils";
import { COPY } from "@tea-ui/ux-standards";

import { dataSlot } from "../internal";

/**
 * TEA UI — typography.
 *
 * One type scale, used everywhere. The audit found the two source projects
 * between them rendering real UI text at **9px and 10px** — sizes that fail
 * legibility for anyone with reduced acuity and fail outright for anyone with a
 * low-vision condition. This scale has no step below 11px, and the 11px step is
 * reserved for uppercase micro-labels, where the letterforms are short and the
 * extra weight compensates.
 *
 * `Heading` renders a **real heading element** at the level it is given. The
 * audit found a `CardTitle` rendering a `<div>`, which silently flattened the
 * heading structure of every page that used it — a screen-reader user navigating
 * by heading had nothing to navigate by. `level` is therefore required and has
 * no default guess.
 */

export const textVariants = cva("", {
  variants: {
    size: {
      label: "text-label",
      micro: "text-micro",
      ui: "text-ui",
      body: "text-body",
      lead: "text-lead",
      title: "text-title",
      section: "text-section",
      display: "text-display",
      hero: "text-hero",
    },
    tone: {
      default: "text-fg",
      muted: "text-fg-muted",
      subtle: "text-fg-subtle",
      inverse: "text-fg-inverse",
      accent: "text-primary",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: { size: "ui", tone: "default" },
});

export interface TextProps
  extends Omit<React.ComponentProps<"p">, "color">,
    VariantProps<typeof textVariants> {
  asChild?: boolean | undefined;
  /** The element to render. Ignored when `asChild` is set. */
  as?: React.ElementType | undefined;
  align?: "start" | "center" | "end" | "justify" | undefined;
  truncate?: boolean | undefined;
  /** Opt into `text-wrap: balance` for headlines only. */
  balance?: boolean | undefined;
}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(function Text(
  {
    asChild = false,
    as,
    size,
    tone,
    weight,
    align,
    truncate = false,
    balance = false,
    className,
    ...props
  },
  ref,
) {
  const Component = (asChild ? Slot.Root : (as ?? "p")) as React.ElementType;
  return (
    <Component
      ref={ref}
      className={cn(
        textVariants({ size, tone, weight }),
        align === "center" && "text-center",
        align === "end" && "text-end",
        align === "justify" && "text-justify",
        truncate && "truncate",
        balance && "text-balance",
        className,
      )}
      {...dataSlot("text")}
      {...props}
    />
  );
});

export interface HeadingProps extends Omit<React.ComponentProps<"h1">, "color"> {
  /** The heading level. Required — there is no safe default for a document. */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  tone?: "default" | "muted" | "accent" | undefined;
  weight?: "semibold" | "bold" | undefined;
  balance?: boolean | undefined;
  className?: string | undefined;
}

const HEADING_SIZE: Record<HeadingProps["level"], string> = {
  1: "text-display",
  2: "text-section",
  3: "text-title",
  4: "text-lead",
  5: "text-ui",
  6: "text-label",
};

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level, tone = "default", weight = "semibold", balance = true, className, ...props },
  ref,
) {
  const Tag = `h${level}` as "h1";
  return (
    <Tag
      ref={ref}
      className={cn(
        HEADING_SIZE[level],
        level >= 4 && "font-medium",
        level <= 2 && (weight === "bold" ? "font-bold" : "font-semibold"),
        tone === "muted" && "text-fg-muted",
        tone === "accent" && "text-primary",
        balance && "text-balance",
        className,
      )}
      {...dataSlot("heading", `h${level}`)}
      {...props}
    />
  );
});

/**
 * The TEA micro-label. This exact class string appeared verbatim twenty times
 * across one source project. It is a token, not a class.
 */
export const Eyebrow = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(function Eyebrow(
  { className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn("text-label font-semibold uppercase tracking-widest text-fg-muted", className)}
      {...dataSlot("eyebrow")}
      {...props}
    />
  );
});

export const Caption = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(
  function Caption({ className, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn("text-micro text-fg-subtle", className)}
        {...dataSlot("caption")}
        {...props}
      />
    );
  },
);

export const InlineCode = React.forwardRef<HTMLElement, React.ComponentProps<"code">>(
  function InlineCode({ className, ...props }, ref) {
    return (
      <code
        ref={ref as React.Ref<HTMLElement>}
        className={cn(
          "border border-line bg-surface-2 px-1 py-0.5 font-mono text-micro text-primary",
          className,
        )}
        {...dataSlot("code", "inline")}
        {...props}
      />
    );
  },
);

export interface PreformattedProps extends React.ComponentProps<"pre"> {
  /** Clip instead of growing, with a scrollbar. */
  maxHeight?: number | string | undefined;
  /** A copy button, labelled in German from the shared copy deck. */
  copyable?: boolean | undefined;
  className?: string | undefined;
}

export const Preformatted = React.forwardRef<HTMLPreElement, PreformattedProps>(function Preformatted(
  { maxHeight, copyable = false, className, children, ...props },
  ref,
) {
  const [copied, setCopied] = React.useState(false);

  const copy = React.useCallback(() => {
    const text = typeof children === "string" ? children : (event_text(children));
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [children]);

  return (
    <div className={cn("relative", className)} {...dataSlot("code", "block-wrapper")}>
      <pre
        ref={ref}
        style={{ maxHeight }}
        className={cn(
          "overflow-auto border border-line bg-surface-2 p-3 font-mono text-mono text-fg",
          maxHeight && "overflow-y-auto",
        )}
        tabIndex={0}
        {...dataSlot("code", "block")}
        {...props}
      >
        {children}
      </pre>
      {copyable ? (
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? COPY.actions.copied : COPY.actions.copy}
          className="absolute end-2 top-2 border border-line bg-surface p-1 text-fg-muted transition-colors hover:text-fg"
          {...dataSlot("code", "copy")}
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        </button>
      ) : null}
    </div>
  );
});

function event_text(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(event_text).join("");
  return "";
}

export const Kbd = React.forwardRef<HTMLElement, React.ComponentProps<"kbd">>(function Kbd(
  { className, ...props },
  ref,
) {
  return (
    <kbd
      ref={ref as React.Ref<HTMLElement>}
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center border border-line-strong bg-surface-3 px-1",
        "font-mono text-label text-fg-muted",
        className,
      )}
      {...dataSlot("kbd")}
      {...props}
    />
  );
});

export interface LinkProps extends Omit<React.ComponentProps<"a">, "color"> {
  asChild?: boolean | undefined;
  /** Opens in a new tab. Adds `rel` and an accessible hint. */
  external?: boolean | undefined;
  /** Suppress the underline until hover. */
  subtle?: boolean | undefined;
  className?: string | undefined;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { asChild = false, external = false, subtle = false, className, children, ...props },
  ref,
) {
  const Component = (asChild ? Slot.Root : "a") as React.ElementType;
  return (
    <Component
      ref={ref}
      className={cn(
        "text-primary underline-offset-4 transition-colors hover:underline",
        subtle && "no-underline hover:underline",
        className,
      )}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...dataSlot("link")}
      {...props}
    >
      {children}
      {external ? (
        <>
          <ArrowRight size={14} aria-hidden="true" className="ms-1 inline-block align-[-2px]" />
          <span className="sr-only"> (external link, opens in a new tab)</span>
        </>
      ) : null}
    </Component>
  );
});

export const Blockquote = React.forwardRef<HTMLQuoteElement, React.ComponentProps<"blockquote">>(
  function Blockquote({ className, ...props }, ref) {
    return (
      <blockquote
        ref={ref}
        className={cn("border-s-2 border-primary ps-4 text-lead text-fg-muted italic", className)}
        {...dataSlot("blockquote")}
        {...props}
      />
    );
  },
);

export interface ListProps extends React.ComponentProps<"ul"> {
  ordered?: boolean | undefined;
}

export const List = React.forwardRef<HTMLUListElement, ListProps>(function List(
  { ordered = false, className, children, ...props },
  ref,
) {
  const Tag = (ordered ? "ol" : "ul") as "ul";
  return (
    <Tag
      ref={ref}
      className={cn(
        "ms-5 flex flex-col gap-1.5 text-ui text-fg-muted",
        ordered ? "list-decimal" : "list-disc",
        "marker:text-fg-subtle",
        className,
      )}
      {...dataSlot("list")}
      {...props}
    >
      {children}
    </Tag>
  );
});

export const DefinitionList = React.forwardRef<HTMLDListElement, React.ComponentProps<"dl">>(
  function DefinitionList({ className, ...props }, ref) {
    return <dl ref={ref} className={cn("grid gap-1", className)} {...dataSlot("definition-list")} {...props} />;
  },
);

export const DefinitionTerm = React.forwardRef<HTMLElement, React.ComponentProps<"dt">>(
  function DefinitionTerm({ className, ...props }, ref) {
    return <dt ref={ref} className={cn("text-ui font-medium text-fg", className)} {...dataSlot("definition-term")} {...props} />;
  },
);

export const DefinitionDetail = React.forwardRef<HTMLElement, React.ComponentProps<"dd">>(
  function DefinitionDetail({ className, ...props }, ref) {
    return <dd ref={ref} className={cn("ms-0 text-ui text-fg-muted", className)} {...dataSlot("definition-detail")} {...props} />;
  },
);
