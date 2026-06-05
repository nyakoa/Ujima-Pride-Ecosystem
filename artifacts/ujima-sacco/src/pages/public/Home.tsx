import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Home() {
  return (
    <PublicLayout>
      <div className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary text-primary-foreground py-24">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Jiunge Nawe <br/>
              <span className="text-accent">Join Us Today</span>
            </h1>
            <p className="text-lg md:text-xl mb-10 text-primary-foreground/90">
              Access life-changing loans with confidence. Ujima SACCO provides secure, transparent, and community-driven financial solutions for your future.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/register">Apply for a Loan / Omba Mkopo</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 hover:text-white">
                <Link href="/about">Learn More / Jifunze Zaidi</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Snippet */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 text-foreground">Our Loan Products</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">We offer a variety of tailored loan products to suit your personal and business needs.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {['Business Loans', 'Asset Financing', 'Education Loans'].map((type) => (
                <div key={type} className="p-6 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg mb-2">{type}</h3>
                  <p className="text-sm text-muted-foreground mb-4">Competitive rates and flexible repayment terms designed for your success.</p>
                  <Link href="/loan-products" className="text-primary font-medium text-sm hover:underline">View details &rarr;</Link>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Button variant="ghost" asChild>
                <Link href="/loan-products">View All Products</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* About Snippet */}
        <section className="py-20 bg-muted/50 border-y">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <h2 className="text-3xl font-bold mb-6">Built on Trust</h2>
            <p className="text-muted-foreground mb-8">
              Ujima SACCO was founded on the principles of cooperative economics. We leverage modern technology with traditional values to bring accessible financial services to our members.
            </p>
            <Button variant="outline" asChild>
              <Link href="/about">Read Our Story</Link>
            </Button>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
