
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login page
    navigate('/login');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <p className="text-muted-foreground">جاري التحميل...</p>
    </div>
  );
};

export default LandingPage;
