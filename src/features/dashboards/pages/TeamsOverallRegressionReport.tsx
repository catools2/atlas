import { Figure } from "../components/Figure";
import { ReportPage, ReportSection } from "../components/ReportPage";
import type { ReportFilter } from "../components/ReportPage";

const FILTERS: ReportFilter[] = [
    { name: "version", label: "Version", fallback: "" },
    { name: "team", label: "Team", fallback: "" },
];

export function TeamsOverallRegressionReport() {
  return (
    <ReportPage
      path="/dashboards/teams-regression"
      title="Teams Overall Regression Statistics"
      lede="The same regression view as the per-team report, aggregated across teams."
      filters={FILTERS}
    >
    <ReportSection
      title="Execution status"
      lede="Regression inventory, then outcome split overall and per execution track."
    >
      <Figure
        query="q9a8afa48ca"
        title="Regression Inventory"
        viz="pie"
        span={3}
      />
      <Figure
        query="q8d8e94b47e"
        title="Overall Execution Status"
        viz="pie"
        span={3}
      />
      <Figure
        query="qa58d20ea62"
        title="Manual Cycle By Execution Status"
        viz="pie"
        span={3}
      />
      <Figure
        query="qe917cc0929"
        title="Automation Cycle By Execution Status"
        viz="pie"
        span={3}
      />
    </ReportSection>
    <ReportSection
      title="Cycle status"
    >
      <Figure
        query="q39c8c8d4c8"
        title="Manual Test Cycles Execution Status"
        viz="barGauge"
        span={6}
        height={300}
        min={0}
        max={100}
      />
      <Figure
        query="q7b49935a5d"
        title="Automation Test Cycles Execution Status"
        viz="barGauge"
        span={6}
        height={300}
        min={0}
        max={100}
      />
    </ReportSection>
    </ReportPage>
  );
}
