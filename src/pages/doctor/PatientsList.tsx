import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useRef } from 'react';
import { Search, MoreVertical, Phone, Mail, Calendar, Clock, FileText, Plus, Download, LogOut, Wand2, Loader2, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { getGeminiResponse } from '../../lib/gemini';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createWorker } from 'tesseract.js';

// Types
interface Patient {
    id: string;
    doctor_id: string;
    name: string;
    email: string;
    phone: string;
    height: number;
    weight: number;
    status: 'current' | 'past';
    created_at: string;
}

interface PatientRecord {
    id: string;
    diagnosis: string;
    prescription_url: string | null;
    visit_date: string;
}

interface Appointment {
    id: string;
    patient_name: string;
    appointment_date: string;
    type: string;
    status: string;
}

const PatientsList = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'current' | 'past' | 'appointments'>('current');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Data State
    const [patients, setPatients] = useState<Patient[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);

    // Modal State
    const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false); // Success Popup State
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Add Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        height: '',
        weight: '',
        diagnosis: '',
    });
    const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);

    // Smart Fill State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const smartFillInputRef = useRef<HTMLInputElement>(null);

    // Fetch Data
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (activeTab === 'appointments') {
                    const { data, error } = await supabase
                        .from('appointments')
                        .select('*')
                        .eq('doctor_id', user.id)
                        .order('appointment_date', { ascending: true });

                    if (error) throw error;
                    setAppointments(data || []);
                } else {
                    const { data, error } = await supabase
                        .from('doctor_patients')
                        .select('*')
                        .eq('doctor_id', user.id)
                        .eq('status', activeTab)
                        .ilike('name', `%${searchTerm}%`)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    setPatients(data || []);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                // Fallback to empty if table doesn't exist yet (before SQL run)
                setPatients([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, activeTab, searchTerm, refreshTrigger]);

    // Fetch details when a patient is selected
    useEffect(() => {
        if (selectedPatient) {
            const fetchRecords = async () => {
                const { data } = await supabase
                    .from('patient_records')
                    .select('*')
                    .eq('patient_id', selectedPatient.id)
                    .order('visit_date', { ascending: false });
                setPatientRecords(data || []);
            };
            fetchRecords();
            setIsDetailsOpen(true);
        }
    }, [selectedPatient]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPrescriptionFile(e.target.files[0]);
        }
    };

    const handleFileUpload = async (file: File): Promise<string | null> => {
        if (!user) return null;
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('prescriptions')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('prescriptions').getPublicUrl(fileName);
            return data.publicUrl;
        } catch (error) {
            console.error('Upload failed:', error);
            return null;
        }
    };

    // ----------- SMART FILL LOGIC -----------
    const triggerSmartFill = () => {
        smartFillInputRef.current?.click();
    };

    const handleSmartFillImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        try {
            // 1. OCR Step (Image -> Text)
            const worker = await createWorker('eng');
            const ret = await worker.recognize(file);
            const rawText = ret.data.text;
            await worker.terminate();

            console.log("OCR Extracted Text:", rawText);

            // 2. AI Parsing Step (Text -> Structured Data)
            // We use the app's Gemini integration to intelligently parse the messy OCR text
            const prompt = `
                You are a medical data assistant. extract the following patient details from the text below into a purely JSON format.
                
                Fields required:
                - name (string, full name)
                - email (string)
                - phone (string)
                - height (number, in cm. if in meters convert to cm)
                - weight (number, in kg)
                - diagnosis (string, specific diagnosis)
                - prescription (string, full text of Rx)

                If a field is not found, return null. 
                Do not include markdown formatting like \`\`\`json. Just return the raw JSON string.

                Text to analyze:
                "${rawText}"
            `;

            const aiResponse = await getGeminiResponse(prompt);
            console.log("Gemini Response:", aiResponse);

            let extractedData: any = {};
            try {
                // Attempt to clean and parse JSON
                const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                extractedData = JSON.parse(cleanJson);
            } catch (jsonError) {
                console.error("Failed to parse Gemini JSON:", jsonError);
                extractedData.diagnosis = `Complex Note Parsed: \n${aiResponse}`;
            }

            // 3. Populate Form
            setFormData(prev => ({
                ...prev,
                name: extractedData.name || extractedData.patient_name || prev.name,
                email: extractedData.email || prev.email,
                phone: extractedData.phone || prev.phone,
                height: extractedData.height ? String(extractedData.height) : prev.height,
                weight: extractedData.weight ? String(extractedData.weight) : prev.weight,
                diagnosis: extractedData.diagnosis
                    ? (extractedData.prescription ? `${extractedData.diagnosis}\n\nRx: ${extractedData.prescription}` : extractedData.diagnosis)
                    : prev.diagnosis
            }));

            setPrescriptionFile(file);
            alert("Smart Fill Complete! Analysis by Gemini AI.");

        } catch (err: any) {
            console.error(err);
            alert("Smart Fill Failed: " + err.message);
        } finally {
            setIsAnalyzing(false);
            if (smartFillInputRef.current) smartFillInputRef.current.value = '';
        }
    };


    // ----------------------------------------

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsLoading(true);

        try {
            // 1. Create Patient
            const { data: patientData, error: patientError } = await supabase
                .from('doctor_patients')
                .insert([{
                    doctor_id: user.id,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    height: formData.height ? parseFloat(formData.height) : null,
                    weight: formData.weight ? parseFloat(formData.weight) : null,
                    status: 'current'
                }])
                .select()
                .single();

            if (patientError) throw patientError;

            // 2. Upload File if exists
            let fileUrl = null;
            if (prescriptionFile) {
                fileUrl = await handleFileUpload(prescriptionFile);
            }

            // 3. Create Initial Record
            if (formData.diagnosis || fileUrl) {
                await supabase.from('patient_records').insert([{
                    patient_id: patientData.id,
                    doctor_id: user.id,
                    diagnosis: formData.diagnosis,
                    prescription_url: fileUrl
                }]);
            }

            setRefreshTrigger(prev => prev + 1);
            setIsAddPatientOpen(false);
            resetForm();
            setIsSuccessOpen(true); // Trigger Success Modal

        } catch (error: any) {
            console.error('Error adding patient:', error);
            alert('Failed to add patient: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedPatient) return;
        setIsLoading(true); // Reuse loading state for modal

        // Reuse formData (diagnosis) and file for this
        try {
            let fileUrl = null;
            if (prescriptionFile) {
                fileUrl = await handleFileUpload(prescriptionFile);
            }

            await supabase.from('patient_records').insert([{
                patient_id: selectedPatient.id,
                doctor_id: user.id,
                diagnosis: formData.diagnosis,
                prescription_url: fileUrl
            }]);

            // Refresh local records
            const { data } = await supabase
                .from('patient_records')
                .select('*')
                .eq('patient_id', selectedPatient.id)
                .order('visit_date', { ascending: false });
            setPatientRecords(data || []);

            resetForm(); // Clear inputs but keep modal open
            alert('Record added!');
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', height: '', weight: '', diagnosis: '' });
        setPrescriptionFile(null);
    };

    const handleDischarge = async () => {
        if (!selectedPatient || !user) return;
        if (!confirm('Are you sure you want to discharge this patient? They will be moved to Past Patients.')) return;

        try {
            const { error } = await supabase
                .from('doctor_patients')
                .update({ status: 'past' })
                .eq('id', selectedPatient.id);

            if (error) throw error;

            alert('Patient discharged successfully.');
            setIsDetailsOpen(false);
            setRefreshTrigger(prev => prev + 1); // Refresh list
        } catch (err: any) {
            console.error('Error discharging patient:', err);
            alert('Failed to discharge: ' + err.message);
        }
    };

    const handleGeneratePDF = () => {
        if (!selectedPatient) return;

        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text('Medical Prescription / Report', 105, 20, { align: 'center' });

        // Doctor Info
        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);
        doc.text(`Dr. ${user?.full_name || 'Medical Officer'}`, 14, 30);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);

        // Line
        doc.setLineWidth(0.5);
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 42, 196, 42);

        // Patient Info
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Patient Details', 14, 52);

        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(`Name: ${selectedPatient.name}`, 14, 60);
        doc.text(`Contact: ${selectedPatient.phone || 'N/A'}`, 14, 66);
        doc.text(`Email: ${selectedPatient.email || 'N/A'}`, 14, 72);

        doc.text(`Height: ${selectedPatient.height} cm`, 100, 60);
        doc.text(`Weight: ${selectedPatient.weight} kg`, 100, 66);

        // Diagnosis / Records Table
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Diagnosis & Medical History', 14, 85);

        const tableData = patientRecords.map(rec => [
            new Date(rec.visit_date).toLocaleDateString() + ' ' + new Date(rec.visit_date).toLocaleTimeString(),
            rec.diagnosis || 'No notes recorded.'
        ]);

        autoTable(doc, {
            startY: 90,
            head: [['Date', 'Diagnosis / Notes']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [66, 133, 244] },
        });

        // Footer
        const finalY = (doc as any).lastAutoTable.finalY || 150;
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text('*** Electronically Generated by MediConnect ***', 105, finalY + 20, { align: 'center' });

        doc.save(`Prescription_${selectedPatient.name.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <div className="space-y-6">
            {/* Header & Tabs */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Patient Management</h1>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setIsAddPatientOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Patient
                        </Button>
                    </div>
                </div>

                <div className="flex space-x-1 rounded-xl bg-gray-100 p-1 w-fit">
                    {(['current', 'past', 'appointments'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${activeTab === tab
                                ? 'bg-white text-blue-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                                }`}
                        >
                            {tab === 'appointments' ? 'Appointments' : `${tab} Patients`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <Card>
                <CardHeader>
                    {activeTab !== 'appointments' && (
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search patients..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto min-h-[300px]">
                        {/* PATIENT LIST VIEW */}
                        {activeTab !== 'appointments' && (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Name</th>
                                        <th className="px-4 py-3">Contact</th>
                                        <th className="px-4 py-3">Vitals</th>
                                        <th className="px-4 py-3">Added</th>
                                        <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {patients.length === 0 && !isLoading && (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">No patients found.</td></tr>
                                    )}
                                    {patients.map((patient) => (
                                        <tr key={patient.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedPatient(patient)}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{patient.name}</div>
                                                <div className="text-xs text-gray-500">{patient.email}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{patient.phone}</td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {patient.height && patient.weight ? `${patient.height}cm / ${patient.weight}kg` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {new Date(patient.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* APPOINTMENTS VIEW */}
                        {activeTab === 'appointments' && (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Date/Time</th>
                                        <th className="px-4 py-3">Patient</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {appointments.length === 0 && !isLoading && (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">No appointments scheduled.</td></tr>
                                    )}
                                    {appointments.map((apt) => (
                                        <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-blue-500" />
                                                    <span className="font-medium">{new Date(apt.appointment_date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 pl-6">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium">{apt.patient_name}</td>
                                            <td className="px-4 py-3">{apt.type}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                    {apt.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button size="sm">View</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* SUCCESS MODAL */}
            <Modal isOpen={isSuccessOpen} onClose={() => setIsSuccessOpen(false)} title="Success">
                <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Patient Added Successfully!</h3>
                    <p className="text-sm text-gray-500">The patient has been registered and the record has been created.</p>
                    <Button onClick={() => setIsSuccessOpen(false)} className="w-full">
                        Close
                    </Button>
                </div>
            </Modal>

            {/* ADD PATIENT MODAL */}
            <Modal isOpen={isAddPatientOpen} onClose={() => setIsAddPatientOpen(false)} title="Add New Patient">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Smart Fill Header */}
                    <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                                <Wand2 className="h-4 w-4" /> Smart Fill
                            </h4>
                            <p className="text-xs text-blue-700">Upload a prescription/report to autofill details.</p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-white text-blue-600 border-blue-200 hover:bg-blue-100"
                            onClick={triggerSmartFill}
                            disabled={isAnalyzing}
                        >
                            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                            {isAnalyzing ? 'Analyzing...' : 'Upload & Autofill'}
                        </Button>
                        <input
                            type="file"
                            ref={smartFillInputRef}
                            className="hidden"
                            accept="image/*, .pdf"
                            onChange={handleSmartFillImage}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Full Name</label>
                            <Input name="name" required value={formData.name} onChange={handleInputChange} placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <Input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Phone</label>
                            <Input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+1 (555) 000-0000" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Height (cm)</label>
                                <Input name="height" type="number" value={formData.height} onChange={handleInputChange} placeholder="175" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Weight (kg)</label>
                                <Input name="weight" type="number" value={formData.weight} onChange={handleInputChange} placeholder="70" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Initial Diagnosis</label>
                        <textarea name="diagnosis" rows={3} className="w-full rounded-md border p-2 text-sm" value={formData.diagnosis} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Upload Prescription</label>
                        <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setIsAddPatientOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Add Patient'}</Button>
                    </div>
                </form>
            </Modal>

            {/* PATIENT DETAILS MODAL */}
            <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Patient Details">
                {selectedPatient && (
                    <div className="space-y-6">
                        {/* Patient Info Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between bg-gray-50 p-4 rounded-lg gap-4">
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
                                    {selectedPatient.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{selectedPatient.name}</h3>
                                    <div className="text-sm text-gray-500 flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1 mt-1">
                                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {selectedPatient.email || 'N/A'}</span>
                                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedPatient.phone || 'N/A'}</span>
                                        <span className="hidden sm:inline">|</span>
                                        <span>Height: {selectedPatient.height}cm</span>
                                        <span>Weight: {selectedPatient.weight}kg</span>
                                    </div>
                                </div>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50 w-full sm:w-auto"
                                    onClick={handleGeneratePDF}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Prescription
                                </Button>
                                {selectedPatient.status === 'current' && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto"
                                        onClick={handleDischarge}
                                    >
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Discharge
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Recent History */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Medical History
                            </h4>
                            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                {patientRecords.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No records found.</p>
                                ) : (
                                    patientRecords.map(rec => (
                                        <div key={rec.id} className="border-l-2 border-blue-200 pl-4 py-1">
                                            <div className="text-xs text-gray-400 mb-1">{new Date(rec.visit_date).toLocaleDateString()}</div>
                                            <p className="text-sm text-gray-800">{rec.diagnosis || 'No diagnosis note.'}</p>
                                            {rec.prescription_url && (
                                                <a href={rec.prescription_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                                                    View Attachment
                                                </a>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Add New Record Section */}
                        <div className="border-t pt-4 mt-4">
                            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Add New Record / Visit Note</h4>
                            <form onSubmit={handleAddRecord} className="space-y-3">
                                <textarea
                                    name="diagnosis"
                                    placeholder="Enter diagnosis or visit notes..."
                                    rows={2}
                                    className="w-full rounded-md border p-2 text-sm"
                                    value={formData.diagnosis}
                                    onChange={handleInputChange}
                                />
                                <div className="flex items-center gap-2">
                                    <input type="file" onChange={handleFileChange} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-gray-100" />
                                    <Button type="submit" size="sm" disabled={isLoading}>{isLoading ? 'Saving...' : 'Add Note'}</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

// End of component
export default PatientsList;
