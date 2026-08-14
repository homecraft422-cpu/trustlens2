"use client";

import { useEffect, useRef } from "react";

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface AnalysisChartProps {
  data: ChartDataPoint[];
  title: string;
  type?: "bar" | "line" | "doughnut";
  height?: number;
  showValues?: boolean;
  animate?: boolean;
}

export default function AnalysisChart({
  data,
  title,
  type = "bar",
  height = 200,
  showValues = true,
  animate = true,
}: AnalysisChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    let progress = 0;
    const targetProgress = 1;
    const animationDuration = 1000;
    const startTime = performance.now();

    const colors = [
      "#4c6ef5",
      "#22c55e",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
      "#ec4899",
      "#f97316",
    ];

    const draw = (currentProgress: number) => {
      ctx.clearRect(0, 0, rect.width, rect.height);

      if (type === "bar") {
        const maxValue = Math.max(...data.map((d) => d.value));
        const barWidth = (rect.width - 40) / data.length;
        const chartHeight = rect.height - 60;
        const startX = 30;
        const startY = rect.height - 30;

        // Draw grid lines
        ctx.strokeStyle = "#f1f5f9";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
          const y = startY - (chartHeight * i) / 4;
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(rect.width - 10, y);
          ctx.stroke();
        }

        // Draw bars
        data.forEach((point, i) => {
          const x = startX + i * barWidth + barWidth * 0.15;
          const barW = barWidth * 0.7;
          const barH =
            (point.value / maxValue) * chartHeight * currentProgress;
          const y = startY - barH;

          // Bar gradient
          const gradient = ctx.createLinearGradient(x, y, x, startY);
          const color = point.color || colors[i % colors.length];
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, color + "80");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
          ctx.fill();

          // Value label
          if (showValues && currentProgress >= 0.9) {
            ctx.fillStyle = "#374151";
            ctx.font = "bold 11px system-ui";
            ctx.textAlign = "center";
            ctx.fillText(
              `${Math.round(point.value * currentProgress)}%`,
              x + barW / 2,
              y - 8
            );
          }

          // X-axis label
          ctx.fillStyle = "#6b7280";
          ctx.font = "10px system-ui";
          ctx.textAlign = "center";
          ctx.fillText(point.label, x + barW / 2, startY + 15);
        });
      } else if (type === "line") {
        const maxValue = Math.max(...data.map((d) => d.value));
        const chartWidth = rect.width - 60;
        const chartHeight = rect.height - 60;
        const startX = 40;
        const startY = rect.height - 30;
        const pointSpacing = chartWidth / (data.length - 1);

        // Draw grid
        ctx.strokeStyle = "#f1f5f9";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
          const y = startY - (chartHeight * i) / 4;
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(rect.width - 10, y);
          ctx.stroke();
        }

        // Draw line
        ctx.strokeStyle = colors[0];
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();

        const pointsToDraw = Math.ceil(data.length * currentProgress);

        data.slice(0, pointsToDraw).forEach((point, i) => {
          const x = startX + i * pointSpacing;
          const y = startY - (point.value / maxValue) * chartHeight;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();

        // Draw area fill
        ctx.fillStyle = colors[0] + "20";
        ctx.beginPath();
        data.slice(0, pointsToDraw).forEach((point, i) => {
          const x = startX + i * pointSpacing;
          const y = startY - (point.value / maxValue) * chartHeight;

          if (i === 0) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.lineTo(
          startX + (pointsToDraw - 1) * pointSpacing,
          startY
        );
        ctx.closePath();
        ctx.fill();

        // Draw points
        data.slice(0, pointsToDraw).forEach((point, i) => {
          const x = startX + i * pointSpacing;
          const y = startY - (point.value / maxValue) * chartHeight;

          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = colors[0];
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // X-axis label
          ctx.fillStyle = "#6b7280";
          ctx.font = "10px system-ui";
          ctx.textAlign = "center";
          ctx.fillText(point.label, x, startY + 15);
        });
      } else if (type === "doughnut") {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const radius = Math.min(rect.width, rect.height) / 2 - 30;
        const innerRadius = radius * 0.6;
        const total = data.reduce((sum, d) => sum + d.value, 0);

        let currentAngle = -Math.PI / 2;

        data.forEach((point, i) => {
          const sliceAngle = (point.value / total) * Math.PI * 2 * currentProgress;
          const color = point.color || colors[i % colors.length];

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
          ctx.arc(
            centerX,
            centerY,
            innerRadius,
            currentAngle + sliceAngle,
            currentAngle,
            true
          );
          ctx.closePath();
          ctx.fill();

          // Label
          if (currentProgress >= 0.9) {
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelRadius = radius + 15;
            const labelX = centerX + Math.cos(labelAngle) * labelRadius;
            const labelY = centerY + Math.sin(labelAngle) * labelRadius;

            ctx.fillStyle = "#374151";
            ctx.font = "bold 10px system-ui";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`${point.label}`, labelX, labelY);
          }

          currentAngle += sliceAngle;
        });

        // Center text
        if (currentProgress >= 0.9) {
          ctx.fillStyle = "#1f2937";
          ctx.font = "bold 24px system-ui";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            `${Math.round(total * currentProgress)}`,
            centerX,
            centerY - 8
          );
          ctx.fillStyle = "#6b7280";
          ctx.font = "12px system-ui";
          ctx.fillText("Total", centerX, centerY + 14);
        }
      }
    };

    if (animate) {
      const animateFrame = (timestamp: number) => {
        const elapsed = timestamp - startTime;
        progress = Math.min(elapsed / animationDuration, 1);
        
        // Easing function
        const eased = 1 - Math.pow(1 - progress, 3);
        draw(eased);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animateFrame);
        }
      };

      animationRef.current = requestAnimationFrame(animateFrame);
    } else {
      draw(1);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, type, showValues, animate]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: `${height}px` }}
      />
      {type === "doughnut" && (
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {data.map((point, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    point.color ||
                    [
                      "#4c6ef5",
                      "#22c55e",
                      "#f59e0b",
                      "#ef4444",
                      "#8b5cf6",
                    ][i % 5],
                }}
              />
              <span className="text-xs text-slate-600">
                {point.label}: {point.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
