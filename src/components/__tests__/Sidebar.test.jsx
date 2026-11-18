import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Sidebar from "../Sidebar";
import { useAuthStore } from "../../store/authStore";
import { ROUTES, navigateTo } from "../../services/routes";

vi.mock("../../services/routes", async () => {
  const actual = await vi.importActual("../../services/routes");
  return {
    ...actual,
    navigateTo: vi.fn(),
    getCurrentRoute: vi.fn(() => ({ route: actual.ROUTES.APP })),
    getUserProfileRoute: vi.fn(() => actual.ROUTES.PROFILE),
  };
});

describe("Sidebar inbox navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      currentUser: { token: "token-1", username: "demo-user" },
      authError: null,
      authLoading: false,
      loginBlockedUntil: 0,
    });
  });

  it("navigates to unified inbox without logging out", () => {
    const logoutSpy = vi.spyOn(useAuthStore.getState(), "logout");

    render(<Sidebar isSidebarOpen onToggle={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Inbox" }));

    expect(navigateTo).toHaveBeenCalledWith(ROUTES.NOTIFICATIONS);
    expect(logoutSpy).not.toHaveBeenCalled();
  });

  it("navigates to reminders without premium gating", () => {
    render(<Sidebar isSidebarOpen onToggle={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Reminders" }));

    expect(navigateTo).toHaveBeenCalledWith(ROUTES.ALARMS);
  });

  it("navigates to insights without premium gating", () => {
    render(<Sidebar isSidebarOpen onToggle={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Insights" }));

    expect(navigateTo).toHaveBeenCalledWith(ROUTES.LEARNING_INSIGHTS);
  });

  it("shows website links without excluded utility pages", () => {
    render(<Sidebar isSidebarOpen onToggle={() => {}} />);

    ["About & Support", "Careers"].forEach((label) => {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "Contact" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Feedback" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Coding Profiles" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Import" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Export" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Browse Sheets" })).not.toBeInTheDocument();
  });

  it("does not log out when confirmation is cancelled", () => {
    const logoutSpy = vi.spyOn(useAuthStore.getState(), "logout");
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<Sidebar isSidebarOpen onToggle={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Log Out" }));

    expect(confirmSpy).toHaveBeenCalledWith("Are you sure you want to log out?");
    expect(logoutSpy).not.toHaveBeenCalled();
    expect(navigateTo).not.toHaveBeenCalledWith(ROUTES.LOGIN);
  });

  it("logs out when confirmation is accepted", () => {
    const logoutSpy = vi.spyOn(useAuthStore.getState(), "logout");
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<Sidebar isSidebarOpen onToggle={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Log Out" }));

    expect(confirmSpy).toHaveBeenCalledWith("Are you sure you want to log out?");
    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateTo).toHaveBeenCalledWith(ROUTES.LOGIN);
  });

});
