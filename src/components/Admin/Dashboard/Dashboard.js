import React, { useMemo, useState, useEffect, useCallback } from "react";
import "./Dashboard.css";
import { useTranslation } from "react-i18next";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

function Dashboard() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalAlbums: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });
  const [charts, setCharts] = useState({
    revenue: { labels: [], values: [] },
    users: { labels: [], values: [] },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const [statsRes, chartsRes] = await Promise.all([
          fetch("http://localhost:5001/api/admin/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5001/api/admin/dashboard-charts?months=12", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        } else {
          console.error("Failed to load admin stats");
        }

        if (chartsRes.ok) {
          const chartData = await chartsRes.json();
          setCharts({
            revenue: chartData?.revenue || { labels: [], values: [] },
            users: chartData?.users || { labels: [], values: [] },
          });
        } else {
          console.error("Failed to load admin chart data");
        }
      } catch (error) {
        console.error("Connection error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = useCallback(
    (amount) => {
      const currentLang = (i18n.resolvedLanguage || i18n.language || "vi")
        .toLowerCase()
        .split("-")[0];
      const locale = currentLang === "en" ? "en-US" : "vi-VN";

      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "VND",
      }).format(amount);
    },
    [i18n.language, i18n.resolvedLanguage]
  );

  const revenueChartData = useMemo(() => {
    const labels = charts.revenue.labels || [];
    const values = charts.revenue.values || [];
    return {
      labels,
      datasets: [
        {
          label: t("admin.dashboard.revenueLabel"),
          data: values,
          backgroundColor: "rgba(227, 80, 80, 0.35)",
          borderColor: "rgba(227, 80, 80, 0.9)",
          borderWidth: 1,
        },
      ],
    };
  }, [charts.revenue.labels, charts.revenue.values, t]);

  const revenueChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.dataset.label}: ${formatCurrency(ctx.raw || 0)}`,
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => {
              try {
                const currentLang = (
                  i18n.resolvedLanguage ||
                  i18n.language ||
                  "vi"
                )
                  .toLowerCase()
                  .split("-")[0];
                const locale = currentLang === "en" ? "en-US" : "vi-VN";
                return new Intl.NumberFormat(locale).format(value);
              } catch {
                return value;
              }
            },
          },
        },
      },
    };
  }, [i18n.language, i18n.resolvedLanguage, formatCurrency]);

  const usersChartData = useMemo(() => {
    const labels = charts.users.labels || [];
    const values = charts.users.values || [];
    return {
      labels,
      datasets: [
        {
          label: t("admin.dashboard.newUsersLabel"),
          data: values,
          borderColor: "rgba(74, 144, 226, 0.95)",
          backgroundColor: "rgba(74, 144, 226, 0.15)",
          tension: 0.35,
          fill: true,
          pointRadius: 2,
        },
      ],
    };
  }, [charts.users.labels, charts.users.values, t]);

  const usersChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
      },
    };
  }, []);

  if (loading)
    return <div style={{ padding: "20px" }}>{t("common.loading")}</div>;

  return (
    <div className="dashboard">
      <h2>{t("admin.dashboard.title")}</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        <div className="admin-card" style={{ borderLeft: "4px solid #4a90e2" }}>
          <h3>{t("admin.dashboard.totalSongs")}</h3>
          <p
            style={{ fontSize: "24px", fontWeight: "bold", marginTop: "10px" }}
          >
            {stats.totalSongs}
          </p>
        </div>
        <div className="admin-card" style={{ borderLeft: "4px solid #50e3c2" }}>
          <h3>{t("admin.dashboard.totalAlbums")}</h3>
          <p
            style={{ fontSize: "24px", fontWeight: "bold", marginTop: "10px" }}
          >
            {stats.totalAlbums}
          </p>
        </div>
        <div className="admin-card" style={{ borderLeft: "4px solid #f5a623" }}>
          <h3>{t("admin.dashboard.totalUsers")}</h3>
          <p
            style={{ fontSize: "24px", fontWeight: "bold", marginTop: "10px" }}
          >
            {stats.totalUsers}
          </p>
        </div>
        <div className="admin-card" style={{ borderLeft: "4px solid #e35050" }}>
          <h3>{t("admin.dashboard.totalRevenue")}</h3>
          <p
            style={{ fontSize: "24px", fontWeight: "bold", marginTop: "10px" }}
          >
            {formatCurrency(stats.totalRevenue)}
          </p>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="dashboard-chart-card">
          <div className="dashboard-chart-header">
            <h3>{t("admin.dashboard.revenueByMonth")}</h3>
            <span>{t("admin.dashboard.last12Months")}</span>
          </div>
          <div className="dashboard-chart-body">
            <Bar data={revenueChartData} options={revenueChartOptions} />
          </div>
        </div>

        <div className="dashboard-chart-card">
          <div className="dashboard-chart-header">
            <h3>{t("admin.dashboard.newUsersByMonth")}</h3>
            <span>{t("admin.dashboard.last12Months")}</span>
          </div>
          <div className="dashboard-chart-body">
            <Line data={usersChartData} options={usersChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
