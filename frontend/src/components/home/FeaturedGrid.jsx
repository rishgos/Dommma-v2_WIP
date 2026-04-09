import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Bed, Bath, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeIn, StaggerChildren } from '@/components/motion';

const FeaturedGrid = ({ properties, loading }) => {
  return (
    <section className="section-md bg-[#F5F5F0] dark:bg-[#0F1419] pt-12" data-testid="featured-properties">
      <div className="max-w-7xl mx-auto px-6">
        <FadeIn>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Featured Listings</p>
              <h2
                className="text-xl md:text-2xl text-[#1A2F3A] dark:text-white"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Discover Your Next Home
              </h2>
            </div>
            <Link
              to="/browse"
              className="hidden md:flex items-center gap-2 text-[#1A2F3A] dark:text-[#C4A962] font-medium hover:gap-3 transition-all"
            >
              <span className="text-sm">View All</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </FadeIn>

        {/* Property Grid */}
        <StaggerChildren staggerDelay={0.04} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {loading
            ? Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#1A2332] rounded-xl overflow-hidden shadow-sm">
                  <div className="h-36 skeleton-shimmer" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 skeleton-shimmer rounded w-3/4" />
                    <div className="h-3 skeleton-shimmer rounded w-1/2" />
                    <div className="h-3 skeleton-shimmer rounded w-2/3" />
                  </div>
                </div>
              ))
            : properties.map((property) => {
                const isSample = property.isSample;
                const propertyId = property.id;
                const title = property.title;
                const location = isSample
                  ? `${property.address}, ${property.city}`
                  : `${property.address || ''}, ${property.city || ''}`;
                const propertyType = property.property_type || 'Apartment';
                const image = isSample
                  ? property.images?.[0]
                  : property.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600';
                const price = property.price;
                const beds = property.bedrooms ?? property.beds ?? 0;
                const baths = property.bathrooms ?? property.baths ?? 1;
                const sqft = property.sqft || 0;

                return (
                  <motion.div
                    key={propertyId}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to={isSample ? '/browse' : `/browse?property=${propertyId}`}
                      className="group block bg-white dark:bg-[#1A2332] rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 relative"
                      data-testid={`property-card-${propertyId}`}
                    >
                      {isSample && (
                        <div className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-xs text-center py-1 z-10">
                          Sample - Add your own!
                        </div>
                      )}

                      {/* Image with zoom */}
                      <div className={`relative h-36 overflow-hidden ${isSample ? 'mt-5' : ''}`}>
                        <img
                          src={image}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-[#1A2F3A]">
                            {propertyType}
                          </span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-0.5 bg-[#1A2F3A] rounded-full text-xs font-medium text-white">
                            ${price?.toLocaleString()}/mo
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <h3 className="font-medium text-sm text-[#1A2F3A] dark:text-white mb-1 group-hover:text-[#2C4A52] dark:group-hover:text-[#C4A962] transition-colors line-clamp-1">
                          {title}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                          <MapPin size={10} />
                          <span className="truncate">{location}</span>
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1"><Bed size={12} /> {beds}</span>
                          <span className="flex items-center gap-1"><Bath size={12} /> {baths}</span>
                          {sqft > 0 && <span className="flex items-center gap-1"><Square size={12} /> {sqft}</span>}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
        </StaggerChildren>

        {/* Mobile View All */}
        <div className="mt-8 text-center md:hidden">
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A2F3A] text-white rounded-full"
          >
            View All Properties
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedGrid;
