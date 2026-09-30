import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeader,
  TableRow,
  TableSortButton,
} from "../table";

function Sample(props: { rows?: string[]; sort?: "ascending" | "descending" }): React.ReactElement {
  const { rows = ["srv-01", "srv-02"], sort } = props;
  return (
    <Table label="Server">
      <TableCaption>Server und ihr Zustand</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead sort={sort}>Name</TableHead>
          <TableHead>Port</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((name) => (
          <TableRow key={name}>
            <TableCell>{name}</TableCell>
            <TableCell numeric>25565</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

describe("Table", () => {
  it("renders a real table with a caption and column headers", () => {
    render(<Sample />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Server" })).toBeInTheDocument();
    expect(screen.getByText("Server und ihr Zustand")).toBeInTheDocument();

    // The two headers a screen reader navigates by.
    const heads = screen.getAllByRole("columnheader");
    expect(heads).toHaveLength(2);
    expect(heads[0]).toHaveAttribute("scope", "col");
  });

  it("is keyboard reachable, because a scroll region with no tab stop cannot be scrolled", () => {
    render(<Sample />);
    expect(screen.getByRole("region", { name: "Server" })).toHaveAttribute("tabindex", "0");
  });

  it("announces a sorted column only on that column", () => {
    render(<Sample sort="ascending" />);
    const [name, port] = screen.getAllByRole("columnheader");
    expect(name).toHaveAttribute("aria-sort", "ascending");
    // A permanently present aria-sort="none" announces on every cell of every
    // table. An unsorted column must carry nothing.
    expect(port).not.toHaveAttribute("aria-sort");
  });

  it("marks a selected row in the data attribute vocabulary", () => {
    render(
      <Table label="Server">
        <TableBody>
          <TableRow selected>
            <TableCell>srv-01</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByText("srv-01").closest("tr")).toHaveAttribute("data-selected");
  });

  it("renders an empty row spanning every column", () => {
    render(
      <Table label="Server">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Port</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmptyRow colSpan={2}>
            <p>Keine Server passen zu den aktuellen Filtern.</p>
          </TableEmptyRow>
        </TableBody>
      </Table>,
    );

    const message = screen.getByText("Keine Server passen zu den aktuellen Filtern.");
    const cell = message.closest("td");
    expect(cell).toHaveAttribute("colspan", "2");
    // Presentational: the message carries the meaning, the cell must not add to it.
    expect(cell).toHaveAttribute("role", "presentation");
  });

  it("forwards its ref to the scroll region", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Table label="Server" ref={ref}>
        <TableBody />
      </Table>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("exposes the slot vocabulary on every part", () => {
    const { container } = render(<Sample />);
    expect(container.querySelector('[data-slot="tea-table"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="tea-table-header"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="tea-table-head"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="tea-table-cell"]')).not.toBeNull();
  });

  it("pins the head when the table scrolls, and only then", () => {
    const { rerender } = render(<Sample />);
    expect(document.querySelector("thead")).not.toHaveClass("sticky");

    rerender(
      <Table label="Server" stickyHeader>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    // Without an opaque background a sticky head shows the rows passing under it.
    expect(document.querySelector("thead")).toHaveClass("sticky", "bg-surface");
  });

  it("keeps a numeric cell right-aligned and tabular", () => {
    render(<Sample />);
    const port = screen.getAllByText("25565")[0];
    expect(port).toHaveClass("text-end", "tabular-nums");
  });
});

describe("TableSortButton", () => {
  it("keeps the header a th and puts the action inside it", async () => {
    const onClick = vi.fn();
    const { container } = render(
      <Table label="Server">
        <TableHeader>
          <TableRow>
            <TableHead sort="ascending">
              <TableSortButton active direction="ascending" onClick={onClick}>
                Name
              </TableSortButton>
            </TableHead>
          </TableRow>
        </TableHeader>
      </Table>,
    );

    // The head must remain a `<th>`: that is what carries `scope` and `aria-sort`.
    // Replacing it with the button would give a `<tr>` a button child and lose the
    // column the cell belongs to.
    const head = container.querySelector("th");
    expect(head).toHaveAttribute("scope", "col");
    expect(head).toHaveAttribute("aria-sort", "ascending");
    expect(head?.querySelector("button")).not.toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /Name/ }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not announce the sort twice", () => {
    const { container } = render(
      <Table label="Server">
        <TableHeader>
          <TableRow>
            <TableHead>
              <TableSortButton direction="none">Name</TableSortButton>
            </TableHead>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    // The glyph is decoration; only the head owns the state.
    expect(container.querySelector("th")).not.toHaveAttribute("aria-sort");
    expect(container.querySelector("button")).not.toHaveAttribute("aria-sort");
  });
});
