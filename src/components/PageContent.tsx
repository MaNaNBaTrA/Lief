'use client'
import Analytics from "@/ui/Analytics";
import Detail from "./Detail";
import Navbar from "./Navbar";
import Chart from "@/ui/Chart";
import LineChart from "@/ui/LineChart";

const Home: React.FC = () => {
  return (
    <div className="bg-bg w-screen h-screen overflow-x-hidden">
      <Navbar />
      <div className="flex  flex-col items-center gap-4">
        <Detail />

        <div className=' w-19/20 flex justify-between mb-6 gap-4'>
          <div className=" flex flex-col w-[45%] gap-4">
            <Analytics />
            <LineChart/>
          </div>
          <Chart />
        </div>
      </div>
    </div>
  )
}

export default Home;