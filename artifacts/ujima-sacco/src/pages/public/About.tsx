import { PublicLayout } from "@/components/layout/PublicLayout";

export default function About() {
  return (
    <PublicLayout>
      <div className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">About Us / Kuhusu Sisi</h1>
            <p className="text-xl text-muted-foreground">Building a stronger community through cooperative economics.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-20">
            <div className="bg-card p-8 rounded-lg border shadow-sm">
              <h2 className="text-2xl font-bold mb-4 text-primary">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                To provide secure, accessible, and affordable financial services that empower our members to achieve their personal and business goals, fostering economic growth and stability within the community.
              </p>
            </div>
            <div className="bg-card p-8 rounded-lg border shadow-sm">
              <h2 className="text-2xl font-bold mb-4 text-primary">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                To be the leading Savings and Credit Cooperative in East Africa, recognized for our integrity, innovative AI-driven solutions, and unwavering commitment to member prosperity.
              </p>
            </div>
          </div>

          <div className="prose prose-lg max-w-none text-muted-foreground">
            <h2 className="text-3xl font-bold text-foreground mb-6">Our History</h2>
            <p>
              Ujima SACCO was founded on the principle of "Ujima" — collective work and responsibility. We recognized the need for a financial institution that truly understands the unique challenges and opportunities faced by our community.
            </p>
            <p>
              Starting as a small savings group, we have grown into a robust ecosystem leveraging advanced AI technology to provide fair, fast, and transparent lending decisions. Our Pride Ecosystem represents our commitment to protecting and nurturing the financial health of every member, just as a pride protects its own.
            </p>
            <p>
              Today, we serve thousands of members, offering everything from emergency personal loans to substantial asset financing, always with the same core values of trust, transparency, and community advancement.
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
