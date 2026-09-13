import { Figure } from "../components/Figure";
import { ReportPage, ReportSection } from "../components/ReportPage";
import type { ReportFilter } from "../components/ReportPage";

const FILTERS: ReportFilter[] = [
    { name: "team", label: "Team", fallback: "" },
    { name: "version", label: "Version", fallback: "" },
];

export function InventoryTrendReport() {
  return (
    <ReportPage
      path="/dashboards/inventory-trend"
      title="Cumulative Test Inventory by Team"
      lede="How one team's test inventory and automation debt have moved over time."
      filters={FILTERS}
    >
    <ReportSection
      title="Inventory"
    >
      <Figure
        query="qe772db2cda"
        title="Cumulative Test Inventory Changes"
        viz="timeseries"
        span={12}
      />
    </ReportSection>
    <ReportSection
      title="Automation debt"
      lede="Overall and per-release debt, then how much of the growth is AI-generated."
    >
      <Figure
        query="q30ec8853ec"
        title="Overall Automation Debt"
        viz="timeseries"
        span={6}
      />
      <Figure
        query="qdd6d70ec1f"
        title="Release automation debt"
        viz="timeseries"
        span={6}
      />
      <Figure
        query="qac81271f96"
        title="AI Generated Tests"
        viz="timeseries"
        span={12}
      />
    </ReportSection>
    </ReportPage>
  );
}
