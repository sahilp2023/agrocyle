'use client';

import React, { useState } from 'react';
import { FiMail, FiMessageSquare, FiSend, FiCheck } from 'react-icons/fi';

export default function BuyerSupportPage() {
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        setSubmitted(true);
        setLoading(false);
    };

    if (submitted) {
        return (
            <div className="max-w-xl mx-auto text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheck className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Message Sent!</h2>
                <p className="text-gray-600 mb-6">
                    Our support team will get back to you within 24 hours.
                </p>
                <button
                    onClick={() => {
                        setSubmitted(false);
                        setFormData({ subject: '', message: '' });
                    }}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    Submit Another Request
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Help & Support</h1>
                <p className="text-gray-500 mt-1">Get help with your orders and deliveries</p>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <FiMail className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">Email Support</p>
                            <p className="text-sm text-gray-500">Response within 24 hours</p>
                        </div>
                    </div>
                    <a
                        href="mailto:buyer-support@agrocycle.in"
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                        buyer-support@agrocycle.in
                    </a>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FiMessageSquare className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">Phone Support</p>
                            <p className="text-sm text-gray-500">Mon-Sat, 9 AM - 6 PM</p>
                        </div>
                    </div>
                    <a
                        href="tel:+911800123456"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        1800-123-456 (Toll Free)
                    </a>
                </div>
            </div>

            {/* Support Form */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Send us a message</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subject
                        </label>
                        <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="What do you need help with?"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Message
                        </label>
                        <textarea
                            value={formData.message}
                            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Describe your issue in detail..."
                            rows={5}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none resize-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="animate-spin">⏳</span>
                        ) : (
                            <>
                                <FiSend className="w-5 h-5" />
                                Send Message
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Frequently Asked Questions</h3>

                <div className="space-y-4">
                    <div>
                        <p className="font-medium text-gray-800">How do I place an order?</p>
                        <p className="text-sm text-gray-600 mt-1">
                            Go to Create Order, select a hub, enter the quantity and preferred delivery date, then submit.
                        </p>
                    </div>
                    <div>
                        <p className="font-medium text-gray-800">How can I track my deliveries?</p>
                        <p className="text-sm text-gray-600 mt-1">
                            Visit the Deliveries page to see all incoming deliveries with real-time status updates.
                        </p>
                    </div>
                    <div>
                        <p className="font-medium text-gray-800">What are the quality standards?</p>
                        <p className="text-sm text-gray-600 mt-1">
                            You can configure your quality requirements in the Quality Settings page, including moisture limits and bale types.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
