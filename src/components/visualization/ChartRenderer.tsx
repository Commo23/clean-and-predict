
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, AreaChart, Area, ComposedChart,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F'];

interface ChartRendererProps {
  chartType: string;
  chartData: any[];
  selectedColumns: string[];
  isTimeSeries: boolean;
}

const ChartRenderer = ({
  chartType,
  chartData,
  selectedColumns,
  isTimeSeries
}: ChartRendererProps) => {
  if (!chartData.length) return null;

  const commonProps = {
    width: 500,
    height: 300,
    data: chartData,
    margin: { top: 5, right: 30, left: 20, bottom: 5 }
  };

  switch (chartType) {
    case 'line':
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={isTimeSeries ? "date" : "x"} />
          <YAxis />
          <Tooltip />
          {selectedColumns.map((col, index) => (
            <Line
              key={col}
              type="monotone"
              dataKey={col}
              stroke={COLORS[index % COLORS.length]}
              name={col}
              connectNulls
            />
          ))}
        </LineChart>
      );

    case 'area':
      return (
        <AreaChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={isTimeSeries ? "date" : "x"} />
          <YAxis />
          <Tooltip />
          {selectedColumns.map((col, index) => (
            <Area
              key={col}
              type="monotone"
              dataKey={col}
              stroke={COLORS[index % COLORS.length]}
              fill={COLORS[index % COLORS.length]}
              name={col}
              fillOpacity={0.3}
              stackId="1"
            />
          ))}
        </AreaChart>
      );

    case 'bar':
      return (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={isTimeSeries ? "date" : "x"} />
          <YAxis />
          <Tooltip />
          {selectedColumns.map((col, index) => (
            <Bar
              key={col}
              dataKey={col}
              fill={COLORS[index % COLORS.length]}
              name={col}
            />
          ))}
        </BarChart>
      );

    case 'composed':
      return (
        <ComposedChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={isTimeSeries ? "date" : "x"} />
          <YAxis />
          <Tooltip />
          {selectedColumns.map((col, index) => (
            index % 2 === 0 ? (
              <Bar
                key={col}
                dataKey={col}
                fill={COLORS[index % COLORS.length]}
                name={col}
              />
            ) : (
              <Line
                key={col}
                type="monotone"
                dataKey={col}
                stroke={COLORS[index % COLORS.length]}
                name={col}
              />
            )
          ))}
        </ComposedChart>
      );

    case 'scatter':
      return (
        <ScatterChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={isTimeSeries ? "date" : "x"} />
          <YAxis />
          <Tooltip />
          {selectedColumns.map((col, index) => (
            <Scatter
              key={col}
              name={col}
              data={chartData.map(d => ({
                x: d[isTimeSeries ? "date" : "x"],
                y: d[col]
              }))}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </ScatterChart>
      );

    default:
      return null;
  }
};

export default ChartRenderer;
