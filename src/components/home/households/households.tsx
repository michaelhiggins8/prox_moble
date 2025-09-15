import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProxCard, ProxCardHeader, ProxCardTitle, ProxCardContent } from '@/components/ProxCard';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home as HomeIcon, 
  Users, 
  Settings, 
  ArrowLeft,
  Plus,
  Building2
} from 'lucide-react';

// Import subcomponents
import { HouseholdOverview } from './household/household';
import { MembersManagement } from './Members/Members';

type DashboardView = 'overview' | 'members' | 'settings';

export function Households() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<DashboardView>('overview');

  const sidebarItems = [
    {
      id: 'overview' as DashboardView,
      label: 'Overview',
      icon: HomeIcon,
      description: 'Household summary and stats'
    },
    {
      id: 'members' as DashboardView,
      label: 'Members',
      icon: Users,
      description: 'Manage household members'
    },
    {
      id: 'settings' as DashboardView,
      label: 'Settings',
      icon: Settings,
      description: 'Household preferences'
    }
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'overview':
        return <HouseholdOverview />;
      case 'members':
        return <MembersManagement />;
      case 'settings':
        return <div className="text-center py-12">
          <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Settings</h3>
          <p className="text-muted-foreground">Household settings coming soon...</p>
        </div>;
      default:
        return <HouseholdOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/home')}
                className="h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="w-10 h-10 rounded-prox overflow-hidden">
                <img
                  src="/Icon-01.jpg"
                  alt="Prox Logo"
                  className="w-20 h-20 object-cover object-center transform translate-x-[5%] translate-y-[-25%]"
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground font-primary">
                  Household Dashboard
                </h1>
                <p className="text-sm text-muted-foreground font-secondary">
                  Manage your household and members
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="font-secondary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <div className="w-64 flex-shrink-0">
            <ProxCard className="sticky top-24">
              <ProxCardContent className="p-0">
                <nav className="space-y-1">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-all hover:bg-muted/50 ${
                          isActive 
                            ? 'bg-accent/10 text-accent border-r-2 border-accent' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm font-secondary">
                            {item.label}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </ProxCardContent>
            </ProxCard>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <ProxCard>
              <ProxCardContent className="p-6">
                {renderActiveView()}
              </ProxCardContent>
            </ProxCard>
          </div>
        </div>
      </div>
    </div>
  );
}
