import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "next-themes";
import { describe, expect, it } from "vitest";
import { ThemeToggle } from "@/components/theme-toggle";

describe("ThemeToggle", () => {
  it("provides an accessible theme control", () => {
    render(
      <ThemeProvider attribute="class" forcedTheme="light">
        <ThemeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole("button", { name: "Use dark mode" });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
  });
});
