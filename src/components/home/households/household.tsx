import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ProxCard, ProxCardHeader, ProxCardTitle, ProxCardContent } from '@/components/ProxCard';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Users, 
  Calendar, 
  Edit2, 
  Save, 
  X,
  Plus,
  Trash2
} from 'lucide-react';

interface Household {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

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

export function HouseholdOverview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      fetchHouseholdData();
    }
  }, [user]);

  const fetchHouseholdData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch household data
      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (householdError && householdError.code !== 'PGRST116') {
        throw householdError;
      }

      if (householdData) {
        setHousehold(householdData);
        setEditForm({
          name: householdData.name,
          description: householdData.description || ''
        });

        // Fetch members
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
          .eq('household_id', householdData.id);

        if (membersError) throw membersError;
        setMembers(membersData || []);
      }
    } catch (error) {
      console.error('Error fetching household data:', error);
      toast({
        title: "Error",
        description: "Failed to load household data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditForm({
      name: household?.name || '',
      description: household?.description || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!household) return;

    try {
      const { error } = await supabase
        .from('households')
        .update({
          name: editForm.name,
          description: editForm.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', household.id);

      if (error) throw error;

      setHousehold(prev => prev ? {
        ...prev,
        name: editForm.name,
        description: editForm.description,
        updated_at: new Date().toISOString()
      } : null);

      setEditing(false);
      toast({
        title: "Success",
        description: "Household updated successfully",
      });
    } catch (error) {
      console.error('Error updating household:', error);
      toast({
        title: "Error",
        description: "Failed to update household",
        variant: "destructive",
      });
    }
  };

  const handleCreateHousehold = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('households')
        .insert({
          name: editForm.name || 'My Household',
          description: editForm.description,
          owner_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setHousehold(data);
      toast({
        title: "Success",
        description: "Household created successfully",
      });
    } catch (error) {
      console.error('Error creating household:', error);
      toast({
        title: "Error",
        description: "Failed to create household",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading household data...</p>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-prox mx-auto mb-4 flex items-center justify-center">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No household found</h3>
        <p className="text-muted-foreground mb-4">
          Create your first household to get started
        </p>
        <div className="max-w-md mx-auto space-y-4">
          <Input
            placeholder="Household name"
            value={editForm.name}
            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
            className="font-secondary"
          />
          <Input
            placeholder="Description (optional)"
            value={editForm.description}
            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
            className="font-secondary"
          />
          <Button
            onClick={handleCreateHousehold}
            className="bg-accent hover:bg-accent/90 font-secondary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Household
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Household Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground font-primary">
            {editing ? (
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="text-2xl font-semibold h-auto border-none p-0 bg-transparent focus-visible:ring-0"
              />
            ) : (
              household.name
            )}
          </h2>
          {editing ? (
            <Input
              placeholder="Description (optional)"
              value={editForm.description}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              className="mt-2 font-secondary"
            />
          ) : (
            <p className="text-muted-foreground font-secondary mt-1">
              {household.description || 'No description provided'}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {editing ? (
            <>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                className="bg-accent hover:bg-accent/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleEdit}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProxCard>
          <ProxCardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent/10 rounded-prox flex items-center justify-center">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground font-primary">
                  {members.length}
                </p>
                <p className="text-sm text-muted-foreground font-secondary">
                  Members
                </p>
              </div>
            </div>
          </ProxCardContent>
        </ProxCard>

        <ProxCard>
          <ProxCardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-highlight/10 rounded-prox flex items-center justify-center">
                <Calendar className="h-5 w-5 text-highlight" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground font-primary">
                  {new Date(household.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground font-secondary">
                  Created
                </p>
              </div>
            </div>
          </ProxCardContent>
        </ProxCard>

        <ProxCard>
          <ProxCardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-muted/50 rounded-prox flex items-center justify-center">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground font-primary">
                  Active
                </p>
                <p className="text-sm text-muted-foreground font-secondary">
                  Status
                </p>
              </div>
            </div>
          </ProxCardContent>
        </ProxCard>
      </div>

      {/* Recent Members */}
      <ProxCard>
        <ProxCardHeader>
          <ProxCardTitle className="font-primary">Recent Members</ProxCardTitle>
        </ProxCardHeader>
        <ProxCardContent>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-secondary">
                No members yet. Invite people to join your household.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-prox">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-accent/10 rounded-prox flex items-center justify-center">
                      <Users className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground font-secondary">
                        {member.user.user_metadata?.first_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      member.role === 'owner' 
                        ? 'bg-accent/10 text-accent' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {member.role}
                    </span>
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
