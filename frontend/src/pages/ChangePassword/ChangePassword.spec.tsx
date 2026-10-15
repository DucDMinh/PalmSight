import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ChangePassword from "./index";
import httpService from "@/services/httpService";

describe("ChangePassword Page", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/change-password"]}>
          <ChangePassword />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it("should render ChangePassword form inputs and submit", async () => {
    vi.spyOn(httpService, "put").mockResolvedValue({ data: {} } as any);

    renderComponent();

    expect(screen.getByRole("heading", { name: "Đổi mật khẩu" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Mật khẩu hiện tại/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mật khẩu mới/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Xác nhận mật khẩu/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Mật khẩu hiện tại/), {
      target: { value: "OldPassword123" },
    });
    fireEvent.change(screen.getByLabelText(/Mật khẩu mới/), {
      target: { value: "NewPassword123" },
    });
    fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/), {
      target: { value: "NewPassword123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));

    await waitFor(() => {
      expect(httpService.put).toHaveBeenCalledWith("/api/v1/me/password", {
        currentPassword: "OldPassword123",
        newPassword: "NewPassword123",
      });
      expect(screen.getByText("Đổi mật khẩu thành công.")).toBeInTheDocument();
    });
  });
});
