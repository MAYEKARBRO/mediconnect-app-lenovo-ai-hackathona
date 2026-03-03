import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Users, Calendar, Activity, AlertTriangle, ArrowRight } from 'lucide-react';

const DoctorDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Doctor Dashboard</h1>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">124</div>
                        <p className="text-xs text-gray-500">+12% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Appointments Today</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8</div>
                        <p className="text-xs text-gray-500">2 pending confirmation</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">3</div>
                        <p className="text-xs text-gray-500">Requires immediate attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Trends</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Flu Season</div>
                        <p className="text-xs text-gray-500">High viral cases reported</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">

                {/* Quick Actions / Navigation */}
                <div className="col-span-4 space-y-6">
                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                        <CardHeader>
                            <CardTitle className="text-blue-900">Manage Schedule</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-blue-700 mb-4">View your upcoming appointments, surgeries, and manage availability.</p>
                            <Button onClick={() => navigate('/doctor/schedule')} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                                Go to Schedule <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100">
                        <CardHeader>
                            <CardTitle className="text-purple-900">Health Intelligence & Trends</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-purple-700 mb-4">Analyze disease patterns, classifications (Infectious, NCDs), and patient statistics.</p>
                            <Button onClick={() => navigate('/doctor/trends')} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white">
                                View Disease Analytics <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Patients List (Kept for quick access) */}
                <div className="col-span-3">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Recent Patients</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                                                P{i}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium leading-none">Patient {i}</p>
                                                <p className="text-sm text-gray-500">Check-up</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => navigate('/doctor/patients')}>View</Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
