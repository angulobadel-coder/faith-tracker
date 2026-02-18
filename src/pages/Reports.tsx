import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

const Reports = () => {
  const [viewType, setViewType] = useState<"daily" | "monthly">("daily");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [records, setRecords] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => { fetchRecords(); }, [viewType, selectedDate]);

  const fetchRecords = async () => {
    let query = supabase
      .from("attendance")
      .select("*, members(full_name, fingerprint_id)")
      .order("attendance_date", { ascending: false });

    if (viewType === "daily") {
      query = query.eq("attendance_date", format(selectedDate, "yyyy-MM-dd"));
    } else {
      const start = format(startOfMonth(selectedDate), "yyyy-MM-dd");
      const end = format(endOfMonth(selectedDate), "yyyy-MM-dd");
      query = query.gte("attendance_date", start).lte("attendance_date", end);
    }

    const { data, count } = await query;
    setRecords(data ?? []);
    setTotalCount(data?.length ?? 0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Reportes de Asistencia</h1>
        <p className="text-muted-foreground">Consulta diaria y mensual</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Tipo de consulta</Label>
              <Select value={viewType} onValueChange={(v: "daily" | "monthly") => setViewType(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diaria</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {viewType === "daily"
                      ? format(selectedDate, "PPP", { locale: es })
                      : format(selectedDate, "MMMM yyyy", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-md">
              <span className="text-sm text-muted-foreground">Total registros:</span>
              <span className="font-bold text-lg">{totalCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>ID Huella</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Servicio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No hay registros para esta fecha.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.members?.full_name}</TableCell>
                    <TableCell className="font-mono text-sm">{r.members?.fingerprint_id}</TableCell>
                    <TableCell>{format(new Date(r.attendance_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{r.service_type}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
