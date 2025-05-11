import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Cover = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate("/home");
    }, 3000); 

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="w-screen h-screen bg-black flex justify-center items-center">
      <img
        src="/Cover.png"
        alt="Game Cover"
        className="h-full object-cover"
      />
    </div>
  );
};

export default Cover;
