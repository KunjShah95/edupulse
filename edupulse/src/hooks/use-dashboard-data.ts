import { useQuery } from '@tanstack/react-query';

const fetchDashboardData = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const recentActivities = [
        { id: 1, user: 'John Smith', action: 'submitted Grade 10 Math results', time: '2 hours ago', avatar: 'JS' },
        { id: 2, user: 'Sarah Wilson', action: 'added a new event "Science Fair"', time: '4 hours ago', avatar: 'SW' },
        { id: 3, user: 'Mike Brown', action: 'updated the bus route #42', time: '5 hours ago', avatar: 'MB' },
        { id: 4, user: 'Emily Davis', action: 'approved 5 leave requests', time: '1 day ago', avatar: 'ED' },
    ];

    const upcomingEvents = [
        { id: 1, title: 'Annual Sports Meet', date: 'Oct 25, 2025', time: '09:00 AM', type: 'Sports' },
        { id: 2, title: 'Parent-Teacher Meeting', date: 'Nov 02, 2025', time: '10:00 AM', type: 'Academic' },
        { id: 3, title: 'Science Exhibition', date: 'Nov 15, 2025', time: '11:00 AM', type: 'Academic' },
    ];

    return { recentActivities, upcomingEvents };
};

export const useDashboardData = () => {
    return useQuery({
        queryKey: ['dashboardData'],
        queryFn: fetchDashboardData,
    });
};
