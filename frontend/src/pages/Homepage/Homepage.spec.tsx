import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Homepage from "./index";

describe("Homepage", () => {
  it("should render Homepage title and description", () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "PalmSight" })).toBeInTheDocument();
    expect(
      screen.getByText("Nền tảng xem chỉ tay và luận giải vận mệnh thông minh.")
    ).toBeInTheDocument();
  });
});
