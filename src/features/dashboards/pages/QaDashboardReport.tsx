import { Figure } from "../components/Figure";
import { ReportPage, ReportSection } from "../components/ReportPage";

/**
 * QA Dashboard.
 *
 * <p>Panels 4 and 2 carried the same title in Grafana and are not the same figure: 4 is the
 * running total, 2 aliases every column `*_delta` and is the day-on-day change.
 */
export function QaDashboardReport() {
  return (
    <ReportPage
      path="/dashboards/qa-dashboard"
      title="QA Dashboard"
      lede="The state of the application test estate: its size, its rate of change, and the debt it carries."
    >
    <ReportSection
      title="How big is the test estate"
      lede="Totals first: what exists, and how much of it runs without a person."
    >
      <Figure
        query="qcc6f909a06"
        title="Overall test inventory by type"
        viz="barGauge"
        span={6}
        height={300}
      />
      <Figure
        query="q54646404d2"
        title="Unique tests in the regression cycle"
        viz="bar"
        span={6}
        stacked
      />
      <Figure
        query="qdd037bbfd8"
        title="Average days since a test was last updated — all time"
        viz="barGauge"
        span={6}
        height={300}
      />
      <Figure
        query="qd982434567"
        title="Average days since a test was last updated — selected range"
        viz="barGauge"
        span={6}
        height={300}
      />
    </ReportSection>
    <ReportSection
      title="How is it changing"
      lede="Cumulative and daily views of the same inventory. The cumulative line always rises, so it tells you the size; the daily one is where a stall shows up."
    >
      <Figure
        query="q89e1e3c332"
        title="Test inventory by status — cumulative"
        viz="timeseries"
        span={6}
      />
      <Figure
        query="qc28ebf47c3"
        title="Test inventory by status — daily change"
        viz="timeseries"
        span={6}
      />
      <Figure
        query="q8ceca68197"
        title="Tests created in the selected range"
        viz="barGauge"
        span={6}
        height={300}
      />
      <Figure
        query="qd183ecb8c6"
        title="AI-generated tests"
        viz="timeseries"
        span={6}
      />
    </ReportSection>
    <ReportSection
      title="What it is costing"
      lede="Debt, latency and the defects that got past all of it."
    >
      <Figure
        query="q72769bcf71"
        title="Cumulative automation debt"
        viz="timeseries"
        span={6}
      />
      <Figure
        query="q238f9dd9cb"
        title="Days from test created to test automated"
        viz="bar"
        span={6}
        stacked
      />
      <Figure
        query="qb4cb76a51d"
        title="Defects raised per month"
        viz="bar"
        span={6}
        stacked
      />
      <Figure
        query="q8c33b1d1e7"
        title="Defects raised in total"
        viz="bar"
        span={6}
        stacked
      />
    </ReportSection>
    </ReportPage>
  );
}
