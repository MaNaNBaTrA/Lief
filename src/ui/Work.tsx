import Lottie from 'lottie-react';
import animationData from '../../public/Work.json';


const Work = () => {
    return (
        <div className="flex items-center justify-center">
            <Lottie
                animationData={animationData}
                style={{ width:400, height:200 }}
                loop={true}
                autoplay={true}
            />
        </div>
    )
}

export default Work
