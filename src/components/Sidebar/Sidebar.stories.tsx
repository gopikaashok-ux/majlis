import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
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

const meta = {
  title: "Components/Sidebar",
  component: Sidebar,
  decorators: [onBackdrop],
  args: { sections, user, defaultActiveId: "overview", brandName: "Majlis AI" },
  argTypes: {
    defaultActiveId: { control: "select", options: sections.flat().map((item) => item.id) },
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
  args: { defaultCollapsed: true },
};

export const WithoutUser: Story = {
  args: { user: undefined },
};

/** Both modes side by side, as in the Figma frame. */
export const BothModes: Story = {
  render: (args) => (
    <>
      <Sidebar {...args} aria-label="Main (expanded)" />
      <Sidebar {...args} defaultCollapsed aria-label="Main (collapsed)" />
    </>
  ),
};

/** Controlled: the active page lives in the parent's state. */
export const Controlled: Story = {
  render: (args) => {
    const [active, setActive] = useState("documents");
    return (
      <>
        <Sidebar
          {...args}
          activeId={active}
          onNavigate={(id, event) => {
            event.preventDefault();
            setActive(id);
          }}
        />
        <p style={{ alignSelf: "center", font: "500 14px/20px var(--font-family-primary), sans-serif" }}>
          Active page: <strong>{active}</strong>
        </p>
      </>
    );
  },
};
