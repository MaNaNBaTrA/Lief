import React from 'react'

const Analytics : React.FC = () => {
  return (
      <div className='w-full bg-white rounded-xl items-center p-6 flex justify-between h-fit'>
        <div>
          <div className='text-text text-lg font-semibold mb-2'>Today's Work Duration</div>
          <div className='text-xs font-medium text-stext'>Cumulative work hours logged</div>
        </div>
        <div className='text-2xl text-text font-semibold'>2h 23m</div>
      </div>
      
    
  )
}

export default Analytics;
