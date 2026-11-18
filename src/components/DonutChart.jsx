import { useEffect, useMemo, useRef, useState } from "react";
import { ArcElement, Chart, DoughnutController, Tooltip } from "chart.js";

Chart.register(ArcElement, DoughnutController, Tooltip);

const TOPIC_LABEL_LIMIT = 20;

function clampLabel(value = "", maxLength = TOPIC_LABEL_LIMIT) {
  if (typeof value !== "string") return "";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

const topicOutsideLabelsPlugin = {
  id: "topicOutsideLabels",
  afterDatasetsDraw(chart) {
    const meta = chart.getDatasetMeta(0);
    const dataset = chart.data.datasets[0];
    const labels = chart.data.labels || [];

    if (!meta?.data?.length || !dataset?.data?.length) {
      return;
    }

    const { ctx, chartArea } = chart;
    const horizontalSpan = Math.max(chartArea.right - chartArea.left, 1);
    const elbowLength = Math.min(Math.max(horizontalSpan * 0.12, 24), 46);
    const radialOffset = 20;
    const minGap = 14;

    const points = meta.data.map((arc, index) => {
      const angle = (arc.startAngle + arc.endAngle) / 2;
      const x1 = arc.x + Math.cos(angle) * arc.outerRadius;
      const y1 = arc.y + Math.sin(angle) * arc.outerRadius;
      const x2 = arc.x + Math.cos(angle) * (arc.outerRadius + radialOffset);
      const y2 = arc.y + Math.sin(angle) * (arc.outerRadius + radialOffset);
      const rightSide = Math.cos(angle) > 0;
      const x3 = x2 + (rightSide ? elbowLength : -elbowLength);

      const numericValue = Number(dataset.data[index]) || 0;
      const label = `${clampLabel(labels[index] || "Unknown")}: ${numericValue.toFixed(2)}%`;

      return {
        index,
        x1,
        y1,
        x2,
        y2,
        x3,
        rightSide,
        label,
      };
    });

    const spreadSide = (sidePoints, direction) => {
      const sorted = [...sidePoints].sort((a, b) => a.y2 - b.y2);
      if (!sorted.length) return;

      for (let i = 1; i < sorted.length; i += 1) {
        if (sorted[i].y2 - sorted[i - 1].y2 < minGap) {
          sorted[i].y2 = sorted[i - 1].y2 + minGap;
        }
      }

      for (let i = sorted.length - 2; i >= 0; i -= 1) {
        if (sorted[i + 1].y2 - sorted[i].y2 < minGap) {
          sorted[i].y2 = sorted[i + 1].y2 - minGap;
        }
      }

      const topLimit = chartArea.top + 10;
      const bottomLimit = chartArea.bottom - 10;
      sorted.forEach((point) => {
        point.y2 = Math.min(bottomLimit, Math.max(topLimit, point.y2));
        point.x3 = direction > 0
          ? Math.min(chartArea.right + 16, chart.width - 34)
          : Math.max(chartArea.left - 16, 34);
      });
    };

    spreadSide(points.filter((p) => p.rightSide), 1);
    spreadSide(points.filter((p) => !p.rightSide), -1);

    const pluginOptions = chart.options.plugins?.topicOutsideLabels || {};
    ctx.save();
    ctx.lineWidth = pluginOptions.lineWidth || 1.2;
    const defaultFont = pluginOptions.fontFamily || "Inter, system-ui, -apple-system, Segoe UI, sans-serif";
    const rootStyles = typeof window !== "undefined" ? window.getComputedStyle(document.documentElement) : null;
    const labelColor = pluginOptions.labelColor || rootStyles?.getPropertyValue("--text-primary")?.trim() || "#111827";
    ctx.fillStyle = labelColor;
    ctx.textBaseline = "middle";

    const wrapText = (text, maxWidth) => {
      const words = text.split(" ");
      const lines = [];
      let currentLine = words[0] || "";
      for (let i = 1; i < words.length; i += 1) {
        const testLine = `${currentLine} ${words[i]}`;
        if (ctx.measureText(testLine).width <= maxWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = words[i];
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    points.forEach((point) => {
      const segmentColor = dataset.backgroundColor?.[point.index] || "#b3b3b3";
      const arrowDirection = point.rightSide ? 1 : -1;
      const arrowTipX = point.x3 + (arrowDirection * 6);
      const arrowWingOffset = 4;
      const textStartX = point.rightSide
        ? Math.min(arrowTipX + 4, chart.width - 46)
        : Math.max(arrowTipX - 4, 46);
      const availableWidth = point.rightSide
        ? Math.max(chartArea.right - textStartX - 4, 45)
        : Math.max(textStartX - 4, 45);

      let fontSize = 12;
      ctx.font = `500 ${fontSize}px ${defaultFont}`;
      let lines = wrapText(point.label, availableWidth);
      if (lines.length > 2) {
        fontSize = 10;
        ctx.font = `500 ${fontSize}px ${defaultFont}`;
        lines = wrapText(point.label, availableWidth);
      }
      if (lines.length > 2) {
        lines = [lines[0], `${lines[1].slice(0, Math.max(lines[1].length - 1, 0))}…`];
      }

      ctx.strokeStyle = segmentColor;
      ctx.beginPath();
      ctx.moveTo(point.x1, point.y1);
      ctx.lineTo(point.x2, point.y2);
      ctx.lineTo(point.x3, point.y2);
      ctx.lineTo(arrowTipX, point.y2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(arrowTipX, point.y2);
      ctx.lineTo(point.x3, point.y2 - arrowWingOffset);
      ctx.lineTo(point.x3, point.y2 + arrowWingOffset);
      ctx.closePath();
      ctx.fillStyle = segmentColor;
      ctx.fill();
      ctx.fillStyle = labelColor;
      ctx.textAlign = point.rightSide ? "left" : "right";
      if (lines.length === 1) {
        ctx.fillText(lines[0], textStartX, point.y2);
      } else {
        const lineHeight = fontSize + 2;
        const startY = point.y2 - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line, lineIndex) => {
          ctx.fillText(line, textStartX, startY + (lineIndex * lineHeight));
        });
      }
    });

    ctx.restore();
  },
};

Chart.register(topicOutsideLabelsPlugin);

function DonutChart({
  items,
  total,
  className = "",
  emptyText = "No questions yet",
  labelColor,
  hoverClassName = "",
  centerLabel = "Total",
}) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [activeSlice, setActiveSlice] = useState(null);

  const chartData = useMemo(() => ({
    labels: items.map((item) => clampLabel(item.label)),
    datasets: [
      {
        data: items.map((item) => item.percent),
        backgroundColor: items.map((item) => item.color),
        borderColor: "#111",
        borderWidth: 1.4,
        hoverBorderColor: "#ffffff",
        hoverBorderWidth: 2.4,
      },
    ],
  }), [items]);

  useEffect(() => {
    if (!canvasRef.current || !total) return undefined;

    chartRef.current?.destroy();
    const chart = new Chart(canvasRef.current, {
      type: "doughnut",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "54%",
        layout: { padding: { top: 16, right: 90, bottom: 44, left: 90 } },
        plugins: {
          legend: { display: false },
          topicOutsideLabels: {
            labelColor,
          },
          tooltip: {
            callbacks: {
              label(context) {
                const item = items[context.dataIndex];
                return `${clampLabel(item.label)}: ${item.percent}% (${item.count}/${total})`;
              },
            },
          },
        },
        onHover: (_event, elements) => {
          if (!elements.length) {
            setActiveSlice(null);
            return;
          }
          const index = elements[0].index;
          setActiveSlice(items[index] || null);
        },
      },
    });

    chartRef.current = chart;

    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, [chartData, items, labelColor, total]);

  if (!total) return <div className="flex h-56 items-center justify-center text-sm text-[var(--text-secondary)]">{emptyText}</div>;

  return (
    <div className={`relative w-full max-w-[560px] ${className}`}>
      <div className="relative mx-auto aspect-square w-full">
        <canvas ref={canvasRef} aria-label="Topic distribution doughnut chart" role="img" />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-[var(--text-secondary)]">{centerLabel}</span>
          <span className="text-2xl font-semibold text-[var(--text-primary)]">{total}</span>
        </div>
      </div>
      <div className={`pointer-events-none absolute bottom-10 left-1/2 w-[92%] -translate-x-1/2 rounded-md bg-[var(--surface)]/85 px-2 py-1 text-center text-xs text-[var(--text-secondary)] backdrop-blur-sm ${hoverClassName}`}>
        {activeSlice
          ? `${clampLabel(activeSlice.label)}: ${activeSlice.percent}% (${activeSlice.count}/${total})`
          : "Hover a section to see details"}
      </div>
    </div>
  );
}

export default DonutChart;
