export type UserRole = "CUSTOMER" | "MOVING_COMPANY" | "ADMIN";

export interface CompanyVehicle {
  type: string;
  capacity: string;
  licensePlate: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone: string;
  createdAt: string;
  avatarUrl?: string;
  
  // Onboarding Status
  isOnboarded?: boolean;
  isAdmin?: boolean;

  // Legal Consents
  cookieConsent?: "accepted" | "rejected";
  kvkkApproved?: boolean;
  consentTimestamp?: string;
  
  // Basic Profile Fields
  firstName?: string;
  lastName?: string;
  city?: string;
  district?: string;

  // Carrier / Company Information
  isCompanyOwner?: boolean;
  companyName?: string;
  taxNumber?: string;
  taxOffice?: string;
  taxPlateUrl?: string; // Vergi Levhası (dosya veya metin URL'si)
  tradeRegistryNo?: string; // Ticaret Sicil Bilgileri (opsiyonel)
  companyAddress?: string;
  companyPhone?: string;

  // Single Vehicle Information (Bireysel veya Kurumsal Taşımacı için Ana Araç)
  vehicleType?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehiclePlate?: string;
  vehicleCapacityKg?: number;
  vehicleDimensions?: string; // Kasa Ölçüleri
  vehicleMaxHeight?: number;
  vehicleMaxLength?: number;
  vehicleMaxWidth?: number;

  // Service Preferences
  isIntercity?: boolean; // Şehirler Arası Çalışıyor mu?
  isIntracity?: boolean; // Şehir İçi Çalışıyor mu?
  workingHours?: string; // Çalışma saatleri (Örn: 08:00 - 20:00)

  // Legacy/Compatibility fields
  companyLogo?: string;
  description?: string;
  vehicles?: CompanyVehicle[];
  driversCount?: number;
  hasInsurance?: boolean;
  workingCities?: string[];
  workingDistricts?: string[];
  isApproved?: boolean; // Admin approval status for moving companies
  verificationBadge?: boolean;
  photos?: string[];
  ratingsCount?: number;
  averageRating?: number;
  completedJobs?: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MovingRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  pickupAddress: string;
  destinationAddress: string;
  pickupLocation?: LatLng;
  destinationLocation?: LatLng;
  pickupFloor: number;
  destinationFloor: number;
  hasElevatorPickup: boolean;
  hasElevatorDestination: boolean;
  distanceKm?: number;
  estimatedDurationHours?: number;
  estimatedDate: string;
  preferredTime: string;
  houseType: string; // "1+1", "2+1", "3+1", "Villa", etc.
  roomCount: string;
  furnitureList: string[];
  fragileItems: string; // "Evet" / "Hayır" or description
  whiteGoods: string; // description or checklist
  hasPiano: boolean;
  hasSafe: boolean;
  boxesCount: number;
  assemblyRequired: boolean;
  disassemblyRequired: boolean;
  packingRequired: boolean;
  storageRequired: boolean;
  additionalNotes?: string;
  calculatedVolume?: number;
  calculatedItems?: string;
  images?: string[];
  visibility: "PUBLIC" | "PRIVATE";
  privateCompanyId?: string;
  privateCompanyName?: string;
  status: "PENDING" | "OFFER_ACCEPTED" | "COMPLETED" | "CANCELLED";
  currentStage?: "PREPARING" | "EN_ROUTE" | "LOADING" | "TRANSIT" | "UNLOADING" | "COMPLETED";
  acceptedOfferId?: string;
  acceptedCompanyId?: string;
  acceptedCompanyName?: string;
  createdAt: string;
  offersCount?: number;
}

export interface Offer {
  id: string;
  requestId: string;
  companyId: string;
  companyName: string;
  companyLogo?: string;
  companyRating?: number;
  price: number;
  estimatedDurationDays: number;
  availableDate: string;
  notes?: string;
  validityPeriodDays: number;
  vehicleType: string;
  assignedStaffCount: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  createdAt: string;
}

export interface QuickBidTemplate {
  id: string;
  companyId: string;
  title: string;
  price: number;
  estDurationDays: number;
  assignedStaff: number;
  vehicleType: string;
  notes: string;
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  imageUrl?: string;
  location?: { lat: number; lng: number; address: string };
  read: boolean;
  createdAt: string;
}

export interface ChatSession {
  id: string; // requestId + "_" + companyId
  requestId: string;
  requestTitle: string;
  customerId: string;
  customerName: string;
  companyId: string;
  companyName: string;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCountCustomer: number;
  unreadCountCompany: number;
}

export interface Review {
  id: string;
  requestId: string;
  reviewerId: string;
  reviewerName: string;
  targetId: string; // Company ID or Customer ID
  rating: number; // 1-5
  comment: string;
  reviewerRole: "CUSTOMER" | "MOVING_COMPANY";
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "OFFER_RECEIVED" | "OFFER_ACCEPTED" | "NEW_MESSAGE" | "REVIEW_REMINDER" | "SYSTEM_UPDATE";
  requestId?: string;
  chatId?: string;
  read: boolean;
  createdAt: string;
}

export interface FavoriteCompany {
  id: string;
  customerId: string;
  companyId: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedId: string;
  reportedName: string;
  reason: string;
  details: string;
  status: "PENDING" | "RESOLVED" | "REJECTED";
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target: "ALL" | "CUSTOMERS" | "COMPANIES";
  createdAt: string;
  imageUrl?: string;
  expiresAt?: string;
  durationHours?: number;
  textColor?: string;
  bgColor?: string;
  fontFamily?: string;
  badgeText?: string;
  badgeColor?: string;
}

