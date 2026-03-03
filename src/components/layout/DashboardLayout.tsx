import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Activity,
    Calendar,
    MessageSquare,
    Users,
    LogOut,
    LayoutDashboard,
    FileText,
    Search,
    Box,
    User,
    Pill,
    PartyPopper,
    Stethoscope,
    BookOpen,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarItem {
    icon: React.ElementType;
    label: string;
    to: string;
}

// ... (existing imports)

const Sidebar = ({ role }: { role: string }) => {
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const getNavItems = (): SidebarItem[] => {
        switch (role) {
            case 'doctor':
                // Doctor items left in English for now or translated if keys exist (not requested)
                return [
                    { icon: LayoutDashboard, label: 'Dashboard', to: '/doctor' },
                    { icon: Users, label: 'Patients List', to: '/doctor/patients' },
                    { icon: Calendar, label: 'Schedule', to: '/doctor/schedule' },
                    { icon: PartyPopper, label: 'Events', to: '/doctor/events' },
                    { icon: Activity, label: 'Disease Trends', to: '/doctor/trends' },
                    { icon: MessageSquare, label: 'Messages', to: '/doctor/messages' },
                    { icon: User, label: 'Profile', to: '/doctor/profile' },
                ];
            case 'patient':
                return [
                    { icon: LayoutDashboard, label: t('sidebar.dashboard'), to: '/patient' },
                    { icon: FileText, label: t('sidebar.visits'), to: '/patient/visits' },
                    { icon: Search, label: t('sidebar.search'), to: '/patient/search' },
                    { icon: MessageSquare, label: t('sidebar.chatbot'), to: '/patient/chatbot' },
                    { icon: MessageSquare, label: t('sidebar.messages'), to: '/patient/messages' },
                    { icon: PartyPopper, label: t('sidebar.events'), to: '/patient/events' },
                    { icon: Pill, label: t('sidebar.pharmacy'), to: '/patient/pharmacy' },
                    { icon: User, label: t('sidebar.profile'), to: '/patient/profile' },
                ];
            case 'admin':
                return [
                    { icon: LayoutDashboard, label: 'Dashboard', to: '/admin' },
                    { icon: User, label: 'Profile', to: '/admin/profile' },
                    { icon: Users, label: 'Staff', to: '/admin/staff' },
                    { icon: Stethoscope, label: 'Doctors', to: '/admin/doctors' },
                    { icon: Box, label: 'Inventory', to: '/admin/inventory' },
                    { icon: PartyPopper, label: 'Events', to: '/admin/events' },
                    { icon: BookOpen, label: 'Rulebook', to: '/admin/rulebook' },
                    { icon: MessageSquare, label: 'Chats', to: '/admin/chats' },
                    { icon: Activity, label: 'Analytics', to: '/admin/analytics' },
                ];
            default:
                return [];
        }
    };

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-white">
            <div className="flex h-16 items-center border-b px-6">
                <Activity className="h-6 w-6 text-blue-600 mr-2" />
                <span className="text-lg font-bold text-gray-900">MediConnect</span>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {getNavItems().map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={toRoot(item.to)}
                        className={({ isActive }) =>
                            `flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                            }`
                        }
                    >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>
            <div className="border-t p-4">
                <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                    onClick={handleSignOut}
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    {t('sidebar.logout')}
                </Button>
            </div>
        </div>
    );
};

// Helper to determine exact match for root routes
const toRoot = (path: string) => path.split('/').length === 2;

const DashboardLayout: React.FC = () => {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar role={user.role} />
            <main className="flex-1 overflow-y-auto">
                <div className="px-8 py-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
