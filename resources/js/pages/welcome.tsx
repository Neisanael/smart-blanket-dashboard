// resources/js/pages/HomePage.tsx
import { Link, Head } from '@inertiajs/react';

export default function HomePage() {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-900">
            <div className="w-80 rounded-2xl bg-gray-800 p-8 text-center shadow-lg">
                <h1 className="mb-6 text-2xl text-white">Welcome</h1>
                <Link
                    href={route('login')}
                    className="w-full rounded-lg bg-blue-500 p-3 text-lg text-white hover:bg-blue-600"
                >
                    Log in
                </Link>
            </div>
            <Head title="Welcome" />
        </div>
    );
}
