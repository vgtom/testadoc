import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import {
  FileSignature, Lock, Users, CheckCircle
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: FileSignature,
      title: "Unlimited Free Signatures",
      description: "Experience the freedom of limitless digital signing without ever reaching for your wallet.",
      highlight: "Forever Free"
    },
    {
      icon: Users,
      title: "Invite and Collaborate for Free",
      description: "Bring multiple people into the signing process at no extra cost. Close deals, not your wallet.",
      highlight: "No Extra Cost"
    },
    {
      icon: CheckCircle,
      title: "Certification, Also Free",
      description: "Every signed document comes with a detailed completion certificate, featuring access logs, all at zero cost.",
      highlight: "Detailed Reports"
    },
    {
      icon: Lock,
      title: "Jurito Signs™, Secure and Free",
      description: "Your documents deserve a safe home. Store and organize them for free in our secure Jurito Signs™ Drive vault.",
      highlight: "Secure Storage"
    }
  ];

  const benefits = [
    "Sign unlimited documents for free",
    "Invite unlimited collaborators at no cost",
    "Get detailed completion certificates",
    "Store documents securely forever",
    "Legally binding signatures worldwide",
    "No hidden fees or premium upsells"
  ];

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center space-x-2 bg-gradient-accent text-white rounded-full px-6 py-2 mb-6">
            <FileSignature className="w-4 h-4" />
            <span className="font-medium">100% Free</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Everything you need for
            <span className="text-primary block">digital signatures</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Complete digital signature solution with unlimited signatures, collaboration tools, and secure storage - all completely free forever.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2  gap-8 mb-20 justify-center items-center max-w-[1200px] m-auto ">
          {features.map((feature, index) => (
            <Card key={index} className="  bg-gradient-card border shadow-card hover:shadow-glow transition-all duration-300 group bg-[#6dbef42a] border-[#6dbdf4]">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon color="black" className="w-10 h-10 text-white" />
                </div>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-3xl text-foreground">{feature.title}</CardTitle>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium bg-[#1e6a9d] text-white">
                    {feature.highlight}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* <div>
            <h3 className="text-3xl font-bold text-foreground mb-6">
              Why teams choose Jurito Signs
            </h3>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div> */}
          
          {/* <div className="relative">
            <div className="bg-gradient-hero rounded-2xl p-8 text-center text-white shadow-glow">
              <Clock className="w-16 h-16 mx-auto mb-6 text-jurito-cyan" />
              <h4 className="text-2xl font-bold mb-4">Start Signing in Minutes</h4>
              <p className="text-white/80 mb-6">
                Get your first document signed in under 5 minutes. No complex setup, no credit card required, no limits.
              </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">2min</div>
                    <div className="text-sm text-white/60">Sign Up</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">3min</div>
                    <div className="text-sm text-white/60">Upload Doc</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">5min</div>
                    <div className="text-sm text-white/60">First Signature</div>
                  </div>
                </div>
            </div>
          </div> */}
        </div>
      </div>
    </section>
  );
};

export default Features;