import { Figure } from "../components/Figure";
import { ReportPage, ReportSection } from "../components/ReportPage";
import type { ReportFilter } from "../components/ReportPage";

const FILTERS: ReportFilter[] = [
    { name: "components", label: "Component", fallback: "" },
];

/**
 * Database Execution Status.
 *
 * <p>All three panels arrived untitled. Named from their SQL: the table is the latest pipeline's
 * results per component, the pie is that run's outcome share, and the series is outcomes per hour.
 */
export function DatabaseExecutionReport() {
  return (
    <ReportPage
      path="/dashboards/database-execution"
      title="Database Execution Status"
      lede="The most recent database pipeline run, by component."
      filters={FILTERS}
    >
    <ReportSection
      title="Latest run"
    >
      <Figure
        query="q82f789e6c4"
        title="Latest run outcome share"
        viz="pie"
        span={4}
      />
      <Figure
        query="qcc200619ea"
        title="Latest pipeline results by component"
        viz="table"
        span={8}
        height={340}
      />
    </ReportSection>
    <ReportSection
      title="Over time"
    >
      <Figure
        query="qd0146c5e1f"
        title="Execution outcomes per hour"
        viz="timeseries"
        span={12}
      />
    </ReportSection>
    </ReportPage>
  );
}
