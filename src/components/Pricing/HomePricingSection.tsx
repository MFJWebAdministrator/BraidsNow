import { Check, UsersRound, Star } from "lucide-react";
import { Link } from "react-router-dom";

export function HomePricingSection() {
    return (
        <section className="w-full bg-gray-50 py-20">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-10">
                    {/* Client Card */}
                    <div className="bg-white rounded-2xl shadow-sm border-l-4 border-gradient-to-br from-[#3F0052] to-[#DFA801] hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 ease-in-out overflow-hidden">
                        <div className="p-8">
                            <div className="flex items-center mb-4 text-[#3F0052]">
                                <UsersRound className="w-6 h-6 mr-2" />
                                <h2 className="text-3xl font-bold">
                                    <span className="bg-gradient-to-r from-[#3F0052] to-[#DFA801] bg-clip-text text-transparent">
                                        For Clients
                                    </span>
                                </h2>
                            </div>
                            <p className="text-gray-600 mb-8">
                                Find and book the perfect stylist for your hair
                                needs, anytime and anywhere.
                            </p>

                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-[#3F0052] mb-4">
                                    What's included
                                </h3>

                                <div className="space-y-4">
                                    {[
                                        "Discover stylists by browsing their profiles, reviews, services, portfolio, and prices",
                                        "Easy booking system",
                                        "Leave reviews and ratings for stylists",
                                        "Priority customer support",
                                        "Book traveling stylists for a cut anytime and anywhere",
                                        "Pay deposits and full payments for hair services",
                                    ].map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-start"
                                        >
                                            <Check className="h-5 w-5 text-[#3F0052] mr-3 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700">
                                                {item}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <Link
                                    to="/client-community"
                                    className="inline-flex items-center justify-center transition-colors bg-gradient-to-r from-[#3F0052] to-[#DFA801] text-white shadow hover:brightness-110 h-12 px-8 text-base rounded-full font-light"
                                >
                                    Sign Up Now!
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Stylist Card */}
                    <div className="bg-white rounded-2xl shadow-sm border-l-4 border-gradient-to-br from-[#DFA801] to-[#3F0052] hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 ease-in-out overflow-hidden">
                        <div className="p-8">
                            <div className="flex items-center mb-4 text-[#3F0052]">
                                <Star className="w-6 h-6 mr-2" />
                                <h2 className="text-3xl font-bold">
                                    <span className="bg-gradient-to-r from-[#3F0052] to-[#DFA801] bg-clip-text text-transparent">
                                        For Stylists
                                    </span>
                                </h2>
                            </div>
                            <p className="text-gray-600 mb-8">
                                Everything you need to manage your business,
                                attract new clients, and grow your professional
                                portfolio.
                            </p>

                            <div className="grid md:grid-cols-3 gap-8">
                                <div className="md:col-span-2">
                                    <h3 className="text-lg font-medium text-[#3F0052] mb-4">
                                        What's included
                                    </h3>

                                    <div className="space-y-4">
                                        {[
                                            "Accept client bookings",
                                            "Member resources",
                                            "Process payments securely",
                                            "Showcase your portfolio",
                                            "Priority customer support",
                                            "Business analytics",
                                        ].map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start"
                                            >
                                                <Check className="h-5 w-5 text-[#3F0052] mr-3 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-700">
                                                    {item}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-gray-200 pt-8 md:pt-0 md:pl-8 mt-8 md:mt-0">
                                    <div className="text-center">
                                        <p className="text-4xl font-extrabold bg-gradient-to-r from-[#3F0052] to-[#DFA801] bg-clip-text text-transparent">
                                            $19.99
                                        </p>
                                        <p className="text-lg text-gray-700 mt-2">
                                            /month
                                        </p>
                                        <p className="text-sm text-gray-700 mt-3">
                                            Professional tools, affordable price
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <Link
                                    to="/stylist-community"
                                    className="inline-flex items-center justify-center transition-colors bg-gradient-to-r from-[#3F0052] to-[#DFA801] text-white shadow hover:brightness-110 h-12 px-8 text-base rounded-full font-light"
                                >
                                    Register My Business
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
