import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardCheck, AlertTriangle, TrendingUp } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, eachWeekOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    todayAttendance: 0,
    monthAttendance: 0,
    pendingAlerts: 0,
  });
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentAttendance();
    fetchWeeklyChart();
    fetchMonthlyChart();
  }, []);

  const fetchStats = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");

    const [members, todayAtt, monthAtt, alerts] = await Promise.all([
      supabase.from("members").select("id", { count: "exact", head: true }),
      supabase.from("attendance").select("id", { count: "exact", head: true }).eq("attendance_date", today),
      supabase.from("attendance").select("id", { count: "exact", head: true }).gte("attendance_date", monthStart),
      supabase.from("alerts").select("id", { count: "exact", head: true }).eq("status", "pendiente"),
    ]);

    setStats({
      totalMembers: members.count ?? 0,
      todayAttendance: todayAtt.count ?? 0,
      monthAttendance: monthAtt.count ?? 0,
      pendingAlerts: alerts.count ?? 0,
    });
  };

  const fetchRecentAttendance = async () => {
    const { data } = await supabase
      .from("attendance")
      .select("*, members(full_name, fingerprint_id)")
      .order("created_at", { ascending: false })
      .limit(5);
    setRecentAttendance(data ?? []);
  };

  const fetchWeeklyChart = async () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const { data } = await supabase
      .from("attendance")
      .select("attendance_date")
      .gte("attendance_date", format(weekStart, "yyyy-MM-dd"))
      .lte("attendance_date", format(weekEnd, "yyyy-MM-dd"));

    const counts: Record<string, number> = {};
    (data ?? []).forEach((r) => { counts[r.attendance_date] = (counts[r.attendance_date] || 0) + 1; });

    setWeeklyData(days.map((d) => ({
      day: format(d, "EEE", { locale: es }),
      asistencia: counts[format(d, "yyyy-MM-dd")] || 0,
    })));
  };

  const fetchMonthlyChart = async () => {
    const now = new Date();
    const weeks = eachWeekOfInterval(
      { start: startOfMonth(now), end: endOfMonth(now) },
      { weekStartsOn: 1 }
    );

    const { data } = await supabase
      .from("attendance")
      .select("attendance_date")
      .gte("attendance_date", format(startOfMonth(now), "yyyy-MM-dd"))
      .lte("attendance_date", format(endOfMonth(now), "yyyy-MM-dd"));

    const records = data ?? [];

    setMonthlyData(weeks.map((weekStart, i) => {
      const wEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const count = records.filter((r) => {
        const d = r.attendance_date;
        return d >= format(weekStart, "yyyy-MM-dd") && d <= format(wEnd, "yyyy-MM-dd");
      }).length;
      return { semana: `Sem ${i + 1}`, asistencia: count };
    }));
  };

  const chartConfig = {
    asistencia: { label: "Asistencia", color: "hsl(var(--primary))" },
  };

  const statCards = [
    { title: "Miembros Registrados", value: stats.totalMembers, icon: Users, color: "text-primary" },
    { title: "Asistencia Hoy", value: stats.todayAttendance, icon: ClipboardCheck, color: "text-success" },
    { title: "Asistencia del Mes", value: stats.monthAttendance, icon: TrendingUp, color: "text-info" },
    { title: "Alertas Pendientes", value: stats.pendingAlerts, icon: AlertTriangle, color: "text-warning" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Asistencia Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="asistencia" fill="var(--color-asistencia)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendencia Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="semana" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="asistencia" stroke="var(--color-asistencia)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registros Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAttendance.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay registros aún.</p>
          ) : (
            <div className="space-y-3">
              {recentAttendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{record.members?.full_name}</p>
                    <p className="text-sm text-muted-foreground">ID: {record.members?.fingerprint_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{record.service_type}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(record.attendance_date), "dd/MM/yyyy")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
