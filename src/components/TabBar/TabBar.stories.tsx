import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  TabBar,
  dashboardSquare01Icon,
  folder01Icon,
  libraryIcon,
  moreHorizontalIcon,
  settings01Icon,
  workflowSquare01Icon,
  type TabBarItem,
} from ".";

// Same items as the Figma instance (580:1841).
const items: TabBarItem[] = [
  { value: "overview", label: "Overview", icon: dashboardSquare01Icon },
  { value: "workflows", label: "Workflows", icon: workflowSquare01Icon },
  { value: "knowledge", label: "Knowledge", icon: libraryIcon },
  { value: "files", label: "Files", icon: folder01Icon },
  { value: "settings", label: "Settings", icon: settings01Icon },
  { value: "more", label: "More", icon: moreHorizontalIcon, chevron: true },
];

const meta = {
  title: "Components/Tab Bar",
  component: TabBar,
  args: { items, defaultValue: "overview", "aria-label": "Workspace sections" },
  argTypes: {
    defaultValue: { control: "select", options: items.map((item) => item.value) },
    onValueChange: { action: "valueChange" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Tab Bar — Style=Icon Tabs (Figma 580:1841). Click a tab, or use ←/→/Home/End when a tab has focus.",
      },
    },
  },
} satisfies Meta<typeof TabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OtherTabSelected: Story = {
  args: { defaultValue: "files" },
};

export const FewerTabs: Story = {
  args: { items: items.slice(0, 3) },
};

/** Controlled: the selected tab lives in the parent's state. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState("workflows");
    return (
      <div style={{ display: "grid", gap: 16, justifyItems: "start" }}>
        <TabBar {...args} value={value} onValueChange={setValue} />
        <span style={{ font: "500 14px/20px var(--font-family-primary), sans-serif" }}>
          Selected: <strong>{value}</strong>
        </span>
      </div>
    );
  },
};
