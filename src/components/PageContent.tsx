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
      <div className="flex flex-col items-center gap-4">
        <Detail />
        <div className="flex flex-col gap-6 lg:flex-row lg:h-80 w-19/20">
          <div className="w-full lg:w-1/2">
            <Analytics />
          </div>
          <div className="w-full lg:w-1/2">
            <LineChart />
          </div>
        </div>

        <div className="w-19/20 h-auto">
          <Chart />
        </div>
      </div>
    </div>
  )
}

export default Home;