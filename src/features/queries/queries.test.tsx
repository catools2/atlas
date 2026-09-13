import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ParamForm, toRequest } from "./ParamForm";
import type { ParamSpec } from "../../shared/analytics/types";

const param = (name: string, kind: ParamSpec["kind"], allowed: string[] = []): ParamSpec =>
  ({ name, kind, allowed });

describe("the generated parameter form", () => {
  it("renders a closed select for an operator, never a text box", () => {
    // The one place text is substituted into SQL rather than bound. A free-text control here
    // would hand the caller the substitution the whitelist exists to prevent.
    render(
      <ParamForm
        params={[param("cycle_type", "operator", ["LIKE", "NOT LIKE"])]}
        values={{}}
        onChange={vi.fn()}
      />,
    );

    const field = screen.getByRole("combobox");
    expect(field.tagName).toBe("SELECT");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["LIKE", "NOT LIKE"]);
  });

  it("offers only the values the server whitelisted", () => {
    render(
      <ParamForm params={[param("cycle_type", "operator", ["LIKE"])]} values={{}} onChange={vi.fn()} />,
    );

    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  it("uses a date control for an instant", () => {
    const { container } = render(
      <ParamForm params={[param("timeFrom", "instant")]} values={{}} onChange={vi.fn()} />,
    );

    expect(container.querySelector('input[type="datetime-local"]')).toBeInTheDocument();
  });

  it("says so when a query takes nothing", () => {
    render(<ParamForm params={[]} values={{}} onChange={vi.fn()} />);

    expect(screen.getByText(/takes no parameters/i)).toBeInTheDocument();
  });
});

describe("turning form values into a request", () => {
  it("splits a list and drops the blanks", () => {
    const request = toRequest([param("team", "list")], { team: "payments, cards ,, " });

    expect(request.team).toEqual(["payments", "cards"]);
  });

  it("sends an empty list rather than null, because empty means 'do not filter'", () => {
    // The registry translates Grafana's All sentinel to cardinality(:x) = 0. Sending null
    // would make the condition unknown and the query return nothing.
    expect(toRequest([param("team", "list")], {}).team).toEqual([]);
  });

  it("sends null for an omitted scalar", () => {
    expect(toRequest([param("version", "scalar")], {}).version).toBeNull();
  });

  it("never sends an empty operator", () => {
    // An unfilled {{slot}} would reach the server as literal braces in the SQL.
    expect(toRequest([param("cycle_type", "operator", ["LIKE"])], {}).cycle_type).toBe("LIKE");
  });

  it("falls back to the first allowed value rather than trusting a blank", () => {
    expect(
      toRequest([param("cycle_type", "operator", ["NOT LIKE", "LIKE"])], { cycle_type: "  " })
        .cycle_type,
    ).toBe("NOT LIKE");
  });
});
