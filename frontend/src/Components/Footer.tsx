import { Flower2, Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-secondary/30 border-t border-border mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flower2 className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Flower Identifier</span>
          </div>
          
          <p className="text-xs text-muted-foreground max-w-md">
            Powered by advanced AI to help you discover and learn about beautiful flowers. 
            Information is for educational purposes only.
          </p>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Made with</span>
            <Heart className="w-3 h-3 text-destructive fill-destructive" />
            <span>for nature lovers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
