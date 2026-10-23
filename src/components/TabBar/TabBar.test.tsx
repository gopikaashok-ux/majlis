import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { TabBar, type TabBarItem } from ".";

const items: TabBarItem[] = [
  { value: "overview", label: "Overview", icon: "overview.svg" },
  { value: "workflows", label: "Workflows", icon: "workflows.svg" },
  { value: "more", label: "More", icon: "more.svg", chevron: true },
];

describe("TabBar (Icon Tabs)", () => {
  it("renders a tablist with one tab per item and the default selected", () => {
    render(<TabBar items={items} defaultValue="overview" aria-label="Sections" />);
    expect(screen.getByRole("tablist", { name: "Sections" })).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Overview", "Workflows", "More"]);
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Workflows" })).toHaveAttribute("aria-selected", "false");
  });

  it("uses a roving tabindex", () => {
    render(<TabBar items={items} defaultValue="workflows" />);
    expect(screen.getByRole("tab", { name: "Workflows" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("tabindex", "-1");
  });

  it("selects on click and reports the change", async () => {
    const onValueChange = vi.fn();
    render(<TabBar items={items} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("tab", { name: "Workflows" }));
    expect(onValueChange).toHaveBeenCalledWith("workflows");
    expect(screen.getByRole("tab", { name: "Workflows" })).toHaveAttribute("aria-selected", "true");
  });

  it("supports arrow/Home/End keyboard navigation with wrap-around", async () => {
    render(<TabBar items={items} />);
    await userEvent.tab();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "More" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "More" })).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "More" })).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  });

  it("respects controlled value", async () => {
    function Controlled() {
      const [v, setV] = useState("overview");
      return (
        <>
          <TabBar items={items} value={v} onValueChange={setV} />
          <output>{v}</output>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole("tab", { name: "More" }));
    expect(screen.getByRole("status")).toHaveTextContent("more");
  });

  it("renders the chevron only for items that ask for it", () => {
    const { container } = render(<TabBar items={items} />);
    expect(container.querySelectorAll(".chevron")).toHaveLength(1);
    expect(screen.getByRole("tab", { name: "More" }).querySelector(".chevron")).not.toBeNull();
  });
});
