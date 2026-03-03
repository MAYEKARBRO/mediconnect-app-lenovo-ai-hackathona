import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { Search, MapPin, Award, Video, Star, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DoctorProfile {
    id: string; // auth.id or fake id
    specialization: string;
    affiliated_hospitals: string[];
    experience_years: number;
    cases_handled: number;
    full_name_fetched?: string;
    biography?: string;
    is_hardcoded?: boolean;
}

const HARDCODED_DOCTORS: DoctorProfile[] = [
    {
        id: 'hc-1',
        full_name_fetched: 'Dr. Sarah Jenkins',
        specialization: 'Cardiologist',
        experience_years: 15,
        affiliated_hospitals: ['City Heart Institute', 'Memorial Hospital'],
        cases_handled: 1250,
        biography: 'Expert in interventional cardiology with over 15 years of experience treating complex heart conditions.',
        is_hardcoded: true
    },
    {
        id: 'hc-2',
        full_name_fetched: 'Dr. Michael Chen',
        specialization: 'Dermatologist',
        experience_years: 8,
        affiliated_hospitals: ['Skin Care Center'],
        cases_handled: 3400,
        biography: 'Specializing in cosmetic and medical dermatology, helping patients achieve healthy, radiant skin.',
        is_hardcoded: true
    },
    {
        id: 'hc-3',
        full_name_fetched: 'Dr. Emily Carter',
        specialization: 'Pediatrician',
        experience_years: 10,
        affiliated_hospitals: ['Children\'s Wellness Clinic'],
        cases_handled: 2100,
        biography: 'Dedicated to the health and well-being of children from infancy through adolescence.',
        is_hardcoded: true
    }
];

const DoctorSearch = () => {
    const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        setLoading(true);
        const { data: profiles } = await supabase
            .from('doctor_profiles')
            .select('*');

        let mergedBackend: DoctorProfile[] = [];

        if (profiles) {
            const { data: userProfiles } = await supabase
                .from('profiles')
                .select('id, full_name, role')
                .eq('role', 'doctor');

            mergedBackend = profiles.map(doc => {
                const userProfile = userProfiles?.find(up => up.id === doc.id);
                return {
                    ...doc,
                    full_name_fetched: userProfile?.full_name || 'Dr. Unknown',
                    is_hardcoded: false
                };
            });
        }

        // Merge Hardcoded + Backend
        setDoctors([...HARDCODED_DOCTORS, ...mergedBackend]);
        setLoading(false);
    };

    const filteredDoctors = doctors.filter(doc =>
        doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.full_name_fetched?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.affiliated_hospitals?.some(h => h.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleBook = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening modal when clicking book
        const confirm = window.confirm("Book a video consultation with this doctor for tomorrow?");
        if (confirm) {
            alert("Appointment request sent! Check your email for confirmation.");
        }
    };

    return (
        <div className="space-y-6 relative">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Find a Doctor</h1>

            {/* Search Bar */}
            <div className="flex gap-2 max-w-lg">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search by name, specialization, or hospital..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button>Search</Button>
            </div>

            {/* Results Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <div>Loading doctors...</div>
                ) : filteredDoctors.length === 0 ? (
                    <div className="col-span-3 text-center py-10 text-gray-500">No doctors found matching your criteria.</div>
                ) : (
                    filteredDoctors.map((doc) => (
                        <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.03, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            onClick={() => setSelectedDoctor(doc)}
                        >
                            <Card className="cursor-pointer h-full border-transparent hover:border-blue-200 transition-colors">
                                <CardHeader className="flex flex-row gap-4 items-center">
                                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shadow-sm">
                                        {doc.full_name_fetched?.charAt(0) || 'D'}
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{doc.full_name_fetched}</CardTitle>
                                        <p className="text-sm text-blue-600 font-medium">{doc.specialization || 'General Physician'}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Award className="h-4 w-4 text-gray-400" />
                                        <span>{doc.experience_years || 0} Years Exp.</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="truncate max-w-[200px]" title={doc.affiliated_hospitals?.join(', ')}>
                                            {doc.affiliated_hospitals?.[0] || 'Private Practice'}
                                            {doc.affiliated_hospitals?.length > 1 && ` +${doc.affiliated_hospitals.length - 1} more`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                        <span>{doc.cases_handled || 0} Cases Handled</span>
                                    </div>
                                </CardContent>
                                <div className="p-6 pt-0 mt-auto">
                                    <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={handleBook}>
                                        <Video className="h-4 w-4 mr-2" /> Book Video Consult
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Doctor Details Modal */}
            <AnimatePresence>
                {selectedDoctor && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedDoctor(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative"
                        >
                            <button
                                onClick={() => setSelectedDoctor(null)}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>

                            <div className="p-8 space-y-6">
                                <div className="text-center">
                                    <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 mb-4">
                                        {selectedDoctor.full_name_fetched?.charAt(0)}
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedDoctor.full_name_fetched}</h2>
                                    <p className="text-blue-600 font-medium">{selectedDoctor.specialization}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-semibold mb-2 text-sm uppercase text-gray-500">About</h3>
                                        <p className="text-gray-700 leading-relaxed">
                                            {selectedDoctor.biography || "No biography available for this doctor."}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-blue-700">{selectedDoctor.experience_years}+</div>
                                            <div className="text-xs text-blue-600 uppercase font-bold">Years Experience</div>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-green-700">{selectedDoctor.cases_handled}+</div>
                                            <div className="text-xs text-green-600 uppercase font-bold">Patients Treated</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-2 text-sm uppercase text-gray-500 flex items-center gap-2">
                                            <MapPin className="h-4 w-4" /> Affiliated Hospitals
                                        </h3>
                                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                                            {selectedDoctor.affiliated_hospitals?.map((h, i) => (
                                                <li key={i}>{h}</li>
                                            )) || <li>Private Practice</li>}
                                        </ul>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t">
                                    <Button className="flex-1" onClick={(e) => handleBook(e as any)}>Book Appointment</Button>
                                    <Button variant="outline" className="flex-1" onClick={() => alert("Full profile view integration pending for " + selectedDoctor.full_name_fetched)}>
                                        <User className="h-4 w-4 mr-2" /> View Full Profile
                                    </Button>
                                    {/* Note: Real app would navigate to /patient/doctor/${selectedDoctor.id} here */}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DoctorSearch;
