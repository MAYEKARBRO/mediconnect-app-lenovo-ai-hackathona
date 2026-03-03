import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { User, Mail, Shield, Building, Save } from 'lucide-react';

const AdminProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({ staffStrength: 0 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProfile();
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        const { count: doctorCount } = await supabase.from('doctor_profiles').select('*', { count: 'exact', head: true });
        const { count: staffCount } = await supabase.from('staff').select('*', { count: 'exact', head: true });
        setStats({ staffStrength: (doctorCount || 0) + (staffCount || 0) });
    };

    const fetchProfile = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
        if (data) setProfile(data);
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase.from('profiles').update({
            full_name: profile.full_name,
            hospital_name: profile.hospital_name
        }).eq('id', user?.id);

        if (error) alert('Error saving profile');
        setSaving(false);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Profile</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-gray-500" />
                        Personal Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Hospital Name</label>
                            <div className="relative">
                                <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    className="pl-9"
                                    value={profile?.hospital_name || ''}
                                    onChange={e => setProfile({ ...profile, hospital_name: e.target.value })}
                                    placeholder="Enter Hospital Name"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Total Staff Strength</label>
                            <div className="relative">
                                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    className="pl-9 bg-gray-50 font-bold text-gray-900"
                                    value={stats.staffStrength}
                                    readOnly
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Administrator Name</label>
                            <div className="relative">
                                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    className="pl-9"
                                    value={profile?.full_name || ''}
                                    onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <Input className="pl-9 bg-gray-50" value={user?.email || ''} disabled readOnly />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-gray-500" />
                        Role & Permissions
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="bg-blue-100 p-2 rounded-full">
                            <Building className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-900">Hospital Administrator</h3>
                            <p className="text-sm text-blue-700">
                                You have full access to manage staff, inventory, patient records, and hospital settings.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-blue-600">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    );
};

export default AdminProfile;
