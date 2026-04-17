import { Link } from 'react-router-dom';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-100 selection:text-blue-900">

            {/* --- HERO SECTION --- */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-90"></div>
                    {/* Abstract blobs for modern feel */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                    <div className="absolute top-0 left-0 -ml-20 -mt-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-0 left-20 -mb-20 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8">
                        School Uniforms,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            Redefined.
                        </span>
                    </h1>

                    <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 mb-12">
                        Premium quality, perfect fit, and delivered to your doorstep.
                        Experience the easiest way to shop for your school essentials.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/select-school"
                            className="px-8 py-4 rounded-full bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-1"
                        >
                            Start Shopping
                        </Link>
                        <Link
                            to="/login"
                            className="px-8 py-4 rounded-full bg-white text-gray-900 font-bold text-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
                        >
                            Log In
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- FEATURES SECTION --- */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Why Choose ScholarKit?</h2>
                        <p className="mt-4 text-gray-500">We handle the details so you can focus on education.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-all duration-300">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Quality</h3>
                            <p className="text-gray-600">Durable fabrics designed to withstand the active school day while keeping students comfortable.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-all duration-300">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Delivery</h3>
                            <p className="text-gray-600">Order online and get your uniforms delivered directly to your home within 2-3 business days.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-all duration-300">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 text-green-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Easy Returns</h3>
                            <p className="text-gray-600">Size didn't fit? No problem. Our hassle-free return policy ensures you get the perfect fit.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA SECTION --- */}
            <section className="py-20 bg-gray-900 text-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
                    <p className="text-gray-400 mb-8 text-lg">Select your school and browse the exclusive collection tailored for your students.</p>
                    <Link
                        to="/select-school"
                        className="inline-block px-8 py-4 rounded-full bg-white text-gray-900 font-bold hover:bg-gray-100 transition-colors"
                    >
                        Find My School
                    </Link>
                </div>
            </section>

        </div>
    );
}
