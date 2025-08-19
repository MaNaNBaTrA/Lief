'use client'

import React, { useRef, useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const LineChart: React.FC = () => {
  const chartRef = useRef<ChartJS<'line'>>(null)
  const [gradient, setGradient] = useState<string | CanvasGradient | null>(null)

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]

  const hoursWorked = [120, 90, 100, 130, 110, 95, 80, 140, 150, 125, 100, 115]
  const hoursTarget = [100, 95, 90, 120, 105, 100, 90, 130, 140, 110, 105, 100] 

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.ctx
      const gradientFill = ctx.createLinearGradient(0, 0, 0, 400)
      gradientFill.addColorStop(0, 'rgba(53, 162, 235, 0.5)')
      gradientFill.addColorStop(1, 'rgba(53, 162, 235, 0)')
      setGradient(gradientFill)
    }
  }, [chartRef])

  const data: ChartData<'line'> = {
    labels: months,
    datasets: [
      {
        label: 'Hours Worked',
        data: hoursWorked,
        borderColor: 'rgba(53, 162, 235, 0.9)',
        backgroundColor: gradient || 'rgba(53, 162, 235, 0.4)',
        fill: true,
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgba(53, 162, 235, 0.9)',
        pointHoverBackgroundColor: 'rgba(33, 122, 195, 1)',
        borderWidth: 3,
      },
      {
        label: 'Target Hours',
        data: hoursTarget,
        borderColor: 'rgba(255, 99, 132, 0.9)',
        backgroundColor: 'rgba(255, 99, 132, 0.3)',
        fill: true,
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgba(255, 99, 132, 0.9)',
        pointHoverBackgroundColor: 'rgba(200, 50, 80, 1)',
        borderWidth: 3,
        borderDash: [8, 4], 
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true, 
        position: 'top',
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Monthly Hours Worked',
        font: { size: 18, weight: 'bold' },
        padding: { bottom: 20 },
      },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 160,
        title: {
          display: true,
          text: 'Hours',
          font: { size: 12, weight: 'bold' },
        },
        grid: {
          color: '#eee',
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Month',
          font: { size: 12, weight: 'bold' },
        },
        grid: { display: false },
        ticks: {
          font: {
            size: 11
          }
        }
      },
    },
  }

  return (
    <div className="w-full bg-white p-4 sm:p-6 rounded-lg shadow-lg h-[350px] sm:h-[400px] lg:h-full">
      <Line ref={chartRef} data={data} options={options} />
    </div>
  )
}

export default LineChart