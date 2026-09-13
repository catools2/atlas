import { Figure } from "../components/Figure";
import { ReportPage, ReportSection } from "../components/ReportPage";

export function PlaywrightReport() {
  return (
    <ReportPage
      path="/dashboards/playwright"
      title="Playwright Automation"
      lede="What the Playwright suite covers, how it grew, and how its last runs went."
    >
    <ReportSection
      title="Coverage today"
      lede="Totals and the outcome of the most recent execution."
    >
      <Figure
        query="q1f26221dba"
        title="Overall Automated"
        viz="stat"
        span={3}
        height={120}
        thresholds={{"mode": "percentage", "steps": [{"color": "green", "value": 0}, {"color": "orange", "value": 70}, {"color": "red", "value": 85}]}}
      />
      <Figure
        query="q4c693d5076"
        title="Automated In Defined Range"
        viz="stat"
        span={3}
        height={120}
        thresholds={{"mode": "percentage", "steps": [{"color": "green", "value": 0}, {"color": "orange", "value": 70}, {"color": "red", "value": 85}]}}
      />
      <Figure
        query="q0286ec3962"
        title="Automated In Progress In Defined Range"
        viz="stat"
        span={3}
        height={120}
        thresholds={{"mode": "percentage", "steps": [{"color": "green", "value": 0}, {"color": "orange", "value": 70}, {"color": "red", "value": 85}]}}
      />
      <Figure
        query="q8d07ee7744"
        title="Last Execution Status"
        viz="pie"
        span={3}
      />
    </ReportSection>
    <ReportSection
      title="What is automated"
      lede="The same automated population cut four ways."
    >
      <Figure
        query="q146690d288"
        title="Automated by Functional Area"
        viz="pie"
        span={3}
      />
      <Figure
        query="qd39488a2bc"
        title="Automated By Version"
        viz="pie"
        span={3}
      />
      <Figure
        query="q817d5e1c54"
        title="Automated By Team"
        viz="pie"
        span={3}
      />
      <Figure
        query="q226e5f2d16"
        title="Automated By Priority"
        viz="pie"
        span={3}
      />
    </ReportSection>
    <ReportSection
      title="How it grew"
    >
      <Figure
        query="q4287a0d9b6"
        title="Cumulative Test Inventory by Status"
        viz="timeseries"
        span={6}
      />
      <Figure
        query="q8aa83043ce"
        title="Automated By created Day"
        viz="timeseries"
        span={6}
      />
      <Figure
        query="q59799711cc"
        title="Automated By Team"
        viz="timeseries"
        span={6}
      />
      <Figure
        query="qd2cb1fa618"
        title="Automated By Priority"
        viz="timeseries"
        span={6}
      />
    </ReportSection>
    <ReportSection
      title="Runs and inventory"
      lede="The suite itself, then the pipeline results behind the figures above."
    >
      <Figure
        query="q6dcb97139d"
        title="Playwright Automated"
        viz="table"
        span={12}
        height={340}
      />
      <Figure
        query="qfc3527082e"
        title="Playwright Automation In Progress"
        viz="table"
        span={12}
        height={340}
      />
      <Figure
        query="q6dcb97139d"
        title="Functional Area"
        viz="table"
        span={12}
        height={340}
      />
      <Figure
        query="q0415d83d2b"
        title="Latest pipeline test results"
        viz="table"
        span={12}
        height={340}
      />
      <Figure
        query="qac53ef8b23"
        title="Pipeline pass/fail over time"
        viz="timeseries"
        span={12}
      />
    </ReportSection>
    </ReportPage>
  );
}
