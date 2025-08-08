import { footerNavigation } from './contentSections';
import Hero from './components/Hero';
import Features from './components/Features';
import Footer from './components/Footer';
import juritoBanner from "../client/static/jurito banner.png";


export default function LandingPage() {
  return (
    <div className='bg-white dark:text-white dark:bg-boxdark-2'>
      <main className='isolate dark:bg-boxdark-2'>
        <Hero />
        {/* <Clients /> */}
        <Features />
        <img src={juritoBanner} alt="" />
        {/* <Testimonials testimonials={testimonials} /> */}
        {/* <FAQ faqs={faqs} /> */}
      </main>
      <Footer footerNavigation={footerNavigation} />
    </div>
  );
}
