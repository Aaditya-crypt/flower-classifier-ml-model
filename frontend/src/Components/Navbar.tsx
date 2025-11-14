import { Flower2 } from "lucide-react";

export const Navbar = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-soft">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => scrollToSection('home')}
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <Flower2 className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg">Flower ID</span>
          </button>
          
          <div className="flex items-center gap-6">
            <button
              onClick={() => scrollToSection('home')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Identify
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
