import * as React from "react";
import { Search, X } from "@tea-ui/icons";
import { COPY } from "@tea-ui/ux-standards";
import { cn } from "@tea-ui/utils";
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Container,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  Heading,
  HStack,
  IconButton,
  InlineCode,
  Link,
  SearchInput,
  SkipLink,
  Stack,
  Text,
  Toaster,
  TooltipProvider,
} from "@tea-ui/core";

import type { DocGroup, DocPage } from "./registry";

/**
 * The documentation shell.
 *
 * It is built from the same primitives a product uses — including
 * `AdminShell`-style behaviour expressed directly, because a documentation site
 * is a three-column document and not an application. The one thing it does add
 * is a **command palette on ⌘K / Ctrl-K**, because documentation is browsed by
 * people who already know what they are looking for.
 */
export function DocsShell({
  pages,
  groups,
  route,
  onNavigate,
}: {
  pages: readonly DocPage[];
  groups: readonly DocGroup[];
  route: string;
  onNavigate: (id: string) => void;
}): React.ReactElement {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [navOpen, setNavOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const current = pages.find((page) => page.id === route) ?? pages[0]!;
  const currentGroup = groups.find((group) => group.id === current.group);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((previous) => !previous);
      }
    };
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, []);

  const results = React.useMemo(() => searchPages(pages, query), [pages, query]);

  const go = React.useCallback(
    (id: string) => {
      onNavigate(id);
      setSearchOpen(false);
      setNavOpen(false);
      setQuery("");
    },
    [onNavigate],
  );

  return (
    <div className="min-h-dvh bg-canvas text-fg">
      <SkipLink targetId="tea-docs-main" />

      <header className="sticky top-0 z-header border-b border-line bg-canvas">
        <Container size="full" className="flex h-14 items-center gap-4">
          <IconButton label="Navigation öffnen" variant="ghost" size="sm" className="lg:hidden" onClick={() => setNavOpen(true)}>
            <span aria-hidden="true">☰</span>
          </IconButton>
          <Link href="#/getting-started" className="flex items-center gap-2 text-ui font-semibold text-fg no-underline hover:no-underline">
            TEA UI
            <span className="hidden text-fg-subtle sm:inline">Dokumentation</span>
          </Link>

          <div className="ms-auto min-w-0 max-w-sm flex-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex w-full items-center gap-2 border border-line bg-surface px-2.5 py-1.5 text-start text-ui text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              <Search size={14} aria-hidden="true" />
              <span className="truncate">{COPY.navigation.search}…</span>
              <KbdHint />
            </button>
          </div>
        </Container>
      </header>

      <div className="mx-auto flex w-full max-w-[100rem] gap-0">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-72 shrink-0 overflow-y-auto border-e border-line px-4 py-6 lg:block">
          <SidebarNav pages={pages} groups={groups} route={route} onNavigate={go} />
        </aside>

        <main id="tea-docs-main" tabIndex={-1} className="min-w-0 flex-1 focus-visible:outline-none">
          <Container size="3xl" className="py-8">
            <Breadcrumb className="mb-4">
              <BreadcrumbItem>
                <BreadcrumbLink href="#/getting-started">Dokumentation</BreadcrumbLink>
              </BreadcrumbItem>
              {currentGroup ? (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`#/${pages.find((page) => page.group === currentGroup.id)?.id ?? ""}`}>
                      {currentGroup.label}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              ) : null}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{current.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </Breadcrumb>
            {current.render()}
          </Container>
        </main>
      </div>

      <Drawer open={navOpen} onOpenChange={setNavOpen}>
        <DrawerContent side="start" className="w-80">
          <DrawerHeader>
            <DrawerTitle className="flex items-center justify-between text-ui">
              Navigation
              <IconButton label={COPY.navigation.closeMenu} variant="ghost" size="sm" onClick={() => setNavOpen(false)}>
                <X size={16} aria-hidden="true" />
              </IconButton>
            </DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <SidebarNav pages={pages} groups={groups} route={route} onNavigate={go} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <SearchDialog
        open={searchOpen}
        query={query}
        results={results}
        onQueryChange={setQuery}
        onClose={() => setSearchOpen(false)}
        onSelect={go}
      />

      <Toaster />
      <TooltipProvider delayDuration={300}>
        <span className="sr-only">{COPY.navigation.commandPalette}</span>
      </TooltipProvider>
    </div>
  );
}

