import React from 'react';
import { FiEdit2, FiTrash2, FiMap } from 'react-icons/fi';
import { Button, Card } from '@/components/ui';

interface FarmPlot {
    _id: string;
    plotName: string;
    areaAcre: number;
    areaHa: number;
}

interface FarmPlotListProps {
    plots: FarmPlot[];
    onEdit: (plot: FarmPlot) => void;
    onDelete: (id: string) => void;
    locale: 'hi' | 'en';
}

const FarmPlotList = ({ plots, onEdit, onDelete, locale }: FarmPlotListProps) => {
    if (plots.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <FiMap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{locale === 'hi' ? 'कोई प्लॉट नहीं मिला' : 'No plots found'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {plots.map((plot) => (
                <Card key={plot._id} padding="md" className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-800">{plot.plotName}</h3>
                        <p className="text-sm text-gray-500">
                            {plot.areaAcre.toFixed(2)} Acres ({plot.areaHa.toFixed(2)} Ha)
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onEdit(plot)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={locale === 'hi' ? 'संपादित करें' : 'Edit'}
                        >
                            <FiEdit2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => onDelete(plot._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={locale === 'hi' ? 'हटाएं' : 'Delete'}
                        >
                            <FiTrash2 className="w-5 h-5" />
                        </button>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default FarmPlotList;
