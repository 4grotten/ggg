import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DashboardHeader } from "./DashboardHeader";

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("DashboardHeader", () => {
  const defaultProps = {
    isAuthenticated: true,
    displayName: "John Doe",
    displayAvatar: undefined,
    isVerified: false,
    onAccountSwitcherOpen: vi.fn(),
  };

  it("should render login button when not authenticated", () => {
    const { getByRole } = renderWithRouter(
      <DashboardHeader {...defaultProps} isAuthenticated={false} />
    );
    
    // Should render a button (login button)
    const button = getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("should render avatar with initials when authenticated", () => {
    const { getByText } = renderWithRouter(<DashboardHeader {...defaultProps} />);
    
    expect(getByText("JD")).toBeInTheDocument();
  });

  it("should show correct initials for single name", () => {
    const { getByText } = renderWithRouter(
      <DashboardHeader {...defaultProps} displayName="Alice" />
    );
    
    expect(getByText("A")).toBeInTheDocument();
  });

  it("should truncate initials to 2 characters", () => {
    const { getByText } = renderWithRouter(
      <DashboardHeader {...defaultProps} displayName="John Michael Doe Smith" />
    );
    
    expect(getByText("JM")).toBeInTheDocument();
  });

  it("should show green indicator when verified", () => {
    const { container } = renderWithRouter(
      <DashboardHeader {...defaultProps} isVerified={true} />
    );
    
    const indicator = container.querySelector(".bg-green-500");
    expect(indicator).toBeInTheDocument();
  });

  it("should show red indicator when not verified", () => {
    const { container } = renderWithRouter(
      <DashboardHeader {...defaultProps} isVerified={false} />
    );
    
    const indicator = container.querySelector(".bg-red-500");
    expect(indicator).toBeInTheDocument();
  });
});
