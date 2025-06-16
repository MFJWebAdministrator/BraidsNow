import { Check, Clock, Shield } from "lucide-react";

interface PricingCardProps {
    price?: string;
    interval?: string;
    isHome?: boolean;
}

export function StylistPricingCard({
    price = "$19.99",
    interval = "month",
}: PricingCardProps) {
    return (
        <section className="w-full bg-gray-50 py-16">
            <div className="max-w-6xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-400 overflow-hidden">
                    <div className="grid md:grid-cols-5 w-full">
                        {/* Left content area (3/5 width) */}
                        <div className="md:col-span-3 p-8 md:p-12">
                            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#3F0052] to-[#DFA801] bg-clip-text text-transparent">
                                Professional Stylist Plan
                            </h2>
                            <p className="text-gray-600 mb-8">
                                Everything you need to manage your business,
                                attract new clients, and grow your professional
                                portfolio.
                            </p>

                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-[#3F0052] mb-4">
                                    What's included
                                </h3>

                                <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                                    <div className="flex items-start">
                                        <Check className="h-5 w-5 text-[#3F0052] mr-3 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">
                                            Accept client bookings
                                        </span>
                                    </div>
                                    <div className="flex items-start">
                                        <Check className="h-5 w-5 text-[#3F0052] mr-3 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">
                                            Member resources
                                        </span>
                                    </div>
                                    <div className="flex items-start">
                                        <Check className="h-5 w-5 text-[#3F0052] mr-3 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">
                                            Process payments securely
                                        </span>
                                    </div>
                                    <div className="flex items-start">
                                        <Check className="h-5 w-5 text-[#3F0052] mr-3 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">
                                            Showcase your portfolio
                                        </span>
                                    </div>
                                    <div className="flex items-start">
                                        <Check className="h-5 w-5 text-[#3F0052] mr-3 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">
                                            Priority customer support
                                        </span>
                                    </div>
                                    <div className="flex items-start">
                                        <Check className="h-5 w-5 text-[#3F0052] mr-3 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">
                                            Business analytics
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right pricing area (2/5 width) */}
                        <div className="md:col-span-2 bg-gray-50 border  p-8 md:p-12 flex flex-col justify-center">
                            <div className="text-center mb-2">
                                <p className="text-[#3F0052] font-medium">
                                    Professional tools, affordable price
                                </p>
                            </div>

                            <div className="text-center mb-6">
                                <div className="flex items-center justify-center bg-gradient-to-r from-[#3F0052] to-[#DFA801] bg-clip-text text-transparent">
                                    <span className="text-6xl font-bold">
                                        {price}
                                    </span>
                                    <span className="text-xl ml-2">
                                        /{interval}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-center">
                                    <Shield className="h-5 w-5 text-[#3F0052] mr-3" />
                                    <span className="text-sm text-gray-600">
                                        Secure & reliable platform
                                    </span>
                                </div>
                                <div className="flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-[#3F0052] mr-3" />
                                    <span className="text-sm text-gray-600">
                                        24/7 customer support
                                    </span>
                                </div>
                            </div>
                            {/* <p className="text-sm text-gray-500 text-center mt-4">
                                Invoices and receipts available for easy company
                                reimbursement
                            </p> */}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
