import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AnimatedSection } from "./AnimatedSection";

describe("AnimatedSection", () => {
  it("should render children correctly", () => {
    const { getByText } = render(
      <AnimatedSection>
        <span>Test Content</span>
      </AnimatedSection>
    );
    
    expect(getByText("Test Content")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { getByText } = render(
      <AnimatedSection className="custom-class">
        <span>Content</span>
      </AnimatedSection>
    );
    
    const container = getByText("Content").parentElement;
    expect(container).toHaveClass("custom-class");
  });

  it("should render with different presets without crashing", () => {
    const presets = ["fadeUp", "fadeUpScale", "fadeUpBlur", "fadeIn"] as const;
    
    presets.forEach((preset) => {
      const { getByText, unmount } = render(
        <AnimatedSection preset={preset}>
          <span>{preset} content</span>
        </AnimatedSection>
      );
      
      expect(getByText(`${preset} content`)).toBeInTheDocument();
      unmount();
    });
  });

  it("should accept delay prop", () => {
    const { getByText } = render(
      <AnimatedSection delay={0.5}>
        <span>Delayed Content</span>
      </AnimatedSection>
    );
    
    expect(getByText("Delayed Content")).toBeInTheDocument();
  });
});
