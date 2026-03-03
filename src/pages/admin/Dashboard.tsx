
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Users, Activity, Box } from 'lucide-react';

const AdminDashboard = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Hospital Administration</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">240</div>
                        <p className="text-xs text-gray-500">Doctors, Nurses, Support</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Patients Admitted</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">45</div>
                        <p className="text-xs text-gray-500">Current occupancy: 78%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inventory Alerts</CardTitle>
                        <Box className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">12</div>
                        <p className="text-xs text-gray-500">Items low on stock</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
