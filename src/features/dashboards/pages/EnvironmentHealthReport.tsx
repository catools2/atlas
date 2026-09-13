import { Figure } from "../components/Figure";
import { ReportPage, ReportSection } from "../components/ReportPage";
import type { ReportFilter } from "../components/ReportPage";

const FILTERS: ReportFilter[] = [
    { name: "environment", label: "Environment", fallback: "" },
    { name: "compare_with_environment", label: "Compare with", fallback: "" },
    { name: "name", label: "Test name", fallback: "" },
];

/**
 * Environment Healthcheck.
 *
 * <p>Panel 1184 was a `grafana-polystat-panel`, a Grafana plugin viz with no equivalent here.
 * Its query is ordinary SQL, so it renders as a table rather than being dropped.
 */
export function EnvironmentHealthReport() {
  return (
    <ReportPage
      path="/dashboards/environment-health"
      title="Environment Healthcheck"
      lede="Whether an environment is healthy right now, and how it compares with another."
      filters={FILTERS}
    >
    <ReportSection
      title="Is it healthy"
      lede="Pass rate, last outcome, and how this environment compares with the one selected above."
    >
      <Figure
        query="q8455d795a6"
        title="Pass rate share"
        viz="pie"
        span={4}
      />
      <Figure
        query="q0f7b30d4e3"
        title="Last execution status"
        viz="pie"
        span={4}
      />
      <Figure
        query="q0c3b300f37"
        title="Environment comparison summary"
        viz="gauge"
        span={4}
        height={200}
      />
    </ReportSection>
    <ReportSection
      title="Across environments"
      lede="Every QA environment at a glance, then the latest pipeline recorded for each."
    >
      <Figure
        query="qa8e349787c"
        title="QA environments at a glance"
        viz="table"
        span={12}
      />
      <Figure
        query="qfdf3bbce33"
        title="Latest pipeline per environment"
        viz="table"
        span={12}
        height={340}
      />
    </ReportSection>
    <ReportSection
      title="Over time"
    >
      <Figure
        query="qc53ba11e4f"
        title="Pipeline pass/fail per hour"
        viz="timeseries"
        span={12}
      />
    </ReportSection>
    <ReportSection
      title="What is failing"
      lede="Most-failed tests first, then per-component breakdowns and the latest run in full."
    >
      <Figure
        query="q251709f080"
        title="Most failed tests"
        viz="barGauge"
        span={6}
        height={300}
        min={0}
        max={100}
      />
      <Figure
        query="q350e305360"
        title="Product pipeline health"
        viz="barGauge"
        span={6}
        height={300}
        min={0}
        max={100}
      />
      <Figure
        query="qa6cd0f2f2f"
        title="Selected test"
        viz="barGauge"
        span={6}
        height={300}
      />
      <Figure
        query="q1ca9088935"
        title="Test outcomes in the latest run"
        viz="table"
        span={12}
        height={340}
      />
    </ReportSection>
    </ReportPage>
  );
}
