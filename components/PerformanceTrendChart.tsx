import React, { useEffect, useRef } from 'react';
import type { PuntuacionHistorica } from '../types';

// Let TypeScript know Chart is available globally from the CDN
declare const Chart: any;

interface PerformanceTrendChartProps {
    data: PuntuacionHistorica[];
}

export const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (chartRef.current && data) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            // Sort data by year just in case the API returns them out of order
            const sortedData = [...data].sort((a, b) => a.anio.localeCompare(b.anio));

            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstance.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: sortedData.map(p => p.anio),
                        datasets: [{
                            label: 'Puntuación General',
                            data: sortedData.map(p => p.puntuacion),
                            fill: true,
                            backgroundColor: 'rgba(0, 193, 212, 0.2)',
                            borderColor: 'rgba(0, 193, 212, 1)',
                            pointBackgroundColor: 'rgba(0, 193, 212, 1)',
                            pointBorderColor: '#fff',
                            tension: 0.2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: false,
                                suggestedMin: Math.max(0, Math.min(...sortedData.map(p => p.puntuacion)) - 1),
                                suggestedMax: Math.min(10, Math.max(...sortedData.map(p => p.puntuacion)) + 1),
                                grid: {
                                    color: '#e2e8f0',
                                }
                            },
                            x: {
                                 grid: {
                                    display: false,
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                enabled: true,
                                mode: 'index',
                                intersect: false,
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
                                        if (context.parsed.y !== null) {
                                            label += context.parsed.y.toFixed(2);
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

    return <div style={{ position: 'relative', height: '200px' }}><canvas ref={chartRef}></canvas></div>;
};