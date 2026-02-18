import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

const Members = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({ full_name: "", fingerprint_id: "", phone: "", email: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    const { data } = await supabase.from("members").select("*").order("full_name");
    setMembers(data ?? []);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.full_name.trim() || !newMember.fingerprint_id.trim()) {
      toast.error("Nombre e ID son obligatorios.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("members").insert(newMember);
    if (error) {
      toast.error(error.code === "23505" ? "El ID de huella ya existe." : "Error al agregar miembro.");
    } else {
      toast.success("Miembro agregado exitosamente.");
      setNewMember({ full_name: "", fingerprint_id: "", phone: "", email: "" });
      setDialogOpen(false);
      fetchMembers();
    }
    setLoading(false);
  };

  const filtered = members.filter((m) =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.fingerprint_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Miembros</h1>
          <p className="text-muted-foreground">Gestiona los miembros de la iglesia</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nuevo Miembro</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Miembro</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre Completo *</Label>
                <Input value={newMember.full_name} onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>ID Huella Dactilar *</Label>
                <Input value={newMember.fingerprint_id} onChange={(e) => setNewMember({ ...newMember, fingerprint_id: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Correo</Label>
                <Input type="email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Guardando..." : "Agregar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>ID Huella</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No se encontraron miembros.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.full_name}</TableCell>
                    <TableCell className="font-mono text-sm">{m.fingerprint_id}</TableCell>
                    <TableCell>{m.phone || "—"}</TableCell>
                    <TableCell>{m.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={m.active ? "default" : "secondary"}>
                        {m.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
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

export default Members;
