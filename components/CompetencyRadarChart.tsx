import React, { useEffect, useRef } from 'react';
import type { CompetenciaEvaluada } from '../types';

// Let TypeScript know Chart is available globally from the CDN
declare const Chart: any;

interface CompetencyRadarChartProps {
    data: CompetenciaEvaluada[];
}

export const CompetencyRadarChart: React.FC<CompetencyRadarChartProps> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null); // To hold the chart instance

    useEffect(() => {
        if (chartRef.current && data) {
            // Destroy previous chart instance if it exists
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstance.current = new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: data.map(c => c.nombre),
                        datasets: [{
                            label: 'Puntuación',
                            data: data.map(c => c.puntuacion),
                            backgroundColor: 'rgba(0, 142, 170, 0.2)',
                            borderColor: 'rgba(0, 142, 170, 1)',
                            pointBackgroundColor: 'rgba(0, 142, 170, 1)',
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: 'rgba(0, 142, 170, 1)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            r: {
                                beginAtZero: true,
                                max: 5,
                                min: 0,
                                ticks: {
                                    stepSize: 1,
                                    backdropColor: 'rgba(255, 255, 255, 0.75)',
                                },
                                pointLabels: {
                                    font: {
                                        size: 12
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                enabled: true,
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleFont: {
                                    size: 14,
                                    weight: 'bold',
                                },
                                bodyFont: {
                                    size: 12,
                                },
                                callbacks: {
                                    label: function(context: any) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        if (context.parsed.r !== null) {
                                            label += context.parsed.r.toFixed(1) + ' / 5';
                                        }
                                        return label;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }

        // Cleanup function to destroy the chart on component unmount
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data]);

    return <div style={{ position: 'relative', height: '300px' }}><canvas ref={chartRef}></canvas></div>;
};