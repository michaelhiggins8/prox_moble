import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Bell, Settings, Trash2, Edit2, Check, X, Building2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ProxCard, ProxCardHeader, ProxCardTitle, ProxCardContent } from '@/components/ProxCard';
import { useAuth } from '@/contexts/AuthContext';
import { useUi } from '@/contexts/UiContext';
import { useGuestStore } from '@/stores/guestStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AddCategory } from '@/components/home/AddCategory';
import { DeleteCategory } from '@/components/home/DeleteCategory';
import { DatePicker } from '@/components/ui/date-picker';
import { QuantityDisplay } from '@/components/QuantityDisplay';

interface Item {
  id: string;
  name: string;
  category: string;
  purchased_at: string;
  estimated_expiration_at?: string;
  estimated_restock_at?: string;
  store_name?: string;
  quantity?: number;
  unit?: string;
}







export function Home() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { allCategories, categoriesChangeTracker, setCategoriesChangeTracker } = useUi();
  const { items: guestItems, isGuest } = useGuestStore();
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [editingExpiration, setEditingExpiration] = useState<string | null>(null);
  const [newExpirationDate, setNewExpirationDate] = useState('');

  useEffect(() => {
    if (isGuest) {
      setItems(guestItems);
    } else if (user) {
      fetchUserItems();
    }
  }, [user, isGuest, guestItems]);

  const fetchUserItems = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select('id, name, category, purchased_at, estimated_expiration_at, estimated_restock_at, store_name, quantity, unit, created_at, updated_at, user_id, guest_owner_id, estimate_source')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/welcome');
  };

  const handleDeleteItem = async (itemId: string) => {
    if (isGuest) {
      // For guest users, delete from local store
      useGuestStore.getState().deleteItem(itemId);
    } else {
      // For authenticated users, delete from database
      try {
        const { error } = await supabase
          .from('items')
          .delete()
          .eq('id', itemId);

        if (error) throw error;

        // Remove the item from local state immediately
        setItems(prevItems => prevItems.filter(item => item.id !== itemId));

        toast({
          title: "Item deleted",
          description: "The item has been removed from your pantry.",
        });
      } catch (error) {
        console.error('Error deleting item:', error);
        toast({
          title: "Error",
          description: "Failed to delete the item. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleStartEditExpiration = (item: Item) => {
    setEditingExpiration(item.id);
    setNewExpirationDate(item.estimated_expiration_at || '');
  };

  const handleCancelEditExpiration = () => {
    setEditingExpiration(null);
    setNewExpirationDate('');
  };

  const handleUpdateExpiration = async (itemId: string) => {
    try {
      const newDate = newExpirationDate ? new Date(newExpirationDate).toISOString() : null;

      if (isGuest) {
        // For guest users, update local store
        useGuestStore.getState().updateItem(itemId, {
          estimated_expiration_at: newDate,
          updated_at: new Date().toISOString()
        });

        // Update local state immediately
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId
              ? { ...item, estimated_expiration_at: newDate }
              : item
          )
        );
      } else {
        // For authenticated users, update database
        const { error } = await supabase
          .from('items')
          .update({
            estimated_expiration_at: newDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', itemId);

        if (error) throw error;

        // Update local state immediately
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId
              ? { ...item, estimated_expiration_at: newDate }
              : item
          )
        );
      }

      toast({
        title: "Expiration date updated",
        description: "The item's expiration date has been updated successfully.",
      });

      setEditingExpiration(null);
      setNewExpirationDate('');
    } catch (error) {
      console.error('Error updating expiration date:', error);
      toast({
        title: "Error",
        description: "Failed to update the expiration date. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategory = async (itemId: string, newCategory: string) => {
    try {
      if (isGuest) {
        // For guest users, update local store
        useGuestStore.getState().updateItem(itemId, {
          category: newCategory,
          updated_at: new Date().toISOString()
        });

        // Update local state immediately
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId
              ? { ...item, category: newCategory }
              : item
          )
        );
      } else {
        // For authenticated users, update database
        const { error } = await supabase
          .from('items')
          .update({
            category: newCategory,
            updated_at: new Date().toISOString()
          })
          .eq('id', itemId);

        if (error) throw error;

        // Update local state immediately
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId
              ? { ...item, category: newCategory }
              : item
          )
        );
      }

      toast({
        title: "Category updated",
        description: `Item moved to ${newCategory} category.`,
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update the category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateQuantity = (itemId: string, quantity: number | null, unit: string | null) => {
    // Update local state immediately
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, quantity, unit }
          : item
      )
    );
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedItems = filteredItems.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, Item[]>);

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-prox overflow-hidden">
                <img
                  src="/Icon-01.jpg"
                  alt="Prox Logo"
                  className="w-20 h-20 object-cover object-center transform translate-x-[5%] translate-y-[-25%]"
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground font-primary">
                  {isGuest ? 'Guest Mode' : `Hello, ${user?.user_metadata?.first_name || 'there'}!`}
                </h1>
                <p className="text-sm text-muted-foreground font-secondary">
                  {items.length} items in your pantry
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/expiring-soon')}
                className="relative"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => navigate('/home/settings')}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-accent/10 focus:bg-accent/10"
                  >
                    <Settings className="h-4 w-4 text-accent" />
                    <span className="font-secondary text-sm">Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate('/home/households')}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-accent/10 focus:bg-accent/10"
                  >
                    <Building2 className="h-4 w-4 text-accent" />
                    <span className="font-secondary text-sm">Households</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="text-sm font-secondary"
              >
                {isGuest ? 'Sign In' : 'Sign Out'}
              </Button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 font-secondary"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {allCategories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
            <AddCategory setCategoriesChangeTracker={setCategoriesChangeTracker} categoriesChangeTracker={categoriesChangeTracker}/>
            <DeleteCategory setCategoriesChangeTracker={setCategoriesChangeTracker} categoriesChangeTracker={categoriesChangeTracker}/>

          </div>
        </div>
        
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {isGuest && (
          <ProxCard className="mb-6 bg-gradient-to-r from-accent/10 to-highlight/10 border-accent/20">
            <ProxCardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-accent">You're in guest mode</p>
                <p className="text-sm text-muted-foreground">Create an account to sync across devices</p>
              </div>
              <Button
                onClick={() => navigate('/auth?mode=signup')}
                size="sm"
                className="bg-accent hover:bg-accent/90"
              >
                Sign Up
              </Button>
            </ProxCardContent>
          </ProxCard>
        )}

        {/* Items List */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading items...</p>
          </div>
        ) : Object.keys(groupedItems).length === 0 ? (
          <ProxCard className="text-center py-12">
            <ProxCardContent>
              <div className="w-16 h-16 bg-muted rounded-prox mx-auto mb-4 flex items-center justify-center">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No items yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first grocery item
              </p>
              <Button
                onClick={() => navigate('/add-item')}
                className="bg-accent hover:bg-accent/90"
              >
                Add Your First Item
              </Button>
            </ProxCardContent>
          </ProxCard>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-foreground mb-3 sticky top-32 bg-gradient-background/95 backdrop-blur-sm py-2">
                  {category} ({categoryItems.length})
                </h2>
                <div className="grid gap-3">
                  {categoryItems.map((item) => (
                    <ProxCard key={item.id} className="hover:shadow-medium transition-all group">
                      <ProxCardContent className="flex items-center justify-between p-4">
                        
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{item.name}</h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                            <span>Purchased: {format(new Date(item.purchased_at), 'MMM d')}</span>
                            {editingExpiration === item.id ? (
                              <div className="flex items-center space-x-2">
                                <span>Expires:</span>
                                <DatePicker
                                  date={newExpirationDate ? new Date(newExpirationDate) : undefined}
                                  onDateChange={setNewExpirationDate}
                                  placeholder="Select date"
                                  className="w-32 h-8"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUpdateExpiration(item.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEditExpiration}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              
                              </div>
                              
                            ) : (
                              <div className="flex items-center space-x-2">
                                {item.estimated_expiration_at && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStartEditExpiration(item)}
                                    className="h-auto p-0 text-sm text-muted-foreground hover:text-accent transition-colors"
                                  >
                                    Expires: {format(new Date(item.estimated_expiration_at), 'MMM d')}
                                  </Button>
                                )}
                                {!item.estimated_expiration_at && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStartEditExpiration(item)}
                                    className="h-auto p-0 text-sm text-muted-foreground hover:text-accent transition-colors"
                                  >
                                    Set expiration
                                  </Button>
                                )}
                                <Select
                                  value={item.category}
                                  onValueChange={(value) => handleUpdateCategory(item.id, value)}
                                >
                                  <SelectTrigger className="w-auto h-6 text-xs border border-muted bg-muted/30 hover:bg-muted/50 px-2 text-muted-foreground hover:text-foreground transition-colors">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allCategories.filter(cat => cat !== 'All').map((category) => (
                                      <SelectItem key={category} value={category} className="text-xs">
                                        {category}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                          </div>
                          {item.store_name && (
                            <p className="text-xs text-muted-foreground mt-1">
                              From {item.store_name}
                              
                            </p>
                          )}
                          <div className="mt-1">
                            <QuantityDisplay
                              itemId={item.id}
                              quantity={item.quantity}
                              unit={item.unit}
                              isGuest={isGuest}
                              onUpdate={handleUpdateQuantity}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {item.estimated_expiration_at &&
                           new Date(item.estimated_expiration_at) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) && (
                            <div className="w-2 h-2 bg-destructive rounded-full"></div>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteItem(item.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </ProxCardContent>
                    </ProxCard>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floating Action Button */}
        <Button
          onClick={() => navigate('/add-item')}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent hover:bg-accent/90 shadow-medium hover:shadow-glow transition-all"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}