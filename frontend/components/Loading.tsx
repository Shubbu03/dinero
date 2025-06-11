import { Loader2 } from "lucide-react";

interface LoadingProps {
  text?: string;
}

const Loading: React.FC<LoadingProps> = ({ text }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="flex items-center space-x-3">
        <Loader2 className="h-8 w-8 animate-spin  text-black dark:text-white" />
        <span className="text-lg text-black dark:text-white">
          {text ? `${text}...` : "Loading..."}
        </span>
      </div>
    </div>
  );
};

export default Loading;
