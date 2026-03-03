import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Briefcase, MapPin, Award, Clock, Edit2, Save, X, Building, CheckCircle } from 'lucide-react';

interface DoctorProfileData {
    specialization: string;
    experience_years: number;
    affiliated_hospitals: string[];
    license_number: string;
    biography: string;
    cases_handled: number;
}

const Profile = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState<DoctorProfileData | null>(null);
    const [availabilitySummary, setAvailabilitySummary] = useState<string>('Checking...');

    // Form State
    const [formData, setFormData] = useState<DoctorProfileData>({
        specialization: '',
        experience_years: 0,
        affiliated_hospitals: [],
        license_number: '',
        biography: '',
        cases_handled: 0
    });

    const [hospitalInput, setHospitalInput] = useState('');

    useEffect(() => {
        if (!user) return;
        fetchProfile();
        fetchAvailability();
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('doctor_profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (data) {
                setProfile(data);
                setFormData(data);
            } else if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is fine for new users
                console.error("Error fetching profile:", error);
            }
        } catch (err) {
            console.error("Unexpected error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailability = async () => {
        // Simple logic: Count appointments today to estimate "busyness"
        // Real implementation would look at free slots
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        const { data: events } = await supabase
            .from('doctor_calendar_events')
            .select('*')
            .eq('doctor_id', user?.id)
            .gte('start_time', startOfDay)
            .lte('end_time', endOfDay);

        const eventCount = events?.length || 0;
        // Assuming 8 working hours, 8 slots. 
        const freeSlots = Math.max(0, 8 - eventCount);

        if (freeSlots > 4) setAvailabilitySummary('High Availability');
        else if (freeSlots > 0) setAvailabilitySummary('Limited Availability');
        else setAvailabilitySummary('Fully Booked Today');
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);

        const updates = {
            id: user.id,
            ...formData,
            updated_at: new Date(),
        };

        const { error } = await supabase
            .from('doctor_profiles')
            .upsert(updates);

        if (error) {
            alert('Error saving profile: ' + error.message);
        } else {
            setProfile(formData);
            setIsEditing(false);
        }
        setLoading(false);
    };

    const addHospital = () => {
        if (hospitalInput.trim()) {
            setFormData({
                ...formData,
                affiliated_hospitals: [...(formData.affiliated_hospitals || []), hospitalInput.trim()]
            });
            setHospitalInput('');
        }
    };

    const removeHospital = (index: number) => {
        const newHospitals = [...(formData.affiliated_hospitals || [])];
        newHospitals.splice(index, 1);
        setFormData({ ...formData, affiliated_hospitals: newHospitals });
    };

    if (loading && !profile && !isEditing) return <div className="p-8 text-center">Loading Profile...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Doctor Profile</h1>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="flex items-center gap-2">
                        <Edit2 className="h-4 w-4" /> Edit Profile
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* ID Card / Main Info */}
                <Card className="md:col-span-1 border-blue-100 bg-gradient-to-b from-blue-50 to-white">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="w-32 h-32 mx-auto rounded-full bg-blue-200 flex items-center justify-center text-4xl font-bold text-blue-700 ring-4 ring-white shadow-lg">
                            {user?.full_name?.charAt(0) || 'D'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{user?.full_name || 'Doctor Name'}</h2>
                            <p className="text-sm text-blue-600 font-medium">{profile?.specialization || 'Specialization Not Set'}</p>
                        </div>

                        <div className="pt-4 border-t border-blue-100 w-full space-y-2 text-left">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Award className="h-4 w-4 text-blue-500" />
                                <span>Experience: <strong>{profile?.experience_years || 0} Years</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Cases Handled: <strong>{profile?.cases_handled || 0}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4 text-purple-500" />
                                <span>Status: <strong>{availabilitySummary}</strong></span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Details Section */}
                <div className="md:col-span-2 space-y-6">
                    {/* Professional Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-gray-500" /> Professional Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium mb-1 block">Specialization</label>
                                            <Input
                                                value={formData.specialization}
                                                onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                                placeholder="e.g. Cardiologist"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-1 block">Years of Experience</label>
                                            <Input
                                                type="number"
                                                value={formData.experience_years}
                                                onChange={e => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">License Number</label>
                                        <Input
                                            value={formData.license_number}
                                            onChange={e => setFormData({ ...formData, license_number: e.target.value })}
                                            placeholder="Medical License ID"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Cases Handled (approx)</label>
                                        <Input
                                            type="number"
                                            value={formData.cases_handled}
                                            onChange={e => setFormData({ ...formData, cases_handled: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Biography</label>
                                        <Input
                                            value={formData.biography}
                                            onChange={e => setFormData({ ...formData, biography: e.target.value })}
                                            placeholder="Short professional bio..."
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase tracking-wide">License Number</span>
                                            <p className="font-medium">{profile?.license_number || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase tracking-wide">Cases Handled</span>
                                            <p className="font-medium">{profile?.cases_handled || 0}+</p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wide">Biography</span>
                                        <p className="text-sm text-gray-700 mt-1">{profile?.biography || 'No biography added yet.'}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Affiliations */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5 text-gray-500" /> Affiliated Hospitals
                            </CardTitle>
                            <p className="text-sm text-gray-500">Hospitals where you currently practice</p>
                        </CardHeader>
                        <CardContent>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <Input
                                            value={hospitalInput}
                                            onChange={e => setHospitalInput(e.target.value)}
                                            placeholder="Enter hospital name"
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addHospital())}
                                        />
                                        <Button onClick={addHospital} type="button" size="sm">Add</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.affiliated_hospitals?.map((hospital, idx) => (
                                            <div key={idx} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                                {hospital}
                                                <button onClick={() => removeHospital(idx)} className="text-gray-500 hover:text-red-500"><X className="h-3 w-3" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {profile?.affiliated_hospitals && profile.affiliated_hospitals.length > 0 ? (
                                        <ul className="space-y-2">
                                            {profile.affiliated_hospitals.map((hospital, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">
                                                    <MapPin className="h-4 w-4 text-gray-400" />
                                                    {hospital}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">No affiliated hospitals listed.</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Actions (Only in Edit Mode) */}
                    {isEditing && (
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => { setIsEditing(false); setFormData(profile || formData); }}>Cancel</Button>
                            <Button onClick={handleSave} className="flex items-center gap-2"><Save className="h-4 w-4" /> Save Profile</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
