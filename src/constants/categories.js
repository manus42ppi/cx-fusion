export const CATEGORIES = [
  { id: "ecommerce",   label: "E-Commerce",        icon: "ShoppingCart" },
  { id: "media",       label: "Media & News",       icon: "Newspaper" },
  { id: "saas",        label: "SaaS / Tech",        icon: "Cpu" },
  { id: "finance",     label: "Finance",            icon: "TrendingUp" },
  { id: "health",      label: "Health",             icon: "Heart" },
  { id: "education",   label: "Education",          icon: "BookOpen" },
  { id: "travel",      label: "Travel",             icon: "Plane" },
  { id: "automotive",  label: "Automotive",         icon: "Car" },
  { id: "real-estate", label: "Real Estate",        icon: "Home" },
  { id: "agency",      label: "Agency / Services",  icon: "Briefcase" },
  { id: "other",       label: "Other",              icon: "Globe" },
];

export const TRAFFIC_RANGES = [
  { min: 0,         max: 1000,      label: "< 1K",    tier: 1 },
  { min: 1000,      max: 10000,     label: "1K–10K",  tier: 2 },
  { min: 10000,     max: 100000,    label: "10K–100K",tier: 3 },
  { min: 100000,    max: 1000000,   label: "100K–1M", tier: 4 },
  { min: 1000000,   max: 10000000,  label: "1M–10M",  tier: 5 },
  { min: 10000000,  max: Infinity,  label: "> 10M",   tier: 6 },
];

export const SCORE_GRADES = [
  { min: 90, label: "A",  color: "#10b981" },
  { min: 75, label: "B",  color: "#6366f1" },
  { min: 50, label: "C",  color: "#f59e0b" },
  { min: 25, label: "D",  color: "#f97316" },
  { min: 0,  label: "F",  color: "#ef4444" },
];
