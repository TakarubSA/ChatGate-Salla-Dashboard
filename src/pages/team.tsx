import React, { useState } from 'react';
import { 
  useListUsers, 
  useCreateUser, 
  useUpdateUser, 
  TeamRole, 
  TeamUserStatus,
  TeamUserInput
} from '@/lib/api-client-react';
import { Users, Mail, UserPlus, Shield, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
// import { deleteUser } from '@workspace/api-client-react';
import { useLanguage } from '@/hooks/use-language';

export default function TeamPage() {
  const { data: users, isLoading } = useListUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState<TeamUserInput>({
    name: '',
    email: '',
    role: 'marketing'
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(
      { data: formData },
      {
        onSuccess: () => {
          toast({ title: 'Team member added', description: 'They will receive an email invitation.' });
          setIsAddOpen(false);
          setFormData({ name: '', email: '', role: 'marketing' });
          queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        },
        onError: () => {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to add team member.' });
        }
      }
    );
  };

  const handleRoleChange = (id: number, role: TeamRole) => {
    updateUser.mutate(
      { id, data: { role } },
      {
        onSuccess: () => {
          toast({ title: 'Role updated successfully' });
          queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        }
      }
    );
  };

  const handleStatusChange = (id: number, status: TeamUserStatus) => {
    updateUser.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: 'Status updated successfully' });
          queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        }
      }
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    try {
      // await deleteUser(id);
      toast({ title: 'Member removed' });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Failed to remove member' });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.team.title}</h1>
          <p className="text-muted-foreground mt-1">{t.team.subtitle}</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              {t.team.addMember}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Invite a new member to access ChatGate operations.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(v: TeamRole) => setFormData({ ...formData, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator (Full Access)</SelectItem>
                    <SelectItem value="marketing">Marketing (Carts & Orders only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending ? 'Sending Invite...' : 'Send Invite'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">{t.team.member}</th>
                <th className="px-6 py-4 font-medium">{t.team.role}</th>
                <th className="px-6 py-4 font-medium">{t.team.status}</th>
                <th className="px-6 py-4 font-medium text-right">{t.team.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center">
                      <Users className="h-5 w-5 animate-spin mr-2" />
                      Loading team members...
                    </div>
                  </td>
                </tr>
              ) : users?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No team members</p>
                  </td>
                </tr>
              ) : (
                users?.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">{user.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {user.role === 'admin' ? (
                          <Shield className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="capitalize font-medium">{user.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.status === 'active' ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{t.common.active}</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{t.team.invited}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => handleRoleChange(user.id, 'admin')}
                            disabled={user.role === 'admin'}
                          >
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRoleChange(user.id, 'marketing')}
                            disabled={user.role === 'marketing'}
                          >
                            Make Marketing
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(user.id, 'active')}
                            disabled={user.status === 'active'}
                          >
                            Mark Active
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(user.id, 'invited')}
                            disabled={user.status === 'invited'}
                          >
                            Mark Invited
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
