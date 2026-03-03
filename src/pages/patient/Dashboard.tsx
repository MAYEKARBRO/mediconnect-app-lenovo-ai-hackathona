import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { FileText, MessageSquare, Search, PartyPopper, User, Pill } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const PatientDashboard = () => {
    const navigate = useNavigate();

    const sections = [
        { icon: FileText, label: 'My Visits', path: '/patient/visits', color: 'text-blue-600', bg: 'bg-blue-50', border: 'hover:border-blue-200' },
        { icon: MessageSquare, label: 'AI Health Chat', path: '/patient/chatbot', color: 'text-purple-600', bg: 'bg-purple-50', border: 'hover:border-purple-200' },
        { icon: Search, label: 'Find a Doctor', path: '/patient/search', color: 'text-teal-600', bg: 'bg-teal-50', border: 'hover:border-teal-200' },
        { icon: MessageSquare, label: 'Message Doctor', path: '/patient/messages', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'hover:border-indigo-200' },
        { icon: User, label: 'My Profile', path: '/patient/profile', color: 'text-gray-600', bg: 'bg-gray-50', border: 'hover:border-gray-200' },
        { icon: PartyPopper, label: 'Health Events', path: '/patient/events', color: 'text-pink-600', bg: 'bg-pink-50', border: 'hover:border-pink-200' },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">My Health Portal</h1>
                <p className="text-gray-600 text-lg">
                    Welcome to your personal health dashboard. Here you can manage your appointments, view your medical history,
                    consult with AI or real doctors, and track your wellness journey.
                </p>
                <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm text-gray-500">
                    <div className="flex items-start gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-full"><FileText className="h-4 w-4 text-blue-600" /></div>
                        <span>Access all your digital prescriptions and diagnosis reports instantly.</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="bg-purple-100 p-1.5 rounded-full"><MessageSquare className="h-4 w-4 text-purple-600" /></div>
                        <span>Chat with our advanced AI assistant for immediate health queries.</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="bg-teal-100 p-1.5 rounded-full"><Search className="h-4 w-4 text-teal-600" /></div>
                        <span>Find top specialists and book video consultations in seconds.</span>
                    </div>
                </div>
            </div>

            {/* Main Navigation Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {sections.map((item) => (
                    <Card
                        key={item.label}
                        className={`cursor-pointer transition-all hover:shadow-md border-transparent hover:border ${item.border}`}
                        onClick={() => navigate(item.path)}
                    >
                        <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                            <div className={`p-3 rounded-full ${item.bg}`}>
                                <item.icon className={`h-6 w-6 ${item.color}`} />
                            </div>
                            <span className="font-medium text-sm text-gray-700">{item.label}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Promotions / Events */}
                <Card className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-100">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <PartyPopper className="h-5 w-5 text-pink-500" />
                        <CardTitle className="text-lg text-pink-900">Health Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-pink-700 mb-3">Join our upcoming webinar on "Heart Health Awareness" next Saturday.</p>
                        <Button variant="outline" size="sm" className="bg-white/50 border-pink-200 hover:bg-white text-pink-800">View Events</Button>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Pill className="h-5 w-5 text-green-500" />
                        <CardTitle className="text-lg text-green-900">Medicine Offers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-green-700 mb-3">Get flat 20% off on your first medicine order from our partner pharmacy.</p>
                        <Button variant="outline" size="sm" className="bg-white/50 border-green-200 hover:bg-white text-green-800">Order Now</Button>
                    </CardContent>
                </Card>

                {/* Recent Visit / Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Visit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-gray-500">No recent visits recorded.</div>
                        <Button variant="ghost" className="px-0 mt-2 h-auto text-blue-600 hover:text-blue-700 hover:bg-transparent" onClick={() => navigate('/patient/visits')}>View History</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PatientDashboard;
