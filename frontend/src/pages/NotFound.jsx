import { Link } from 'react-router-dom';
import { ArrowLeft, Plane } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function NotFound() {
  return (
    <div className="not-found">
      <EmptyState
        icon={Plane}
        title="This page is off the flight path"
        description="The page you are looking for does not exist in this workspace."
        action={
          <Link to="/" className="btn btn-primary btn-sm">
            <ArrowLeft size={14} />
            <span>Back to dashboard</span>
          </Link>
        }
      />
    </div>
  );
}
