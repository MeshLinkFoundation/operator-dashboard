import { useState } from "react";
import {
  useNodes,
  useAddNode,
  useUpdateNode,
  useDeleteNode,
  useTestNode,
} from "@/hooks/use-nodes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Zap, Loader2 } from "lucide-react";
import type { NodeInfo, NodeInput } from "@shared/types";

function AddNodeDialog({ onClose }: { onClose?: () => void }) {
  const [form, setForm] = useState<NodeInput>({
    name: "",
    url: "",
    adminPassword: "",
  });
  const addMutation = useAddNode();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addMutation.mutateAsync(form);
      toast({ title: "Node added successfully" });
      setForm({ name: "", url: "", adminPassword: "" });
      onClose?.();
    } catch (err: any) {
      toast({
        title: "Failed to add node",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Node Name</Label>
        <Input
          id="name"
          placeholder="Downtown Hub"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="url">Broker URL</Label>
        <Input
          id="url"
          placeholder="http://100.64.1.10:3000"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Admin Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Admin password for this node"
          value={form.adminPassword}
          onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
          required
        />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={addMutation.isPending}>
          {addMutation.isPending && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          Add Node
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditNodeDialog({
  node,
  onClose,
}: {
  node: NodeInfo;
  onClose?: () => void;
}) {
  const [form, setForm] = useState<Partial<NodeInput>>({
    name: node.name,
    url: node.url,
    adminPassword: "",
  });
  const updateMutation = useUpdateNode();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: Partial<NodeInput> = { name: form.name, url: form.url };
    if (form.adminPassword) input.adminPassword = form.adminPassword;
    try {
      await updateMutation.mutateAsync({ id: node.id, input });
      toast({ title: "Node updated" });
      onClose?.();
    } catch (err: any) {
      toast({
        title: "Failed to update",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Node Name</Label>
        <Input
          id="edit-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-url">Broker URL</Label>
        <Input
          id="edit-url"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-password">
          Admin Password{" "}
          <span className="text-muted-foreground">(leave blank to keep)</span>
        </Label>
        <Input
          id="edit-password"
          type="password"
          value={form.adminPassword}
          onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
        />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function Settings() {
  const { data: nodes, isLoading } = useNodes();
  const deleteMutation = useDeleteNode();
  const testMutation = useTestNode();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editNode, setEditNode] = useState<NodeInfo | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove node "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: `Node "${name}" removed` });
    } catch (err: any) {
      toast({
        title: "Failed to remove",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleTest = async (id: string) => {
    try {
      const result = await testMutation.mutateAsync(id);
      toast({
        title: result.success ? "Connection OK" : "Connection failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (err: any) {
      toast({
        title: "Test failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Node
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Node</DialogTitle>
            </DialogHeader>
            <AddNodeDialog onClose={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : !nodes?.length ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">
            No nodes configured. Add your first node to get started.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nodes.map((node) => (
              <TableRow key={node.id}>
                <TableCell className="font-medium">{node.name}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {node.url}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTest(node.id)}
                      disabled={testMutation.isPending}
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditNode(node)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(node.id, node.name)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editNode} onOpenChange={(open) => !open && setEditNode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Node</DialogTitle>
          </DialogHeader>
          {editNode && (
            <EditNodeDialog
              node={editNode}
              onClose={() => setEditNode(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
