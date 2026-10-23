import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { Button, arrowRight01Icon, plusSignIcon, type ButtonSize } from ".";

const icons = { none: undefined, "plus-sign": plusSignIcon, "arrow-right-01": arrowRight01Icon };

const meta = {
  title: "Components/Button",
  component: Button,
  args: {
    children: "Button",
    variant: "primary",
    size: "medium",
    leadingIcon: plusSignIcon,
    loading: false,
    disabled: false,
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary"] },
    size: { control: "inline-radio", options: ["small", "medium", "large"] },
    leadingIcon: { control: "select", options: Object.keys(icons), mapping: icons },
    trailingIcon: { control: "select", options: Object.keys(icons), mapping: icons },
    children: { control: "text" },
    onClick: { action: "clicked" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Button — Variant=Primary (Figma component set 481:10750). Hover, Pressed and Focus follow the pointer and keyboard; the States story forces them with `data-state`.",
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const sizes: ButtonSize[] = ["small", "medium", "large"];
const row: CSSProperties = { display: "flex", gap: 24, alignItems: "center" };

/** Change any prop from the Controls panel. */
export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div style={row}>
      {sizes.map((size) => (
        <Button key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

/** Every State × Size, as in the Figma matrix. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const states = ["default", "hover", "focus", "pressed", "disabled", "loading"] as const;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "auto repeat(3, 160px)", gap: "24px 16px", alignItems: "center" }}>
        <span />
        {sizes.map((size) => (
          <strong key={size} style={label}>
            {size}
          </strong>
        ))}
        {states.map((state) => (
          <div key={state} style={{ display: "contents" }}>
            <strong style={label}>{state}</strong>
            {sizes.map((size) => (
              <div key={size}>
                <Button
                  {...args}
                  size={size}
                  disabled={state === "disabled"}
                  loading={state === "loading"}
                  data-state={state === "hover" || state === "focus" || state === "pressed" ? state : undefined}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  },
};

export const WithTrailingIcon: Story = {
  args: { children: "Continue", leadingIcon: undefined, trailingIcon: arrowRight01Icon },
};

export const TextOnly: Story = {
  args: { leadingIcon: undefined },
};

export const Loading: Story = {
  args: { loading: true, children: "Saving…" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

const label: CSSProperties = {
  font: "600 14px/20px var(--font-family-primary), sans-serif",
  color: "var(--color-text-secondary)",
  textTransform: "capitalize",
};
