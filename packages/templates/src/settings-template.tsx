import * as React from "react";
import { Panel, Text } from "@tea-ui/core";
import { PageHeader } from "@tea-ui/admin";
import { SectionNavigation, SaveBar } from "@tea-ui/patterns";
import type { SaveBarState } from "@tea-ui/patterns";
import { cn } from "@tea-ui/utils";

/**
 * TEA UI Templates — SettingsTemplate.
 *
 * The settings page: a header, a rail of sections, a panel of fields, and a bar
 * that owns the save.
 *
 * A template is a **complete page structure**, so what it decides is the shape
 * of the screen and the states it handles. What it must not decide is the
 * content: which settings exist, who may change them, and where the bytes go.
 * That is why every one of those is a prop or a child, and why there is no
 * `onPersist` here.
 *
 * **It writes no styles of its own.** Every region is a TEA UI component: the
 * header is `PageHeader`, the rail is `SectionNavigation`, the panel is `Panel`,
 * the footer is `SaveBar`. The only classes below are the two layout relations
 * that are genuinely this template's — "rail beside panel", and the gap between
 * regions. If this file had a colour or a padding value in it, the layer boundary
 * would be a suggestion, and the Showcase would be the place the mistake shows up.
 *
 * **Changing section is announced.** Activating a rail item replaces the panel
 * contents with no URL change and no focus move, which is silent for a screen
 * reader user — the button's `aria-current` changes, and nothing else happens
 * that can be heard. The live region below names the section that is now shown.
 */

export interface SettingsSection {
  /** Stable id. Matched against `activeSection`, and passed to `onSectionChange`. */
  id: string;
  /** Name in the rail and as the panel's title. */
  label: string;
  /** The fields for this section. The template does not inspect them. */
  children: React.ReactNode;
  /** Count or status beside the label in the rail. */
  badge?: React.ReactNode;
  /** Shown under the panel title. Defaults to nothing. */
  description?: string;
  /** Present but not selectable. See `SectionNavigation`. */
  disabled?: boolean;
  /** Why the section cannot be used. */
  disabledReason?: string;
}

export interface SettingsTemplateProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  title: string;
  description?: string;
  sections: readonly SettingsSection[];
  /** Id of the section currently shown. */
  activeSection: string;
  onSectionChange: (id: string) => void;
  /** Drives `SaveBar`. The template forwards it rather than tracking it itself. */
  saveState: SaveBarState;
  onSave?: () => void;
  onDiscard?: () => void;
  /** The cause of a failed save, passed to `SaveBar`. */
  error?: string;
  /** Controls in the page header, right-aligned. */
  headerActions?: React.ReactNode;
  /**
   * Name for the section rail. Defaults to a sensible string; override it when a
   * page carries more than one rail, so the landmarks stay distinguishable.
   */
  railLabel?: string;
  className?: string;
}

export function SettingsTemplate({
  title,
  description,
  sections,
  activeSection,
  onSectionChange,
  saveState,
  onSave,
  onDiscard,
  error,
  headerActions,
  railLabel = "Settings sections",
  className,
  ...props
}: SettingsTemplateProps): React.ReactElement {
  /*
   * One guard covers both empty shapes: a rail with no sections, and an
   * `activeSection` that matches none of them. Both would otherwise render an
   * empty panel, and an empty screen is the harder one to diagnose from the
   * outside. Destructuring the first element and checking it — rather than
   * testing `sections.length` and then indexing — is what lets the type checker
   * prove the fallback exists, instead of leaving `active` possibly undefined
   * because the narrowing happens before the guard.
   */
  const [first] = sections;
  if (!first) {
    return (
      <div className={className} {...props}>
        <Text as="p" role="note" tone="muted">
          {title} has no sections yet, so there is nothing to show.
        </Text>
      </div>
    );
  }

  const active = sections.find((section) => section.id === activeSection) ?? first;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <PageHeader title={title} description={description} actions={headerActions} />

      {/* The one structural relation this template owns: rail beside panel. */}
      <div className="flex flex-wrap items-start gap-6">
        <SectionNavigation
          label={railLabel}
          items={sections.map((section) => ({
            id: section.id,
            label: section.label,
            badge: section.badge,
            disabled: section.disabled,
            disabledReason: section.disabledReason,
          }))}
          active={active.id}
          onSelect={onSectionChange}
        />

        <div className="min-w-[min(32rem,100%)] flex-1">
          <Panel title={active.label} description={active.description} level={2}>
            {active.children}
          </Panel>
        </div>
      </div>

      {/*
       * `sr-only`, not `hidden`: the region has to be in the accessibility tree
       * for the announcement to be delivered at all. A display-none live region is
       * silently ignored.
       */}
      <p role="status" aria-live="polite" className="sr-only">
        {active.label}
      </p>

      <SaveBar
        state={saveState}
        onSave={onSave}
        onDiscard={onDiscard}
        error={error}
      />
    </div>
  );
}