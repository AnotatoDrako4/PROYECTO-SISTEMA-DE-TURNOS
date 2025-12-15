import React from 'react';

interface DoughnutChartProps {
  data: {
    labels: string[];
    series: { labels: string[], series: number[] };
  };
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({ data }) => {
  const { labels, series } = data.series;
  const total = series.reduce((a, b) => a + b, 0);
  const colors = ['#3B82F6', '#8b5cf6', '#10B981', '#F59E0B', '#EF4444'];
  let accumulatedPercentage = 0;

  return (
    <div className="flex items-center justify-center gap-6 h-40">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          {series.map((value, index) => {
            const percentage = (value / total) * 100;
            const strokeDasharray = `${percentage} ${100 - percentage}`;
            const strokeDashoffset = -accumulatedPercentage;
            accumulatedPercentage += percentage;
            return (
              <circle
                key={index}
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke={colors[index % colors.length]}
                strokeWidth="4"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{total}</span>
        </div>
      </div>
      <div className="text-xs space-y-1">
        {labels.map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
            <span className="text-slate-300">{label} ({series[index]})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoughnutChart;