function KbdHint(): React.ReactElement {
  return (
    <span className="ms-auto hidden items-center gap-1 sm:flex">
      <kbd className="border border-line-strong bg-surface-3 px-1 font-mono text-label text-fg-muted">⌘</kbd>
      <kbd className="border border-line-strong bg-surface-3 px-1 font-mono text-label text-fg-muted">K</kbd>
    </span>
  );
}

function SidebarNav({
  pages,
  groups,
  route,
  onNavigate,
}: {
  pages: readonly DocPage[];
  groups: readonly DocGroup[];
  route: string;
  onNavigate: (id: string) => void;
}): React.ReactElement {
  return (
    <nav aria-label={COPY.navigation.main} className="flex flex-col gap-6">
      {groups.map((group) => {
        const items = pages.filter((page) => page.group === group.id);
        if (items.length === 0) return null;
        return (
          <div key={group.id}>
            <p className="px-2 pb-2 text-label font-semibold uppercase tracking-widest text-fg-subtle">
              {group.label}
            </p>
            <Stack gap="none">
              {items.map((page) => (
                <a
                  key={page.id}
                  href={`#/${page.id}`}
                  aria-current={route === page.id ? "page" : undefined}
                  onClick={() => onNavigate(page.id)}
                  className={cn(
                    "block px-2 py-1.5 text-ui transition-colors",
                    route === page.id
                      ? "bg-accent-subtle font-medium text-accent"
                      : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  {page.title}
                </a>
              ))}
            </Stack>
          </div>
        );
      })}
    </nav>
  );
}

function SearchDialog({
  open,
  query,
  results,
  onQueryChange,
  onClose,
  onSelect,
}: {
  open: boolean;
  query: string;
  results: readonly DocPage[];
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onSelect: (id: string) => void;
}): React.ReactElement {
  const [active, setActive] = React.useState(0);

  // The active result resets with the query during render, not in an effect. An
  // effect would leave `active` pointing at a result from the previous query for
  // one frame, and Enter would then open the wrong page.
  const [lastQuery, setLastQuery] = React.useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    setActive(0);
  }

  return (
    <DialogShell open={open} onClose={onClose}>
      <div
        className="flex flex-col gap-2"
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((previous) => Math.min(results.length - 1, previous + 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((previous) => Math.max(0, previous - 1));
          }
        }}
      >
        <SearchInput
          label={COPY.navigation.search}
          placeholder="Seite, Komponente oder Konzept suchen…"
          value={query}
          onValueChange={onQueryChange}
          onSubmit={() => {
            const target = results[active];
            if (target) onSelect(target.id);
          }}
        />
        <ul role="listbox" aria-label="Suchergebnisse" className="max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <li role="presentation" className="px-2 py-4 text-center text-ui text-fg-muted">
              Nichts gefunden für „{query}“.
            </li>
          ) : null}
          {results.map((page, index) => (
            <li key={page.id} role="option" aria-selected={index === active}>
              <button
                type="button"
                onClick={() => onSelect(page.id)}
                onPointerMove={() => setActive(index)}
                className={cn(
                  "flex w-full flex-col gap-0.5 px-2 py-2 text-start transition-colors",
                  index === active ? "bg-accent-subtle" : "hover:bg-surface-3",
                )}
              >
                <span className="text-ui text-fg">{page.title}</span>
                <span className="text-micro text-fg-muted">{page.summary}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </DialogShell>
  );
}

/**
 * A minimal modal wrapper for the palette.
 *
 * It is written here rather than composed from `Dialog` so the keyboard contract
 * is explicit and owned: Escape closes, the arrow keys belong to the result list.
 * A palette that only works with a mouse is not a palette.
 */
function DialogShell({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}): React.ReactElement | null {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-modal flex items-start justify-center bg-overlay p-4 pt-[10vh]"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={COPY.navigation.commandPalette}
        className="w-full max-w-xl border border-line bg-surface-2 p-3 shadow-modal"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Prefix search over title, summary, group and keywords.
 *
 * Every term must match — an AND over the terms, a prefix match on each — so
 * "button core" narrows rather than widens.
 */
export function searchPages(pages: readonly DocPage[], query: string): readonly DocPage[] {
  const terms = query.trim().toLocaleLowerCase("de").split(/\s+/).filter(Boolean);
  if (terms.length === 0) return pages;

  return pages.filter((page) => {
    const haystack = [page.title, page.summary, page.group, ...page.keywords]
      .join(" ")
      .toLocaleLowerCase("de");
    return terms.every((term) => haystack.includes(term));
  });
}

export { Box, Button, Heading, HStack, InlineCode, Text };
