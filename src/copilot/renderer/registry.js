import ActionGroup from "../components/ActionGroup";
import Alert from "../components/Alert";
import BarChart from "../components/BarChart";
import LineChart from "../components/LineChart";
import MetricGrid from "../components/MetricGrid";
import Question from "../components/Question";
import Recommendation from "../components/Recommendation";
import SimpleTable from "../components/SimpleTable";
import SummaryCard from "../components/SummaryCard";

const blockRegistry = Object.freeze({
  summary_card: SummaryCard,
  metric_grid: MetricGrid,
  alert: Alert,
  simple_table: SimpleTable,
  bar_chart: BarChart,
  line_chart: LineChart,
  recommendation: Recommendation,
  question: Question,
  action_group: ActionGroup,
});

export default blockRegistry;
