import React from 'react';

const GlobalNavigator = ({ onBack, onForward, loading }) => {
    return (
        <div className="fixed bottom-8 right-8 z-[9999] flex gap-4">
            <button
                onClick={onBack}
                disabled={loading}
                className="w-12 h-12 rounded-full bg-white border border-museum-stone text-museum-text shadow-lg hover:border-museum-text hover:bg-museum-text hover:text-white transition-all flex items-center justify-center group"
                title="Go Back"
            >
                <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
            </button>
            <button
                onClick={onForward}
                disabled={loading}
                className="w-12 h-12 rounded-full bg-white border border-museum-stone text-museum-text shadow-lg hover:border-museum-text hover:bg-museum-text hover:text-white transition-all flex items-center justify-center group"
                title="Go Forward"
            >
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
            </button>
        </div>
    );
};

export default GlobalNavigator;