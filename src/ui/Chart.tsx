'use client'

import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const Chart: React.FC = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hoursWorked = [7, 8, 6, 5, 8, 9, 8]

  const backgroundColors = [
    'rgba(54, 99, 132, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(201, 203, 207, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(255, 205, 86, 0.8)',
  ]

  const data = {
    labels: days,
    datasets: [
      {
        label: 'Hours Worked',
        data: hoursWorked,
        backgroundColor: backgroundColors,
        borderRadius: 6,
        maxBarThickness: 60,
        barPercentage: 0.95,
        categoryPercentage: 0.95,
      },
    ],
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Hours Worked Per Day',
        font: { size: 18, weight: 'bold' },
        padding: { bottom: 15 },
      },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 12,
        ticks: {
          stepSize: 2,
          color: '#444',
          font: { size: 12 },
        },
        grid: {
          color: '#e0e0e0',
        },
        title: {
          display: true,
          text: 'Hours',
          color: '#444',
          font: { size: 14, weight: 'bold' },
        },
      },
      x: {
        ticks: {
          color: '#444',
          font: { size: 13, weight: 'bold' },
        },
        grid: { display: false },
        title: {
          display: true,
          text: 'Day',
          color: '#444',
          font: { size: 14, weight: 'bold' },
        },
      },
    },
  }

  return (
    <div className="w-full bg-white  rounded-xl p-6 ">
      <Bar data={data} options={options} />
    </div>
  )
}

export default Chart
