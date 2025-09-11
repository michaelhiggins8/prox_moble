import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ProxCard, ProxCardHeader, ProxCardTitle, ProxCardContent } from '@/components/ProxCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  UserPlus, 
  Trash2, 
  Crown,
  Shield,
  User,
  MoreVertical
} from 'lucide-react';

interface HouseholdMember {
  id: string;
  user_id: string;
  household_id: string;
  role: 'owner' | 'member' | 'admin';
  joined_at: string;
  user: {
    id: string;
    email: string;
    user_metadata: {
      first_name?: string;
      last_name?: string;
    };
  };
}

export function MembersManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user]);

  const fetchMembers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // First get the household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (householdError) throw householdError;

      // Then get members
      const { data: membersData, error: membersError } = await supabase
        .from('household_members')
        .select(`
          *,
          user:users!household_members_user_id_fkey (
            id,
            email,
            user_metadata
          )
        `)
        .eq('household_id', household.id);

      if (membersError) throw membersError;
      setMembers(membersData || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error",
        description: "Failed to load household members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail || !user) return;

    setInviting(true);
    try {
      // First get the household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (householdError) throw householdError;

      // Check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', inviteEmail)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      if (existingUser) {
        // Add existing user to household
        const { error: addError } = await supabase
          .from('household_members')
          .insert({
            user_id: existingUser.id,
            household_id: household.id,
            role: inviteRole
          });

        if (addError) throw addError;

        toast({
          title: "Success",
          description: "Member added to household",
        });
      } else {
        // TODO: Send invitation email
        toast({
          title: "Invitation sent",
          description: `Invitation sent to ${inviteEmail}`,
        });
      }

      setInviteEmail('');
      setInviteRole('member');
      setShowInviteForm(false);
      fetchMembers();
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: "Error",
        description: "Failed to invite member",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setMembers(prev => prev.filter(member => member.id !== memberId));
      toast({
        title: "Member removed",
        description: `${memberEmail} has been removed from the household`,
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'member' | 'admin') => {
    try {
      const { error } = await supabase
        .from('household_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      setMembers(prev => prev.map(member => 
        member.id === memberId ? { ...member, role: newRole } : member
      ));

      toast({
        title: "Role updated",
        description: "Member role has been updated",
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-accent" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-highlight" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-accent/10 text-accent';
      case 'admin':
        return 'bg-highlight/10 text-highlight';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const filteredMembers = members.filter(member =>
    member.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user.user_metadata?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user.user_metadata?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground font-primary">
            Members Management
          </h2>
          <p className="text-muted-foreground font-secondary mt-1">
            Manage household members and their roles
          </p>
        </div>
        <Button
          onClick={() => setShowInviteForm(true)}
          className="bg-accent hover:bg-accent/90 font-secondary"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <ProxCard className="border-accent/20">
          <ProxCardContent className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground font-secondary mb-2">
                  Invite New Member
                </h3>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="font-secondary"
                  />
                  <Select value={inviteRole} onValueChange={(value: 'member' | 'admin') => setInviteRole(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleInviteMember}
                    disabled={!inviteEmail || inviting}
                    className="bg-accent hover:bg-accent/90"
                  >
                    {inviting ? 'Sending...' : 'Send Invite'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInviteForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </ProxCardContent>
        </ProxCard>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 font-secondary"
        />
      </div>

      {/* Members List */}
      <ProxCard>
        <ProxCardHeader>
          <ProxCardTitle className="font-primary">
            Household Members ({filteredMembers.length})
          </ProxCardTitle>
        </ProxCardHeader>
        <ProxCardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-secondary">
                {searchTerm ? 'No members found matching your search' : 'No members in this household'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-prox">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-prox flex items-center justify-center">
                      {getRoleIcon(member.role)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground font-secondary">
                        {member.user.user_metadata?.first_name || 'Unknown User'}
                        {member.user.user_metadata?.last_name && ` ${member.user.user_metadata.last_name}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                    {member.role !== 'owner' && (
                      <div className="flex items-center space-x-1">
                        <Select
                          value={member.role}
                          onValueChange={(value: 'member' | 'admin') => handleUpdateRole(member.id, value)}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.id, member.user.email)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ProxCardContent>
      </ProxCard>
    </div>
  );
}
