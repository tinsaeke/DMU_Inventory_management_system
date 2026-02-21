export const useToast = () => {
  return {
    toast: ({ title, description, variant }: { 
      title: string; 
      description?: string; 
      variant?: "default" | "destructive" 
    }) => {
      if (variant === "destructive") {
        console.error(title, description);
      } else {
        console.log(title, description);
      }
    }
  };
};

export const toast = ({ title, description, variant }: { 
  title: string; 
  description?: string; 
  variant?: "default" | "destructive" 
}) => {
  if (variant === "destructive") {
    console.error(title, description);
  } else {
    console.log(title, description);
  }
};
