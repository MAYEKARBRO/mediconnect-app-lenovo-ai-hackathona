import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import {
    Users, UserPlus, Trash2,
    Stethoscope, Syringe, Truck, UserCheck, Shield, Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StaffMember {
    id: string;
    full_name: string;
    role: string;
    employee_id: string;
    contact_number: string;
    is_active: boolean;
}

interface DoctorRequest {
    id: string; // doctor_profile id
    full_name: string;
    specialization: string;
    status: string;
}

const STAFF_ROLES = [
    'Nurse', 'Technician', 'Cleaner', 'Ambulance Driver', 'Receptionist', 'Watchman'
];

const StaffManagement = () => {
    const [activeTab, setActiveTab] = useState('doctors');
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [doctorRequests, setDoctorRequests] = useState<DoctorRequest[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [newStaff, setNewStaff] = useState({
        full_name: '',
        role: 'Nurse',
        employee_id: '',
        contact_number: ''
    });

    useEffect(() => {
        if (activeTab === 'doctors') {
            fetchDoctors();
        } else {
            fetchStaff(activeTab);
        }
    }, [activeTab]);

    const fetchDoctors = async () => {
        // Fetch profiles joined with doctor_profiles where role is doctor
        const { data: doctors } = await supabase
            .from('doctor_profiles')
            .select('*');

        if (doctors) {
            const requests = await Promise.all(doctors.map(async (doc) => {
                const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', doc.id).single();
                return {
                    id: doc.id,
                    full_name: profile?.full_name || 'Unknown',
                    specialization: doc.specialization,
                    status: doc.status || 'approved' // Fallback
                };
            }));
            setDoctorRequests(requests);
        }
    };

    const fetchStaff = async (roleFilter?: string) => {
        let query = supabase.from('staff').select('*').eq('is_active', true);
        if (roleFilter && roleFilter !== 'all') {
            query = query.eq('role', roleFilter);
        }
        const { data } = await query;
        if (data) setStaffList(data);
    };

    const handleAddStaff = async () => {
        if (!newStaff.full_name || !newStaff.employee_id) return;

        const { error } = await supabase.from('staff').insert([{
            ...newStaff,
            is_active: true
        }]);

        if (error) {
            alert('Error adding staff: ' + error.message);
        } else {
            setShowAddModal(false);
            const addedRole = newStaff.role;
            setNewStaff({ full_name: '', role: 'Nurse', employee_id: '', contact_number: '' });
            // Switch to the section of the new staff member
            setActiveTab(addedRole);
            // Fetch will be triggered by useEffect on activeTab change
        }
    };

    const handleRemoveStaff = async (id: string) => {
        if (!confirm('Are you sure you want to remove this staff member?')) return;
        await supabase.from('staff').update({ is_active: false }).eq('id', id);
        fetchStaff(activeTab);
    };

    const handleDoctorAction = async (id: string, action: 'approved' | 'rejected') => {
        await supabase.from('doctor_profiles').update({ status: action }).eq('id', id);
        fetchDoctors();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Staff Management</h1>
                {activeTab !== 'doctors' && (
                    <Button onClick={() => setShowAddModal(true)} className="bg-blue-600">
                        <UserPlus className="h-4 w-4 mr-2" /> Add Staff
                    </Button>
                )}
            </div>

            {/* Role Tabs */}
            <div className="flex flex-wrap gap-2 pb-4 border-b overflow-x-auto">
                <Button
                    variant={activeTab === 'doctors' ? 'primary' : 'outline'}
                    onClick={() => setActiveTab('doctors')}
                    className={activeTab === 'doctors' ? 'bg-blue-600' : ''}
                >
                    <Stethoscope className="h-4 w-4 mr-2" /> Doctors
                </Button>
                {STAFF_ROLES.map(role => (
                    <Button
                        key={role}
                        variant={activeTab === role ? 'primary' : 'outline'}
                        onClick={() => setActiveTab(role)}
                        className={activeTab === role ? 'bg-blue-600' : ''}
                    >
                        {getRoleIcon(role)} <span className="ml-2">{role}s</span>
                    </Button>
                ))}
            </div>

            <Card>
                <CardContent className="p-0">
                    {activeTab === 'doctors' ? (
                        <div className="space-y-8 p-6">
                            {/* Pending Requests Section */}
                            {doctorRequests.some(d => d.status === 'pending' || !d.status) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900 border-l-4 border-yellow-500 pl-3">New Joining Requests</h3>
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-yellow-50 text-yellow-900 font-medium">
                                                <tr>
                                                    <th className="px-6 py-3">Name</th>
                                                    <th className="px-6 py-3">Specialization</th>
                                                    <th className="px-6 py-3">Status</th>
                                                    <th className="px-6 py-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {doctorRequests.filter(d => d.status === 'pending' || !d.status).map((doc) => (
                                                    <motion.tr
                                                        layout
                                                        key={doc.id}
                                                        className="hover:bg-gray-50 bg-white"
                                                    >
                                                        <td className="px-6 py-4 font-medium">{doc.full_name}</td>
                                                        <td className="px-6 py-4 text-gray-500">{doc.specialization}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                Pending Review
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right space-x-2">
                                                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleDoctorAction(doc.id, 'approved')}>
                                                                Approve
                                                            </Button>
                                                            <Button size="sm" variant="danger" onClick={() => handleDoctorAction(doc.id, 'rejected')}>
                                                                Reject
                                                            </Button>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}

                            {/* Approved Doctors Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 border-l-4 border-blue-500 pl-3">Medical Staff Directory</h3>
                                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md">Total: {doctorRequests.filter(d => d.status === 'approved').length}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {doctorRequests.filter(d => d.status === 'approved').map((doc) => (
                                        <motion.div
                                            key={doc.id}
                                            whileHover={{ scale: 1.02 }}
                                            className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-all flex items-start gap-4"
                                        >
                                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                {doc.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{doc.full_name}</h4>
                                                <p className="text-sm text-blue-600 font-medium">{doc.specialization}</p>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                                    <span className="text-xs text-gray-500">Active</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {doctorRequests.filter(d => d.status === 'approved').length === 0 && (
                                        <div className="col-span-full py-8 text-center text-gray-500 border-2 border-dashed rounded-lg">
                                            No active doctors yet. Approve requests to populate this list.
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        /* ================= OTHER STAFF TABLE ================= */
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                                    <tr>
                                        <th className="px-6 py-4">Employee ID</th>
                                        <th className="px-6 py-4">Full Name</th>
                                        <th className="px-6 py-4">Contact</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y result-list">
                                    <AnimatePresence>
                                        {staffList.map((staff) => (
                                            <motion.tr
                                                key={staff.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 font-mono text-gray-600">{staff.employee_id}</td>
                                                <td className="px-6 py-4 font-medium">{staff.full_name}</td>
                                                <td className="px-6 py-4 text-gray-500">{staff.contact_number}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleRemoveStaff(staff.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                    {staffList.length === 0 && (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No {activeTab.toLowerCase()}s found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Staff Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 shadow-xl"
                        >
                            <h2 className="text-xl font-bold">Add New {activeTab === 'doctors' ? 'Staff' : activeTab}</h2>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input value={newStaff.full_name} onChange={e => setNewStaff({ ...newStaff, full_name: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <select
                                    className="w-full border rounded-md p-2 text-sm"
                                    value={newStaff.role}
                                    onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                                >
                                    {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Employee ID</label>
                                <Input value={newStaff.employee_id} onChange={e => setNewStaff({ ...newStaff, employee_id: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Contact Number</label>
                                <Input value={newStaff.contact_number} onChange={e => setNewStaff({ ...newStaff, contact_number: e.target.value })} />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                                <Button onClick={handleAddStaff}>Add Staff</Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

function getRoleIcon(role: string) {
    switch (role) {
        case 'Nurse': return <Syringe className="h-4 w-4" />;
        case 'Ambulance Driver': return <Truck className="h-4 w-4" />;
        case 'Receptionist': return <UserCheck className="h-4 w-4" />;
        case 'Watchman': return <Shield className="h-4 w-4" />;
        case 'Cleaner': return <Trash className="h-4 w-4" />;
        default: return <Users className="h-4 w-4" />;
    }
}

export default StaffManagement;
