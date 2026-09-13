import { Figure } from "../components/Figure";
import { ReportPage, ReportSection } from "../components/ReportPage";
import type { ReportFilter } from "../components/ReportPage";

const FILTERS: ReportFilter[] = [
    { name: "version", label: "Version", fallback: "" },
    { name: "team", label: "Team", fallback: "" },
    { name: "cycle_type", label: "Cycle type", options: ["LIKE", "NOT LIKE"], fallback: "LIKE" },
];

/**
 * Team Regression Statistics.
 *
 * <p>Eleven panels arrived untitled and are nearly the same query, separated only by a trailing
 * predicate. Named from the SQL: 5 is non-automated cycles (manual), 11 is database cycles, 23 is
 * `%Automated%`, 12 and 29 are `%Automated%` with `item_status != 'Automated'` - and are byte-identical queries, a
 * duplicate in the original dashboard - 26 is the API folder, 27 the automated folder, 31 items
 * with a failure count, 17 by functional area and 21 by label.
 */
export function TeamRegressionReport() {
  return (
    <ReportPage
      path="/dashboards/team-regression"
      title="Team Regression Statistics"
      lede="One team's regression picture for the selected version."
      filters={FILTERS}
    >
    <ReportSection
      title="This team, this release"
      lede="The five numbers a team lead is asked for, in the order they are usually asked."
    >
      <Figure
        query="q1052937a1b"
        title="Automated coverage"
        viz="gauge"
        span={3}
        height={200}
      />
      <Figure
        query="qa181ad106a"
        title="Automation debt"
        viz="stat"
        span={3}
        height={120}
        unit="percent"
        thresholds={{"mode": "absolute", "steps": [{"color": "green", "value": 0}, {"color": "red", "value": 80}]}}
      />
      <Figure
        query="qeb8439dc29"
        title="Automated (E2E)"
        viz="stat"
        span={2}
        height={120}
        thresholds={{"mode": "absolute", "steps": [{"color": "green", "value": 0}]}}
      />
      <Figure
        query="qe1ae854b65"
        title="Playwright automated"
        viz="stat"
        span={2}
        height={120}
        thresholds={{"mode": "absolute", "steps": [{"color": "green", "value": 0}, {"color": "red", "value": 80}]}}
      />
      <Figure
        query="qc2429bb031"
        title="Automated by Gen AI"
        viz="stat"
        span={2}
        height={120}
        thresholds={{"mode": "absolute", "steps": [{"color": "green", "value": 0}]}}
      />
      <Figure
        query="q65628d14b6"
        title="Manual tests in this cycle"
        viz="stat"
        span={6}
        height={120}
        unit="none"
        thresholds={{"mode": "absolute", "steps": [{"color": "green", "value": 0}, {"color": "red", "value": 80}]}}
      />
      <Figure
        query="q9a25e14ed8"
        title="Contribution by execution type"
        viz="pie"
        span={6}
      />
    </ReportSection>
    <ReportSection
      title="How the team's inventory is moving"
      lede="Four trends over the same window. Debt is shown twice: for this release, and overall."
    >
      <Figure
        query="q9a25e14ed8"
        title="Cumulative test inventory changes"
        viz="timeseries"
        span={6}
      />
      <Figure
        query="qac81271f96"
        title="AI-generated tests"
        viz="timeseries"
        span={6}
      />
      <Figure
        query="q527cb84009"
        title="Release automation debt"
        viz="timeseries"
        span={6}
      />
      <Figure
        query="q480b15696a"
        title="Overall automation debt"
        viz="timeseries"
        span={6}
      />
    </ReportSection>
    <ReportSection
      title="Execution"
    >
      <Figure
        query="qd4209b4c05"
        title="Automation cycles — execution status"
        viz="barGauge"
        span={6}
        height={300}
        min={0}
        max={100}
      />
      <Figure
        query="q44c7a3b6f9"
        title="Manual cycles — execution status"
        viz="barGauge"
        span={6}
        height={300}
        min={0}
        max={100}
      />
      <Figure
        query="q5d5bcc573a"
        title="Automated execution rate (%)"
        viz="timeseries"
        span={6}
      />
      <Figure
        query="q3be6c46f94"
        title="Manual execution rate (%)"
        viz="timeseries"
        span={6}
      />
      <Figure
        query="q3f7a700ce3"
        title="Automation test cycles"
        viz="table"
        span={6}
        height={340}
      />
      <Figure
        query="qb6e6176107"
        title="Manual test cycles"
        viz="table"
        span={6}
        height={340}
      />
    </ReportSection>
    <ReportSection
      title="The team's tests, by population"
      lede="Same query, different trailing predicate. Named from the SQL, because the original left all of these untitled and they are indistinguishable otherwise."
    >
      <Figure
        query="q71a1a849d8"
        title="Automated tests (automated cycles)"
        viz="table"
        span={6}
        height={340}
      />
      <Figure
        query="q9535849ab4"
        title="Manual tests (non-automated cycles)"
        viz="table"
        span={6}
        height={340}
      />
      <Figure
        query="qe911d9d275"
        title="Database tests"
        viz="table"
        span={6}
        height={340}
      />
      <Figure
        query="q67bcd04d1c"
        title="Automation debt — automated cycles not yet automated"
        viz="table"
        span={6}
        height={340}
      />
      <Figure
        query="q351472803f"
        title="Automated tests under /Automated Test Cases"
        viz="table"
        span={6}
        height={340}
      />
      <Figure
        query="qe64cef320b"
        title="Automated API tests"
        viz="table"
        span={6}
        height={340}
      />
      <Figure
        query="q35016a21ba"
        title="Tests with failures across cycles"
        viz="table"
        span={12}
        height={340}
      />
    </ReportSection>
    <ReportSection
      title="Breakdowns and defects"
    >
      <Figure
        query="q3bc89b2fc6"
        title="Cycle coverage by functional area"
        viz="table"
        span={6}
        height={340}
      />
      <Figure
        query="q7f3ae45597"
        title="Cycle coverage by label"
        viz="table"
        span={6}
        height={340}
      />
      <Figure
        query="q8503c65039"
        title="Defect distribution"
        viz="barGauge"
        span={6}
        height={300}
      />
      <Figure
        query="qecb9cd5182"
        title="Defects raised by root cause"
        viz="pie"
        span={6}
      />
      <Figure
        query="qf8a9c2d22c"
        title="Gen-AI assistance"
        viz="table"
        span={12}
        height={340}
      />
    </ReportSection>
    <ReportSection
      title="Also on this report"
      lede="Figures from the original dashboard that do not belong to a section above."
    >
      <Figure
        query="q102f75f44c"
        title="Automation debt — automated cycles not yet automated (duplicate query)"
        viz="table"
        span={6}
        height={340}
      />
    </ReportSection>
    </ReportPage>
  );
}
