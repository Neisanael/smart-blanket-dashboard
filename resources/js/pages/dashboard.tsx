// resources/js/Pages/Dashboard.jsx
import Gauge from '@/components/gauge';
import GradientSlider from '@/components/gradient-slider';
import { auth, db } from '@/lib/firebase';
import { CategoryScale, ChartData, Chart as ChartJS, ChartOptions, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { onValue, ref, set } from 'firebase/database';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                window.location.href = '/login'; // jika belum login, redirect
            }
            setUser(currentUser);
        });
        return () => unsub();
    }, []);

    const [suhuSelimut, setSuhuSelimut] = useState<number | null>(null);
    const [suhuPemanas, setSuhuPemanas] = useState<number | null>(null);
    const [suhuTubuh, setSuhuTubuh] = useState<number | null>(null);

    useEffect(() => {
        const monitoringRef = ref(db, 'monitoring');
        const unsubscribe = onValue(monitoringRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setSuhuSelimut(data.selimut ?? 0); // 🔹 match DB key
                setSuhuPemanas(data.heater ?? 0); // 🔹 match DB key
                setSuhuTubuh(data.tubuh ?? 0); // 🔹 match DB key
            }
        });

        return () => unsubscribe();
    }, []);

    const [setpoint, setSetpoint] = useState<number | null>(null);
    const [speed, setSpeed] = useState<number | null>(null);
    const [power, setPower] = useState<boolean | null>(null);

    useEffect(() => {
        const controlRef = ref(db, 'control');
        return onValue(controlRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setSetpoint(data.setpoint ?? 36);
                setSpeed(data.speed ?? 1);
                setPower(data.state ?? false);
            }
        });
    }, []);

    // Update Firebase whenever slider moves
    const updateSetpoint = (val: number) => {
        setSetpoint(val);
        set(ref(db, 'control/setpoint'), val);
    };

    const updateSpeed = (val: number) => {
        setSpeed(val);
        set(ref(db, 'control/speed'), val);
    };

    const updatePower = (val: boolean) => {
        setPower(val);
        set(ref(db, 'control/state'), val);
    };

    const getBlowerSpeed = (value: number) => {
        if (value === 1) return 'LOW';
        if (value === 2) return 'MEDIUM';
        if (value === 3) return 'HIGH';
        return '--';
    };

    // Constants
    const DATA_POINT_INTERVAL = 20000; // 20 seconds
    const BLOCKS_TO_KEEP = 8; // 8 blok (0–8)
    const POINTS_PER_BLOCK = 15; // 15 titik per blok
    const TOTAL_POINTS_TO_KEEP = BLOCKS_TO_KEEP * POINTS_PER_BLOCK; // 120 data point

    const [blanketValues, setBlanketValues] = useState<{ x: number; y: number }[]>([]);
    const [bodyValues, setBodyValues] = useState<{ x: number; y: number }[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setBlanketValues((prev) => {
                const updated = [
                    ...prev,
                    { x: prev.length / POINTS_PER_BLOCK, y: suhuSelimut ?? 0 }, // x = blok ke berapa (0..8)
                ];
                return updated.slice(-TOTAL_POINTS_TO_KEEP);
            });

            setBodyValues((prev) => {
                const updated = [...prev, { x: prev.length / POINTS_PER_BLOCK, y: suhuTubuh ?? 0 }];
                return updated.slice(-TOTAL_POINTS_TO_KEEP);
            });
        }, DATA_POINT_INTERVAL);

        return () => clearInterval(interval);
    }, [suhuSelimut, suhuTubuh]);

    // Chart Data pakai objek {x,y}
    const chartData: ChartData<'line', { x: number; y: number }[], number> = {
        datasets: [
            {
                label: 'Blanket Average Temperature (°C)',
                data: blanketValues,
                borderColor: 'blue',
                backgroundColor: 'blue',
                borderWidth: 2,
                stepped: true,
                fill: false,
                parsing: false as const, // 🔧 fix
            },
            {
                label: 'Body Temperature (°C)',
                data: bodyValues,
                borderColor: 'orange',
                backgroundColor: 'orange',
                borderWidth: 2,
                stepped: true,
                fill: false,
                parsing: false as const, // 🔧 fix
            },
        ],
    };

    // Chart Options
    const options: ChartOptions<'line'> = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: 'white',
                    font: { size: 12 },
                },
            },
            title: {
                display: true,
                text: `${getBlowerSpeed(speed ?? 0).toUpperCase()} SPEED, BLANKET SETPOINT ${setpoint ?? '--'} °C`,
                color: 'white',
                font: { size: 16, weight: 'bold' },
            },
        },
        scales: {
            x: {
                type: 'linear',
                min: 0,
                max: 8,
                ticks: {
                    stepSize: 1,
                    color: 'white',
                },
                grid: { color: 'white' },
                title: {
                    display: true,
                    text: 'Time every 5 minutes',
                    color: 'white',
                },
            },
            y: {
                min: 0,
                max: 50,
                ticks: { stepSize: 10, color: 'white' },
                grid: { color: 'white' },
                title: {
                    display: true,
                    text: 'Temperature (°C)',
                    color: 'white',
                },
            },
        },
    };

    return (
        <div className="min-h-screen bg-red-900 p-6 font-sans text-white">
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <p className="text-lg font-bold">Status:</p>
                    <p className="text-xl">Kendali dan Monitoring Aplikasi</p>
                    <p className="text-xl">Monitoring Web</p>
                    <p className="text-xl">Monitoring Alat</p>
                    <button onClick={() => signOut(auth)} className="rounded bg-red-500 px-4 py-2 hover:bg-red-600">
                        Logout
                    </button>
                </div>
                <div className="mt-2 flex items-center justify-center">
                    <button
                        onClick={() => updatePower(!power)}
                        className={`flex w-24 items-center justify-between rounded-full px-3 py-1 transition-colors duration-300 ${
                            power ? 'bg-green-700' : 'bg-red-700'
                        }`}
                    >
                        {power ? (
                            <>
                                <span className="font-semibold text-white">ON</span>
                                <div className="h-4 w-4 rounded-full bg-green-300" />
                            </>
                        ) : (
                            <>
                                <div className="h-4 w-4 rounded-full bg-red-300" />
                                <span className="font-semibold text-white">OFF</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            <h1 className="mb-8 text-center text-3xl font-bold">Blanket warmer 01</h1>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* KENDALI */}
                <div className="rounded-xl bg-red-800 p-6 shadow-xl">
                    <h2 className="mb-4 text-center text-2xl font-bold">KENDALI</h2>
                    <div className="mb-8">
                        <p className="text-lg">Kecepatan Blower:</p>
                        <GradientSlider
                            icon="/wind.png"
                            value={speed!}
                            setValue={updateSpeed}
                            gradient="lightblue, dodgerblue"
                            min={1}
                            max={3}
                            labelFunc={(val) => (val === 3 ? 'HIGH' : val === 2 ? 'MEDIUM' : 'LOW')}
                        />
                    </div>
                    <div>
                        <p className="text-lg">Suhu Setpoint Selimut</p>
                        {setpoint !== null && (
                            <GradientSlider
                                icon="/fire.png"
                                value={setpoint}
                                setValue={updateSetpoint}
                                gradient="orange, red"
                                min={36}
                                max={40}
                                unit="°C"
                            />
                        )}
                    </div>
                </div>

                {/* MONITORING */}
                <div className="rounded-xl bg-red-800 p-6 shadow-xl">
                    <h2 className="mb-4 text-center text-2xl font-bold">MONITORING</h2>
                    <div className="mb-6 grid grid-cols-3 gap-4">
                        <Gauge value={suhuSelimut!} min={26} max={48} label="Suhu Rata-Rata Selimut" />
                        <Gauge value={suhuPemanas!} min={26} max={80} label="Suhu Pemanas" />
                        <Gauge value={suhuTubuh!} min={20} max={40} label="Suhu Tubuh" />
                    </div>
                    <div>
                        <div>
                            <Line data={chartData} options={options} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
