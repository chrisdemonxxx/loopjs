import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import { WS_URL } from '../config';
import request from '../axios';
import { User } from '../types';

const ClientDetailPage = () => {
    const { uuid } = useParams();
    const [client, setClient] = useState<User | null>(null);
    const [metrics, setMetrics] = useState<{
        cpuUsage: { x: number; y: number }[];
        ramUsage: { x: number; y: number }[];
    }>({
        cpuUsage: [],
        ramUsage: [],
    });

    useEffect(() => {
        const fetchClientData = async () => {
            const res = await request.get(`info/get-user/${uuid}`);
            setClient(res.data.data);
        };

        fetchClientData();

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'subscribe', uuid }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'metrics') {
                const now = new Date().getTime();
                setMetrics((prevMetrics) => ({
                    cpuUsage: [...prevMetrics.cpuUsage, { x: now, y: data.cpuUsage }],
                    ramUsage: [...prevMetrics.ramUsage, { x: now, y: data.ramUsage }],
                }));
            }
        };

        return () => {
            ws.close();
        };
    }, [uuid]);

    if (!client) {
        return <div>Loading...</div>;
    }

    const chartOptions = {
        chart: {
            type: 'line',
            animations: {
                enabled: true,
                easing: 'linear',
                dynamicAnimation: {
                    speed: 1000,
                },
            },
        },
        xaxis: {
            type: 'datetime',
        },
        yaxis: {
            min: 0,
            max: 100,
        },
    };

    return (
        <div>
            <h1>{client.computerName}</h1>
            <p>IP: {client.ipAddress}</p>
            <p>OS: {client.osInfo}</p>
            <p>Platform: {client.platform}</p>
            <p>Status: {client.status}</p>
            {client.diskUsage && (
                <p>
                    Disk Usage: {client.diskUsage.used} / {client.diskUsage.total}
                </p>
            )}

            <div className="charts">
                <ReactApexChart
                    options={chartOptions}
                    series={[{ name: 'CPU Usage', data: metrics.cpuUsage }]}
                    type="line"
                    height={350}
                />
                <ReactApexChart
                    options={chartOptions}
                    series={[{ name: 'RAM Usage', data: metrics.ramUsage }]}
                    type="line"
                    height={350}
                />
            </div>
        </div>
    );
};

export default ClientDetailPage;
