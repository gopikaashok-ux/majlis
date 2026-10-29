import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import {
  TabBar,
  dashboardSquare01Icon,
  folder01Icon,
  libraryIcon,
  moreHorizontalIcon,
  settings01Icon,
  workflowSquare01Icon,
  type TabBarItem,
  type TabBarProps,
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

/**
 * Props that make the tab bar follow the `value` control and write clicks back to it,
 * so the control and the preview always agree. Call it from a story's render function.
 */
function useSyncedArgs(args: TabBarProps): TabBarProps {
  const [, updateArgs] = useArgs<TabBarProps>();
  return {
    ...args,
    onValueChange: (value) => {
      updateArgs({ value });
      args.onValueChange?.(value);
    },
  };
}

const meta = {
  title: "Components/Tab Bar",
  component: TabBar,
  render: (args) => <TabBar {...useSyncedArgs(args)} />,
  args: { items, value: "overview", "aria-label": "Workspace sections" },
  argTypes: {
    value: { control: "select", options: items.map((item) => item.value), description: "Selected tab" },
    // Only read when the component first mounts, so it can't drive the preview; `value` replaces it here.
    defaultValue: { table: { disable: true } },
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
  args: { value: "files" },
};

export const FewerTabs: Story = {
  args: { items: items.slice(0, 3) },
  argTypes: { value: { options: items.slice(0, 3).map((item) => item.value) } },
};

/** The selected tab, shown next to the bar: change it from the control or by clicking. */
export const Controlled: Story = {
  args: { value: "workflows" },
  render: (args) => (
    <div style={{ display: "grid", gap: 16, justifyItems: "start" }}>
      <TabBar {...useSyncedArgs(args)} />
      <span style={{ font: "500 14px/20px var(--font-family-primary), sans-serif" }}>
        Selected: <strong>{args.value}</strong>
      </span>
    </div>
  ),
};