export interface SiteSettings {
  appName: string;
  appSlogan: string;
  heroTitle: string;
  heroDescription: string;
  heroBadgeText: string;
  footerDescription: string;
  logoType: "duck" | "custom_url";
  customLogoUrl: string;
  primaryColor: string; // Tailwind tint or Hex code e.g. "#2563EB"
  accentColor: string; // Tailwind tint or Hex code e.g. "#FBBF24"
  menuHomeText: string;
  menuDiscoverText: string;
  menuCreateRequestText: string;
  menuDashboardText: string;
  menuChatsText: string;
  menuProfileText: string;
  menuHowItWorksText?: string;
  menuFaqsText?: string;
  menuBlogText?: string;
  menuPrivacyText?: string;

  // New customization fields for every section & text
  showHeroSloganCard?: boolean;
  heroSloganMain?: string;
  heroSloganSub?: string;
  heroSloganFooterLeft?: string;
  heroSloganFooterRight?: string;
  heroButtonRequestText?: string;
  heroButtonDiscoverText?: string;

  // Statistics
  showStatsRow?: boolean;
  statsMode?: "real" | "custom";
  showFirmsCount?: boolean;
  customFirmsText?: string;
  showTransfersCount?: boolean;
  customTransfersText?: string;
  showSatisfactionRate?: boolean;
  customSatisfactionText?: string;

  // Values Section (Güvenlik ve Avantajlar)
  showValuesSection?: boolean;
  value1Title?: string;
  value1Desc?: string;
  value2Title?: string;
  value2Desc?: string;
  value3Title?: string;
  value3Desc?: string;

  // Carrier CTA Section
  showCarrierCTA?: boolean;
  carrierCTABadge?: string;
  carrierCTATitle?: string;
  carrierCTADesc?: string;
  carrierCTAPrimaryBtn?: string;
  carrierCTASecondaryBtn?: string;

  // Page specific content parameters for A-to-Z control
  howItWorksTitle?: string;
  howItWorksSub?: string;
  howItWorksStep1Title?: string;
  howItWorksStep1Desc?: string;
  howItWorksStep2Title?: string;
  howItWorksStep2Desc?: string;
  howItWorksStep3Title?: string;
  howItWorksStep3Desc?: string;

  discoverMoversTitle?: string;
  discoverMoversSub?: string;

  helpCenterTitle?: string;
  helpCenterSub?: string;
  helpCenterContactTitle?: string;
  helpCenterContactDesc?: string;
  helpCenterPhone?: string;
  helpCenterEmail?: string;
  helpCenterAboutTitle?: string;
  helpCenterAboutDesc?: string;

  privacyTermsTitle?: string;
  privacyTermsLastUpdated?: string;
  privacyTermsSection1?: string;
  privacyTermsSection2?: string;
  privacyTermsSection3?: string;

  blogTitle?: string;
  blogSub?: string;
  blog1Tag?: string;
  blog1Title?: string;
  blog1Desc?: string;
  blog2Tag?: string;
  blog2Title?: string;
  blog2Desc?: string;

  // General Button & Layout Styles
  bodyBgColor?: string;
  cardBgColor?: string;
  buttonTextColor?: string;
  buttonRoundedness?: "rounded-none" | "rounded-md" | "rounded-xl" | "rounded-3xl" | "rounded-full";
  fontFamily?: "font-sans" | "font-mono" | "font-serif" | "font-display";

  // Create Request Page Customized Texts
  createRequestTitle?: string;
  createRequestSub?: string;
  createRequestSubmitBtnText?: string;
  createRequestFormPickupLabel?: string;
  createRequestFormDestinationLabel?: string;
  createRequestFormRoomsLabel?: string;
  createRequestFormFloorLabel?: string;

  // Dashboards Customizable Buttons & Text
  dashboardCreateRequestBtnText?: string;
  dashboardViewOffersBtnText?: string;
  dashboardGiveOfferBtnText?: string;
  requestCancelBtnText?: string;

  // New Global Header & Footer Background/Text Styles
  headerBgColor?: string;
  headerTextColor?: string;
  footerBgColor?: string;
  footerTextColor?: string;
  buttonBgColor?: string;
  buttonHoverBgColor?: string;

  // Custom Page Sections Toggle
  showBlogSection?: boolean;
  showHowItWorksSection?: boolean;
  showFaqsSection?: boolean;

  // Rich FAQ Customizations
  faq1Question?: string;
  faq1Answer?: string;
  faq2Question?: string;
  faq2Answer?: string;
  faq3Question?: string;
  faq3Answer?: string;
  faq4Question?: string;
  faq4Answer?: string;

  // Customer Dashboard
  customerDashboardWelcomeText?: string;
  customerDashboardSub?: string;
  customerDashboardNoRequestsText?: string;

  // Company Dashboard
  companyDashboardWelcomeText?: string;
  companyDashboardSub?: string;
  companyDashboardNoJobsText?: string;

  // Pricing Estimation Panel Texts
  createRequestPricingEstTitle?: string;
  createRequestPricingEstDesc?: string;

  // Chat/Support Texts
  chatWelcomeHeader?: string;
  chatWelcomeSub?: string;

  // Login/Register Screen Customization
  loginTitle?: string;
  loginSub?: string;
  registerTitle?: string;
  registerSub?: string;

  // Hero Image Slider
  heroSliderInterval?: number;
  heroSliderImage1?: string;
  heroSliderImage2?: string;
  heroBackgroundImage?: string;
  heroBackgroundImageOpacity?: number;
}

export interface BlogPost {
  id?: string;
  tag: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}


