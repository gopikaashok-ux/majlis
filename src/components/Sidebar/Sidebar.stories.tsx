import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import {
  Sidebar,
  analyticsIcon,
  documentsIcon,
  homeIcon,
  insightsIcon,
  integrationsIcon,
  plansIcon,
  settingsIcon,
  teamIcon,
  type SidebarNavItem,
  type SidebarProps,
} from ".";

// Same content as the Sidebar instances in Figma frame 1501:4459 ("Left nav").
const sections: SidebarNavItem[][] = [
  [
    { id: "overview", label: "Overview", icon: homeIcon },
    { id: "documents", label: "Documents", icon: documentsIcon },
    { id: "analytics", label: "Analytics", icon: analyticsIcon, badge: "New" },
    { id: "insights", label: "Insights", icon: insightsIcon },
    { id: "plans", label: "Plans", icon: plansIcon },
  ],
  [
    { id: "team", label: "Team", icon: teamIcon },
    { id: "integrations", label: "Integrations", icon: integrationsIcon },
    { id: "settings", label: "Settings", icon: settingsIcon },
  ],
];
const user = { name: "Syed Hafeez", plan: "Enterprise", initials: "SH" };

// The Glass style is translucent, so it is shown on the Figma frame's backdrop colour (not a token).
const onBackdrop: Decorator = (Story) => (
  <div style={{ display: "flex", gap: 24, height: 760, padding: 40, background: "#edeaff" }}>
    <Story />
  </div>
);

/**
 * Props that make the sidebar follow the `activeId` and `collapsed` controls and write clicks back
 * to them, so the controls and the preview always agree. Call it from a story's render function.
 */
function useSyncedArgs(args: SidebarProps): SidebarProps {
  const [, updateArgs] = useArgs<SidebarProps>();
  return {
    ...args,
    onNavigate: (id, event) => {
      updateArgs({ activeId: id });
      args.onNavigate?.(id, event);
    },
    onCollapsedChange: (collapsed) => {
      updateArgs({ collapsed });
      args.onCollapsedChange?.(collapsed);
    },
  };
}

const meta = {
  title: "Components/Sidebar",
  component: Sidebar,
  render: (args) => <Sidebar {...useSyncedArgs(args)} />,
  decorators: [onBackdrop],
  args: { sections, user, activeId: "overview", collapsed: false, brandName: "Majlis AI" },
  argTypes: {
    activeId: { control: "select", options: sections.flat().map((item) => item.id), description: "Active page" },
    collapsed: { control: "boolean" },
    // Only read when the component first mounts, so they can't drive the preview; activeId / collapsed replace them here.
    defaultActiveId: { table: { disable: true } },
    defaultCollapsed: { table: { disable: true } },
    onNavigate: { action: "navigate" },
    onCollapsedChange: { action: "collapsedChange" },
    onUserClick: { action: "userClick" },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Sidebar — Style=Glass, Mode=Expanded | Collapsed (Figma 587:1937 / 587:2043). Click items to change the active page; the double arrow collapses and expands it.",
      },
    },
  },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {};

export const Collapsed: Story = {
  args: { collapsed: true },
};

export const WithoutUser: Story = {
  args: { user: undefined },
};

/** Both modes side by side, as in the Figma frame. The active page follows the control. */
export const BothModes: Story = {
  argTypes: { collapsed: { table: { disable: true } } },
  render: (args) => {
    const synced = useSyncedArgs(args);
    return (
      <>
        <Sidebar {...synced} collapsed={false} aria-label="Main (expanded)" />
        <Sidebar {...synced} collapsed aria-label="Main (collapsed)" />
      </>
    );
  },
};

/** The active page, shown next to the sidebar: change it from the control or by clicking. */
export const Controlled: Story = {
  args: { activeId: "documents" },
  render: (args) => (
    <>
      <Sidebar {...useSyncedArgs(args)} />
      <p style={{ alignSelf: "center", font: "500 14px/20px var(--font-family-primary), sans-serif" }}>
        Active page: <strong>{args.activeId}</strong>
      </p>
    </>
  ),
};
