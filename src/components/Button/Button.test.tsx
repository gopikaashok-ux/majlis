import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { Button } from ".";

describe("Button (Primary)", () => {
  it("renders a primary, medium, type=button by default", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("data-variant", "primary");
    expect(button).toHaveAttribute("data-size", "medium");
    expect(button).not.toHaveAttribute("aria-busy");
  });

  it("applies the size", () => {
    render(
      <>
        <Button size="small">S</Button>
        <Button size="large">L</Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "S" })).toHaveAttribute("data-size", "small");
    expect(screen.getByRole("button", { name: "L" })).toHaveAttribute("data-size", "large");
  });

  it("renders leading and trailing icons as decorative masks", () => {
    const { container } = render(
      <Button leadingIcon="plus.svg" trailingIcon="arrow.svg">
        Create
      </Button>,
    );
    const icons = container.querySelectorAll("[aria-hidden=true]");
    expect(icons).toHaveLength(2);
    expect((icons[0] as HTMLElement).style.getPropertyValue("--btn-icon")).toBe('url("plus.svg")');
    expect((icons[1] as HTMLElement).style.getPropertyValue("--btn-icon")).toBe('url("arrow.svg")');
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("calls onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Go" });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows a spinner in place of the leading icon and ignores clicks while loading", async () => {
    const onClick = vi.fn();
    const { container } = render(
      <Button loading leadingIcon="plus.svg" onClick={onClick}>
        Saving
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toBeDisabled();
    const icons = container.querySelectorAll("[aria-hidden=true]");
    expect(icons).toHaveLength(1);
    expect((icons[0] as HTMLElement).style.getPropertyValue("--btn-icon")).toMatch(/spinner/);
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is keyboard operable and forwards ref and native props", async () => {
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} type="submit" onClick={onClick} data-testid="b">
        Submit
      </Button>,
    );
    expect(ref.current).toBe(screen.getByTestId("b"));
    expect(ref.current).toHaveAttribute("type", "submit");
    await userEvent.tab();
    expect(ref.current).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
