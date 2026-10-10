import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-8xl font-black text-indigo-500/20 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-slate-100 mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-400 max-w-sm mb-6">
        The page you are looking for doesn't exist or has been moved to another path.
      </p>
      <Link to="/">
        <Button variant="primary">
          <Home size={16} />
          <span>Return to Dashboard</span>
        </Button>
      </Link>
    </div>
  );
};
