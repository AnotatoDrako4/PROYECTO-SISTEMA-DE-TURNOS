import React from 'react';

interface BarChartProps {
  data: {
    labels: string[];
    series: number[][];
  };
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const maxValue = Math.max(...data.series.flat());
  const colors = ['#3B82F6', '#8b5cf6', '#10B981'];

  return (
    <div className="flex justify-around items-end h-40 w-full pt-4 pr-2">
      {data.labels.map((label, index) => (
        <div key={label} className="flex flex-col items-center h-full w-full">
          <div className="flex-grow flex items-end w-full justify-center gap-1">
             {data.series.map((series, seriesIndex) => (
                <div
                    key={seriesIndex}
                    className="w-1/2 rounded-t-md transition-all duration-500"
                    style={{
                        height: `${(series[index] / maxValue) * 100}%`,
                        backgroundColor: colors[seriesIndex % colors.length]
                    }}
                    title={`${label}: ${series[index]}`}
                />
             ))}
          </div>
          <span className="text-xs text-slate-400 mt-1">{label}</span>
        </div>
      ))}
    </div>
  );
};

export default BarChart;
