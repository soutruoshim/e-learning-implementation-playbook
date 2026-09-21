import Link from 'next/link';
import Image from 'next/image';
import heroImage from '@/public/hero.png';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center flex-1 py-12">
      <h1 className="text-4xl font-extrabold mb-6 text-primary">Project Playbooks</h1>
      
      <div className="relative w-full max-w-4xl aspect-[16/9] mb-8 rounded-xl overflow-hidden shadow-2xl border border-primary/20">
        <Image 
          src={heroImage} 
          alt="Project Playbooks Mockup" 
          fill 
          className="object-cover"
          priority
        />
      </div>

      <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
        Welcome to our official Project Playbooks. Dive into our comprehensive documentation covering everything from Project Briefs to the Operations Runbook.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-6">
        <Link 
          href="/docs/coffee" 
          className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          Coffee Playbook
        </Link>
        <Link 
          href="/docs/e-learning" 
          className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          Implementation Playbook
        </Link>
      </div>
    </div>
  );
}
