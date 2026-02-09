import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders todo header and add task form", () => {
  render(<App />);
  expect(screen.getByText(/to-?do/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /add task/i })).toBeInTheDocument();
});
