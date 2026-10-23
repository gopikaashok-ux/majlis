import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Sidebar, type SidebarNavItem } from ".";

const sections: SidebarNavItem[][] = [
  [
    { id: "overview", label: "Overview", icon: "home.svg" },
    { id: "documents", label: "Documents", icon: "doc.svg" },
    { id: "analytics", label: "Analytics", icon: "chart.svg", badge: "New" },
  ],
  [
    { id: "team", label: "Team", icon: "team.svg" },
    { id: "settings", label: "Settings", icon: "gear.svg", href: "/settings" },
  ],
];
const user = { name: "Syed Hafeez", plan: "Enterprise", initials: "SH" };

describe("Sidebar (Glass)", () => {
  it("renders brand, both groups with a divider, and the profile when expanded", () => {
    const { container } = render(<Sidebar sections={sections} user={user} />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav).toHaveAttribute("data-mode", "expanded");
    expect(screen.getByText("Majlis AI")).toBeInTheDocument();
    expect(within(nav).getAllByRole("list")).toHaveLength(2);
    expect(container.querySelectorAll("hr")).toHaveLength(1);
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Syed Hafeez/ })).toHaveTextContent("Enterprise");
    expect(screen.getByText("SH")).toBeInTheDocument();
  });

  it("marks the first item active by default, or defaultActiveId", () => {
    const { rerender } = render(<Sidebar sections={sections} />);
    expect(screen.getByRole("button", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    rerender(<Sidebar key="2" sections={sections} defaultActiveId="team" />);
    expect(screen.getByRole("button", { name: "Team" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Overview" })).not.toHaveAttribute("aria-current");
  });

  it("changes the active item on click and reports it", async () => {
    const onNavigate = vi.fn();
    render(<Sidebar sections={sections} onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole("button", { name: "Documents" }));
    expect(onNavigate).toHaveBeenCalledWith("documents", expect.anything());
    expect(screen.getByRole("button", { name: "Documents" })).toHaveAttribute("aria-current", "page");
  });

  it("renders items with href as links", () => {
    render(<Sidebar sections={sections} />);
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings");
  });

  it("collapses and expands with the toggle button", async () => {
    const onCollapsedChange = vi.fn();
    render(<Sidebar sections={sections} user={user} onCollapsedChange={onCollapsedChange} />);
    const nav = screen.getByRole("navigation");
    await userEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    expect(nav).toHaveAttribute("data-mode", "collapsed");
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(nav).toHaveAttribute("data-mode", "expanded");
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
  });

  it("in collapsed mode hides labels, badge, brand name and profile text but keeps accessible names", () => {
    render(<Sidebar sections={sections} user={user} defaultCollapsed />);
    expect(screen.queryByText("Majlis AI")).toBeNull();
    expect(screen.queryByText("Overview")).toBeNull();
    expect(screen.queryByText("New")).toBeNull();
    expect(screen.queryByText("Enterprise")).toBeNull();
    const overview = screen.getByRole("button", { name: "Overview" });
    expect(overview).toHaveAttribute("title", "Overview");
    expect(screen.getByRole("button", { name: "Syed Hafeez, Enterprise" })).toBeInTheDocument();
  });

  it("supports controlled active item and collapsed state", async () => {
    function Controlled() {
      const [active, setActive] = useState("overview");
      const [collapsed, setCollapsed] = useState(false);
      return (
        <>
          <Sidebar
            sections={sections}
            activeId={active}
            onNavigate={setActive}
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
          />
          <output>{`${active}/${collapsed}`}</output>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole("button", { name: "Team" }));
    await userEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.getByRole("status")).toHaveTextContent("team/true");
    expect(screen.getByRole("button", { name: "Team" })).toHaveAttribute("aria-current", "page");
  });

  it("calls onUserClick from the profile", async () => {
    const onUserClick = vi.fn();
    render(<Sidebar sections={sections} user={user} onUserClick={onUserClick} />);
    await userEvent.click(screen.getByRole("button", { name: /Syed Hafeez/ }));
    expect(onUserClick).toHaveBeenCalledTimes(1);
  });

  it("is keyboard reachable in order: toggle, items, profile", async () => {
    render(<Sidebar sections={sections} user={user} />);
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Collapse sidebar" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Overview" })).toHaveFocus();
  });
});
