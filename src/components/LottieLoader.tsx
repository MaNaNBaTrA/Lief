import Lottie from 'lottie-react';
import animationData from '../../public/Loader.json'; 

const LottieLoader = ({ width = 100, height = 100 }) => {
  return (
    <div className="flex items-center justify-center">
      <Lottie
        animationData={animationData}
        style={{ width, height }}
        loop={true}
        autoplay={true}
      />
    </div>
  );
};

export default LottieLoader;