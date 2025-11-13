import React from 'react';

const SkeletonBox: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`bg-slate-200 rounded-md ${className}`}></div>
);

export const ResultsSkeleton: React.FC = () => {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Title */}
            <div className="flex flex-col items-center">
                <SkeletonBox className="h-7 w-2/3" />
                <SkeletonBox className="h-4 w-1/3 mt-2" />
            </div>

            {/* User Info & Score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-100 p-4 rounded-xl border border-slate-200">
                <div className="md:col-span-2 flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                    <div className="w-2/3 space-y-2">
                        <SkeletonBox className="h-5" />
                        <SkeletonBox className="h-4" />
                    </div>
                </div>
                <div className="flex justify-center md:justify-end">
                    <div className="w-24 h-24 bg-slate-200 rounded-full"></div>
                </div>
            </div>
            
            {/* Action Buttons Placeholder */}
             <div className="pt-2 space-y-3">
                <SkeletonBox className="h-16 flex-1" />
                <div className="flex flex-col sm:flex-row gap-3">
                    <SkeletonBox className="h-10 flex-1" />
                    <SkeletonBox className="h-10 flex-1" />
                </div>
            </div>

            {/* Executive Summary Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
                <SkeletonBox className="h-5 w-1/3 mb-4" />
                <div className="space-y-2">
                    <SkeletonBox className="h-4 w-full" />
                    <SkeletonBox className="h-4 w-full" />
                    <SkeletonBox className="h-4 w-3/4" />
                </div>
            </div>
            
             {/* Competencies Card */}
             <div className="bg-white p-4 rounded-xl border border-slate-200">
                <SkeletonBox className="h-5 w-1/2 mb-4" />
                <div className="h-48">
                    <SkeletonBox className="h-full w-full" />
                </div>
            </div>

            {/* Strengths & Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <SkeletonBox className="h-5 w-1/2 mb-4" />
                    <div className="space-y-2">
                        <SkeletonBox className="h-4 w-full" />
                        <SkeletonBox className="h-4 w-5/6" />
                        <SkeletonBox className="h-4 w-full" />
                    </div>
                </div>
                 <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <SkeletonBox className="h-5 w-1/2 mb-4" />
                    <div className="space-y-2">
                        <SkeletonBox className="h-4 w-full" />
                        <SkeletonBox className="h-4 w-5/6" />
                        <SkeletonBox className="h-4 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};