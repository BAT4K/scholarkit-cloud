import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RefreshCcw } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-slate-50 font-sans selection:bg-primary/20 selection:text-primary-dark overflow-hidden">

            {/* --- HERO SECTION --- */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    {/* Modern abstract glowing orbs */}
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-400/20 mix-blend-multiply filter blur-[100px] animate-blob"></div>
                    <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-400/20 mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    
                    <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter mb-8 leading-[1.1]">
                        School Uniforms,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">
                            Redefined.
                        </span>
                    </h1>

                    <p className="mt-6 max-w-2xl mx-auto text-xl font-medium text-slate-500 mb-12 leading-relaxed">
                        Premium quality, perfect fit, and delivered to your doorstep.
                        Experience the easiest way to shop for your school essentials.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
                        <Link
                            to="/select-school"
                            className="btn-primary px-10 py-4 text-lg w-full sm:w-auto shadow-xl shadow-primary/20"
                        >
                            Start Shopping
                        </Link>
                        <Link
                            to="/login"
                            className="btn-secondary px-10 py-4 text-lg w-full sm:w-auto bg-white/50 backdrop-blur-md border-slate-200/50"
                        >
                            Log In Securely
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- FEATURES SECTION --- */}
            <section className="py-24 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight sm:text-5xl">Why Choose ScholarKit?</h2>
                        <p className="mt-4 text-lg font-medium text-slate-500">We handle the details so you can focus on education.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="glass-card p-10 hover:-translate-y-2 transition-all duration-500 group">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8 text-primary shadow-sm border border-indigo-100 group-hover:scale-110 transition-transform duration-500">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-3">Premium Quality</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">Durable fabrics engineered to withstand the active school day while keeping students incredibly comfortable.</p>
                        </div>

                        <div className="glass-card p-10 hover:-translate-y-2 transition-all duration-500 group">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 text-emerald-600 shadow-sm border border-emerald-100 group-hover:scale-110 transition-transform duration-500">
                                <Truck className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-3">Next-Day Delivery</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">Order online and get your official uniforms delivered directly to your home within 24-48 business hours.</p>
                        </div>

                        <div className="glass-card p-10 hover:-translate-y-2 transition-all duration-500 group">
                            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-8 text-rose-500 shadow-sm border border-rose-100 group-hover:scale-110 transition-transform duration-500">
                                <RefreshCcw className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-3">Zero-Friction Returns</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">Size didn't fit perfectly? No problem. Our automated return policy ensures you get the exact right fit instantly.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- IMPRESSIVE CTA SECTION --- */}
            <section className="py-12 px-4 sm:px-6 lg:px-8 mb-20 relative z-10">
                <div className="max-w-6xl mx-auto rounded-[3rem] bg-slate-900 overflow-hidden relative shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.3),_transparent_50%)]"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    
                    <div className="relative z-10 px-6 py-20 sm:p-24 text-center flex flex-col items-center">
                        <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tight">Ready to upgrade?</h2>
                        <p className="text-slate-300 mb-10 text-xl max-w-2xl font-medium leading-relaxed">
                            Select your school and browse the exclusive, institution-approved collection tailored for your students today.
                        </p>
                        <Link
                            to="/select-school"
                            className="bg-white text-slate-900 font-black px-10 py-5 rounded-full text-lg hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-all duration-300"
                        >
                            Find Your Campus
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
}
