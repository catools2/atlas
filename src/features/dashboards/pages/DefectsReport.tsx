import { Figure } from "../components/Figure";
import { ReportPage, ReportSection } from "../components/ReportPage";

/**
 * Defects Statistics.
 *
 * <p>Three panels on the original dashboard were titled "Unique Defects By Version" and were
 * three different figures. One of them did not group by version at all - its query is
 * `SELECT item_status, COUNT(DISTINCT item_id) ... GROUP BY item_status`. The Grafana title was
 * simply wrong; it is corrected here.
 */
export function DefectsReport() {
  return (
    <ReportPage
      path="/dashboards/defects"
      title="Defects Statistics"
      lede="Defects raised against the application: where they are, who is finding them, and whether the rate is changing."
    >
    <ReportSection
      title="Where the defects are"
      lede="Shape of the current defect population: state, cause, and area of the product."
    >
      <Figure
        query="qdab6ad1b7a"
        title="Defects by status"
        viz="barGauge"
        span={6}
        height={300}
      />
      <Figure
        query="q956fc4c637"
        title="Defects by version"
        viz="barGauge"
        span={6}
        height={300}
      />
      <Figure
        query="q5eae83497c"
        title="Root cause of defects raised"
        viz="pie"
        span={4}
      />
      <Figure
        query="q3da049d32d"
        title="Functional area of defects raised"
        viz="pie"
        span={4}
      />
      <Figure
        query="qa4e13730b0"
        title="Share of defects by version"
        viz="pie"
        span={4}
      />
    </ReportSection>
    <ReportSection
      title="Who is finding them"
      lede="Team and reporter are attribution, not performance: a team that reports more defects is usually a team that is testing more."
    >
      <Figure
        query="q689400a636"
        title="Defects raised by team"
        viz="barGauge"
        span={6}
        height={300}
      />
      <Figure
        query="q5d0eb6ddd1"
        title="Defects raised by reporter"
        viz="barGauge"
        span={6}
        height={300}
      />
    </ReportSection>
    <ReportSection
      title="How the rate is moving"
      lede="The same daily series cut three ways. Look for the slope, not the height."
    >
      <Figure
        query="qfac556b643"
        title="Defects raised per day, by team"
        viz="timeseries"
        span={12}
      />
      <Figure
        query="qc0bb8dcf39"
        title="Defects raised per day, by reporter"
        viz="timeseries"
        span={12}
      />
      <Figure
        query="qb1c609b64f"
        title="Defects raised per day, by version"
        viz="timeseries"
        span={12}
      />
    </ReportSection>
    <ReportSection
      title="The defects themselves"
      lede="Every row drills through to the item behind it."
    >
      <Figure
        query="qc05a4e4021"
        title="Reported defects"
        viz="table"
        span={12}
        height={340}
      />
      <Figure
        query="q96dc782d0c"
        title="Defects by functional area"
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
        query="qff21118feb"
        title="Defects raised per day, by version (alternate cut)"
        viz="timeseries"
        span={6}
      />
    </ReportSection>
    </ReportPage>
  );
}
