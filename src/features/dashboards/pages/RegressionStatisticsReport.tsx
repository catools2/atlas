import { Figure } from "../components/Figure";
import { ReportPage, ReportSection } from "../components/ReportPage";
import type { ReportFilter } from "../components/ReportPage";

const FILTERS: ReportFilter[] = [
    { name: "versions", label: "Version", fallback: "" },
    { name: "cycle_type", label: "Cycle type", options: ["LIKE", "NOT LIKE"], fallback: "LIKE" },
];

/**
 * Regression Statistics - the largest report, at 28 figures.
 *
 * <p>Six panels on the original dashboard were `text` banners used as dividers; they are real
 * headings here. Five arrived untitled and are named from their SQL: 12 groups by team, 32 by
 * functional area, 34 by label, and 39/40 are the same component breakdown as gauges and as a
 * table.
 */
export function RegressionStatisticsReport() {
  return (
    <ReportPage
      path="/dashboards/regression"
      title="Regression Statistics"
      lede="How the selected regression cycle went: the headline verdict, then each execution track, then what it cost in defects."
      filters={FILTERS}
    >
    <ReportSection
      title="The verdict"
      lede="Read this row first. Everything below it explains one of these four numbers."
    >
      <Figure
        query="qb804c4180c"
        title="Automated coverage"
        viz="gauge"
        span={3}
        height={200}
      />
      <Figure
        query="q0adb95504f"
        title="Escaped defects"
        viz="stat"
        span={3}
        height={120}
        unit="percent"
        thresholds={{"mode": "absolute", "steps": [{"color": "green", "value": 0}, {"color": "red", "value": 80}]}}
      />
      <Figure
        query="qf8bb9116d2"
        title="Overall execution status"
        viz="pie"
        span={3}
      />
      <Figure
        query="q43b483d93a"
        title="Execution type"
        viz="pie"
        span={3}
      />
    </ReportSection>
    <ReportSection
      title="Who ran what"
      lede="Contribution by team and by type - the denominator behind the coverage figure above."
    >
      <Figure
        query="qf9f4df6fc9"
        title="Team contribution by execution type (count)"
        viz="bar"
        span={6}
        stacked
      />
      <Figure
        query="q18efee527f"
        title="Team contribution by execution type (%)"
        viz="bar"
        span={6}
        stacked
      />
      <Figure
        query="q660e445e21"
        title="Contribution by type"
        viz="pie"
        span={6}
      />
      <Figure
        query="q02fa6144a6"
        title="Cycle coverage by team"
        viz="table"
        span={6}
        height={340}
      />
    </ReportSection>
    <ReportSection
      title="Automated cycles"
    >
      <Figure
        query="q693d49e7ac"
        title="Automation execution status"
        viz="pie"
        span={4}
      />
      <Figure
        query="qde7d256c38"
        title="Automation cycles — overall status"
        viz="barGauge"
        span={4}
        height={300}
        min={0}
        max={100}
      />
      <Figure
        query="q4d48b62ff4"
        title="Automated execution rate (%)"
        viz="timeseries"
        span={4}
      />
      <Figure
        query="qe46765b1f3"
        title="Automated test cycles"
        viz="table"
        span={12}
        height={340}
      />
    </ReportSection>
    <ReportSection
      title="Manual and SME cycles"
      lede="Kept together because they are the same question asked of two populations: what a person ran, and what a subject-matter expert ran."
    >
      <Figure
        query="q835ad8d15d"
        title="Manual execution status"
        viz="pie"
        span={4}
      />
      <Figure
        query="qe9807b3ae0"
        title="Manual cycles — overall status"
        viz="barGauge"
        span={4}
        height={300}
        min={-20}
        max={100}
      />
      <Figure
        query="qdb5881c0fb"
        title="Manual execution rate (%)"
        viz="timeseries"
        span={4}
      />
      <Figure
        query="q9ca6e13e1b"
        title="Manual test cycles"
        viz="table"
        span={12}
        height={340}
      />
      <Figure
        query="qbd3fdfcc22"
        title="SME execution status"
        viz="pie"
        span={4}
      />
      <Figure
        query="qc3b0ebd7b2"
        title="Playwright execution status"
        viz="pie"
        span={4}
      />
      <Figure
        query="q955253fb4b"
        title="SME test cycles"
        viz="table"
        span={4}
        height={340}
      />
    </ReportSection>
    <ReportSection
      title="Coverage by component"
      lede="The same component breakdown twice: as a gauge set to scan, and as a table to read."
    >
      <Figure
        query="q1a9332913b"
        title="Coverage by component"
        viz="barGauge"
        span={6}
        height={300}
        min={0}
        max={100}
      />
      <Figure
        query="q64f94d2468"
        title="Coverage by component — detail"
        viz="table"
        span={6}
        height={340}
      />
      <Figure
        query="qef3725c9a7"
        title="Cycle coverage by functional area"
        viz="table"
        span={6}
        height={340}
      />
      <Figure
        query="q1829038e42"
        title="Cycle coverage by label"
        viz="table"
        span={6}
        height={340}
      />
    </ReportSection>
    <ReportSection
      title="Defects from this cycle"
    >
      <Figure
        query="qbf7998066d"
        title="Defect distribution"
        viz="barGauge"
        span={4}
        height={300}
      />
      <Figure
        query="q5ae792a498"
        title="Defects by root cause"
        viz="pie"
        span={4}
      />
      <Figure
        query="qc84363e26f"
        title="Defects by functional area"
        viz="pie"
        span={4}
      />
      <Figure
        query="qf1fa05c6b8"
        title="Defects raised per day, by team"
        viz="timeseries"
        span={12}
      />
      <Figure
        query="q437bbfcb06"
        title="Reported defects"
        viz="table"
        span={12}
        height={340}
      />
    </ReportSection>
    </ReportPage>
  );
}
