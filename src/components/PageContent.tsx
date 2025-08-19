'use client'
import Analytics from "@/ui/Analytics";
import Detail from "./Detail";
import Navbar from "./Navbar";
import Chart from "@/ui/Chart";
import LineChart from "@/ui/LineChart";

const Home: React.FC = () => {
  return (
    <div className="bg-bg min-h-screen w-full overflow-x-hidden">
      <Navbar />
      <div className="flex flex-col items-center gap-4 pb-8">
        <Detail />
        <div className="flex flex-col gap-6 lg:flex-row w-19/20">
          <div className="w-full lg:w-1/2 h-[350px] sm:h-[400px] lg:h-80">
            <Analytics />
          </div>
          <div className="w-full lg:w-1/2 h-[350px] sm:h-[400px] lg:h-80">
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